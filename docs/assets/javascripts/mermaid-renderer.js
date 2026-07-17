var mermaidDiagramSequence = 0;
var mermaidZoomMin = 0.5;
var mermaidZoomMax = 2;
var mermaidZoomStep = 0.25;
var mermaidRendererScriptUrl = document.currentScript ? document.currentScript.src : '';
var mermaidLoadPromise = null;
var mermaidInitialized = false;

function getMermaidLibraryUrl() {
  var rendererScriptElement = document.querySelector('script[src$="/assets/javascripts/mermaid-renderer.js"]');
  var rendererScript = mermaidRendererScriptUrl || (rendererScriptElement && rendererScriptElement.src);

  if (!rendererScript) {
    return '/assets/javascripts/mermaid.min.js';
  }

  return new URL('mermaid.min.js', rendererScript).href;
}

function initializeMermaid() {
  if (mermaidInitialized || typeof mermaid === 'undefined') {
    return;
  }

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: 'Inter, Segoe UI, system-ui, sans-serif',
    flowchart: {
      htmlLabels: true,
      useMaxWidth: false,
      curve: 'basis'
    }
  });
  mermaidInitialized = true;
}

function loadMermaidLibrary() {
  if (typeof mermaid !== 'undefined') {
    initializeMermaid();
    return Promise.resolve();
  }

  if (mermaidLoadPromise) {
    return mermaidLoadPromise;
  }

  mermaidLoadPromise = new Promise(function(resolve, reject) {
    var script = document.createElement('script');
    script.src = getMermaidLibraryUrl();
    script.async = true;
    script.addEventListener('load', function() {
      initializeMermaid();
      resolve();
    });
    script.addEventListener('error', function() {
      reject(new Error('Mermaid 脚本加载失败'));
    });
    document.head.appendChild(script);
  });

  return mermaidLoadPromise;
}

function createMermaidZoomButton(label, text, className) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'mermaid-zoom-button ' + className;
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  button.textContent = text;
  return button;
}

function setupMermaidZoom(container) {
  if (container.dataset.mermaidZoomBound === 'true') {
    return;
  }

  var svg = container.querySelector(':scope > svg');
  if (!svg) {
    return;
  }

  var initialRect = svg.getBoundingClientRect();
  var viewBox = svg.viewBox && svg.viewBox.baseVal;
  var baseWidth = initialRect.width || (viewBox && viewBox.width) || 800;
  var baseHeight = initialRect.height || (viewBox && viewBox.height) || 450;
  var scale = 1;

  var toolbar = document.createElement('div');
  toolbar.className = 'mermaid-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', '流程图缩放控制');

  var zoomOut = createMermaidZoomButton('缩小流程图', '−', 'mermaid-zoom-out');
  var zoomReset = createMermaidZoomButton('恢复为 100%', '100%', 'mermaid-zoom-reset');
  var zoomIn = createMermaidZoomButton('放大流程图', '+', 'mermaid-zoom-in');

  toolbar.appendChild(zoomOut);
  toolbar.appendChild(zoomReset);
  toolbar.appendChild(zoomIn);

  var viewport = document.createElement('div');
  viewport.className = 'mermaid-viewport';
  viewport.setAttribute('tabindex', '0');
  viewport.setAttribute('aria-label', '可滚动的流程图画布；按住 Ctrl 或 Command 并滚动鼠标滚轮可缩放');

  var canvas = document.createElement('div');
  canvas.className = 'mermaid-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', '流程图');
  canvas.appendChild(svg);
  viewport.appendChild(canvas);
  container.appendChild(toolbar);
  container.appendChild(viewport);

  function applyScale(nextScale) {
    scale = Math.min(mermaidZoomMax, Math.max(mermaidZoomMin, nextScale));
    svg.style.width = (baseWidth * scale) + 'px';
    svg.style.height = (baseHeight * scale) + 'px';
    svg.style.maxHeight = 'none';
    zoomReset.textContent = Math.round(scale * 100) + '%';
    zoomOut.disabled = scale <= mermaidZoomMin;
    zoomIn.disabled = scale >= mermaidZoomMax;
  }

  zoomOut.addEventListener('click', function() {
    applyScale(scale - mermaidZoomStep);
  });

  zoomReset.addEventListener('click', function() {
    applyScale(1);
  });

  zoomIn.addEventListener('click', function() {
    applyScale(scale + mermaidZoomStep);
  });

  viewport.addEventListener('wheel', function(event) {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }
    event.preventDefault();
    applyScale(scale + (event.deltaY < 0 ? mermaidZoomStep : -mermaidZoomStep));
  }, { passive: false });

  container.dataset.mermaidZoomBound = 'true';
  applyScale(1);
}

function setupMermaidDiagrams() {
  if (!document.querySelector('pre.mermaid-source')) {
    return;
  }

  loadMermaidLibrary()
    .then(renderMermaidDiagrams)
    .catch(function(error) {
      document.querySelectorAll('pre.mermaid-source').forEach(function(sourceBlock) {
        sourceBlock.classList.add('mermaid--error');
        sourceBlock.textContent = '流程图渲染失败：' + error.message;
      });
    });
}

function renderMermaidDiagrams() {
  var diagrams = document.querySelectorAll('pre.mermaid-source');

  diagrams.forEach(function(sourceBlock) {
    if (sourceBlock.dataset.mermaidBound === 'true') {
      return;
    }

    sourceBlock.dataset.mermaidBound = 'true';
    var source = sourceBlock.textContent.trim();
    var container = document.createElement('div');
    var diagramId = 'mermaid-diagram-' + mermaidDiagramSequence++;

    container.className = 'mermaid';
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', '流程图（支持缩放）');
    sourceBlock.replaceWith(container);

    mermaid.render(diagramId, source)
      .then(function(result) {
        container.innerHTML = result.svg;
        setupMermaidZoom(container);
        if (result.bindFunctions) {
          result.bindFunctions(container);
        }
      })
      .catch(function(error) {
        container.classList.add('mermaid--error');
        container.textContent = '流程图渲染失败：' + error.message;
      });
  });
}

document.addEventListener('DOMContentLoaded', setupMermaidDiagrams);

if (typeof document$ !== 'undefined') {
  document$.subscribe(setupMermaidDiagrams);
}
