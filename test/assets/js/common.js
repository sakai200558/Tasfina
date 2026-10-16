document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu && sidebar) mobileMenu.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', event => {
    if (window.innerWidth <= 760 && sidebar && !sidebar.contains(event.target) && mobileMenu && !mobileMenu.contains(event.target)) sidebar.classList.remove('open');
  });
});