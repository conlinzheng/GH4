function handleError(error, fallback = null) {
    console.error('Error:', error);
    
    const message = error.message || 'An unknown error occurred';
    
    if (document.querySelector('.error-message')) {
        return;
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.products-grid');
    if (container) {
        container.innerHTML = '';
        container.appendChild(errorDiv);
    }
    
    return fallback;
}

function showNotification(message, type = 'error') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'error') {
        notification.style.backgroundColor = '#e74c3c';
        notification.style.color = '#fff';
    } else if (type === 'success') {
        notification.style.backgroundColor = '#27ae60';
        notification.style.color = '#fff';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#f39c12';
        notification.style.color = '#fff';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

window.handleError = handleError;
window.showNotification = showNotification;