const UINotifier = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 3000) {
        this.init();
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            min-width: 200px;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            background: ${this.getBgColor(type)};
            border-left: 4px solid ${this.getBorderColor(type)};
        `;
        
        notification.textContent = message;
        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },
    
    getBgColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        return colors[type] || colors.info;
    },
    
    getBorderColor(type) {
        const colors = {
            success: '#2E7D32',
            error: '#c62828',
            warning: '#ef6c00',
            info: '#1565C0'
        };
        return colors[type] || colors.info;
    },
    
    success(message) {
        this.show(message, 'success');
    },
    
    error(message) {
        this.show(message, 'error', 5000);
    },
    
    warning(message) {
        this.show(message, 'warning');
    },
    
    info(message) {
        this.show(message, 'info');
    }
};

const showNotification = (message, type = 'info') => {
    UINotifier.show(message, type);
};

const showSuccess = (message) => {
    UINotifier.success(message);
};

const showError = (message) => {
    UINotifier.error(message);
};

const showWarning = (message) => {
    UINotifier.warning(message);
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UINotifier, showNotification, showSuccess, showError, showWarning };
}
