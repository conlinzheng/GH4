const APP_CONFIG = {
    repoOwner: 'GH4',
    repoName: 'GH4',
    apiBase: 'https://api.github.com'
};

let currentView = 'products';

function initApp() {
    setupNavigation();
    setupTokenModal();
    loadCurrentView();
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const hash = item.getAttribute('href').substring(1);
            switchView(hash);
            updateActiveNav(item);
        });
    });
    
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            switchView(hash);
        }
    });
}

function switchView(viewName) {
    currentView = viewName;
    
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
        targetView.style.display = 'block';
    }
    
    if (typeof window[`init${capitalize(viewName)}`] === 'function') {
        window[`init${capitalize(viewName)}`]();
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateActiveNav(activeItem) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    activeItem.classList.add('active');
}

function loadCurrentView() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        switchView(hash);
    } else {
        switchView('products');
    }
}

function setupTokenModal() {
    const tokenBtn = document.getElementById('tokenBtn');
    const tokenModal = document.getElementById('tokenModal');
    const cancelTokenBtn = document.getElementById('cancelTokenBtn');
    const saveTokenBtn = document.getElementById('saveTokenBtn');
    const tokenInput = document.getElementById('tokenInput');
    
    tokenBtn.addEventListener('click', () => {
        tokenInput.value = localStorage.getItem('github_token') || '';
        tokenModal.style.display = 'flex';
    });
    
    cancelTokenBtn.addEventListener('click', () => {
        tokenModal.style.display = 'none';
    });
    
    saveTokenBtn.addEventListener('click', () => {
        const token = tokenInput.value.trim();
        if (token) {
            localStorage.setItem('github_token', token);
            showNotification('Token 保存成功', 'success');
        }
        tokenModal.style.display = 'none';
    });
    
    tokenModal.addEventListener('click', (e) => {
        if (e.target === tokenModal) {
            tokenModal.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', initApp);
