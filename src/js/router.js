// ============================================
// KUYUMCU PWA — SPA Router
// ============================================

const routes = {};
let currentPage = null;
let appContainer = null;

export function registerRoute(path, renderFn) {
  routes[path] = renderFn;
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentRoute() {
  return window.location.hash.slice(1) || '/';
}

export async function handleRoute() {
  const path = getCurrentRoute();
  const renderFn = routes[path] || routes['/'];

  if (!renderFn) return;

  // Cleanup previous page
  if (currentPage && currentPage.destroy) {
    currentPage.destroy();
  }

  const pageContent = document.getElementById('page-content') || appContainer;
  if (pageContent) {
    pageContent.innerHTML = '';
    pageContent.className = 'page';
    currentPage = await renderFn(pageContent);
  }

  // Update nav
  updateNav(path);
}

export function initRouter(container) {
  appContainer = container;
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function updateNav(path) {
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.dataset.route;
    item.classList.toggle('active', href === path);
  });
}
