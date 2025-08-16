// LED分BIN数据管理模块
const LEDBinManager = {
    // LED数据缓存
    data: {
        red: {
            luminanceBins: [],
            colorBins: {},
            wavelengthBins: {}
        },
        green: {
            luminanceBins: [],
            colorBins: {},
            wavelengthBins: {}
        },
        blue: {
            luminanceBins: [],
            colorBins: {},
            wavelengthBins: {}
        }
    },
    
    // 当前选择状态
    selection: {
        red: { luminanceBin: null, colorBin: null },
        green: { luminanceBin: null, colorBin: null },
        blue: { luminanceBin: null, colorBin: null }
    },
    
    // 初始化
    init() {
        try {
            this.loadLEDData();
            console.log('LED分BIN数据管理器初始化完成');
        } catch (error) {
            console.error('LED分BIN数据管理器初始化失败:', error);
            throw error;
        }
    },
    
    // 加载LED数据（从内置数据源）
    loadLEDData() {
        // 解析红色LED数据
        this.data.red.luminanceBins = [
            { id: '4U', min: 1.979, max: 2.231, description: '630.0 ~ 710.0 mcd' },
            { id: '1V', min: 2.231, max: 2.513, description: '710.0 ~ 800.0 mcd' },
            { id: '2V', min: 2.513, max: 2.827, description: '800.0 ~ 900.0 mcd' },
            { id: '3V', min: 2.827, max: 3.142, description: '900.0 ~ 1000.0 mcd' },
            { id: '4V', min: 3.142, max: 3.519, description: '1000.0 ~ 1120.0 mcd' }
        ];
        
        this.data.red.wavelengthBins = {
            'JP': { min: 620, max: 625 },
            'MT': { min: 623, max: 629 },
            'RW': { min: 627, max: 632 }
        };
        
        this.data.red.colorBins = {
            'JP': [
                { x: 0.6879, y: 0.3086 },
                { x: 0.6915, y: 0.3083 },
                { x: 0.7006, y: 0.2993 },
                { x: 0.6969, y: 0.2996 }
            ],
            'MT': [
                { x: 0.6936, y: 0.303 },
                { x: 0.6972, y: 0.3027 },
                { x: 0.7066, y: 0.2934 },
                { x: 0.7028, y: 0.2938 }
            ],
            'RW': [
                { x: 0.7, y: 0.2966 },
                { x: 0.7037, y: 0.2962 },
                { x: 0.7105, y: 0.2895 },
                { x: 0.7067, y: 0.2899 }
            ]
        };
        
        // 解析绿色LED数据
        this.data.green.luminanceBins = [
            { id: '8A', min: 4.995, max: 5.655, description: '1590.0 ~ 1800.0 mcd' },
            { id: '5B', min: 5.655, max: 6.315, description: '1800.0 ~ 2010.0 mcd' },
            { id: '6B', min: 6.315, max: 7.037, description: '2010.0 ~ 2240.0 mcd' },
            { id: '7B', min: 7.037, max: 7.854, description: '2240.0 ~ 2500.0 mcd' },
            { id: '8B', min: 7.854, max: 8.796, description: '2500.0 ~ 2800.0 mcd' }
        ];
        
        this.data.green.wavelengthBins = {
            'DJ': { min: 519, max: 524 },
            'FL': { min: 521, max: 526 },
            'JP': { min: 524, max: 529 },
            'LR': { min: 526, max: 531 },
            'PU': { min: 529, max: 534 },
            'RW': { min: 531, max: 536 },
            'U3': { min: 534, max: 541 },
            '18': { min: 539, max: 546 }
        };
        
        this.data.green.colorBins = {
            'DJ': [
                { x: 0.1401, y: 0.6951 },
                { x: 0.1201, y: 0.7325 },
                { x: 0.1415, y: 0.7518 },
                { x: 0.1606, y: 0.7102 }
            ],
            'FL': [
                { x: 0.1486, y: 0.7014 },
                { x: 0.1273, y: 0.7439 },
                { x: 0.1517, y: 0.7547 },
                { x: 0.1698, y: 0.7127 }
            ],
            'JP': [
                { x: 0.1606, y: 0.7102 },
                { x: 0.1415, y: 0.7518 },
                { x: 0.1679, y: 0.7565 },
                { x: 0.1831, y: 0.7174 }
            ],
            'LR': [
                { x: 0.1694, y: 0.7136 },
                { x: 0.1517, y: 0.7547 },
                { x: 0.1794, y: 0.7549 },
                { x: 0.1933, y: 0.717 }
            ],
            'PU': [
                { x: 0.1831, y: 0.7174 },
                { x: 0.1678, y: 0.7565 },
                { x: 0.1973, y: 0.75 },
                { x: 0.2091, y: 0.7142 }
            ],
            'RW': [
                { x: 0.1932, y: 0.717 },
                { x: 0.1794, y: 0.7549 },
                { x: 0.2098, y: 0.7449 },
                { x: 0.2196, y: 0.7122 }
            ],
            'U3': [
                { x: 0.2091, y: 0.7142 },
                { x: 0.1974, y: 0.75 },
                { x: 0.2419, y: 0.7273 },
                { x: 0.2474, y: 0.7029 }
            ],
            '18': [
                { x: 0.2362, y: 0.7067 },
                { x: 0.2288, y: 0.7353 },
                { x: 0.2752, y: 0.7042 },
                { x: 0.2776, y: 0.6881 }
            ]
        };
        
        // 解析蓝色LED数据
        this.data.blue.luminanceBins = [
            { id: '3S', min: 0.704, max: 0.785, description: '224.0 ~ 250.0 mcd' },
            { id: '4S', min: 0.785, max: 0.88, description: '250.0 ~ 280.0 mcd' },
            { id: '1T', min: 0.88, max: 0.99, description: '280.0 ~ 315.0 mcd' },
            { id: '2T', min: 0.99, max: 1.115, description: '315.0 ~ 355.0 mcd' },
            { id: '3T', min: 1.115, max: 1.257, description: '355.0 ~ 400.0 mcd' },
            { id: '4T', min: 1.257, max: 1.414, description: '400.0 ~ 450.0 mcd' },
            { id: '1U', min: 1.414, max: 1.571, description: '450.0 ~ 500.0 mcd' },
            { id: '2U', min: 1.571, max: 1.759, description: '500.0 ~ 560.0 mcd' },
            { id: '3U', min: 1.759, max: 1.979, description: '560.0 ~ 630.0 mcd' },
            { id: '4U', min: 1.979, max: 2.231, description: '630.0 ~ 710.0 mcd' }
        ];
        
        this.data.blue.wavelengthBins = {
            '73': { min: 447, max: 451 },
            '51': { min: 449, max: 453 },
            '3C': { min: 451, max: 456 },
            'AF': { min: 454, max: 459 },
            'DH': { min: 457, max: 461 },
            'FK': { min: 459, max: 463 },
            'HM': { min: 461, max: 465 },
            'KP': { min: 463, max: 467 },
            'MS': { min: 465, max: 470 },
            'QV': { min: 468, max: 473 },
            'TZ': { min: 471, max: 476 }
        };
        
        this.data.blue.colorBins = {
            '73': [
                { x: 0.1622, y: 0.0203 },
                { x: 0.1595, y: 0.0152 },
                { x: 0.1556, y: 0.0186 },
                { x: 0.1588, y: 0.0243 }
            ],
            '51': [
                { x: 0.1606, y: 0.0222 },
                { x: 0.1576, y: 0.0168 },
                { x: 0.1534, y: 0.0206 },
                { x: 0.157, y: 0.0268 }
            ],
            '3C': [
                { x: 0.1588, y: 0.0243 },
                { x: 0.1556, y: 0.0186 },
                { x: 0.15, y: 0.0246 },
                { x: 0.1543, y: 0.0317 }
            ],
            'AF': [
                { x: 0.1562, y: 0.0285 },
                { x: 0.1524, y: 0.0219 },
                { x: 0.1462, y: 0.0293 },
                { x: 0.1509, y: 0.037 }
            ],
            'DH': [
                { x: 0.1532, y: 0.0332 },
                { x: 0.1489, y: 0.0262 },
                { x: 0.1436, y: 0.0332 },
                { x: 0.1487, y: 0.0414 }
            ],
            'FK': [
                { x: 0.1509, y: 0.037 },
                { x: 0.1462, y: 0.0293 },
                { x: 0.1407, y: 0.0376 },
                { x: 0.1463, y: 0.0463 }
            ],
            'HM': [
                { x: 0.1487, y: 0.0414 },
                { x: 0.1436, y: 0.0332 },
                { x: 0.1375, y: 0.0428 },
                { x: 0.1436, y: 0.0519 }
            ],
            'KP': [
                { x: 0.1463, y: 0.0463 },
                { x: 0.1407, y: 0.0376 },
                { x: 0.1338, y: 0.0493 },
                { x: 0.1404, y: 0.0588 }
            ],
            'MS': [
                { x: 0.1436, y: 0.0519 },
                { x: 0.1375, y: 0.0428 },
                { x: 0.1272, y: 0.062 },
                { x: 0.1354, y: 0.0727 }
            ],
            'QV': [
                { x: 0.1389, y: 0.0631 },
                { x: 0.1317, y: 0.0532 },
                { x: 0.1199, y: 0.0785 },
                { x: 0.1295, y: 0.0899 }
            ],
            'TZ': [
                { x: 0.1335, y: 0.0779 },
                { x: 0.1251, y: 0.0672 },
                { x: 0.1115, y: 0.1 },
                { x: 0.1231, y: 0.1122 }
            ]
        };
    },
    
    // 获取指定颜色的亮度BIN列表
    getLuminanceBins(color) {
        if (!this.data[color]) return [];
        return this.data[color].luminanceBins;
    },
    
    // 获取指定颜色的色度BIN列表
    getColorBinList(color) {
        if (!this.data[color]) return [];
        return Object.keys(this.data[color].colorBins);
    },
    
    // 获取指定颜色BIN的四边形坐标
    getColorBinCoordinates(color, binId) {
        if (!this.data[color] || !this.data[color].colorBins[binId]) return null;
        return this.data[color].colorBins[binId];
    },
    
    // 计算色度BIN的中心点
    getColorBinCenter(color, binId) {
        const coords = this.getColorBinCoordinates(color, binId);
        if (!coords || coords.length === 0) return null;
        
        const centerX = coords.reduce((sum, point) => sum + point.x, 0) / coords.length;
        const centerY = coords.reduce((sum, point) => sum + point.y, 0) / coords.length;
        
        return { x: centerX, y: centerY };
    },
    
    // 获取亮度BIN的中值
    getLuminanceBinCenter(color, binId) {
        const bin = this.data[color]?.luminanceBins.find(b => b.id === binId);
        if (!bin) return null;
        
        return (bin.min + bin.max) / 2;
    },
    
    // 设置LED选择
    setSelection(color, luminanceBin, colorBin) {
        if (!this.data[color]) return false;
        
        this.selection[color] = {
            luminanceBin: luminanceBin,
            colorBin: colorBin
        };
        
        return true;
    },
    
    // 获取当前选择
    getSelection(color) {
        return this.selection[color] || { luminanceBin: null, colorBin: null };
    },
    
    // 获取选择的LED参数
    getSelectedLEDParams(color) {
        const selection = this.getSelection(color);
        if (!selection.luminanceBin || !selection.colorBin) return null;
        
        const center = this.getColorBinCenter(color, selection.colorBin);
        const luminance = this.getLuminanceBinCenter(color, selection.luminanceBin);
        
        if (!center || luminance === null) return null;
        
        return {
            x: center.x,
            y: center.y,
            lv: luminance,
            luminanceBin: selection.luminanceBin,
            colorBin: selection.colorBin
        };
    },
    
    // 清除选择
    clearSelection(color) {
        if (color) {
            this.selection[color] = { luminanceBin: null, colorBin: null };
        } else {
            // 清除所有选择
            Object.keys(this.selection).forEach(c => {
                this.selection[c] = { luminanceBin: null, colorBin: null };
            });
        }
    },
    
    // 检查坐标是否在BIN区域内
    isPointInBin(color, binId, x, y) {
        const coords = this.getColorBinCoordinates(color, binId);
        if (!coords || coords.length < 3) return false;
        
        // 使用射线法检测点是否在多边形内
        let inside = false;
        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
            const xi = coords[i].x, yi = coords[i].y;
            const xj = coords[j].x, yj = coords[j].y;
            
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    },
    
    // 获取波长BIN信息
    getWavelengthBin(color, binId) {
        if (!this.data[color] || !this.data[color].wavelengthBins[binId]) return null;
        return this.data[color].wavelengthBins[binId];
    },
    
    // =================== 色域计算相关方法 ===================
    
    // 获取当前LED BIN选择的最小色域范围
    getMinimumGamut() {
        const redSelection = this.getSelection('red');
        const greenSelection = this.getSelection('green');
        const blueSelection = this.getSelection('blue');
        
        // 检查是否所有LED都有BIN选择
        if (!redSelection.colorBin || !greenSelection.colorBin || !blueSelection.colorBin) {
            return null;
        }
        
        // 获取各颜色BIN的边界区域
        const redBounds = this.getColorBinBounds('red', redSelection.colorBin);
        const greenBounds = this.getColorBinBounds('green', greenSelection.colorBin);
        const blueBounds = this.getColorBinBounds('blue', blueSelection.colorBin);
        
        if (!redBounds || !greenBounds || !blueBounds) {
            return null;
        }
        
        // 计算最小色域三角形
        return this.calculateMinimumTriangle(redBounds, greenBounds, blueBounds);
    },
    
    // 获取色度BIN的边界包围盒
    getColorBinBounds(color, binId) {
        const coords = this.getColorBinCoordinates(color, binId);
        if (!coords || coords.length === 0) return null;
        
        let minX = Math.min(...coords.map(p => p.x));
        let maxX = Math.max(...coords.map(p => p.x));
        let minY = Math.min(...coords.map(p => p.y));
        let maxY = Math.max(...coords.map(p => p.y));
        
        return {
            minX, maxX, minY, maxY,
            center: this.getColorBinCenter(color, binId),
            polygon: coords
        };
    },
    
    // 计算三个BIN区域形成的最小色域三角形
    calculateMinimumTriangle(redBounds, greenBounds, blueBounds) {
        // 为了得到最小色域，我们需要找到三个BIN区域中最接近中心的点
        // 这样形成的三角形是最小的可实现色域
        
        // 使用每个BIN的中心点作为色域三角形的顶点
        const redVertex = redBounds.center;
        const greenVertex = greenBounds.center;
        const blueVertex = blueBounds.center;
        
        if (!redVertex || !greenVertex || !blueVertex) {
            return null;
        }
        
        return {
            red: redVertex,
            green: greenVertex,
            blue: blueVertex,
            area: this.calculateTriangleArea(redVertex, greenVertex, blueVertex)
        };
    },
    
    // 计算三角形面积
    calculateTriangleArea(p1, p2, p3) {
        return Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2);
    },
    
    // 检查点是否在LED BIN定义的最小色域内
    isPointInMinimumGamut(point) {
        const gamut = this.getMinimumGamut();
        if (!gamut) {
            return { inGamut: false, error: 'LED BIN选择不完整，无法确定色域范围' };
        }
        
        // 使用点在三角形内的判断方法
        const isInside = this.isPointInTriangle(point, gamut.red, gamut.green, gamut.blue);
        
        return {
            inGamut: isInside,
            gamut: gamut,
            distance: isInside ? 0 : this.distanceToTriangle(point, gamut.red, gamut.green, gamut.blue)
        };
    },
    
    // 判断点是否在三角形内 (使用重心坐标法)
    isPointInTriangle(point, v1, v2, v3) {
        const denom = (v2.y - v3.y) * (v1.x - v3.x) + (v3.x - v2.x) * (v1.y - v3.y);
        
        if (Math.abs(denom) < 1e-12) {
            return false; // 三角形退化
        }
        
        const a = ((v2.y - v3.y) * (point.x - v3.x) + (v3.x - v2.x) * (point.y - v3.y)) / denom;
        const b = ((v3.y - v1.y) * (point.x - v3.x) + (v1.x - v3.x) * (point.y - v3.y)) / denom;
        const c = 1 - a - b;
        
        return a >= 0 && b >= 0 && c >= 0;
    },
    
    // 计算点到三角形的最短距离 (简化版本)
    distanceToTriangle(point, v1, v2, v3) {
        // 计算点到三角形三条边的距离，取最小值
        const d1 = this.distanceToLine(point, v1, v2);
        const d2 = this.distanceToLine(point, v2, v3);
        const d3 = this.distanceToLine(point, v3, v1);
        
        return Math.min(d1, d2, d3);
    },
    
    // 计算点到线段的距离
    distanceToLine(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        
        let param = dot / lenSq;
        param = Math.max(0, Math.min(1, param));
        
        const xx = lineStart.x + param * C;
        const yy = lineStart.y + param * D;
        
        const dx = point.x - xx;
        const dy = point.y - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // 检查是否已启用LED BIN模式
    isLEDBinModeEnabled() {
        const colors = ['red', 'green', 'blue'];
        return colors.every(color => {
            const selection = this.getSelection(color);
            return selection.luminanceBin && selection.colorBin;
        });
    },
    
    // 获取LED BIN模式的状态摘要
    getLEDBinStatus() {
        const colors = ['red', 'green', 'blue'];
        const status = {};
        
        colors.forEach(color => {
            const selection = this.getSelection(color);
            status[color] = {
                enabled: !!(selection.luminanceBin && selection.colorBin),
                luminanceBin: selection.luminanceBin,
                colorBin: selection.colorBin
            };
        });
        
        const allEnabled = Object.values(status).every(s => s.enabled);
        const gamut = allEnabled ? this.getMinimumGamut() : null;
        
        return {
            ledStatus: status,
            allEnabled: allEnabled,
            gamut: gamut
        };
    }
};