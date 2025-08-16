// Excel文件加载和数据处理模块
const ExcelLoader = {
    // 存储加载的颜色数据
    colorData: [],
    isDataLoaded: false,
    
    // 初始化模块
    init() {
        this.loadDefaultData();
    },
    
    // 加载默认Excel数据
    async loadDefaultData() {
        try {
            const response = await fetch('./InputData/目标色.xlsx');
            if (!response.ok) {
                throw new Error('无法加载默认Excel文件');
            }
            
            const arrayBuffer = await response.arrayBuffer();
            this.parseExcelData(arrayBuffer);
            
            NotificationSystem.success('默认色彩数据加载成功');
        } catch (error) {
            console.warn('默认数据加载失败:', error.message);
            NotificationSystem.warning('默认数据加载失败，请手动导入Excel文件');
        }
    },
    
    // 处理文件输入
    handleFileInput(file) {
        if (!file) {
            NotificationSystem.error('请选择一个文件');
            return;
        }
        
        if (!this.isExcelFile(file)) {
            NotificationSystem.error('请选择Excel文件 (.xlsx 或 .xls)');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.parseExcelData(e.target.result);
                NotificationSystem.success(`成功导入 ${this.colorData.length} 个颜色数据`);
            } catch (error) {
                ErrorHandler.handle(error, 'Excel file parsing');
            }
        };
        
        reader.onerror = () => {
            NotificationSystem.error('文件读取失败');
        };
        
        reader.readAsArrayBuffer(file);
    },
    
    // 检查是否为Excel文件
    isExcelFile(file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ];
        
        const validExtensions = ['.xlsx', '.xls'];
        const fileName = file.name.toLowerCase();
        
        return validTypes.includes(file.type) || 
               validExtensions.some(ext => fileName.endsWith(ext));
    },
    
    // 解析Excel数据
    parseExcelData(arrayBuffer) {
        try {
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 转换为JSON格式
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            this.colorData = this.processRawData(rawData);
            this.isDataLoaded = true;
            
            // 更新Excel目标色选择器
            this.updateTargetSelector();
            
            // 通知应用更新
            if (typeof ColorCalculatorApp !== 'undefined') {
                ColorCalculatorApp.onExcelDataLoaded(this.colorData);
            }
            
        } catch (error) {
            throw new Error(`Excel解析失败: ${error.message}`);
        }
    },
    
    // 处理原始数据
    processRawData(rawData) {
        const processedData = [];
        
        // 跳过标题行，从第二行开始处理
        for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];
            
            if (!row || row.length < 3) continue;
            
            const id = row[0];
            const x = parseFloat(row[1]);
            const y = parseFloat(row[2]);
            
            // 验证数据有效性
            if (this.isValidColorData(id, x, y)) {
                processedData.push({
                    id: id,
                    name: `颜色 ${id}`,
                    x: x,
                    y: y,
                    visible: true,
                    highlighted: false
                });
            }
        }
        
        if (processedData.length === 0) {
            throw new Error('Excel文件中没有找到有效的颜色数据');
        }
        
        return processedData;
    },
    
    // 验证色彩数据有效性
    isValidColorData(id, x, y) {
        // 检查ID是否为数字
        if (isNaN(id) || id <= 0) return false;
        
        // 检查x, y坐标是否为有效数字
        if (isNaN(x) || isNaN(y)) return false;
        
        // 检查x, y坐标是否在CIE1931有效范围内
        if (x < 0 || x > 1 || y < 0 || y > 1) return false;
        
        // 检查是否在CIE1931色度图谱轮廓内
        return this.isInsideCIEBoundary(x, y);
    },
    
    // 检查点是否在CIE1931色度图谱轮廓内
    isInsideCIEBoundary(x, y) {
        // 简化检查：基本的色度图边界
        // 实际应用中可以使用更精确的色谱轮廓数据
        return (x + y <= 1) && (x >= 0) && (y >= 0);
    },
    
    // 获取颜色数据
    getColorData() {
        return this.colorData;
    },
    
    // 获取指定ID的颜色数据
    getColorById(id) {
        return this.colorData.find(color => color.id == id);
    },
    
    // 设置颜色可见性
    setColorVisibility(id, visible) {
        const color = this.getColorById(id);
        if (color) {
            color.visible = visible;
            this.notifyDataChanged();
        }
    },
    
    // 设置颜色高亮状态
    setColorHighlight(id, highlighted) {
        // 设置指定颜色的高亮状态（支持多选）
        const color = this.getColorById(id);
        if (color) {
            color.highlighted = highlighted;
            this.notifyDataChanged();
        }
    },
    
    // 清除所有高亮状态
    clearAllHighlights() {
        this.colorData.forEach(color => {
            color.highlighted = false;
        });
        this.notifyDataChanged();
    },
    
    // 获取可见的颜色数据
    getVisibleColors() {
        return this.colorData.filter(color => color.visible);
    },
    
    // 获取高亮的颜色（兼容性方法，返回第一个高亮颜色）
    getHighlightedColor() {
        return this.colorData.find(color => color.highlighted);
    },
    
    // 获取所有高亮的颜色
    getHighlightedColors() {
        return this.colorData.filter(color => color.highlighted);
    },
    
    // 通知数据变化
    notifyDataChanged() {
        if (typeof ColorCalculatorApp !== 'undefined') {
            ColorCalculatorApp.onExcelDataChanged();
        }
    },
    
    // 搜索颜色
    searchColors(keyword) {
        if (!keyword) return this.colorData;
        
        const lowerKeyword = keyword.toLowerCase();
        return this.colorData.filter(color => 
            color.name.toLowerCase().includes(lowerKeyword) ||
            color.id.toString().includes(lowerKeyword)
        );
    },
    
    // 导出数据为JSON
    exportToJSON() {
        return JSON.stringify(this.colorData, null, 2);
    },
    
    // 获取数据统计信息
    getDataStats() {
        return {
            total: this.colorData.length,
            visible: this.getVisibleColors().length,
            highlighted: this.getHighlightedColors().length,
            xRange: this.getCoordinateRange('x'),
            yRange: this.getCoordinateRange('y')
        };
    },
    
    // 获取坐标范围
    getCoordinateRange(coordinate) {
        if (this.colorData.length === 0) return { min: 0, max: 1 };
        
        const values = this.colorData.map(color => color[coordinate]);
        return {
            min: Math.min(...values),
            max: Math.max(...values)
        };
    },
    
    // 更新Excel目标色选择器
    updateTargetSelector() {
        const selector = document.getElementById('excel-target-selector');
        if (!selector) return;
        
        // 清空现有选项
        selector.innerHTML = '<option value="">选择目标色...</option>';
        
        if (!this.isDataLoaded || this.colorData.length === 0) {
            selector.innerHTML = '<option value="">请先导入Excel数据...</option>';
            return;
        }
        
        // 添加颜色选项
        this.colorData.forEach(color => {
            const option = document.createElement('option');
            option.value = color.id;
            option.textContent = `${color.name} (${PrecisionFormatter.formatValue(color.x, 'coordinate')}, ${PrecisionFormatter.formatValue(color.y, 'coordinate')})`;
            selector.appendChild(option);
        });
    }
};