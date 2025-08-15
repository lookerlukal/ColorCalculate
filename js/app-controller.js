// 主应用控制器 - 管理所有模块和状态
const ColorCalculatorApp = {
    // 应用状态
    state: {
        colorPoints: null,
        activeMode: 'mode1',
        draggingPoint: null,
        draggingSlider: null,
        sliderStepSize: 1.0,
        showGamutBoundaries: true
    },
    
    // DOM 元素引用
    elements: {
        canvas: null,
        tabs: {},
        modes: {},
        inputs: {},
        results: {}
    },
    
    // 初始化应用
    init() {
        try {
            this.initializeState();
            this.cacheElements();
            this.initializeModules();
            this.bindEvents();
            this.updateDisplay();
            
            NotificationSystem.success('色彩计算器初始化完成');
        } catch (error) {
            ErrorHandler.handle(error, 'App initialization');
        }
    },
    
    // 初始化应用状态
    initializeState() {
        this.state.colorPoints = { ...ColorCalculatorConfig.defaultColorPoints };
        this.state.sliderStepSize = ColorCalculatorConfig.slider.defaultStepSize;
        this.state.showGamutBoundaries = ColorCalculatorConfig.ui.showGamutBoundaries;
    },
    
    // 缓存 DOM 元素
    cacheElements() {
        // Canvas 元素
        this.elements.canvas = document.getElementById('cie1931');
        
        // 标签页元素
        this.elements.tabs = {
            tab1: document.getElementById('tab1'),
            tab2: document.getElementById('tab2'),
            tab3: document.getElementById('tab3')
        };
        
        // 模式容器
        this.elements.modes = {
            mode1: document.getElementById('mode1'),
            mode2: document.getElementById('mode2'),
            mode3: document.getElementById('mode3')
        };
        
        // 输入控件
        this.cacheInputElements();
        
        // 结果显示元素
        this.cacheResultElements();
    },
    
    cacheInputElements() {
        const colors = ['red', 'green', 'blue'];
        this.elements.inputs = {};
        
        colors.forEach(color => {
            this.elements.inputs[color] = {
                x: document.getElementById(`${color}-x`),
                y: document.getElementById(`${color}-y`),
                lv: document.getElementById(`${color}-lv`),
                presets: document.getElementById(`${color}-presets`),
                saveBtn: document.getElementById(`save-${color}-preset`)
            };
        });
        
        // 目标色输入（模式2和3）
        this.elements.inputs.target = {
            x: document.getElementById('target-x'),
            y: document.getElementById('target-y'),
            lv: document.getElementById('target-lv')
        };
    },
    
    cacheResultElements() {
        this.elements.results = {
            // 模式1结果
            mixX: document.getElementById('mix-x'),
            mixY: document.getElementById('mix-y'),
            mixLv: document.getElementById('mix-lv'),
            
            // 模式2结果
            requiredRed: document.getElementById('required-red-lv'),
            requiredGreen: document.getElementById('required-green-lv'),
            requiredBlue: document.getElementById('required-blue-lv'),
            
            // 模式3结果
            maxLv: document.getElementById('max-lv-result'),
            limitingColor: document.getElementById('limiting-color'),
            redUsed: document.getElementById('red-used-lv'),
            greenUsed: document.getElementById('green-used-lv'),
            blueUsed: document.getElementById('blue-used-lv')
        };
    },
    
    // 初始化各个模块
    initializeModules() {
        // 初始化图表渲染器
        ChartRenderer.init(this.elements.canvas);
        
        // 初始化预设管理器
        if (typeof PresetManager !== 'undefined') {
            PresetManager.init();
        }
    },
    
    // 绑定事件监听器
    bindEvents() {
        // 标签页切换
        Object.entries(this.elements.tabs).forEach(([tabId, tabElement]) => {
            tabElement.addEventListener('click', (e) => {
                this.switchMode(tabId.replace('tab', 'mode'));
            });
        });
        
        // Canvas 交互事件
        this.bindCanvasEvents();
        
        // 输入框事件
        this.bindInputEvents();
        
        // 键盘事件
        this.bindKeyboardEvents();
        
        // 窗口大小改变事件
        window.addEventListener('resize', () => {
            ChartRenderer.invalidateCache();
            this.updateDisplay();
        });
    },
    
    // 绑定 Canvas 交互事件
    bindCanvasEvents() {
        const canvas = this.elements.canvas;
        
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // 防止右键菜单
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    },
    
    // 绑定输入框事件
    bindInputEvents() {
        const colors = ['red', 'green', 'blue', 'target'];
        
        colors.forEach(color => {
            const inputs = this.elements.inputs[color];
            if (!inputs) return;
            
            ['x', 'y', 'lv'].forEach(property => {
                if (inputs[property]) {
                    inputs[property].addEventListener('input', (e) => {
                        this.handleInputChange(color, property, parseFloat(e.target.value));
                    });
                }
            });
        });
    },
    
    // 绑定键盘事件
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.state.draggingPoint = null;
                this.state.draggingSlider = null;
                this.updateDisplay();
            }
            
            // 步长控制
            if (e.key === 'Shift') {
                this.state.sliderStepSize = 0.1;
            } else if (e.key === 'Control') {
                this.state.sliderStepSize = 0.01;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift' || e.key === 'Control') {
                this.state.sliderStepSize = ColorCalculatorConfig.slider.defaultStepSize;
            }
        });
    },
    
    // 切换计算模式
    switchMode(mode) {
        // 更新活动模式
        this.state.activeMode = mode;
        
        // 更新标签页样式
        Object.values(this.elements.tabs).forEach(tab => tab.classList.remove('active'));
        Object.values(this.elements.modes).forEach(mode => mode.classList.remove('active'));
        
        const activeTabId = mode.replace('mode', 'tab');
        if (this.elements.tabs[activeTabId]) {
            this.elements.tabs[activeTabId].classList.add('active');
        }
        if (this.elements.modes[mode]) {
            this.elements.modes[mode].classList.add('active');
        }
        
        // 执行对应的计算
        this.performCalculation();
        
        // 更新显示
        this.updateDisplay();
    },
    
    // 处理鼠标按下事件
    handleMouseDown(e) {
        const rect = this.elements.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 检查是否点击了某个颜色点
        const clickedPoint = this.getClickedPoint(x, y);
        if (clickedPoint) {
            this.state.draggingPoint = clickedPoint;
            this.elements.canvas.style.cursor = 'grabbing';
        }
    },
    
    // 处理鼠标移动事件
    handleMouseMove(e) {
        const rect = this.elements.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.state.draggingPoint) {
            // 更新拖拽点的位置
            const cieCoords = ChartRenderer.screenToCieCoordinates(x, y, 
                ColorCalculatorConfig.canvas.width, ColorCalculatorConfig.canvas.height);
            
            // 限制坐标范围
            cieCoords.x = Math.max(0, Math.min(1, cieCoords.x));
            cieCoords.y = Math.max(0, Math.min(1, cieCoords.y));
            
            this.state.colorPoints[this.state.draggingPoint].x = cieCoords.x;
            this.state.colorPoints[this.state.draggingPoint].y = cieCoords.y;
            
            this.updateInputs();
            this.performCalculation();
            this.updateDisplay();
        } else {
            // 检查鼠标是否悬停在颜色点上
            const hoveredPoint = this.getClickedPoint(x, y);
            this.elements.canvas.style.cursor = hoveredPoint ? 'grab' : 'default';
        }
    },
    
    // 处理鼠标释放事件
    handleMouseUp(e) {
        this.state.draggingPoint = null;
        this.elements.canvas.style.cursor = 'default';
    },
    
    // 获取被点击的颜色点
    getClickedPoint(screenX, screenY) {
        const config = ColorCalculatorConfig;
        const tolerance = 15; // 点击容差
        
        const pointNames = ['red', 'green', 'blue'];
        if (this.state.activeMode === 'mode2' || this.state.activeMode === 'mode3') {
            pointNames.push('target');
        } else if (this.state.activeMode === 'mode1') {
            pointNames.push('mix');
        }
        
        for (const pointName of pointNames) {
            if (pointName === 'mix' && this.state.activeMode !== 'mode1') continue;
            
            const point = this.state.colorPoints[pointName];
            const screenCoords = ChartRenderer.cieToScreenCoordinates(
                point.x, point.y, config.canvas.width, config.canvas.height);
            
            const distance = Math.sqrt(
                Math.pow(screenX - screenCoords.x, 2) + 
                Math.pow(screenY - screenCoords.y, 2)
            );
            
            if (distance <= tolerance) {
                return pointName;
            }
        }
        
        return null;
    },
    
    // 处理输入框变化
    handleInputChange(color, property, value) {
        if (isNaN(value)) return;
        
        // 验证输入范围
        let isValid = true;
        if (property === 'x' || property === 'y') {
            isValid = ErrorHandler.validate(value, 0, 1, `${color} ${property}坐标`);
        } else if (property === 'lv') {
            const maxLv = ColorCalculatorConfig.slider.maxLvValues[color] || 100;
            isValid = ErrorHandler.validate(value, 0, maxLv, `${color} 光通量`);
        }
        
        if (isValid) {
            this.state.colorPoints[color][property] = value;
            this.performCalculation();
            this.updateDisplay();
        }
    },
    
    // 执行计算
    performCalculation() {
        try {
            if (this.state.activeMode === 'mode1') {
                const mixResult = ColorCalculator.calculateMixedColor(this.state.colorPoints);
                this.state.colorPoints.mix = mixResult;
            } else if (this.state.activeMode === 'mode2') {
                const required = ColorCalculator.calculateRequiredLuminance(this.state.colorPoints);
                this.updateMode2Results(required);
            } else if (this.state.activeMode === 'mode3') {
                const maxResult = ColorCalculator.calculateMaxLuminance(this.state.colorPoints);
                this.updateMode3Results(maxResult);
            }
        } catch (error) {
            ErrorHandler.handle(error, 'Calculation');
        }
    },
    
    // 更新模式2结果显示
    updateMode2Results(results) {
        if (this.elements.results.requiredRed) {
            this.elements.results.requiredRed.textContent = results.red.toFixed(1);
        }
        if (this.elements.results.requiredGreen) {
            this.elements.results.requiredGreen.textContent = results.green.toFixed(1);
        }
        if (this.elements.results.requiredBlue) {
            this.elements.results.requiredBlue.textContent = results.blue.toFixed(1);
        }
    },
    
    // 更新模式3结果显示
    updateMode3Results(results) {
        if (this.elements.results.maxLv) {
            this.elements.results.maxLv.textContent = results.maxLuminance.toFixed(1);
        }
        if (this.elements.results.redUsed) {
            this.elements.results.redUsed.textContent = results.ratio.red.toFixed(1);
        }
        if (this.elements.results.greenUsed) {
            this.elements.results.greenUsed.textContent = results.ratio.green.toFixed(1);
        }
        if (this.elements.results.blueUsed) {
            this.elements.results.blueUsed.textContent = results.ratio.blue.toFixed(1);
        }
    },
    
    // 更新输入框显示
    updateInputs() {
        const colors = ['red', 'green', 'blue', 'target'];
        
        colors.forEach(color => {
            const point = this.state.colorPoints[color];
            const inputs = this.elements.inputs[color];
            
            if (point && inputs) {
                if (inputs.x) inputs.x.value = point.x.toFixed(4);
                if (inputs.y) inputs.y.value = point.y.toFixed(4);
                if (inputs.lv) inputs.lv.value = point.lv.toFixed(1);
            }
        });
        
        // 更新模式1的混合结果显示
        if (this.state.activeMode === 'mode1') {
            const mix = this.state.colorPoints.mix;
            if (this.elements.results.mixX) this.elements.results.mixX.textContent = mix.x.toFixed(4);
            if (this.elements.results.mixY) this.elements.results.mixY.textContent = mix.y.toFixed(4);
            if (this.elements.results.mixLv) this.elements.results.mixLv.textContent = mix.lv.toFixed(1);
        }
    },
    
    // 更新显示
    updateDisplay() {
        ChartRenderer.draw(this.state.colorPoints, this.state.activeMode, this.state.showGamutBoundaries);
        this.updateInputs();
    }
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    ColorCalculatorApp.init();
});