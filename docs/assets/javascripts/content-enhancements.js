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

function getTocCollapseStorageKey() {
  return 'toc-collapsed:' + window.location.pathname;
}

function readCollapsedTocSections() {
  try {
    return JSON.parse(window.localStorage.getItem(getTocCollapseStorageKey()) || '[]');
  } catch (error) {
    return [];
  }
}

function writeCollapsedTocSections(sections) {
  try {
    window.localStorage.setItem(getTocCollapseStorageKey(), JSON.stringify(sections));
  } catch (error) {
    return;
  }
}

function createTocCollapseIcon() {
  var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  path.setAttribute('d', 'M7 10l5 5 5-5');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  icon.appendChild(path);

  return icon;
}

function setupTocCollapsibles() {
  var toc = document.querySelector('.md-sidebar--secondary nav.md-nav');

  if (!toc) {
    return;
  }

  var rootList = toc.querySelector(':scope > .md-nav__list');
  var collapsedSections = readCollapsedTocSections();

  if (!rootList) {
    return;
  }

  Array.prototype.forEach.call(rootList.children, function(item, index) {
    var link = item.querySelector(':scope > .md-nav__link');
    var childNav = item.querySelector(':scope > nav.md-nav');

    if (!link || !childNav || item.dataset.tocCollapseBound === 'true') {
      return;
    }

    var sectionKey = link.getAttribute('href') || 'section-' + index;
    var childNavId = 'toc-section-' + index;
    var button = document.createElement('button');

    childNav.id = childNavId;
    button.type = 'button';
    button.className = 'toc-collapse-toggle';
    button.setAttribute('aria-controls', childNavId);
    button.appendChild(createTocCollapseIcon());
    item.classList.add('toc-collapsible');
    item.insertBefore(button, childNav);
    item.dataset.tocCollapseBound = 'true';

    function applyCollapsedState(collapsed) {
      item.classList.toggle('toc-collapsible--collapsed', collapsed);
      button.setAttribute('aria-expanded', String(!collapsed));
      button.setAttribute('aria-label', (collapsed ? '展开' : '折叠') + link.textContent.trim() + '的二级目录');
    }

    applyCollapsedState(collapsedSections.indexOf(sectionKey) !== -1);

    button.addEventListener('click', function() {
      var collapsed = !item.classList.contains('toc-collapsible--collapsed');
      var storedSections = readCollapsedTocSections();
      var storedIndex = storedSections.indexOf(sectionKey);

      if (collapsed && storedIndex === -1) {
        storedSections.push(sectionKey);
      } else if (!collapsed && storedIndex !== -1) {
        storedSections.splice(storedIndex, 1);
      }

      applyCollapsedState(collapsed);
      writeCollapsedTocSections(storedSections);
    });
  });
}

function setupPdfExport() {
  document.querySelectorAll('[data-export-pdf]').forEach(function(button) {
    if (button.dataset.pdfExportBound === 'true') {
      return;
    }

    button.dataset.pdfExportBound = 'true';
    button.addEventListener('click', function() {
      window.print();
    });
  });
}

document.addEventListener('DOMContentLoaded', setupCodeBlockHeaders);
document.addEventListener('DOMContentLoaded', setupTocCollapsibles);
document.addEventListener('DOMContentLoaded', setupPdfExport);

if (typeof document$ !== 'undefined') {
  document$.subscribe(setupCodeBlockHeaders);
  document$.subscribe(setupTocCollapsibles);
  document$.subscribe(setupPdfExport);
}
