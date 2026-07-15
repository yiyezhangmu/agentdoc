var codeLanguageLabels = {
  bash: 'Bash',
  css: 'CSS',
  html: 'HTML',
  javascript: 'JavaScript',
  js: 'JavaScript',
  json: 'JSON',
  markdown: 'Markdown',
  mermaid: 'Mermaid',
  plaintext: 'Text',
  powershell: 'PowerShell',
  python: 'Python',
  shell: 'Shell',
  sql: 'SQL',
  text: 'Text',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML'
};

function getCodeLanguage(block) {
  var languageClass = Array.prototype.find.call(block.classList, function(className) {
    return className.indexOf('language-') === 0;
  });

  if (!languageClass) {
    return 'Code';
  }

  var language = languageClass.replace('language-', '').toLowerCase();
  return codeLanguageLabels[language] || language.toUpperCase();
}

function setupCodeBlockHeaders() {
  var blocks = document.querySelectorAll('.md-typeset .highlight');

  blocks.forEach(function(block) {
    if (block.dataset.codeHeaderBound === 'true' || block.classList.contains('mermaid')) {
      return;
    }

    var header = document.createElement('div');
    var language = document.createElement('span');
    var copyButton = block.querySelector(':scope > .md-clipboard');

    header.className = 'code-block-header';
    language.className = 'code-block-language';
    language.textContent = getCodeLanguage(block);
    header.appendChild(language);

    if (copyButton) {
      header.appendChild(copyButton);
    }

    block.insertBefore(header, block.firstChild);
    block.dataset.codeHeaderBound = 'true';
  });
}

document.addEventListener('DOMContentLoaded', setupCodeBlockHeaders);

if (typeof document$ !== 'undefined') {
  document$.subscribe(setupCodeBlockHeaders);
}
