// ===== Configuration =====
const API_URL = '/api';

// ===== State =====
let currentUser = null;
let currentPage = 1;
let currentFilters = {
  search: '',
  category: 'all',
  status: 'all'
};

// ===== DOM Elements =====
const elements = {
  // Theme
  themeSwitch: document.getElementById('themeSwitch'),
  
  // Auth
  authButtons: document.getElementById('authButtons'),
  userMenu: document.getElementById('userMenu'),
  userName: document.getElementById('userName'),
  userAvatar: document.getElementById('userAvatar'),
  
  // Modals
  loginModal: document.getElementById('loginModal'),
  signupModal: document.getElementById('signupModal'),
  reportModal: document.getElementById('reportModal'),
  itemDetailModal: document.getElementById('itemDetailModal'),
  myItemsModal: document.getElementById('myItemsModal'),
  
  // Forms
  loginForm: document.getElementById('loginForm'),
  signupForm: document.getElementById('signupForm'),
  reportForm: document.getElementById('reportForm'),
  quickSearchForm: document.getElementById('quickSearchForm'),
  contactForm: document.getElementById('contactForm'),
  
  // Items
  itemsGrid: document.getElementById('itemsGrid'),
  loadingSpinner: document.getElementById('loadingSpinner'),
  emptyState: document.getElementById('emptyState'),
  pagination: document.getElementById('pagination'),
  
  // Mobile
  mobileMenuBtn: document.getElementById('mobileMenuBtn'),
  mobileMenu: document.getElementById('mobileMenu'),
  
  // Toast
  toast: document.getElementById('toast')
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuth();
  initModals();
  initForms();
  initSearch();
  initMobileMenu();
  loadItems();
  loadStats();
});

// ===== Theme =====
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('darkmode');
  }
  
  elements.themeSwitch?.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  document.body.classList.toggle('darkmode');
  const isDark = document.body.classList.contains('darkmode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// ===== Authentication =====
function initAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    fetchCurrentUser(token);
  }
  
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

async function fetchCurrentUser(token) {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      setCurrentUser(data.user);
    } else {
      localStorage.removeItem('token');
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}

function setCurrentUser(user) {
  currentUser = user;
  
  if (user) {
    elements.authButtons?.classList.add('hidden');
    elements.userMenu?.classList.remove('hidden');
    elements.userName.textContent = user.username;
    elements.userAvatar.textContent = user.username[0].toUpperCase();
  } else {
    elements.authButtons?.classList.remove('hidden');
    elements.userMenu?.classList.add('hidden');
  }
}

function logout() {
  localStorage.removeItem('token');
  setCurrentUser(null);
  showToast('Logged out successfully', 'success');
}

// ===== Modals =====
function initModals() {
  // Open buttons
  document.getElementById('openLogin')?.addEventListener('click', () => openModal('loginModal'));
  document.getElementById('openSignup')?.addEventListener('click', () => openModal('signupModal'));
  document.getElementById('reportLostBtn')?.addEventListener('click', () => openReportModal('Lost'));
  document.getElementById('reportFoundBtn')?.addEventListener('click', () => openReportModal('Found'));
  document.getElementById('myItemsBtn')?.addEventListener('click', () => {
    openModal('myItemsModal');
    loadMyItems();
  });
  
  // Close buttons
  document.getElementById('closeLogin')?.addEventListener('click', () => closeModal('loginModal'));
  document.getElementById('closeSignup')?.addEventListener('click', () => closeModal('signupModal'));
  document.getElementById('closeReport')?.addEventListener('click', () => closeModal('reportModal'));
  document.getElementById('closeItemDetail')?.addEventListener('click', () => closeModal('itemDetailModal'));
  document.getElementById('closeMyItems')?.addEventListener('click', () => closeModal('myItemsModal'));
  
  // Switch modals
  document.getElementById('goToSignup')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal('loginModal');
    openModal('signupModal');
  });
  
  document.getElementById('goToLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal('signupModal');
    openModal('loginModal');
  });
  
  // Close on overlay click
  document.querySelectorAll('.modalOverlay').forEach(overlay => {
    overlay.addEventListener('click', () => {
      document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
      });
      document.body.style.overflow = '';
    });
  });
  
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
      });
      document.body.style.overflow = '';
    }
  });
  
  // Password toggle
  document.querySelectorAll('.togglePassword').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal?.classList.remove('active');
  document.body.style.overflow = '';
}

function openReportModal(type) {
  if (!currentUser) {
    showToast('Please log in to report an item', 'warning');
    openModal('loginModal');
    return;
  }
  
  document.getElementById('reportType').value = type;
  document.getElementById('reportModalTitle').textContent = `Report ${type} Item`;
  document.getElementById('itemContactEmail').value = currentUser.email || '';
  openModal('reportModal');
}

// ===== Forms =====
function initForms() {
  // Login
  elements.loginForm?.addEventListener('submit', handleLogin);
  
  // Signup
  elements.signupForm?.addEventListener('submit', handleSignup);
  
  // Report
  elements.reportForm?.addEventListener('submit', handleReport);
  
  // Contact
  elements.contactForm?.addEventListener('submit', handleContact);
  
  // Image preview
  document.getElementById('itemPhoto')?.addEventListener('change', handleImagePreview);
}

async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.token);
      setCurrentUser(data.user);
      closeModal('loginModal');
      elements.loginForm.reset();
      showToast('Welcome back!', 'success');
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (error) {
    showToast('Network error. Please try again.', 'error');
  }
}

async function handleSignup(e) {
  e.preventDefault();
  
  const username = document.getElementById('signupUsername').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.token);
      setCurrentUser(data.user);
      closeModal('signupModal');
      elements.signupForm.reset();
      showToast('Account created successfully!', 'success');
    } else {
      showToast(data.message || 'Signup failed', 'error');
    }
  } catch (error) {
    showToast('Network error. Please try again.', 'error');
  }
}

async function handleReport(e) {
  e.preventDefault();
  
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('Please log in first', 'warning');
    return;
  }
  
  const formData = new FormData();
  formData.append('name', document.getElementById('itemName').value);
  formData.append('description', document.getElementById('itemDescription').value);
  formData.append('category', document.getElementById('itemCategory').value);
  formData.append('status', document.getElementById('reportType').value);
  formData.append('location', document.getElementById('itemLocation').value);
  formData.append('contactEmail', document.getElementById('itemContactEmail').value);
  formData.append('contactPhone', document.getElementById('itemContactPhone').value || '');
  
  const photoInput = document.getElementById('itemPhoto');
  if (photoInput.files[0]) {
    formData.append('photo', photoInput.files[0]);
  }
  
  try {
    const response = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      closeModal('reportModal');
      elements.reportForm.reset();
      document.getElementById('imagePreview').classList.add('hidden');
      document.getElementById('fileUploadPlaceholder').classList.remove('hidden');
      loadItems();
      showToast('Item reported successfully!', 'success');
    } else {
      showToast(data.message || 'Failed to report item', 'error');
    }
  } catch (error) {
    showToast('Network error. Please try again.', 'error');
  }
}

function handleContact(e) {
  e.preventDefault();
  showToast('Message sent! We\'ll get back to you soon.', 'success');
  e.target.reset();
}

function handleImagePreview(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('imagePreview').src = e.target.result;
      document.getElementById('imagePreview').classList.remove('hidden');
      document.getElementById('fileUploadPlaceholder').classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }
}

// ===== Search =====
function initSearch() {
  elements.quickSearchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    currentFilters.search = document.getElementById('searchInput').value;
    currentFilters.category = document.getElementById('categoryFilter').value;
    currentFilters.status = document.getElementById('statusFilter').value;
    currentPage = 1;
    loadItems();
  });
  
  // View toggle
  document.getElementById('gridViewBtn')?.addEventListener('click', () => setView('grid'));
  document.getElementById('listViewBtn')?.addEventListener('click', () => setView('list'));
}

function setView(view) {
  const grid = elements.itemsGrid;
  document.querySelectorAll('.viewBtn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  
  if (view === 'list') {
    grid.classList.add('listView');
  } else {
    grid.classList.remove('listView');
  }
}

// ===== Items =====
async function loadItems() {
  elements.loadingSpinner?.classList.remove('hidden');
  elements.emptyState?.classList.add('hidden');
  elements.itemsGrid.innerHTML = '';
  
  try {
    const params = new URLSearchParams({
      page: currentPage,
      search: currentFilters.search,
      category: currentFilters.category,
      status: currentFilters.status
    });
    
    const response = await fetch(`${API_URL}/items?${params}`);
    const data = await response.json();
    
    elements.loadingSpinner?.classList.add('hidden');
    
    if (data.items && data.items.length > 0) {
      renderItems(data.items);
      renderPagination(data.pagination);
    } else {
      elements.emptyState?.classList.remove('hidden');
    }
  } catch (error) {
    elements.loadingSpinner?.classList.add('hidden');
    showToast('Failed to load items', 'error');
  }
}

function renderItems(items) {
  elements.itemsGrid.innerHTML = items.map(item => `
    <div class="itemCard" onclick="showItemDetail('${item._id}')">
      <div class="itemCardImage">
        ${item.photo 
          ? `<img src="${item.photo}" alt="${item.name}" />`
          : `<div class="placeholder">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>`
        }
        <span class="itemStatus ${item.status.toLowerCase()}">${item.status}</span>
      </div>
      <div class="itemCardBody">
        <span class="itemCardCategory">${item.category}</span>
        <h3 class="itemCardTitle">${escapeHtml(item.name)}</h3>
        <p class="itemCardDesc">${escapeHtml(item.description)}</p>
        <div class="itemCardMeta">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            ${escapeHtml(item.location)}
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            ${formatDate(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderPagination(pagination) {
  if (!pagination || pagination.pages <= 1) {
    elements.pagination.innerHTML = '';
    return;
  }
  
  let html = '';
  
  html += `<button class="pageBtn" ${pagination.current === 1 ? 'disabled' : ''} onclick="goToPage(${pagination.current - 1})">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  </button>`;
  
  for (let i = 1; i <= pagination.pages; i++) {
    if (i === 1 || i === pagination.pages || (i >= pagination.current - 1 && i <= pagination.current + 1)) {
      html += `<button class="pageBtn ${i === pagination.current ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    } else if (i === pagination.current - 2 || i === pagination.current + 2) {
      html += `<span class="pageDots">...</span>`;
    }
  }
  
  html += `<button class="pageBtn" ${pagination.current === pagination.pages ? 'disabled' : ''} onclick="goToPage(${pagination.current + 1})">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  </button>`;
  
  elements.pagination.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  loadItems();
  document.getElementById('items').scrollIntoView({ behavior: 'smooth' });
}

async function showItemDetail(id) {
  try {
    const response = await fetch(`${API_URL}/items/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const item = data.item;
      document.getElementById('itemDetailContent').innerHTML = `
        <div class="itemDetail">
          ${item.photo 
            ? `<img src="${item.photo}" alt="${item.name}" class="itemDetailImage" />`
            : ''
          }
          <div class="itemDetailHeader">
            <div>
              <h2 class="itemDetailTitle">${escapeHtml(item.name)}</h2>
              <span class="itemStatus ${item.status.toLowerCase()}" style="position: static; display: inline-block; margin-top: 0.5rem;">${item.status}</span>
            </div>
          </div>
          <div class="itemDetailMeta">
            <div>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              ${formatDate(item.createdAt)}
            </div>
            <div>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              ${escapeHtml(item.location)}
            </div>
            <div>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              ${item.category}
            </div>
          </div>
          <div class="itemDetailDesc">
            <h4>Description</h4>
            <p>${escapeHtml(item.description)}</p>
          </div>
          <div class="itemDetailContact">
            <h4>Contact Information</h4>
            <p>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              ${escapeHtml(item.contactEmail)}
            </p>
            ${item.contactPhone ? `
              <p>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                ${escapeHtml(item.contactPhone)}
              </p>
            ` : ''}
            <p style="margin-top: 0.5rem; font-size: 0.875rem;">
              Reported by: ${item.reportedBy?.username || 'Anonymous'}
            </p>
          </div>
        </div>
      `;
      openModal('itemDetailModal');
    }
  } catch (error) {
    showToast('Failed to load item details', 'error');
  }
}

async function loadMyItems() {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const response = await fetch(`${API_URL}/items/user/my-items`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    const container = document.getElementById('myItemsList');
    
    if (data.items && data.items.length > 0) {
      container.innerHTML = data.items.map(item => `
        <div class="myItemCard">
          ${item.photo 
            ? `<img src="${item.photo}" alt="${item.name}" />`
            : `<div style="width: 80px; height: 80px; background: var(--bg-secondary); border-radius: var(--radius); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>`
          }
          <div class="myItemInfo">
            <h4>${escapeHtml(item.name)}</h4>
            <p>
              <span class="itemStatus ${item.status.toLowerCase()}" style="position: static; font-size: 0.7rem; padding: 0.15rem 0.5rem;">${item.status}</span>
              ${item.location} • ${formatDate(item.createdAt)}
            </p>
          </div>
          <div class="myItemActions">
            ${!item.isResolved ? `
              <button class="btn btnAccent" onclick="resolveItem('${item._id}')">Mark Resolved</button>
            ` : `
              <span style="color: var(--accent); font-size: 0.75rem;">✓ Resolved</span>
            `}
            <button class="btn btnOutline" onclick="deleteItem('${item._id}')">Delete</button>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `
        <div class="emptyState" style="padding: 2rem;">
          <p>You haven't reported any items yet.</p>
        </div>
      `;
    }
  } catch (error) {
    showToast('Failed to load your items', 'error');
  }
}

async function resolveItem(id) {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const response = await fetch(`${API_URL}/items/${id}/resolve`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('Item marked as resolved!', 'success');
      loadMyItems();
      loadItems();
    } else {
      showToast(data.message || 'Failed to resolve item', 'error');
    }
  } catch (error) {
    showToast('Network error', 'error');
  }
}

async function deleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const response = await fetch(`${API_URL}/items/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('Item deleted', 'success');
      loadMyItems();
      loadItems();
    } else {
      showToast(data.message || 'Failed to delete item', 'error');
    }
  } catch (error) {
    showToast('Network error', 'error');
  }
}

async function loadStats() {
  // For demo, show placeholder stats
  // In production, you'd fetch real stats from the API
  document.getElementById('totalItems').textContent = '127';
  document.getElementById('resolvedItems').textContent = '89';
  document.getElementById('activeUsers').textContent = '342';
}

// ===== Mobile Menu =====
function initMobileMenu() {
  elements.mobileMenuBtn?.addEventListener('click', () => {
    elements.mobileMenu?.classList.toggle('active');
  });
  
  document.querySelectorAll('.mobileNavLink').forEach(link => {
    link.addEventListener('click', () => {
      elements.mobileMenu?.classList.remove('active');
    });
  });
}

// ===== Toast =====
function showToast(message, type = 'success') {
  const toast = elements.toast;
  const toastMessage = toast.querySelector('.toastMessage');
  const toastIcon = toast.querySelector('.toastIcon');
  
  toast.className = `toast ${type}`;
  toastMessage.textContent = message;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '!'
  };
  toastIcon.textContent = icons[type] || icons.success;
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ===== Utilities =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}
