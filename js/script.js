// 色彩计算器 - 兼容性和遗留功能模块
// 注意：大部分功能已迁移到新的模块化架构中

// 为了保持向后兼容，保留一些全局变量的引用
let colorPoints, draggingPoint, draggingSlider, activeMode, sliderStepSize, showGamutBoundaries;
let canvas, ctx;

// 初始化兼容性层
function initCompatibilityLayer() {
    if (typeof ColorCalculatorApp !== 'undefined') {
        // 将新架构的状态映射到旧的全局变量
        colorPoints = ColorCalculatorApp.state.colorPoints;
        draggingPoint = ColorCalculatorApp.state.draggingPoint;
        draggingSlider = ColorCalculatorApp.state.draggingSlider;
        activeMode = ColorCalculatorApp.state.activeMode;
        sliderStepSize = ColorCalculatorApp.state.sliderStepSize;
        showGamutBoundaries = ColorCalculatorApp.state.showGamutBoundaries;
        
        canvas = ColorCalculatorApp.elements.canvas;
        if (canvas) {
            ctx = canvas.getContext('2d');
        }
    }
}

// 预设管理功能（简化版本）
const PresetManager = {
    presets: {
        red: {},
        green: {},
        blue: {}
    },
    
    init() {
        this.loadPresets();
        this.populatePresetSelects();
        this.bindPresetEvents();
    },
    
    loadPresets() {
        try {
            const saved = localStorage.getItem('colorPresets');
            if (saved) {
                this.presets = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('无法加载预设:', error);
        }
    },
    
    savePresets() {
        try {
            localStorage.setItem('colorPresets', JSON.stringify(this.presets));
        } catch (error) {
            console.warn('无法保存预设:', error);
        }
    },
    
    populatePresetSelects() {
        const colors = ['red', 'green', 'blue'];
        
        colors.forEach(color => {
            const select = document.getElementById(`${color}-presets`);
            if (!select) return;
            
            // 清空现有选项
            select.innerHTML = '<option value="">选择预设...</option>';
            
            // 添加预设选项
            Object.keys(this.presets[color] || {}).forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            });
        });
    },
    
    bindPresetEvents() {
        const colors = ['red', 'green', 'blue'];
        
        colors.forEach(color => {
            // 预设选择事件
            const select = document.getElementById(`${color}-presets`);
            if (select) {
                select.addEventListener('change', (e) => {
                    this.applyPreset(color, e.target.value);
                });
            }
            
            // 保存预设按钮事件
            const saveBtn = document.getElementById(`save-${color}-preset`);
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    this.saveCurrentAsPreset(color);
                });
            }
        });
    },
    
    applyPreset(color, presetName) {
        if (!presetName || !this.presets[color] || !this.presets[color][presetName]) return;
        
        const preset = this.presets[color][presetName];
        
        // 更新应用状态
        if (typeof ColorCalculatorApp !== 'undefined') {
            ColorCalculatorApp.state.colorPoints[color].x = preset.x;
            ColorCalculatorApp.state.colorPoints[color].y = preset.y;
            ColorCalculatorApp.state.colorPoints[color].lv = preset.lv;
            
            ColorCalculatorApp.performCalculation();
            ColorCalculatorApp.updateDisplay();
        }
        
        NotificationSystem.success(`已应用预设: ${presetName}`);
    },
    
    saveCurrentAsPreset(color) {
        const name = prompt('请输入预设名称:', '');
        if (!name || name.trim() === '') return;
        
        const cleanName = name.trim();
        
        // 获取当前值
        let currentPoint = null;
        if (typeof ColorCalculatorApp !== 'undefined') {
            currentPoint = ColorCalculatorApp.state.colorPoints[color];
        }
        
        if (!currentPoint) return;
        
        // 保存预设
        if (!this.presets[color]) {
            this.presets[color] = {};
        }
        
        this.presets[color][cleanName] = {
            x: currentPoint.x,
            y: currentPoint.y,
            lv: currentPoint.lv
        };
        
        this.savePresets();
        this.populatePresetSelects();
        
        NotificationSystem.success(`预设 "${cleanName}" 已保存`);
    }
};

// 一些遗留的实用函数
function getCanvasScaleFactor() {
    return ChartRenderer ? ChartRenderer.getCanvasScaleFactor() : 1;
}

function screenToCieCoordinates(screenX, screenY) {
    if (ChartRenderer) {
        return ChartRenderer.screenToCieCoordinates(screenX, screenY, 
            ColorCalculatorConfig.canvas.width, ColorCalculatorConfig.canvas.height);
    }
    return { x: 0, y: 0 };
}

function cieToScreenCoordinates(cieX, cieY) {
    if (ChartRenderer) {
        return ChartRenderer.cieToScreenCoordinates(cieX, cieY, 
            ColorCalculatorConfig.canvas.width, ColorCalculatorConfig.canvas.height);
    }
    return { x: 0, y: 0 };
}

// 调试用函数
function debugDrawButtonBoundaries() {
    console.log('Debug: Button boundaries visualization');
    // 这个函数在新架构中由 debugTool 处理
}

// 页面加载完成后初始化兼容性层
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initCompatibilityLayer();
        if (typeof PresetManager !== 'undefined') {
            PresetManager.init();
        }
    }, 100); // 延迟执行确保其他模块已加载
});

// 导出一些兼容性函数供其他脚本使用
window.ColorCalculatorLegacy = {
    getCanvasScaleFactor,
    screenToCieCoordinates,
    cieToScreenCoordinates,
    debugDrawButtonBoundaries,
    PresetManager
};