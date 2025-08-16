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
            this.performCalculation(); // 初始化时执行一次计算
            this.updateDisplay();
            
            NotificationSystem.success('色彩计算器初始化完成');
        } catch (error) {
            ErrorHandler.handle(error, 'App initialization');
        }
    },

    // 根据配置格式化数值显示
    formatValue(value, type = 'luminance') {
        const precision = ColorCalculatorConfig.precision.display[type];
        return Number(value).toFixed(precision);
    },
    
    // 初始化应用状态
    initializeState() {
        this.state.colorPoints = { ...ColorCalculatorConfig.defaultColorPoints };
        this.state.sliderStepSize = ColorCalculatorConfig.slider.defaultStepSize;
        this.state.showGamutBoundaries = ColorCalculatorConfig.ui.showGamutBoundaries;
        this.state.debugMode = false; // 调试模式，可通过控制台设置 ColorCalculatorApp.state.debugMode = true
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
            mode3: document.getElementById('mode3'),
            mode4: document.getElementById('mode4')
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
                maxLv: document.getElementById(`${color}-max-lv`), // 模式4的最大光通量
                // LED分BIN选择器元素
                ledEnable: document.getElementById(`${color}-led-enable`),
                ledLuminanceBin: document.getElementById(`${color}-luminance-bin`),
                ledColorBin: document.getElementById(`${color}-color-bin`),
                ledInfo: document.getElementById(`${color}-led-info`)
            };
        });
        
        // 模式3多选目标色相关元素
        this.elements.inputs.mode3 = {
            // 手动输入
            manualX: document.getElementById('manual-target-x'),
            manualY: document.getElementById('manual-target-y'),
            manualLv: document.getElementById('manual-target-lv'),
            manualMaxHint: document.getElementById('manual-max-lv-hint'),
            addManualBtn: document.getElementById('add-manual-target'),
            
            // Excel选择
            excelSelector: document.getElementById('excel-target-selector'),
            excelLv: document.getElementById('excel-target-lv'),
            excelMaxHint: document.getElementById('excel-max-lv-hint'),
            addExcelBtn: document.getElementById('add-excel-target'),
            
            // 目标列表
            targetList: document.getElementById('target-list'),
            clearAllBtn: document.getElementById('clear-all-targets')
        };
        
        // Excel导入相关元素（模式2）
        this.elements.inputs.excel = {
            fileInput: document.getElementById('excel-file-input'),
            selectBtn: document.getElementById('select-excel-btn'),
            loadDefaultBtn: document.getElementById('load-default-btn'),
            dataStats: document.getElementById('excel-data-stats'),
            tableContainer: document.getElementById('color-table-container')
        };
        
        // 应用状态 - 添加选中的目标色列表
        this.state.selectedTargets = [];
    },
    
    cacheResultElements() {
        this.elements.results = {
            // 模式1结果
            mixX: document.getElementById('mix-x'),
            mixY: document.getElementById('mix-y'),
            mixLv: document.getElementById('mix-lv'),
            
            // 模式2结果
            requiredRed: document.getElementById('red-lv-result'),
            requiredGreen: document.getElementById('green-lv-result'),
            requiredBlue: document.getElementById('blue-lv-result'),
            
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
        
        // 初始化LED分BIN管理器
        if (typeof LEDBinManager !== 'undefined') {
            LEDBinManager.init();
            this.initializeLEDSelectors(); // 初始化LED选择器
        }
        
        
        // 初始化Excel加载器
        if (typeof ExcelLoader !== 'undefined') {
            ExcelLoader.init();
        }
        
        // 初始化颜色表格组件
        if (typeof ColorTable !== 'undefined') {
            ColorTable.init('color-table-container');
        }
    },
    
    // 绑定事件监听器
    bindEvents() {
        // 标签页切换
        Object.entries(this.elements.tabs).forEach(([tabId, tabElement]) => {
            if (tabElement) {  // 添加null检查
                tabElement.addEventListener('click', (e) => {
                    this.switchMode(tabId.replace('tab', 'mode'));
                });
            }
        });
        
        // Canvas 交互事件
        this.bindCanvasEvents();
        
        // 输入框事件
        this.bindInputEvents();
        
        // LED选择器事件
        this.bindLEDEvents();
        
        // 键盘事件
        this.bindKeyboardEvents();
        
        // 色域显示开关
        const gamutToggle = document.getElementById('show-gamut');
        if (gamutToggle) {
            gamutToggle.addEventListener('change', (e) => {
                this.state.showGamutBoundaries = e.target.checked;
                Logger.info(`色域显示: ${e.target.checked ? '开启' : '关闭'}`, 'UI');
                this.updateDisplay();
            });
        }
        
        // 计算按钮事件绑定
        this.bindCalculationButtons();
        
        // 窗口大小改变事件
        window.addEventListener('resize', () => {
            ChartRenderer.invalidateCache();
            this.updateDisplay();
        });
        
        // Excel导入相关事件
        this.bindExcelEvents();
        
        // 色域边界检测事件
        this.bindGamutCheckEvents();
        
        // 模式3多选目标色事件
        this.bindMode3Events();
    },
    
    // 绑定 Canvas 交互事件
    bindCanvasEvents() {
        const canvas = this.elements.canvas;
        
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // 缩放功能（鼠标滚轮）
        canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
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
                        const value = parseFloat(e.target.value);
                        Logger.debug(`输入变化: ${color}.${property} = ${value}`, 'InputHandler');
                        this.handleInputChange(color, property, value);
                    });
                }
            });
            
            // 为模式3的最大光通量输入框添加事件监听
            if (inputs.maxLv) {
                inputs.maxLv.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    Logger.debug(`最大光通量变化: ${color}.maxLv = ${value}`, 'InputHandler');
                    this.handleMaxLvChange(color, value);
                });
            }
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
            
            // 重置缩放 (R键)
            if (e.key === 'r' || e.key === 'R') {
                ChartRenderer.resetTransform();
                ChartRenderer.invalidateCache();
                this.updateDisplay();
            }
            
            // 调试模式开关 (D键)
            if (e.key === 'd' || e.key === 'D') {
                this.state.debugMode = !this.state.debugMode;
                console.log('调试模式:', this.state.debugMode ? '开启' : '关闭');
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
    
    // 绑定计算按钮事件
    bindCalculationButtons() {
        // 模式1计算按钮
        const calcMixBtn = document.getElementById('calculate-mix');
        if (calcMixBtn) {
            calcMixBtn.addEventListener('click', () => {
                Logger.info('手动触发模式1计算', 'UI');
                this.performCalculation();
                this.updateDisplay();
            });
        }
        
        // 模式3计算按钮（按设定值计算）
        const calcLvBtn = document.getElementById('calculate-lv');
        if (calcLvBtn) {
            calcLvBtn.addEventListener('click', () => {
                Logger.info('手动触发模式3计算（按设定值）', 'UI');
                this.performCalculation();
                this.updateDisplay();
            });
        }
        
        // 模式3计算按钮（按最大值计算）
        const calcLvMaxBtn = document.getElementById('calculate-lv-max');
        if (calcLvMaxBtn) {
            calcLvMaxBtn.addEventListener('click', () => {
                Logger.info('手动触发模式3计算（按最大值）', 'UI');
                this.calculateMode3MaxLuminance();
                this.updateDisplay();
            });
        }
        
        // 模式3计算按钮
        const calcMaxLvBtn = document.getElementById('calculate-max-lv');
        if (calcMaxLvBtn) {
            calcMaxLvBtn.addEventListener('click', () => {
                Logger.info('手动触发模式3计算', 'UI');
                this.performCalculation();
                this.updateDisplay();
            });
        }
        
        // Excel目标色选择器事件已移到bindMode3Events中处理
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
        
        // 同步输入值 - 确保目标色坐标在所有模式间一致
        this.syncInputValues();
        
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
        
        // 先检查是否点击了Excel数据点
        if (this.handleExcelDataPointClick(e)) {
            return;
        }
        
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
        
        // 添加调试信息
        if (this.state.debugMode) {
            console.log('=== Mouse Debug Info ===');
            console.log('Client coords:', e.clientX, e.clientY);
            console.log('Canvas rect:', rect);
            console.log('Relative coords:', x, y);
            console.log('Canvas size (CSS):', rect.width, rect.height);
            console.log('Canvas size (internal):', this.elements.canvas.width, this.elements.canvas.height);
            console.log('Canvas size (config):', ColorCalculatorConfig.canvas.width, ColorCalculatorConfig.canvas.height);
            console.log('DevicePixelRatio:', window.devicePixelRatio);
            console.log('Scale factor:', ChartRenderer.getCanvasScaleFactor());
            
            // 测试各种坐标转换
            const cieCoords1 = ChartRenderer.screenToCieCoordinates(x, y, 
                ColorCalculatorConfig.canvas.width, ColorCalculatorConfig.canvas.height);
            const cieCoords2 = ChartRenderer.transformedScreenToCieCoordinates(x, y,
                ColorCalculatorConfig.canvas.width, ColorCalculatorConfig.canvas.height);
                
            console.log('CIE coords (normal):', cieCoords1);
            console.log('CIE coords (transformed):', cieCoords2);
            console.log('Transform state:', ChartRenderer.transform);
            console.log('========================');
        }
        
        if (this.state.draggingPoint) {
            // 更新拖拽点的位置（使用考虑变换的坐标转换）
            const cieCoords = ChartRenderer.transformedScreenToCieCoordinates(x, y, 
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
        
        // 存储鼠标位置用于调试绘制
        if (this.state.debugMode) {
            this.state.mouseX = x;
            this.state.mouseY = y;
        }
    },
    
    // 处理鼠标释放事件
    handleMouseUp(e) {
        this.state.draggingPoint = null;
        this.elements.canvas.style.cursor = 'default';
    },
    
    // 处理鼠标滚轮缩放
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.elements.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = ChartRenderer.transform.scale * scaleFactor;
        
        // 限制缩放范围
        if (newScale < ChartRenderer.transform.minScale || newScale > ChartRenderer.transform.maxScale) {
            return;
        }
        
        // 计算缩放中心点
        const config = ColorCalculatorConfig.canvas;
        const centerX = config.width / 2;
        const centerY = config.height / 2;
        
        // 更新缩放和偏移
        ChartRenderer.transform.scale = newScale;
        
        // 以鼠标位置为中心进行缩放
        const deltaX = (mouseX - centerX) * (scaleFactor - 1);
        const deltaY = (mouseY - centerY) * (scaleFactor - 1);
        
        ChartRenderer.transform.offsetX -= deltaX;
        ChartRenderer.transform.offsetY -= deltaY;
        
        Logger.debug(`缩放: scale=${newScale.toFixed(2)}, offset=(${ChartRenderer.transform.offsetX.toFixed(1)}, ${ChartRenderer.transform.offsetY.toFixed(1)})`, 'ZoomHandler');
        
        // 重新渲染
        ChartRenderer.invalidateCache();
        this.updateDisplay();
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
            const screenCoords = ChartRenderer.transformedCieToScreenCoordinates(
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
    
    // 处理模式3最大光通量变化
    handleMaxLvChange(color, value) {
        if (isNaN(value) || value < 0) return;
        
        // 仅在模式3时重新计算
        if (this.state.activeMode === 'mode3') {
            this.performCalculation();
            this.updateDisplay();
        }
    },
    
    // 获取界面上的最大光通量值
    getMaxLvValues() {
        const maxLvValues = {};
        const colors = ['red', 'green', 'blue'];
        
        colors.forEach(color => {
            const input = this.elements.inputs[color]?.maxLv;
            if (input) {
                maxLvValues[color] = parseFloat(input.value) || ColorCalculatorConfig.slider.maxLvValues[color] || 100;
            } else {
                maxLvValues[color] = ColorCalculatorConfig.slider.maxLvValues[color] || 100;
            }
        });
        
        return maxLvValues;
    },
    
    // 执行计算
    performCalculation() {
        try {
            Logger.debug(`开始${this.state.activeMode}计算`, 'Calculator');
            
            if (this.state.activeMode === 'mode1') {
                const mixResult = ColorCalculator.calculateMixedColor(this.state.colorPoints);
                this.state.colorPoints.mix = mixResult;
                Logger.info(`模式1计算完成: 混合色(${this.formatValue(mixResult.x, 'coordinate')}, ${this.formatValue(mixResult.y, 'coordinate')}, ${this.formatValue(mixResult.lv)})`, 'Calculator');
            } else if (this.state.activeMode === 'mode2') {
                // 模式2: 目标色导入 - 主要用于Excel数据导入和目标色设置，无需特殊计算
                Logger.info('模式2: 目标色导入模式', 'Calculator');
            } else if (this.state.activeMode === 'mode3') {
                // 模式3: 计算光通量需求（多目标色）
                this.calculateMode3MultiTargets();
                this.updateMode3MaxHints(); // 更新最大光通量提示
            } else if (this.state.activeMode === 'mode4') {
                // 模式4: 计算最大光通量
                const maxLvValues = this.getMaxLvValues();
                const maxResult = ColorCalculator.calculateMaxLuminance(this.state.colorPoints, maxLvValues);
                this.updateMode4Results(maxResult);
                Logger.info(`模式4计算完成: 最大光通量=${this.formatValue(maxResult.maxLuminance)}`, 'Calculator');
            }
        } catch (error) {
            Logger.error(`计算失败: ${error.message}`, 'Calculator');
            ErrorHandler.handle(error, 'Calculation');
        }
    },
    
    // 计算模式3的多目标色光通量需求
    calculateMode3MultiTargets() {
        const resultsContainer = document.getElementById('mode3-results');
        if (!resultsContainer) return;
        
        if (this.state.selectedTargets.length === 0) {
            resultsContainer.innerHTML = '<p class="empty-hint">请先添加目标色并点击计算</p>';
            return;
        }
        
        let html = '';
        let hasError = false;
        
        this.state.selectedTargets.forEach((target, index) => {
            try {
                // 验证RGB基色数据
                const rgbValid = ['red', 'green', 'blue'].every(color => {
                    const point = this.state.colorPoints[color];
                    return ColorCalculator.validateColorPoint(point);
                });
                
                if (!rgbValid) {
                    throw new Error('RGB基色数据无效，请检查模式1中的RGB设置');
                }
                
                // 验证目标色数据
                if (!target || isNaN(target.x) || isNaN(target.y) || isNaN(target.lv)) {
                    throw new Error('目标色数据无效');
                }
                
                // 构造临时colorPoints用于计算
                const tempColorPoints = {
                    red: this.state.colorPoints.red,
                    green: this.state.colorPoints.green,
                    blue: this.state.colorPoints.blue,
                    target: { x: target.x, y: target.y, lv: target.lv }
                };
                
                const required = ColorCalculator.calculateRequiredLuminance(tempColorPoints);
                
                // 获取RGB基色的最大光通量值用于计算百分比
                const maxLvValues = {
                    red: parseFloat(document.getElementById('red-lv')?.value) || 100,
                    green: parseFloat(document.getElementById('green-lv')?.value) || 100,
                    blue: parseFloat(document.getElementById('blue-lv')?.value) || 100
                };
                
                // 计算使用百分比
                const redPercent = maxLvValues.red > 0 ? (required.red / maxLvValues.red * 100) : 0;
                const greenPercent = maxLvValues.green > 0 ? (required.green / maxLvValues.green * 100) : 0;
                const bluePercent = maxLvValues.blue > 0 ? (required.blue / maxLvValues.blue * 100) : 0;
                
                html += `
                    <div class="target-result">
                        <h4>${target.name} (目标光通量: ${this.formatValue(target.lv)}lm)</h4>
                        <div class="result-grid">
                            <div class="result-item">
                                <span>红色所需光通量:</span>
                                <span>${this.formatValue(required.red)}lm (${this.formatValue(redPercent, 'percentage')}%)</span>
                            </div>
                            <div class="result-item">
                                <span>绿色所需光通量:</span>
                                <span>${this.formatValue(required.green)}lm (${this.formatValue(greenPercent, 'percentage')}%)</span>
                            </div>
                            <div class="result-item">
                                <span>蓝色所需光通量:</span>
                                <span>${this.formatValue(required.blue)}lm (${this.formatValue(bluePercent, 'percentage')}%)</span>
                            </div>
                        </div>
                    </div>
                `;
                
                Logger.info(`目标色${index + 1}计算完成: R=${this.formatValue(required.red)}, G=${this.formatValue(required.green)}, B=${this.formatValue(required.blue)}`, 'Mode3Calculator');
            } catch (error) {
                hasError = true;
                html += `
                    <div class="target-result error">
                        <h4>${target.name}</h4>
                        <p class="error-message">计算失败: ${error.message}</p>
                    </div>
                `;
                Logger.error(`目标色${index + 1}计算失败: ${error.message}`, 'Mode3Calculator');
            }
        });
        
        resultsContainer.innerHTML = html;
        
        if (hasError) {
            NotificationSystem.warning('部分目标色计算失败，请检查坐标是否在RGB三角形内');
        }
    },
    
    // 计算模式3的多目标色最大光通量需求
    calculateMode3MaxLuminance() {
        const resultsContainer = document.getElementById('mode3-results');
        if (!resultsContainer) return;
        
        if (this.state.selectedTargets.length === 0) {
            resultsContainer.innerHTML = '<p class="empty-hint">请先添加目标色并点击计算</p>';
            return;
        }
        
        // 获取RGB基色的最大光通量值
        const maxLvValues = {
            red: parseFloat(document.getElementById('red-lv')?.value) || 100,
            green: parseFloat(document.getElementById('green-lv')?.value) || 100,
            blue: parseFloat(document.getElementById('blue-lv')?.value) || 100
        };
        
        let html = '';
        let hasError = false;
        
        this.state.selectedTargets.forEach((target, index) => {
            try {
                // 验证RGB基色数据
                const rgbValid = ['red', 'green', 'blue'].every(color => {
                    const point = this.state.colorPoints[color];
                    return ColorCalculator.validateColorPoint(point);
                });
                
                if (!rgbValid) {
                    throw new Error('RGB基色数据无效，请检查模式1中的RGB设置');
                }
                
                // 验证目标色数据
                if (!target || isNaN(target.x) || isNaN(target.y)) {
                    throw new Error('目标色数据无效');
                }
                
                // 构造临时colorPoints用于计算最大光通量
                const tempColorPoints = {
                    red: this.state.colorPoints.red,
                    green: this.state.colorPoints.green,
                    blue: this.state.colorPoints.blue,
                    target: { x: target.x, y: target.y, lv: 1 } // 光通量值在此步骤中不重要
                };
                
                // 计算最大可达光通量
                const maxResult = ColorCalculator.calculateMaxLuminance(tempColorPoints, maxLvValues);
                
                // 使用最大光通量作为目标光通量重新计算
                tempColorPoints.target.lv = maxResult.maxLuminance;
                const required = ColorCalculator.calculateRequiredLuminance(tempColorPoints);
                
                // 计算使用百分比
                const redPercent = maxLvValues.red > 0 ? (required.red / maxLvValues.red * 100) : 0;
                const greenPercent = maxLvValues.green > 0 ? (required.green / maxLvValues.green * 100) : 0;
                const bluePercent = maxLvValues.blue > 0 ? (required.blue / maxLvValues.blue * 100) : 0;
                
                html += `
                    <div class="target-result">
                        <h4>${target.name} (最大可达光通量: ${this.formatValue(maxResult.maxLuminance)}lm)</h4>
                        <div class="result-grid">
                            <div class="result-item">
                                <span>红色所需光通量:</span>
                                <span>${this.formatValue(required.red)}lm (${this.formatValue(redPercent, 'percentage')}%)</span>
                            </div>
                            <div class="result-item">
                                <span>绿色所需光通量:</span>
                                <span>${this.formatValue(required.green)}lm (${this.formatValue(greenPercent, 'percentage')}%)</span>
                            </div>
                            <div class="result-item">
                                <span>蓝色所需光通量:</span>
                                <span>${this.formatValue(required.blue)}lm (${this.formatValue(bluePercent, 'percentage')}%)</span>
                            </div>
                        </div>
                    </div>
                `;
                
                Logger.info(`目标色${index + 1}最大光通量计算完成: 最大=${this.formatValue(maxResult.maxLuminance)}, R=${this.formatValue(required.red)}(${this.formatValue(redPercent)}%), G=${this.formatValue(required.green)}(${this.formatValue(greenPercent)}%), B=${this.formatValue(required.blue)}(${this.formatValue(bluePercent)}%)`, 'Mode3MaxCalculator');
            } catch (error) {
                hasError = true;
                html += `
                    <div class="target-result error">
                        <h4>${target.name}</h4>
                        <p class="error-message">计算失败: ${error.message}</p>
                    </div>
                `;
                Logger.error(`目标色${index + 1}最大光通量计算失败: ${error.message}`, 'Mode3MaxCalculator');
            }
        });
        
        resultsContainer.innerHTML = html;
        
        if (hasError) {
            NotificationSystem.warning('部分目标色计算失败，请检查坐标是否在RGB三角形内');
        }
    },
    
    // 更新模式3结果显示（兼容旧版本）
    updateMode3Results(results) {
        // 这个方法保留用于兼容性，新的多目标色计算使用calculateMode3MultiTargets
        if (this.elements.results.requiredRed) {
            this.elements.results.requiredRed.textContent = this.formatValue(results.red);
        }
        if (this.elements.results.requiredGreen) {
            this.elements.results.requiredGreen.textContent = this.formatValue(results.green);
        }
        if (this.elements.results.requiredBlue) {
            this.elements.results.requiredBlue.textContent = this.formatValue(results.blue);
        }
    },
    
    // 更新模式4结果显示（计算最大光通量）
    updateMode4Results(results) {
        if (this.elements.results.maxLv) {
            this.elements.results.maxLv.textContent = this.formatValue(results.maxLuminance);
        }
        if (this.elements.results.redUsed) {
            this.elements.results.redUsed.textContent = this.formatValue(results.ratio.red);
        }
        if (this.elements.results.greenUsed) {
            this.elements.results.greenUsed.textContent = this.formatValue(results.ratio.green);
        }
        if (this.elements.results.blueUsed) {
            this.elements.results.blueUsed.textContent = this.formatValue(results.ratio.blue);
        }
    },
    
    // 更新输入框显示
    updateInputs() {
        const colors = ['red', 'green', 'blue', 'target'];
        
        colors.forEach(color => {
            const point = this.state.colorPoints[color];
            const inputs = this.elements.inputs[color];
            
            if (point && inputs) {
                if (inputs.x) inputs.x.value = this.formatValue(point.x, 'coordinate');
                if (inputs.y) inputs.y.value = this.formatValue(point.y, 'coordinate');
                if (inputs.lv) inputs.lv.value = this.formatValue(point.lv);
            }
        });
        
        // 更新模式1的混合结果显示
        if (this.state.activeMode === 'mode1') {
            const mix = this.state.colorPoints.mix;
            if (this.elements.results.mixX) this.elements.results.mixX.textContent = this.formatValue(mix.x, 'coordinate');
            if (this.elements.results.mixY) this.elements.results.mixY.textContent = this.formatValue(mix.y, 'coordinate');
            if (this.elements.results.mixLv) this.elements.results.mixLv.textContent = this.formatValue(mix.lv);
        }
    },
    
    // 同步输入值
    syncInputValues() {
        // 从colorPoints状态同步到输入框
        this.updateInputs();
        
        Logger.debug(`模式切换到${this.state.activeMode}，已同步输入值`, 'InputSync');
    },
    
    // 更新显示
    updateDisplay() {
        ChartRenderer.draw(this.state.colorPoints, this.state.activeMode, this.state.showGamutBoundaries);
        this.updateInputs();
        
        // 如果开启调试模式，绘制调试信息
        if (this.state.debugMode && this.state.mouseX !== undefined && this.state.mouseY !== undefined) {
            ChartRenderer.drawDebugInfo(this.state.mouseX, this.state.mouseY);
        }
    },
    
    // 绑定Excel相关事件
    bindExcelEvents() {
        const excelElements = this.elements.inputs.excel;
        
        // 文件选择按钮
        if (excelElements.selectBtn) {
            excelElements.selectBtn.addEventListener('click', () => {
                excelElements.fileInput.click();
            });
        }
        
        // 文件输入变化
        if (excelElements.fileInput) {
            excelElements.fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    ExcelLoader.handleFileInput(file);
                }
            });
        }
        
        // 加载默认数据按钮
        if (excelElements.loadDefaultBtn) {
            excelElements.loadDefaultBtn.addEventListener('click', () => {
                ExcelLoader.loadDefaultData();
            });
        }
    },
    
    // 绑定模式3多选目标色事件
    bindMode3Events() {
        const mode3Elements = this.elements.inputs.mode3;
        
        // 手动添加目标色按钮
        if (mode3Elements.addManualBtn) {
            mode3Elements.addManualBtn.addEventListener('click', () => {
                this.addManualTarget();
            });
        }
        
        // Excel添加目标色按钮
        if (mode3Elements.addExcelBtn) {
            mode3Elements.addExcelBtn.addEventListener('click', () => {
                this.addExcelTarget();
            });
        }
        
        // 清空所有目标按钮
        if (mode3Elements.clearAllBtn) {
            mode3Elements.clearAllBtn.addEventListener('click', () => {
                this.clearAllTargets();
            });
        }
        
        // 实时更新最大光通量提示
        if (mode3Elements.manualX) {
            mode3Elements.manualX.addEventListener('input', () => this.updateMode3MaxHints());
        }
        if (mode3Elements.manualY) {
            mode3Elements.manualY.addEventListener('input', () => this.updateMode3MaxHints());
        }
        if (mode3Elements.excelSelector) {
            mode3Elements.excelSelector.addEventListener('change', () => this.updateMode3MaxHints());
        }
    },
    
    // Excel数据加载完成回调
    onExcelDataLoaded(colorData) {
        try {
            Logger.info(`Excel数据加载完成: ${colorData.length} 个颜色数据`, 'ExcelLoader');
            
            // 更新数据统计信息
            this.updateExcelDataStats();
            
            // 更新表格显示
            if (typeof ColorTable !== 'undefined') {
                ColorTable.updateData();
            }
            
            // 如果当前在模式4，重新绘制图表
            if (this.state.activeMode === 'mode4') {
                this.updateDisplay();
            }
            
            NotificationSystem.success(`成功加载 ${colorData.length} 个颜色数据`);
        } catch (error) {
            ErrorHandler.handle(error, 'Excel data loaded callback');
        }
    },
    
    // 从Excel数据设置目标色
    setTargetColorFromExcel(color) {
        try {
            // 更新目标色坐标
            this.state.colorPoints.target.x = color.x;
            this.state.colorPoints.target.y = color.y;
            
            // 更新输入框显示
            if (this.elements.inputs.target.x) {
                this.elements.inputs.target.x.value = this.formatValue(color.x, 'coordinate');
            }
            if (this.elements.inputs.target.y) {
                this.elements.inputs.target.y.value = this.formatValue(color.y, 'coordinate');
            }
            
            // Excel目标色选择器更新已移到模式3中处理
            
            // 更新最大光通量提示
            this.updateMaxLvHint();
            
            // 重新计算和显示
            this.performCalculation();
            this.updateDisplay();
            
            Logger.info(`设置目标色: ${color.name} (${color.x}, ${color.y})`, 'ExcelTarget');
        } catch (error) {
            ErrorHandler.handle(error, 'setTargetColorFromExcel');
        }
    },
    
    // 更新最大光通量提示
    updateMaxLvHint() {
        if (!this.elements.inputs.maxLvHint) return;
        
        try {
            // 使用当前的RGB基色坐标和目标色计算最大光通量
            const maxLvValues = {
                red: 100,   // 默认最大值，实际应从模式4获取
                green: 100,
                blue: 100
            };
            
            // 如果模式4有设置，使用模式4的值
            const redMaxInput = document.getElementById('red-max-lv');
            const greenMaxInput = document.getElementById('green-max-lv');
            const blueMaxInput = document.getElementById('blue-max-lv');
            
            if (redMaxInput && redMaxInput.value) maxLvValues.red = parseFloat(redMaxInput.value);
            if (greenMaxInput && greenMaxInput.value) maxLvValues.green = parseFloat(greenMaxInput.value);
            if (blueMaxInput && blueMaxInput.value) maxLvValues.blue = parseFloat(blueMaxInput.value);
            
            const result = ColorCalculator.calculateMaxLuminance(this.state.colorPoints, maxLvValues);
            
            if (result.maxLuminance > 0) {
                this.elements.inputs.maxLvHint.textContent = `最大可达: ${this.formatValue(result.maxLuminance)} lm`;
                this.elements.inputs.maxLvHint.style.color = '#28a745';
            } else {
                this.elements.inputs.maxLvHint.textContent = '目标色不在RGB三角形内';
                this.elements.inputs.maxLvHint.style.color = '#dc3545';
            }
        } catch (error) {
            this.elements.inputs.maxLvHint.textContent = '计算失败';
            this.elements.inputs.maxLvHint.style.color = '#dc3545';
            console.warn('最大光通量计算失败:', error);
        }
    },
    
    // Excel数据变化回调
    onExcelDataChanged() {
        try {
            // 更新数据统计信息
            this.updateExcelDataStats();
            
            // 重新绘制图表
            this.updateDisplay();
            
            // 更新表格显示
            if (typeof ColorTable !== 'undefined') {
                ColorTable.renderCurrentPage();
            }
        } catch (error) {
            ErrorHandler.handle(error, 'Excel data changed callback');
        }
    },
    
    // 更新Excel数据统计信息
    updateExcelDataStats() {
        const statsElement = this.elements.inputs.excel.dataStats;
        if (!statsElement) return;
        
        if (!ExcelLoader.isDataLoaded) {
            statsElement.innerHTML = '<span>未加载数据</span>';
            return;
        }
        
        const stats = ExcelLoader.getDataStats();
        statsElement.innerHTML = `
            <span>总计: ${stats.total} 个颜色</span>
            <span>可见: ${stats.visible} 个</span>
            <span>高亮: ${stats.highlighted} 个</span>
            <span>X范围: ${this.formatValue(stats.xRange.min, 'coordinate')} - ${this.formatValue(stats.xRange.max, 'coordinate')}</span>
            <span>Y范围: ${this.formatValue(stats.yRange.min, 'coordinate')} - ${this.formatValue(stats.yRange.max, 'coordinate')}</span>
        `;
    },
    
    // 处理Canvas上的Excel数据点点击
    handleExcelDataPointClick(mouseEvent) {
        if (!ExcelLoader.isDataLoaded) return false;
        
        const rect = this.elements.canvas.getBoundingClientRect();
        const mouseX = mouseEvent.clientX - rect.left;
        const mouseY = mouseEvent.clientY - rect.top;
        
        // 应用变换
        const scaleFactor = ChartRenderer.getCanvasScaleFactor();
        const adjustedX = mouseX * scaleFactor;
        const adjustedY = mouseY * scaleFactor;
        
        // 查找点击的数据点
        const clickedColor = ChartRenderer.findExcelDataPointAt(adjustedX, adjustedY);
        
        if (clickedColor) {
            // 切换高亮状态
            ExcelLoader.setColorHighlight(clickedColor.id, !clickedColor.highlighted);
            
            // 如果表格已初始化，滚动到对应行
            if (typeof ColorTable !== 'undefined') {
                ColorTable.goToColor(clickedColor.id);
            }
            
            Logger.info(`点击了颜色点: ${clickedColor.name}`, 'ExcelDataPoint');
            return true;
        }
        
        return false;
    },
    
    // =================== LED分BIN功能 ===================
    
    // 初始化LED选择器
    initializeLEDSelectors() {
        const colors = ['red', 'green', 'blue'];
        
        colors.forEach(color => {
            this.populateLEDSelectors(color);
        });
    },
    
    // 填充LED选择器选项
    populateLEDSelectors(color) {
        const elements = this.elements.inputs[color];
        if (!elements || !elements.ledLuminanceBin || !elements.ledColorBin) return;
        
        // 填充亮度BIN选项
        const luminanceBins = LEDBinManager.getLuminanceBins(color);
        elements.ledLuminanceBin.innerHTML = '<option value="">选择亮度BIN...</option>';
        luminanceBins.forEach(bin => {
            const option = document.createElement('option');
            option.value = bin.id;
            option.textContent = `${bin.id} (${this.formatValue(bin.min)}-${this.formatValue(bin.max)} lm)`;
            option.title = bin.description || '';
            elements.ledLuminanceBin.appendChild(option);
        });
        
        // 填充色度BIN选项
        const colorBins = LEDBinManager.getColorBinList(color);
        elements.ledColorBin.innerHTML = '<option value="">选择色度BIN...</option>';
        colorBins.forEach(binId => {
            const wavelengthInfo = LEDBinManager.getWavelengthBin(color, binId);
            const option = document.createElement('option');
            option.value = binId;
            option.textContent = binId;
            if (wavelengthInfo) {
                option.textContent += ` (${wavelengthInfo.min}-${wavelengthInfo.max}nm)`;
            }
            elements.ledColorBin.appendChild(option);
        });
    },
    
    // 绑定LED事件
    bindLEDEvents() {
        const colors = ['red', 'green', 'blue'];
        
        colors.forEach(color => {
            const elements = this.elements.inputs[color];
            if (!elements) return;
            
            // LED启用复选框事件
            if (elements.ledEnable) {
                elements.ledEnable.addEventListener('change', (e) => {
                    this.onLEDEnableChange(color, e.target.checked);
                });
            }
            
            // 亮度BIN选择事件
            if (elements.ledLuminanceBin) {
                elements.ledLuminanceBin.addEventListener('change', (e) => {
                    this.onLEDBinSelectionChange(color);
                });
            }
            
            // 色度BIN选择事件
            if (elements.ledColorBin) {
                elements.ledColorBin.addEventListener('change', (e) => {
                    this.onLEDBinSelectionChange(color);
                });
            }
        });
    },
    
    // LED启用状态改变处理
    onLEDEnableChange(color, enabled) {
        const elements = this.elements.inputs[color];
        if (!elements) return;
        
        const selectionGroup = elements.ledColorBin?.closest('.led-selection-group');
        if (selectionGroup) {
            selectionGroup.style.display = enabled ? 'block' : 'none';
        }
        
        if (!enabled) {
            // 禁用时清除选择
            LEDBinManager.clearSelection(color);
            if (elements.ledLuminanceBin) elements.ledLuminanceBin.value = '';
            if (elements.ledColorBin) elements.ledColorBin.value = '';
            this.hideLEDInfo(color);
            this.updateDisplay();
        }
    },
    
    // LED BIN选择改变处理
    onLEDBinSelectionChange(color) {
        const elements = this.elements.inputs[color];
        if (!elements) return;
        
        const luminanceBin = elements.ledLuminanceBin?.value;
        const colorBin = elements.ledColorBin?.value;
        
        if (luminanceBin && colorBin) {
            // 两个BIN都选择了，更新LEDBinManager和输入框
            LEDBinManager.setSelection(color, luminanceBin, colorBin);
            const params = LEDBinManager.getSelectedLEDParams(color);
            
            if (params) {
                // 更新坐标和亮度输入框
                if (elements.x) elements.x.value = this.formatValue(params.x, 'coordinate');
                if (elements.y) elements.y.value = this.formatValue(params.y, 'coordinate');
                if (elements.lv) elements.lv.value = this.formatValue(params.lv);
                
                // 更新状态
                this.state.colorPoints[color] = {
                    x: params.x,
                    y: params.y,
                    lv: params.lv
                };
                
                // 显示LED信息
                this.showLEDInfo(color, params);
                
                // 重新计算和显示
                this.performCalculation();
                this.updateDisplay();
                
                Logger.info(`LED BIN选择: ${color} - 亮度:${luminanceBin}, 色度:${colorBin}`, 'LEDSelection');
            }
        } else {
            // 选择不完整，隐藏信息
            this.hideLEDInfo(color);
        }
        
        // 更新色域状态显示
        this.onLEDBinSelectionUpdate();
    },
    
    // 显示LED信息
    showLEDInfo(color, params) {
        const elements = this.elements.inputs[color];
        if (!elements || !elements.ledInfo) return;
        
        const wavelengthInfo = LEDBinManager.getWavelengthBin(color, params.colorBin);
        const luminanceBin = LEDBinManager.getLuminanceBins(color).find(b => b.id === params.luminanceBin);
        
        let infoText = `中心坐标: (${this.formatValue(params.x, 'coordinate')}, ${this.formatValue(params.y, 'coordinate')})`;
        if (wavelengthInfo) {
            infoText += ` | 波长: ${wavelengthInfo.min}-${wavelengthInfo.max}nm`;
        }
        if (luminanceBin) {
            infoText += ` | 光通量: ${this.formatValue(params.lv)}lm`;
        }
        
        const infoElement = elements.ledInfo.querySelector('.led-wavelength-info');
        if (infoElement) {
            infoElement.textContent = infoText;
        }
        
        elements.ledInfo.style.display = 'block';
    },
    
    // 隐藏LED信息
    hideLEDInfo(color) {
        const elements = this.elements.inputs[color];
        if (elements && elements.ledInfo) {
            elements.ledInfo.style.display = 'none';
        }
    },
    
    // === 多选目标色功能 ===
    
    // 添加手动输入的目标色
    addManualTarget() {
        const mode3Elements = this.elements.inputs.mode3;
        
        const x = parseFloat(mode3Elements.manualX.value);
        const y = parseFloat(mode3Elements.manualY.value);
        const lv = parseFloat(mode3Elements.manualLv.value);
        
        if (isNaN(x) || isNaN(y) || isNaN(lv)) {
            NotificationSystem.error('请输入有效的坐标和光通量值');
            return;
        }
        
        if (x < 0 || x > 1 || y < 0 || y > 1) {
            NotificationSystem.error('坐标值应在0-1范围内');
            return;
        }
        
        const target = {
            id: `manual_${Date.now()}`,
            name: `手动输入 (${this.formatValue(x, 'coordinate')}, ${this.formatValue(y, 'coordinate')})`,
            x: x,
            y: y,
            lv: lv,
            type: 'manual'
        };
        
        this.state.selectedTargets.push(target);
        this.updateTargetList();
        this.clearManualInputs();
        
        NotificationSystem.success('已添加目标色');
    },
    
    // 添加Excel选择的目标色
    addExcelTarget() {
        const mode3Elements = this.elements.inputs.mode3;
        
        const selectedId = mode3Elements.excelSelector.value;
        const lv = parseFloat(mode3Elements.excelLv.value);
        
        if (!selectedId) {
            NotificationSystem.error('请选择一个颜色');
            return;
        }
        
        if (isNaN(lv)) {
            NotificationSystem.error('请输入有效的光通量值');
            return;
        }
        
        const color = ExcelLoader.getColorById(selectedId);
        if (!color) {
            NotificationSystem.error('选择的颜色不存在');
            return;
        }
        
        const target = {
            id: `excel_${selectedId}_${Date.now()}`,
            name: color.name,
            x: color.x,
            y: color.y,
            lv: lv,
            type: 'excel',
            originalId: selectedId
        };
        
        this.state.selectedTargets.push(target);
        this.updateTargetList();
        
        // 重置Excel输入
        mode3Elements.excelSelector.value = '';
        mode3Elements.excelLv.value = '1';
        
        NotificationSystem.success('已添加目标色');
    },
    
    // 清空所有目标色
    clearAllTargets() {
        this.state.selectedTargets = [];
        this.updateTargetList();
        NotificationSystem.info('已清空所有目标色');
    },
    
    // 删除指定目标色
    removeTarget(targetId) {
        this.state.selectedTargets = this.state.selectedTargets.filter(t => t.id !== targetId);
        this.updateTargetList();
    },
    
    // 更新目标色列表显示
    updateTargetList() {
        const targetList = this.elements.inputs.mode3.targetList;
        if (!targetList) return;
        
        if (this.state.selectedTargets.length === 0) {
            targetList.innerHTML = '<p class="empty-hint">尚未添加任何目标色</p>';
            return;
        }
        
        let html = '';
        this.state.selectedTargets.forEach(target => {
            const maxLv = this.calculateMaxLuminanceForTarget(target.x, target.y);
            html += `
                <div class="target-item" data-target-id="${target.id}">
                    <div class="target-info">
                        <strong>${target.name}</strong><br>
                        <small>坐标: (${this.formatValue(target.x, 'coordinate')}, ${this.formatValue(target.y, 'coordinate')})</small><br>
                        <small>目标光通量: ${this.formatValue(target.lv)}lm (最大可达: ${this.formatValue(maxLv)}lm)</small>
                    </div>
                    <button class="remove-target-btn" onclick="ColorCalculatorApp.removeTarget('${target.id}')">
                        ❌
                    </button>
                </div>
            `;
        });
        
        targetList.innerHTML = html;
    },
    
    // 清空手动输入框
    clearManualInputs() {
        const mode3Elements = this.elements.inputs.mode3;
        if (mode3Elements.manualX) mode3Elements.manualX.value = '0.3333';
        if (mode3Elements.manualY) mode3Elements.manualY.value = '0.3333';
        if (mode3Elements.manualLv) mode3Elements.manualLv.value = '1';
    },
    
    // 更新模式3的最大光通量提示
    updateMode3MaxHints() {
        const mode3Elements = this.elements.inputs.mode3;
        
        // 更新手动输入的最大光通量提示
        if (mode3Elements.manualX && mode3Elements.manualY && mode3Elements.manualMaxHint) {
            const x = parseFloat(mode3Elements.manualX.value);
            const y = parseFloat(mode3Elements.manualY.value);
            
            if (!isNaN(x) && !isNaN(y)) {
                const maxLv = this.calculateMaxLuminanceForTarget(x, y);
                mode3Elements.manualMaxHint.textContent = `最大可达: ${this.formatValue(maxLv)}lm`;
            }
        }
        
        // 更新Excel选择的最大光通量提示
        if (mode3Elements.excelSelector && mode3Elements.excelMaxHint) {
            const selectedId = mode3Elements.excelSelector.value;
            if (selectedId) {
                const color = ExcelLoader.getColorById(selectedId);
                if (color) {
                    const maxLv = this.calculateMaxLuminanceForTarget(color.x, color.y);
                    mode3Elements.excelMaxHint.textContent = `最大可达: ${this.formatValue(maxLv)}lm`;
                }
            }
        }
    },
    
    // 计算指定目标色的最大光通量（使用模式1的RGB数据）
    calculateMaxLuminanceForTarget(targetX, targetY) {
        try {
            // 使用模式1中当前设置的RGB光通量值
            const maxLvValues = {
                red: this.state.colorPoints.red.lv,
                green: this.state.colorPoints.green.lv,
                blue: this.state.colorPoints.blue.lv
            };
            
            // 构造完整的colorPoints对象
            const colorPoints = {
                red: this.state.colorPoints.red,
                green: this.state.colorPoints.green,
                blue: this.state.colorPoints.blue,
                target: { x: targetX, y: targetY, lv: 0 } // lv值在最大光通量计算中不用到
            };
            
            // 使用ColorCalculator计算最大光通量
            const result = ColorCalculator.calculateMaxLuminance(colorPoints, maxLvValues);
            
            return result.maxLuminance || 0;
        } catch (error) {
            console.warn('计算最大光通量失败:', error);
            return 0;
        }
    },
    
    // =================== 色域边界检测功能 ===================
    
    // 绑定色域检测事件
    bindGamutCheckEvents() {
        const checkButton = document.getElementById('check-gamut-boundary');
        if (checkButton) {
            checkButton.addEventListener('click', () => {
                this.performGamutBoundaryCheck();
            });
        }
    },
    
    // 执行色域边界检测
    performGamutBoundaryCheck() {
        try {
            // 检查是否有导入的颜色数据
            const colorData = ExcelLoader.getColorData();
            if (!colorData || colorData.length === 0) {
                NotificationSystem.error('请先导入颜色数据');
                return;
            }
            
            // 检查LED BIN模式是否启用
            if (!LEDBinManager.isLEDBinModeEnabled()) {
                NotificationSystem.error('请先在Step1中为红、绿、蓝三色都选择LED分BIN数据');
                return;
            }
            
            // 执行色域边界检测
            const checkResult = ColorCalculator.checkGamutBoundaryForTargets(colorData);
            
            if (!checkResult.success) {
                NotificationSystem.error(checkResult.error);
                return;
            }
            
            // 更新表格显示检测结果
            if (typeof ColorTable !== 'undefined') {
                ColorTable.updateGamutCheckResults(checkResult);
            }
            
            // 更新色域状态显示
            this.updateGamutStatusDisplay(checkResult);
            
            // 显示检测结果摘要
            this.showGamutCheckSummary(checkResult);
            
            Logger.info(`色域边界检测完成: ${checkResult.summary.outOfGamut}/${checkResult.summary.total} 个颜色超边界`, 'GamutCheck');
            
        } catch (error) {
            ErrorHandler.handle(error, 'performGamutBoundaryCheck');
        }
    },
    
    // 更新色域状态显示
    updateGamutStatusDisplay(checkResult) {
        const statusElement = document.getElementById('gamut-status');
        const resultsElement = document.getElementById('gamut-results');
        
        if (statusElement) {
            const binStatus = LEDBinManager.getLEDBinStatus();
            const gamut = binStatus.gamut;
            
            if (gamut) {
                statusElement.innerHTML = `
                    LED BIN色域已确定 - 红(${binStatus.ledStatus.red.colorBin}), 
                    绿(${binStatus.ledStatus.green.colorBin}), 
                    蓝(${binStatus.ledStatus.blue.colorBin})
                `;
                statusElement.className = 'gamut-status enabled';
            }
        }
        
        if (resultsElement) {
            resultsElement.style.display = 'block';
        }
        
        // 启用检测按钮
        const checkButton = document.getElementById('check-gamut-boundary');
        if (checkButton) {
            checkButton.disabled = false;
        }
    },
    
    // 显示色域检测结果摘要
    showGamutCheckSummary(checkResult) {
        const resultsElement = document.getElementById('gamut-results');
        if (!resultsElement) return;
        
        const summaryElement = resultsElement.querySelector('.gamut-summary');
        if (!summaryElement) return;
        
        const summary = checkResult.summary;
        summaryElement.innerHTML = `
            检测完成: ${summary.total} 个颜色中，
            <span class="in-gamut">${summary.inGamut} 个在色域内</span>，
            <span class="out-of-gamut">${summary.outOfGamut} 个超出边界</span>
            (覆盖率: ${summary.percentage}%)
        `;
        
        if (summary.outOfGamut > 0) {
            NotificationSystem.warning(`发现 ${summary.outOfGamut} 个超色域边界的颜色，已在表格中标红显示`);
        } else {
            NotificationSystem.success('所有颜色都在LED BIN色域范围内');
        }
    },
    
    // 监听LED BIN选择变化，更新色域状态
    onLEDBinSelectionUpdate() {
        const statusElement = document.getElementById('gamut-status');
        const checkButton = document.getElementById('check-gamut-boundary');
        const resultsElement = document.getElementById('gamut-results');
        
        if (!statusElement || !checkButton) return;
        
        const binStatus = LEDBinManager.getLEDBinStatus();
        
        if (binStatus.allEnabled && binStatus.gamut) {
            // LED BIN模式完全启用
            statusElement.innerHTML = `
                LED BIN色域已确定 - 红(${binStatus.ledStatus.red.colorBin}), 
                绿(${binStatus.ledStatus.green.colorBin}), 
                蓝(${binStatus.ledStatus.blue.colorBin})
            `;
            statusElement.className = 'gamut-status enabled';
            checkButton.disabled = false;
        } else {
            // LED BIN模式未完全启用
            statusElement.innerHTML = '请先在Step1中为红、绿、蓝三色都选择LED分BIN数据';
            statusElement.className = 'gamut-status disabled';
            checkButton.disabled = true;
            
            // 隐藏检测结果
            if (resultsElement) {
                resultsElement.style.display = 'none';
            }
            
            // 清除表格中的色域检测结果
            if (typeof ColorTable !== 'undefined') {
                ColorTable.clearGamutCheckResults();
            }
        }
    }
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    ColorCalculatorApp.init();
});