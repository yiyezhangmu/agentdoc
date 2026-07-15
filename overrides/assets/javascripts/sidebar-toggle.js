document.addEventListener('DOMContentLoaded', function() {
  var toggleBtn = document.getElementById('__sidebar-toggle');
  if (toggleBtn) {
    var sidebarHidden = localStorage.getItem('sidebar-hidden') === 'true';
    
    if (sidebarHidden) {
      document.body.classList.add('sidebar-hidden');
    }
    
    toggleBtn.addEventListener('click', function() {
      document.body.classList.toggle('sidebar-hidden');
      var isHidden = document.body.classList.contains('sidebar-hidden');
      localStorage.setItem('sidebar-hidden', isHidden);
    });
  }
});