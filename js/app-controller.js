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
            tab3: document.getElementById('tab3'),
            tab4: document.getElementById('tab4')
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
                maxLv: document.getElementById(`${color}-max-lv`), // 模式3的最大光通量
                presets: document.getElementById(`${color}-presets`),
                saveBtn: document.getElementById(`save-${color}-preset`),
                // LED分BIN选择器元素
                ledEnable: document.getElementById(`${color}-led-enable`),
                ledLuminanceBin: document.getElementById(`${color}-luminance-bin`),
                ledColorBin: document.getElementById(`${color}-color-bin`),
                ledInfo: document.getElementById(`${color}-led-info`)
            };
        });
        
        // 目标色输入（模式2和3共享）
        this.elements.inputs.target = {
            x: document.getElementById('target-x'),
            y: document.getElementById('target-y'),
            lv: document.getElementById('target-lv')
        };
        
        // Excel目标色选择器
        this.elements.inputs.excelTargetSelector = document.getElementById('excel-target-selector');
        this.elements.inputs.maxLvHint = document.getElementById('max-lv-hint');
        
        // Excel导入相关元素（模式4）
        this.elements.inputs.excel = {
            fileInput: document.getElementById('excel-file-input'),
            selectBtn: document.getElementById('select-excel-btn'),
            loadDefaultBtn: document.getElementById('load-default-btn'),
            dataStats: document.getElementById('excel-data-stats'),
            tableContainer: document.getElementById('color-table-container')
        };
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
        
        // 初始化预设管理器
        if (typeof PresetManager !== 'undefined') {
            PresetManager.init();
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
            tabElement.addEventListener('click', (e) => {
                this.switchMode(tabId.replace('tab', 'mode'));
            });
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
        
        // 模式2计算按钮
        const calcLvBtn = document.getElementById('calculate-lv');
        if (calcLvBtn) {
            calcLvBtn.addEventListener('click', () => {
                Logger.info('手动触发模式2计算', 'UI');
                this.performCalculation();
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
        
        // Excel目标色选择器事件
        if (this.elements.inputs.excelTargetSelector) {
            this.elements.inputs.excelTargetSelector.addEventListener('change', (e) => {
                const colorId = parseInt(e.target.value);
                if (colorId) {
                    const color = ExcelLoader.getColorById(colorId);
                    if (color) {
                        this.setTargetColorFromExcel(color);
                    }
                }
            });
        }
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
                Logger.info(`模式1计算完成: 混合色(${mixResult.x.toFixed(4)}, ${mixResult.y.toFixed(4)}, ${mixResult.lv.toFixed(1)})`, 'Calculator');
            } else if (this.state.activeMode === 'mode2') {
                // 模式2: 目标色导入 - 主要用于Excel数据导入和目标色设置，无需特殊计算
                Logger.info('模式2: 目标色导入模式', 'Calculator');
            } else if (this.state.activeMode === 'mode3') {
                // 模式3: 计算光通量需求
                const required = ColorCalculator.calculateRequiredLuminance(this.state.colorPoints);
                this.updateMode3Results(required);
                this.updateMaxLvHint(); // 更新最大光通量提示
                Logger.info(`模式3计算完成: R=${required.red.toFixed(1)}, G=${required.green.toFixed(1)}, B=${required.blue.toFixed(1)}`, 'Calculator');
            } else if (this.state.activeMode === 'mode4') {
                // 模式4: 计算最大光通量
                const maxLvValues = this.getMaxLvValues();
                const maxResult = ColorCalculator.calculateMaxLuminance(this.state.colorPoints, maxLvValues);
                this.updateMode4Results(maxResult);
                Logger.info(`模式4计算完成: 最大光通量=${maxResult.maxLuminance.toFixed(1)}`, 'Calculator');
            }
        } catch (error) {
            Logger.error(`计算失败: ${error.message}`, 'Calculator');
            ErrorHandler.handle(error, 'Calculation');
        }
    },
    
    // 更新模式3结果显示（计算光通量需求）
    updateMode3Results(results) {
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
    
    // 更新模式4结果显示（计算最大光通量）
    updateMode4Results(results) {
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
                this.elements.inputs.target.x.value = color.x.toFixed(4);
            }
            if (this.elements.inputs.target.y) {
                this.elements.inputs.target.y.value = color.y.toFixed(4);
            }
            
            // 更新Excel目标色选择器
            if (this.elements.inputs.excelTargetSelector) {
                this.elements.inputs.excelTargetSelector.value = color.id;
            }
            
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
                this.elements.inputs.maxLvHint.textContent = `最大可达: ${result.maxLuminance.toFixed(1)} lm`;
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
            <span>X范围: ${stats.xRange.min.toFixed(4)} - ${stats.xRange.max.toFixed(4)}</span>
            <span>Y范围: ${stats.yRange.min.toFixed(4)} - ${stats.yRange.max.toFixed(4)}</span>
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
            option.textContent = `${bin.id} (${bin.min.toFixed(1)}-${bin.max.toFixed(1)} lm)`;
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
                if (elements.x) elements.x.value = params.x.toFixed(4);
                if (elements.y) elements.y.value = params.y.toFixed(4);
                if (elements.lv) elements.lv.value = params.lv.toFixed(1);
                
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
    },
    
    // 显示LED信息
    showLEDInfo(color, params) {
        const elements = this.elements.inputs[color];
        if (!elements || !elements.ledInfo) return;
        
        const wavelengthInfo = LEDBinManager.getWavelengthBin(color, params.colorBin);
        const luminanceBin = LEDBinManager.getLuminanceBins(color).find(b => b.id === params.luminanceBin);
        
        let infoText = `中心坐标: (${params.x.toFixed(4)}, ${params.y.toFixed(4)})`;
        if (wavelengthInfo) {
            infoText += ` | 波长: ${wavelengthInfo.min}-${wavelengthInfo.max}nm`;
        }
        if (luminanceBin) {
            infoText += ` | 光通量: ${params.lv.toFixed(1)}lm`;
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
    }
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    ColorCalculatorApp.init();
});