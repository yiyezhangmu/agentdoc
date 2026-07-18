"""Render Mermaid fences to cached SVG files during MkDocs builds."""

import hashlib
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = ROOT / ".cache" / "mermaid"
PUBLIC_DIR = ROOT / "docs" / "assets" / "generated" / "mermaid"
MERMAID_FENCE = re.compile(r"```mermaid[ \t]*\r?\n(.*?)\r?\n```", re.DOTALL)
INLINE_PAINT_IMPORTANT = re.compile(
    r"(?P<property>fill|stroke|stroke-width):(?P<value>[^;]+?)\s*!important"
)


def find_mmdc() -> str:
    candidates = [
        ROOT / "node_modules" / ".bin" / "mmdc.cmd",
        ROOT / "node_modules" / ".bin" / "mmdc",
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    raise RuntimeError(
        "未找到 Mermaid CLI，请先执行 npm install 安装 @mermaid-js/mermaid-cli。"
    )


def render_svg(source: str, target: Path) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    target.parent.mkdir(parents=True, exist_ok=True)
    mmdc = find_mmdc()

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".mmd", encoding="utf-8", dir=CACHE_DIR, delete=False
    ) as source_file:
        source_file.write(source)
        source_path = Path(source_file.name)

    try:
        environment = os.environ.copy()
        if "PUPPETEER_EXECUTABLE_PATH" not in environment:
            browsers = [
                Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
                Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
                Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
                Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
            ] + list(
                Path.home()
                .glob(".cache/puppeteer/chrome-headless-shell/**/chrome-headless-shell.exe")
            )
            for browser in browsers:
                if browser.exists():
                    environment["PUPPETEER_EXECUTABLE_PATH"] = str(browser)
                    break

        subprocess.run(
            [
                mmdc,
                "-i",
                str(source_path),
                "-o",
                str(target),
                "-t",
                "default",
                "-b",
                "transparent",
                "--quiet",
            ],
            check=True,
            cwd=ROOT,
            env=environment,
        )
    finally:
        source_path.unlink(missing_ok=True)


def cached_svg(source: str) -> tuple[str, Path]:
    cache_key = hashlib.sha256(
        ("mermaid-static-v1\0" + source.replace("\r\n", "\n")).encode("utf-8")
    ).hexdigest()[:16]
    filename = f"diagram-{cache_key}.svg"
    cache_path = CACHE_DIR / filename
    public_path = PUBLIC_DIR / filename

    if not cache_path.exists() or cache_path.stat().st_size == 0:
        render_svg(source, cache_path)

    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    if not public_path.exists() or public_path.stat().st_mtime < cache_path.stat().st_mtime:
        shutil.copy2(cache_path, public_path)

    return filename, cache_path


def prepare_inline_svg(svg: str) -> str:
    """Allow page theme CSS to override Mermaid's inline node paint styles."""
    return INLINE_PAINT_IMPORTANT.sub(
        r"\g<property>:\g<value>", svg
    )


def on_page_markdown(markdown, page, config, files):
    if "```mermaid" not in markdown:
        return markdown

    def replace_fence(match):
        source = match.group(1).strip()
        _, cache_path = cached_svg(source)
        svg = cache_path.read_text(encoding="utf-8")
        svg = svg.replace("my-svg", cache_path.stem)
        svg = prepare_inline_svg(svg)
        return (
            '<div class="mermaid mermaid-static" role="group" '
            'aria-label="流程图（支持拖动和缩放）">'
            f"{svg}"
            "</div>"
        )

    return MERMAID_FENCE.sub(replace_fence, markdown)
