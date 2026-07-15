var mermaidDiagramSequence = 0;

function setupMermaidDiagrams() {
  if (typeof mermaid === 'undefined') {
    return;
  }

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
    container.setAttribute('role', 'img');
    container.setAttribute('aria-label', '流程图');
    sourceBlock.replaceWith(container);

    mermaid.render(diagramId, source)
      .then(function(result) {
        container.innerHTML = result.svg;
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

if (typeof mermaid !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: 'Inter, Segoe UI, system-ui, sans-serif',
    flowchart: {
      htmlLabels: true,
      useMaxWidth: true,
      curve: 'basis'
    }
  });
}

document.addEventListener('DOMContentLoaded', setupMermaidDiagrams);

if (typeof document$ !== 'undefined') {
  document$.subscribe(setupMermaidDiagrams);
}
