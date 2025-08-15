// 日志系统 - 用于调试和监控应用状态
const Logger = {
    logs: [],
    maxLogs: 1000,
    levels: {
        DEBUG: { value: 0, name: 'DEBUG', color: '#6c757d' },
        INFO: { value: 1, name: 'INFO', color: '#17a2b8' },
        WARN: { value: 2, name: 'WARN', color: '#ffc107' },
        ERROR: { value: 3, name: 'ERROR', color: '#dc3545' }
    },
    currentLevel: 0, // DEBUG level by default
    isVisible: false,
    panel: null,
    
    init() {
        this.createLogPanel();
        this.bindEvents();
        this.info('日志系统初始化完成');
    },
    
    createLogPanel() {
        // 创建日志面板容器
        const panel = document.createElement('div');
        panel.id = 'log-panel';
        panel.className = 'log-panel hidden';
        panel.innerHTML = `
            <div class="log-header">
                <h3>调试日志</h3>
                <div class="log-controls">
                    <select id="log-level-filter" class="log-filter">
                        <option value="0">全部</option>
                        <option value="1">INFO+</option>
                        <option value="2">WARN+</option>
                        <option value="3">ERROR</option>
                    </select>
                    <button id="clear-logs" class="log-btn">清空</button>
                    <button id="export-logs" class="log-btn">导出</button>
                    <button id="close-logs" class="log-btn">关闭</button>
                </div>
            </div>
            <div class="log-content" id="log-content">
                <div class="log-empty">暂无日志</div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.panel = panel;
        
        // 添加样式
        this.addLogStyles();
    },
    
    addLogStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .log-panel {
                position: fixed;
                top: 50px;
                right: 20px;
                width: 500px;
                height: 400px;
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 12px;
            }
            
            .log-panel.hidden {
                display: none;
            }
            
            .log-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                background: #f8f9fa;
                border-bottom: 1px solid #ddd;
                border-radius: 8px 8px 0 0;
            }
            
            .log-header h3 {
                margin: 0;
                font-size: 14px;
                color: #333;
            }
            
            .log-controls {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            
            .log-filter, .log-btn {
                padding: 4px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: #fff;
                font-size: 11px;
                cursor: pointer;
            }
            
            .log-btn:hover {
                background: #e9ecef;
            }
            
            .log-content {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                background: #f8f9fa;
            }
            
            .log-empty {
                text-align: center;
                color: #6c757d;
                padding: 20px;
                font-style: italic;
            }
            
            .log-entry {
                display: flex;
                margin-bottom: 4px;
                padding: 4px 8px;
                border-radius: 3px;
                background: rgba(255,255,255,0.7);
                border-left: 3px solid transparent;
            }
            
            .log-time {
                flex-shrink: 0;
                width: 60px;
                color: #6c757d;
                font-size: 10px;
            }
            
            .log-level {
                flex-shrink: 0;
                width: 50px;
                font-weight: bold;
                text-align: center;
                font-size: 10px;
            }
            
            .log-message {
                flex: 1;
                color: #333;
                word-break: break-word;
            }
            
            .log-context {
                flex-shrink: 0;
                color: #6c757d;
                font-size: 10px;
                font-style: italic;
                margin-left: 8px;
            }
            
            .log-toggle-btn {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 12px;
                cursor: pointer;
                font-size: 12px;
                z-index: 10000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            
            .log-toggle-btn:hover {
                background: #0056b3;
            }
        `;
        
        document.head.appendChild(style);
    },
    
    bindEvents() {
        // 日志级别过滤
        const levelFilter = document.getElementById('log-level-filter');
        if (levelFilter) {
            levelFilter.addEventListener('change', (e) => {
                this.currentLevel = parseInt(e.target.value);
                this.refreshDisplay();
            });
        }
        
        // 清空日志
        const clearBtn = document.getElementById('clear-logs');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clear();
            });
        }
        
        // 导出日志
        const exportBtn = document.getElementById('export-logs');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportLogs();
            });
        }
        
        // 关闭面板
        const closeBtn = document.getElementById('close-logs');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }
        
        // 创建切换按钮
        this.createToggleButton();
    },
    
    createToggleButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'log-toggle-btn';
        toggleBtn.className = 'log-toggle-btn';
        toggleBtn.textContent = 'LOG';
        toggleBtn.addEventListener('click', () => {
            this.toggle();
        });
        
        document.body.appendChild(toggleBtn);
    },
    
    log(level, message, context = '') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            level,
            message,
            context,
            id: Date.now() + Math.random()
        };
        
        this.logs.push(logEntry);
        
        // 限制日志数量
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        
        // 同时输出到控制台
        const consoleMethod = level === 'ERROR' ? 'error' : 
                             level === 'WARN' ? 'warn' : 
                             level === 'INFO' ? 'info' : 'debug';
        console[consoleMethod](`[${timestamp}] [${level}] ${context ? `[${context}] ` : ''}${message}`);
        
        // 更新显示
        if (this.isVisible) {
            this.refreshDisplay();
        }
    },
    
    debug(message, context) {
        this.log('DEBUG', message, context);
    },
    
    info(message, context) {
        this.log('INFO', message, context);
    },
    
    warn(message, context) {
        this.log('WARN', message, context);
    },
    
    error(message, context) {
        this.log('ERROR', message, context);
    },
    
    refreshDisplay() {
        const content = document.getElementById('log-content');
        if (!content) return;
        
        const filteredLogs = this.logs.filter(log => 
            this.levels[log.level].value >= this.currentLevel
        );
        
        if (filteredLogs.length === 0) {
            content.innerHTML = '<div class="log-empty">无匹配的日志记录</div>';
            return;
        }
        
        content.innerHTML = filteredLogs.map(log => {
            const levelInfo = this.levels[log.level];
            return `
                <div class="log-entry" style="border-left-color: ${levelInfo.color}">
                    <div class="log-time">${log.timestamp.split(' ')[1] || log.timestamp}</div>
                    <div class="log-level" style="color: ${levelInfo.color}">${levelInfo.name}</div>
                    <div class="log-message">${this.escapeHtml(log.message)}</div>
                    ${log.context ? `<div class="log-context">[${this.escapeHtml(log.context)}]</div>` : ''}
                </div>
            `;
        }).join('');
        
        // 滚动到底部
        content.scrollTop = content.scrollHeight;
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    show() {
        if (this.panel) {
            this.panel.classList.remove('hidden');
            this.isVisible = true;
            this.refreshDisplay();
        }
    },
    
    hide() {
        if (this.panel) {
            this.panel.classList.add('hidden');
            this.isVisible = false;
        }
    },
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    },
    
    clear() {
        this.logs = [];
        this.refreshDisplay();
        this.info('日志已清空');
    },
    
    exportLogs() {
        const logText = this.logs.map(log => 
            `[${log.timestamp}] [${log.level}] ${log.context ? `[${log.context}] ` : ''}${log.message}`
        ).join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `color-calculator-logs-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.info('日志已导出');
    }
};

// 页面加载时初始化日志系统
document.addEventListener('DOMContentLoaded', () => {
    Logger.init();
});