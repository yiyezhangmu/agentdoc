function createReadingToggleButton(id, side, label, path) {
  if (document.getElementById(id)) {
    return;
  }

  var button = document.createElement('button');
  button.id = id;
  button.type = 'button';
  button.className = 'reading-layout-toggle reading-layout-toggle--' + side;
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>';
  document.body.appendChild(button);
}

function setupPanelToggle(buttonIds, className, storageKey, labels) {
  var buttons = buttonIds
    .map(function(buttonId) {
      return document.getElementById(buttonId);
    })
    .filter(Boolean);

  if (!buttons.length) {
    return;
  }

  function syncState() {
    var isHidden = localStorage.getItem(storageKey) === 'true';
    document.body.classList.toggle(className, isHidden);
    buttons.forEach(function(toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', isHidden ? labels.show : labels.hide);
      toggleBtn.setAttribute('title', isHidden ? labels.show : labels.hide);
    });
  }

  buttons.forEach(function(toggleBtn) {
    if (toggleBtn.dataset.bound === 'true') {
      return;
    }

    toggleBtn.dataset.bound = 'true';
    toggleBtn.addEventListener('click', function() {
      var isHidden = !document.body.classList.contains(className);
      localStorage.setItem(storageKey, isHidden);
      syncState();
    });
  });

  syncState();
}

function setupReadingLayoutToggles() {
  createReadingToggleButton(
    '__reading-left-toggle',
    'left',
    '收起左侧导航',
    '<path d="M4 4h16v16H4z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 4v16M15 8l-4 4 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  );

  createReadingToggleButton(
    '__reading-right-toggle',
    'right',
    '收起右侧目录',
    '<path d="M4 4h16v16H4z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 4v16M9 8l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  );

  setupPanelToggle(['__reading-left-toggle'], 'sidebar-hidden', 'sidebar-hidden', {
    hide: '收起左侧导航',
    show: '展开左侧导航'
  });

  setupPanelToggle(['__reading-right-toggle'], 'toc-hidden', 'toc-hidden', {
    hide: '收起右侧目录',
    show: '展开右侧目录'
  });
}

function setupCollapsibleSections() {
  var headings = Array.prototype.slice.call(document.querySelectorAll('.md-content h2[id]'));

  headings.forEach(function(heading) {
    if (heading.dataset.collapsibleBound === 'true') {
      return;
    }

    var sectionId = heading.id;
    var storageKey = 'section-collapsed:' + location.pathname + '#' + sectionId;
    var toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'section-collapse-toggle';
    toggleBtn.setAttribute('aria-label', '收起章节');
    toggleBtn.setAttribute('title', '收起章节');
    toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5z"/></svg>';
    heading.appendChild(toggleBtn);

    function sectionNodes() {
      var nodes = [];
      var current = heading.nextElementSibling;

      while (current && current.tagName !== 'H2') {
        nodes.push(current);
        current = current.nextElementSibling;
      }

      return nodes;
    }

    function syncSection() {
      var isCollapsed = localStorage.getItem(storageKey) === 'true';
      heading.classList.toggle('section-collapsed', isCollapsed);
      toggleBtn.setAttribute('aria-label', isCollapsed ? '展开章节' : '收起章节');
      toggleBtn.setAttribute('title', isCollapsed ? '展开章节' : '收起章节');
      sectionNodes().forEach(function(node) {
        node.hidden = isCollapsed;
      });
    }

    function toggleSection(event) {
      if (event.target.classList.contains('headerlink')) {
        return;
      }

      var nextState = !heading.classList.contains('section-collapsed');
      localStorage.setItem(storageKey, nextState);
      syncSection();
    }

    heading.dataset.collapsibleBound = 'true';
    heading.addEventListener('click', toggleSection);
    syncSection();
  });
}

document.addEventListener('DOMContentLoaded', setupReadingLayoutToggles);
document.addEventListener('DOMContentLoaded', setupCollapsibleSections);

if (typeof document$ !== 'undefined') {
  document$.subscribe(function() {
    setupReadingLayoutToggles();
    setupCollapsibleSections();
  });
}
