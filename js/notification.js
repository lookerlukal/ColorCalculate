// 通知和错误处理系统
const NotificationSystem = {
    container: null,
    
    init() {
        this.createNotificationContainer();
    },
    
    createNotificationContainer() {
        if (this.container) return;
        
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        this.container = container;
    },
    
    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            color: white;
            padding: 12px 20px;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-size: 14px;
            max-width: 300px;
            pointer-events: auto;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        notification.textContent = message;
        
        this.container.appendChild(notification);
        
        // 触发动画
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });
        
        // 自动移除
        setTimeout(() => {
            this.remove(notification);
        }, duration);
        
        // 点击移除
        notification.addEventListener('click', () => {
            this.remove(notification);
        });
        
        return notification;
    },
    
    remove(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },
    
    getBackgroundColor(type) {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        return colors[type] || colors.info;
    },
    
    // 快捷方法
    success(message, duration) {
        return this.show(message, 'success', duration);
    },
    
    error(message, duration) {
        return this.show(message, 'error', duration);
    },
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    },
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
};

// 错误处理工具
const ErrorHandler = {
    handle(error, context = '') {
        console.error(`[${context}]`, error);
        
        let message = ColorCalculatorConfig.errorMessages.calculationFailed;
        
        if (typeof error === 'string') {
            message = error;
        } else if (error.message) {
            message = error.message;
        }
        
        NotificationSystem.error(message);
    },
    
    validate(value, min, max, fieldName) {
        if (isNaN(value) || value < min || value > max) {
            const message = `${fieldName} 必须在 ${min} 到 ${max} 之间`;
            NotificationSystem.warning(message);
            return false;
        }
        return true;
    },
    
    checkBrowserSupport() {
        const features = {
            canvas: !!document.createElement('canvas').getContext,
            localStorage: typeof Storage !== 'undefined'
        };
        
        for (const [feature, supported] of Object.entries(features)) {
            if (!supported) {
                const message = ColorCalculatorConfig.errorMessages[`${feature}NotSupported`];
                NotificationSystem.error(message, 0); // 不自动消失
                return false;
            }
        }
        
        return true;
    }
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    NotificationSystem.init();
    ErrorHandler.checkBrowserSupport();
});