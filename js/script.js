// DOM元素引用
const canvas = document.getElementById('cie1931');
const ctx = canvas.getContext('2d');
const tab1 = document.getElementById('tab1');
const tab2 = document.getElementById('tab2');
const mode1 = document.getElementById('mode1');
const mode2 = document.getElementById('mode2');

// 滑动条步长设置
let sliderStepSize = 1.0; // 默认步长

// 滑动条最大值设置
const maxLvValues = {
    red: 30,
    green: 30,
    blue: 30
};

// 添加NTSC色域标准坐标
const ntscColorSpace = {
    red: { x: 0.67, y: 0.33 },
    green: { x: 0.21, y: 0.71 },
    blue: { x: 0.14, y: 0.08 }
};

// 添加sRGB色域标准坐标
const srgbColorSpace = {
    red: { x: 0.64, y: 0.33 },
    green: { x: 0.30, y: 0.60 },
    blue: { x: 0.15, y: 0.06 }
};

// 色域显示开关
let showGamutBoundaries = true;

// 颜色点位置和数据
let colorPoints = {
    red: { x: 0.7, y: 0.3, lv: 10 },
    green: { x: 0.2, y: 0.7, lv: 10 },
    blue: { x: 0.1, y: 0.1, lv: 10 },
    target: { x: 0.3333, y: 0.3333, lv: 30 },
    mix: { x: 0, y: 0, lv: 0 }
};

// 当前被拖拽的点
let draggingPoint = null;
// 用于滑动条拖动状态
let draggingSlider = null;

// 当前激活的模式
let activeMode = 'mode1';

// 绘制CIE1931色度图的数据
const spectralLocus = [
    { x: 0.1741, y: 0.0050 },
    { x: 0.1740, y: 0.0050 },
    { x: 0.1738, y: 0.0049 },
    { x: 0.1736, y: 0.0049 },
    { x: 0.1733, y: 0.0048 },
    { x: 0.1730, y: 0.0048 },
    { x: 0.1726, y: 0.0048 },
    { x: 0.1721, y: 0.0048 },
    { x: 0.1714, y: 0.0051 },
    { x: 0.1703, y: 0.0058 },
    { x: 0.1689, y: 0.0069 },
    { x: 0.1669, y: 0.0086 },
    { x: 0.1644, y: 0.0109 },
    { x: 0.1611, y: 0.0138 },
    { x: 0.1566, y: 0.0177 },
    { x: 0.1510, y: 0.0227 },
    { x: 0.1440, y: 0.0297 },
    { x: 0.1355, y: 0.0399 },
    { x: 0.1241, y: 0.0578 },
    { x: 0.1096, y: 0.0868 },
    { x: 0.0913, y: 0.1327 },
    { x: 0.0687, y: 0.2007 },
    { x: 0.0454, y: 0.2950 },
    { x: 0.0235, y: 0.4127 },
    { x: 0.0082, y: 0.5384 },
    { x: 0.0039, y: 0.6548 },
    { x: 0.0139, y: 0.7502 },
    { x: 0.0389, y: 0.8120 },
    { x: 0.0743, y: 0.8338 },
    { x: 0.1142, y: 0.8262 },
    { x: 0.1547, y: 0.8059 },
    { x: 0.1929, y: 0.7816 },
    { x: 0.2296, y: 0.7543 },
    { x: 0.2658, y: 0.7243 },
    { x: 0.3016, y: 0.6923 },
    { x: 0.3373, y: 0.6589 },
    { x: 0.3731, y: 0.6245 },
    { x: 0.4087, y: 0.5896 },
    { x: 0.4441, y: 0.5547 },
    { x: 0.4788, y: 0.5202 },
    { x: 0.5125, y: 0.4866 },
    { x: 0.5448, y: 0.4544 },
    { x: 0.5752, y: 0.4242 },
    { x: 0.6029, y: 0.3965 },
    { x: 0.6270, y: 0.3725 },
    { x: 0.6482, y: 0.3514 },
    { x: 0.6658, y: 0.3340 },
    { x: 0.6801, y: 0.3197 },
    { x: 0.6915, y: 0.3083 },
    { x: 0.7006, y: 0.2993 },
    { x: 0.7079, y: 0.2920 },
    { x: 0.7140, y: 0.2859 },
    { x: 0.7190, y: 0.2809 },
    { x: 0.7230, y: 0.2770 },
    { x: 0.7260, y: 0.2740 },
    { x: 0.7283, y: 0.2717 },
    { x: 0.7300, y: 0.2700 },
    { x: 0.7311, y: 0.2689 },
    { x: 0.7320, y: 0.2680 },
    { x: 0.7327, y: 0.2673 },
    { x: 0.7334, y: 0.2666 },
    { x: 0.7340, y: 0.2660 },
    { x: 0.7344, y: 0.2656 },
    { x: 0.7346, y: 0.2654 },
    { x: 0.7347, y: 0.2653 },
    { x: 0.7347, y: 0.2653 }
];

// 直线连接最后一个点和第一个点，闭合色域
spectralLocus.push({ x: 0.1741, y: 0.0050 });

// 预设管理功能
const presets = {
    red: [],
    green: [],
    blue: [],
    target: []
};

// 初始化加载保存的预设
function loadSavedPresets() {
    // 从localStorage中读取已保存的预设
    const savedPresets = localStorage.getItem('colorCalculator_presets');
    
    if (savedPresets) {
        try {
            Object.assign(presets, JSON.parse(savedPresets));
            updatePresetDropdowns();
        } catch (error) {
            console.error('无法加载预设数据:', error);
        }
    }
    
    // 添加一些默认预设，如果没有预设
    addDefaultPresets();
}

// 如果没有预设，添加一些默认值
function addDefaultPresets() {
    // 检查各颜色预设是否为空
    if (presets.red.length === 0) {
        // 红色的常见配方
        presets.red.push({ name: '标准红', x: 0.7, y: 0.3, lv: 10 });
        presets.red.push({ name: '深红', x: 0.68, y: 0.32, lv: 8 });
    }
    
    if (presets.green.length === 0) {
        // 绿色的常见配方  
        presets.green.push({ name: '标准绿', x: 0.2, y: 0.7, lv: 10 });
        presets.green.push({ name: '浅绿', x: 0.3, y: 0.6, lv: 12 });
    }
    
    if (presets.blue.length === 0) {
        // 蓝色的常见配方
        presets.blue.push({ name: '标准蓝', x: 0.1, y: 0.1, lv: 10 });
        presets.blue.push({ name: '深蓝', x: 0.15, y: 0.05, lv: 8 });
    }
    
    if (presets.target.length === 0) {
        // 目标色的常见配方
        presets.target.push({ name: '白色(D65)', x: 0.3127, y: 0.3290, lv: 30 });
        presets.target.push({ name: '暖白', x: 0.4, y: 0.4, lv: 30 });
        presets.target.push({ name: '冷白', x: 0.29, y: 0.31, lv: 30 });
    }
    
    // 保存默认预设
    savePresets();
    
    // 更新下拉列表
    updatePresetDropdowns();
}

// 保存预设到localStorage
function savePresets() {
    try {
        localStorage.setItem('colorCalculator_presets', JSON.stringify(presets));
    } catch (error) {
        console.error('无法保存预设数据:', error);
    }
}

// 更新所有预设下拉菜单
function updatePresetDropdowns() {
    updatePresetDropdown('red');
    updatePresetDropdown('green');
    updatePresetDropdown('blue');
    updatePresetDropdown('target');
}

// 更新特定颜色的预设下拉菜单
function updatePresetDropdown(color) {
    const select = document.getElementById(`${color}-presets`);
    
    // 清除现有选项（保留第一个占位选项）
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // 添加预设选项
    presets[color].forEach((preset, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = preset.name;
        select.appendChild(option);
    });
}

// 应用选定的预设
function applyPreset(color, presetIndex) {
    const preset = presets[color][presetIndex];
    if (!preset) return;
    
    // 更新颜色点数据
    colorPoints[color].x = preset.x;
    colorPoints[color].y = preset.y;
    colorPoints[color].lv = preset.lv;
    
    // 更新界面
    updateInputFields();
    drawCIE1931Chart();
}

// 保存当前值为新预设
function saveCurrentAsPreset(color) {
    // 弹出对话框，让用户输入预设名称
    const presetName = prompt(`请输入${getColorName(color)}预设的名称:`, `${getColorName(color)}配方 ${presets[color].length + 1}`);
    
    if (presetName === null || presetName.trim() === '') {
        return; // 用户取消或未输入名称
    }
    
    // 创建新预设
    const newPreset = {
        name: presetName,
        x: colorPoints[color].x,
        y: colorPoints[color].y,
        lv: colorPoints[color].lv
    };
    
    // 添加到预设列表
    presets[color].push(newPreset);
    
    // 保存到localStorage
    savePresets();
    
    // 更新下拉菜单
    updatePresetDropdown(color);
    
    // 选择新添加的预设
    const select = document.getElementById(`${color}-presets`);
    select.value = presets[color].length - 1;
    
    // 显示成功消息
    alert(`已保存"${presetName}"预设`);
}

// 获取颜色的中文名称
function getColorName(color) {
    switch (color) {
        case 'red': return '红色';
        case 'green': return '绿色';
        case 'blue': return '蓝色';
        case 'target': return '目标色';
        default: return color;
    }
}

// 设置预设按钮和选择器的事件监听
function setupPresetControls() {
    // 加载保存的预设
    loadSavedPresets();
    
    // 为每个颜色设置保存按钮事件
    document.getElementById('save-red-preset').addEventListener('click', () => saveCurrentAsPreset('red'));
    document.getElementById('save-green-preset').addEventListener('click', () => saveCurrentAsPreset('green'));
    document.getElementById('save-blue-preset').addEventListener('click', () => saveCurrentAsPreset('blue'));
    document.getElementById('save-target-preset').addEventListener('click', () => saveCurrentAsPreset('target'));
    
    // 为每个颜色设置预设选择下拉菜单事件
    document.getElementById('red-presets').addEventListener('change', (e) => {
        if (e.target.value) {
            applyPreset('red', parseInt(e.target.value));
        }
    });
    
    document.getElementById('green-presets').addEventListener('change', (e) => {
        if (e.target.value) {
            applyPreset('green', parseInt(e.target.value));
        }
    });
    
    document.getElementById('blue-presets').addEventListener('change', (e) => {
        if (e.target.value) {
            applyPreset('blue', parseInt(e.target.value));
        }
    });
    
    document.getElementById('target-presets').addEventListener('change', (e) => {
        if (e.target.value) {
            applyPreset('target', parseInt(e.target.value));
        }
    });
}

// 页面加载完成后初始化
window.addEventListener('load', () => {
    // 从输入框更新颜色点
    updateColorPointsFromInputs();
    
    // 确保所有输入框同步
    updateInputFields();
    
    // 初始绘制
    drawCIE1931Chart();
    
    // 添加事件监听器
    setupEventListeners();
    
    // 初始化预设控制
    setupPresetControls();
});

// 从输入框更新颜色点数据
function updateColorPointsFromInputs() {
    // 模式1中的输入框
    colorPoints.red.x = parseFloat(document.getElementById('red-x').value) || 0;
    colorPoints.red.y = parseFloat(document.getElementById('red-y').value) || 0;
    colorPoints.red.lv = parseFloat(document.getElementById('red-lv').value) || 0;
    
    colorPoints.green.x = parseFloat(document.getElementById('green-x').value) || 0;
    colorPoints.green.y = parseFloat(document.getElementById('green-y').value) || 0;
    colorPoints.green.lv = parseFloat(document.getElementById('green-lv').value) || 0;
    
    colorPoints.blue.x = parseFloat(document.getElementById('blue-x').value) || 0;
    colorPoints.blue.y = parseFloat(document.getElementById('blue-y').value) || 0;
    colorPoints.blue.lv = parseFloat(document.getElementById('blue-lv').value) || 0;
    
    // 从模式2的输入框更新RGB坐标
    if (activeMode === 'mode2') {
        colorPoints.red.x = parseFloat(document.getElementById('red-x2').value) || colorPoints.red.x;
        colorPoints.red.y = parseFloat(document.getElementById('red-y2').value) || colorPoints.red.y;
        
        colorPoints.green.x = parseFloat(document.getElementById('green-x2').value) || colorPoints.green.x;
        colorPoints.green.y = parseFloat(document.getElementById('green-y2').value) || colorPoints.green.y;
        
        colorPoints.blue.x = parseFloat(document.getElementById('blue-x2').value) || colorPoints.blue.x;
        colorPoints.blue.y = parseFloat(document.getElementById('blue-y2').value) || colorPoints.blue.y;
    }
    
    // 目标色
    colorPoints.target.x = parseFloat(document.getElementById('target-x').value) || 0.3333;
    colorPoints.target.y = parseFloat(document.getElementById('target-y').value) || 0.3333;
    colorPoints.target.lv = parseFloat(document.getElementById('target-lv').value) || 30;
    
    // 确保坐标在有效范围内
    colorPoints.red.x = Math.max(0, Math.min(1, colorPoints.red.x));
    colorPoints.red.y = Math.max(0, Math.min(1, colorPoints.red.y));
    colorPoints.green.x = Math.max(0, Math.min(1, colorPoints.green.x));
    colorPoints.green.y = Math.max(0, Math.min(1, colorPoints.green.y));
    colorPoints.blue.x = Math.max(0, Math.min(1, colorPoints.blue.x));
    colorPoints.blue.y = Math.max(0, Math.min(1, colorPoints.blue.y));
    colorPoints.target.x = Math.max(0, Math.min(1, colorPoints.target.x));
    colorPoints.target.y = Math.max(0, Math.min(1, colorPoints.target.y));
    
    // 确保光通量为正值
    colorPoints.red.lv = Math.max(0, colorPoints.red.lv);
    colorPoints.green.lv = Math.max(0, colorPoints.green.lv);
    colorPoints.blue.lv = Math.max(0, colorPoints.blue.lv);
    colorPoints.target.lv = Math.max(0, colorPoints.target.lv);
    
    // 更新滑动条最大值，基于输入框的光通量值
    // 使用输入框值的1.5倍作为上限，但最小为30
    maxLvValues.red = Math.max(30, colorPoints.red.lv * 1.5);
    maxLvValues.green = Math.max(30, colorPoints.green.lv * 1.5);
    maxLvValues.blue = Math.max(30, colorPoints.blue.lv * 1.5);
}

// 绘制CIE1931色度图 - 简化版本，移除缩放和平移
function drawCIE1931Chart() {
    const width = canvas.width;
    const height = canvas.height;
    
    // 设置绘图区域尺寸
    const drawWidth = width * 0.95; 
    const drawHeight = height * 0.95;
    
    // 实际绘图区域的中心点
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // 边界计算
    const boundLeft = centerX - drawWidth/2;
    const boundTop = centerY - drawHeight/2;
    
    // 绘制网格线
    drawGrid(boundLeft, boundTop, drawWidth, drawHeight);
    
    // 绘制彩色CIE1931色谱轨迹 - 超高精度版本
    const gridSize = 300; // 提高精细度到300x300
    const stepCellX = drawWidth / gridSize;
    const stepCellY = drawHeight / gridSize;
    
    // 使用高分辨率网格渲染彩色填充
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const normalizedX = i / gridSize;
            const normalizedY = 1 - j / gridSize;
            
            // 超出了色域范围
            if (normalizedX > 0.8 || normalizedY > 0.9) continue;
            
            // 检查点是否在色谱轨迹内部
            if (isPointInSpectralLocus(normalizedX, normalizedY)) {
                // 将xy色坐标映射到近似的RGB颜色
                const color = xyToRgb(normalizedX, normalizedY);
                
                const pixelX = boundLeft + normalizedX * drawWidth;
                const pixelY = boundTop + (1 - normalizedY) * drawHeight;
                
                ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                ctx.fillRect(pixelX, pixelY, stepCellX + 0.5, stepCellY + 0.5); // 略微扩大填充区域避免缝隙
            }
        }
    }
    
    // 绘制光谱轨迹边界
    ctx.beginPath();
    
    // 创建坐标映射函数，从色彩坐标转换到画布坐标
    const mapX = x => boundLeft + x * drawWidth;
    const mapY = y => boundTop + (1 - y) * drawHeight;
    
    ctx.moveTo(mapX(spectralLocus[0].x), mapY(spectralLocus[0].y));
    
    for (let i = 1; i < spectralLocus.length; i++) {
        ctx.lineTo(mapX(spectralLocus[i].x), mapY(spectralLocus[i].y));
    }
    
    ctx.closePath();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 根据开关状态绘制标准色域三角形
    if (showGamutBoundaries) {
        // 绘制NTSC色域三角形
        ctx.beginPath();
        ctx.moveTo(mapX(ntscColorSpace.red.x), mapY(ntscColorSpace.red.y));
        ctx.lineTo(mapX(ntscColorSpace.green.x), mapY(ntscColorSpace.green.y));
        ctx.lineTo(mapX(ntscColorSpace.blue.x), mapY(ntscColorSpace.blue.y));
        ctx.closePath();
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制sRGB色域三角形
        ctx.beginPath();
        ctx.moveTo(mapX(srgbColorSpace.red.x), mapY(srgbColorSpace.red.y));
        ctx.lineTo(mapX(srgbColorSpace.green.x), mapY(srgbColorSpace.green.y));
        ctx.lineTo(mapX(srgbColorSpace.blue.x), mapY(srgbColorSpace.blue.y));
        ctx.closePath();
        ctx.strokeStyle = 'rgba(0, 0, 200, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // 绘制RGB三角形
    drawRGBTriangle(boundLeft, boundTop, drawWidth, drawHeight);
    
    // 绘制各个点
    drawColorPoints(boundLeft, boundTop, drawWidth, drawHeight);
    
    // 绘制步长调整按钮
    drawStepSizeControls();
    
    // 绘制色域显示开关
    drawGamutDisplayToggle(boundLeft, boundTop, drawWidth, drawHeight);
    
    // 计算并显示色域覆盖率
    drawGamutCoverageInfo(boundLeft, boundTop, drawWidth, drawHeight);
    
    // 绘制底部标题
    ctx.fillStyle = '#333333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("CIE1931色度图（点击或拖动可更改颜色位置）", width/2, height - 10);
    
    // 绘制调试可视化内容
    if (typeof debugTool !== 'undefined' && debugTool.active) {
        debugTool.drawDebugVisuals(ctx, boundLeft, boundTop, drawWidth, drawHeight);
    }
}

// 绘制网格线
function drawGrid(boundLeft, boundTop, drawWidth, drawHeight) {
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 0.5;
    
    // 绘制X轴网格线 - 每0.1单位一条线
    for (let i = 0; i <= 10; i++) {
        const x = boundLeft + (i * 0.1) * drawWidth;
        ctx.beginPath();
        ctx.moveTo(x, boundTop);
        ctx.lineTo(x, boundTop + drawHeight);
        ctx.stroke();
    }
    
    // 绘制Y轴网格线 - 每0.1单位一条线
    for (let i = 0; i <= 10; i++) {
        const y = boundTop + (i * 0.1) * drawHeight;
        ctx.beginPath();
        ctx.moveTo(boundLeft, y);
        ctx.lineTo(boundLeft + drawWidth, y);
        ctx.stroke();
    }
    
    // 绘制X轴
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boundLeft, boundTop + drawHeight);
    ctx.lineTo(boundLeft + drawWidth, boundTop + drawHeight);
    ctx.stroke();
    
    // 绘制Y轴
    ctx.beginPath();
    ctx.moveTo(boundLeft, boundTop);
    ctx.lineTo(boundLeft, boundTop + drawHeight);
    ctx.stroke();
    
    // 标注坐标
    ctx.fillStyle = '#666666';
    ctx.font = `12px Arial`;
    ctx.textAlign = 'center';
    
    // X轴标注
    for (let i = 0; i <= 10; i++) {
        const x = boundLeft + (i * 0.1) * drawWidth;
        const value = (i * 0.1).toFixed(1);
        ctx.fillText(value, x, boundTop + drawHeight + 15);
    }
    
    ctx.textAlign = 'right';
    // Y轴标注
    for (let i = 0; i <= 10; i++) {
        const y = boundTop + (i * 0.1) * drawHeight;
        const value = (1 - i * 0.1).toFixed(1);
        ctx.fillText(value, boundLeft - 5, y + 5);
    }
}

// 绘制RGB颜色三角形
function drawRGBTriangle(boundLeft, boundTop, drawWidth, drawHeight) {
    ctx.beginPath();
    
    // 创建坐标映射函数
    const mapX = x => boundLeft + x * drawWidth;
    const mapY = y => boundTop + (1 - y) * drawHeight;
    
    // 红色点
    const redX = mapX(colorPoints.red.x);
    const redY = mapY(colorPoints.red.y);
    
    // 绿色点
    const greenX = mapX(colorPoints.green.x);
    const greenY = mapY(colorPoints.green.y);
    
    // 蓝色点
    const blueX = mapX(colorPoints.blue.x);
    const blueY = mapY(colorPoints.blue.y);
    
    // 绘制三角形
    ctx.moveTo(redX, redY);
    ctx.lineTo(greenX, greenY);
    ctx.lineTo(blueX, blueY);
    ctx.closePath();
    
    // 填充
    ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
    ctx.fill();
    
    // 描边
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// 绘制颜色点
function drawColorPoints(boundLeft, boundTop, drawWidth, drawHeight) {
    // 创建坐标映射函数
    const mapX = x => boundLeft + x * drawWidth;
    const mapY = y => boundTop + (1 - y) * drawHeight;
    
    // 点大小
    const pointSize = 12;
    
    // 仅在模式1中绘制滑动条
    if (activeMode === 'mode1') {
        // 绘制红色点和滑动条
        drawPoint(
            mapX(colorPoints.red.x),
            mapY(colorPoints.red.y),
            'red',
            'R',
            pointSize
        );
        drawLvSlider(
            mapX(colorPoints.red.x) + pointSize * 1.5,
            mapY(colorPoints.red.y),
            'red'
        );
        
        // 绘制绿色点和滑动条
        drawPoint(
            mapX(colorPoints.green.x),
            mapY(colorPoints.green.y),
            'green',
            'G',
            pointSize
        );
        drawLvSlider(
            mapX(colorPoints.green.x) + pointSize * 1.5,
            mapY(colorPoints.green.y),
            'green'
        );
        
        // 绘制蓝色点和滑动条
        drawPoint(
            mapX(colorPoints.blue.x),
            mapY(colorPoints.blue.y),
            'blue',
            'B',
            pointSize
        );
        drawLvSlider(
            mapX(colorPoints.blue.x) + pointSize * 1.5,
            mapY(colorPoints.blue.y),
            'blue'
        );
    } else {
        // 模式2中只绘制点，不绘制滑动条
        drawPoint(
            mapX(colorPoints.red.x),
            mapY(colorPoints.red.y),
            'red',
            'R',
            pointSize
        );
        
        drawPoint(
            mapX(colorPoints.green.x),
            mapY(colorPoints.green.y),
            'green',
            'G',
            pointSize
        );
        
        drawPoint(
            mapX(colorPoints.blue.x),
            mapY(colorPoints.blue.y),
            'blue',
            'B',
            pointSize
        );
    }
    
    // 仅在模式2中显示目标点
    if (activeMode === 'mode2') {
        drawPoint(
            mapX(colorPoints.target.x),
            mapY(colorPoints.target.y),
            'black',
            'T',
            pointSize
        );
    }
    
    // 仅在模式1中显示混合点
    if (activeMode === 'mode1' && colorPoints.mix.x > 0) {
        drawPoint(
            mapX(colorPoints.mix.x),
            mapY(colorPoints.mix.y),
            'purple',
            'M',
            pointSize
        );
    }
}

// 更新滑动条值（保持函数名不变，但内部逻辑修改）
function updateSliderValue(mouseY, color) {
    // 不再需要垂直滑动，改为通过按钮调整
    // 但保留函数以兼容现有代码
    console.log("调用了updateSliderValue函数，但现在仅通过按钮调整值");
}

// 跟踪最近点击的按钮，用于显示高亮状态
let lastClickedButton = null;
let buttonHighlightTimer = null;

// 设置按钮点击效果
function setButtonClickEffect(colorName, buttonType) {
    // 清除之前的高亮计时器
    if (buttonHighlightTimer) {
        clearTimeout(buttonHighlightTimer);
    }
    
    // 记录当前点击的按钮
    lastClickedButton = {
        color: colorName,
        type: buttonType
    };
    
    // 重绘以显示高亮效果
    drawCIE1931Chart();
    
    // 300毫秒后清除高亮效果
    buttonHighlightTimer = setTimeout(() => {
        lastClickedButton = null;
        drawCIE1931Chart();
    }, 300);
}

// 添加全局坐标转换函数
function getCanvasScaleFactor() {
    const rect = canvas.getBoundingClientRect();
    return {
        scaleX: canvas.width / rect.width,
        scaleY: canvas.height / rect.height
    };
}

// 屏幕坐标转换为Canvas坐标
function screenToCanvasCoordinates(screenX, screenY) {
    const scale = getCanvasScaleFactor();
    return {
        x: screenX * scale.scaleX,
        y: screenY * scale.scaleY
    };
}

// 获取CIE绘图区域边界
function getDrawAreaBounds() {
    const width = canvas.width;
    const height = canvas.height;
    const drawWidth = width * 0.95;
    const drawHeight = height * 0.95;
    
    return {
        left: (width - drawWidth) / 2,
        top: (height - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight
    };
}

// 计算按钮的精确位置和边界
function calculateButtonPositions(colorName) {
    // 获取绘图区域边界
    const bounds = getDrawAreaBounds();
    
    // 创建坐标映射函数
    const mapX = x => bounds.left + x * bounds.width;
    const mapY = y => bounds.top + (1 - y) * bounds.height;
    
    // 获取色点坐标
    const point = colorPoints[colorName];
    const x = mapX(point.x);
    const y = mapY(point.y);
    
    // 按钮尺寸设置
    const buttonSize = 15;
    const spacing = 5;
    
    // 计算控制组的中心位置
    const controlX = x + buttonSize * 2.5;
    
    // 计算精确的按钮边界
    const plusLeft = controlX - buttonSize - spacing - buttonSize/2;
    const plusTop = y - buttonSize/2;
    const minusLeft = controlX + buttonSize + spacing - buttonSize/2;
    const minusTop = y - buttonSize/2;
    
    return {
        controlX: controlX,
        y: y,
        plus: {
            x: controlX - buttonSize - spacing,
            y: y,
            left: plusLeft,
            top: plusTop,
            right: plusLeft + buttonSize,
            bottom: plusTop + buttonSize
        },
        minus: {
            x: controlX + buttonSize + spacing,
            y: y,
            left: minusLeft,
            top: minusTop,
            right: minusLeft + buttonSize,
            bottom: minusTop + buttonSize
        }
    };
}

// 修改drawLvSlider函数
function drawLvSlider(x, y, colorName) {
    const buttonSize = 15;
    
    // 获取当前光通量
    const currentLv = colorPoints[colorName].lv;
    const maxLv = maxLvValues[colorName];
    
    // 获取按钮位置
    const positions = calculateButtonPositions(colorName);
    
    // 保存按钮位置到全局
    if (typeof window.buttonPositions === 'undefined') {
        window.buttonPositions = {};
    }
    window.buttonPositions[colorName] = positions;
    
    // 检查按钮是否处于高亮状态
    const isMinusHighlighted = lastClickedButton && 
                              lastClickedButton.color === colorName && 
                              lastClickedButton.type === 'minus';
    
    // 减小按钮（-）- 方形
    ctx.beginPath();
    ctx.rect(
        positions.minus.left, 
        positions.minus.top, 
        buttonSize, 
        buttonSize
    );
    ctx.fillStyle = isMinusHighlighted ? 'rgb(200, 200, 255)' : 'white';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.stroke();
    
    // 绘制 - 符号
    ctx.beginPath();
    ctx.moveTo(positions.minus.x - buttonSize/3, positions.y);
    ctx.lineTo(positions.minus.x + buttonSize/3, positions.y);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 显示当前值（改为黑色）
    ctx.font = 'bold 12px "Microsoft YaHei", "等线", Arial';
    ctx.fillStyle = 'black'; // 将数字颜色统一改为黑色
    ctx.textAlign = 'center';
    ctx.fillText(currentLv.toFixed(1), positions.controlX, positions.y + 4);
    
    // 检查按钮是否处于高亮状态
    const isPlusHighlighted = lastClickedButton && 
                             lastClickedButton.color === colorName && 
                             lastClickedButton.type === 'plus';
    
    // 增加按钮（+）- 方形
    ctx.beginPath();
    ctx.rect(
        positions.plus.left, 
        positions.plus.top, 
        buttonSize, 
        buttonSize
    );
    ctx.fillStyle = isPlusHighlighted ? 'rgb(200, 200, 255)' : 'white';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.stroke();
    
    // 绘制 + 符号
    ctx.beginPath();
    ctx.moveTo(positions.plus.x - buttonSize/3, positions.y);
    ctx.lineTo(positions.plus.x + buttonSize/3, positions.y);
    ctx.moveTo(positions.plus.x, positions.y - buttonSize/3);
    ctx.lineTo(positions.plus.x, positions.y + buttonSize/3);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

// 修改isOnSlider函数来使用统一坐标转换
function isOnSlider(mouseX, mouseY) {
    // 只在模式1中检查按钮
    if (activeMode !== 'mode1') return null;
    
    // 转换屏幕坐标到canvas坐标
    const canvasCoord = screenToCanvasCoordinates(mouseX, mouseY);
    const canvasX = canvasCoord.x;
    const canvasY = canvasCoord.y;
    
    // 调试信息
    console.log("统一坐标转换 - 鼠标位置:", canvasX, canvasY);
    
    // 检查每个颜色的控件
    const colors = ['red', 'green', 'blue'];
    
    for (const color of colors) {
        const positions = calculateButtonPositions(color);
        
        // 检查是否在增加按钮内
        if (canvasX >= positions.plus.left && canvasX <= positions.plus.right && 
            canvasY >= positions.plus.top && canvasY <= positions.plus.bottom) {
            console.log(`点击了${color}的+按钮`);
            return color + '_plus';
        }
        
        // 检查是否在减小按钮内
        if (canvasX >= positions.minus.left && canvasX <= positions.minus.right && 
            canvasY >= positions.minus.top && canvasY <= positions.minus.bottom) {
            console.log(`点击了${color}的-按钮`);
            return color + '_minus';
        }
    }
    
    return null;
}

// 修改onMouseDown函数，使用统一坐标转换
function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 输出原始鼠标位置信息
    console.log("原始鼠标位置(屏幕坐标):", mouseX, mouseY);
    
    // 获取DPI缩放信息
    const scale = getCanvasScaleFactor();
    console.log("DPI缩放比例:", scale.scaleX, scale.scaleY);
    
    // 转换为canvas坐标
    const canvasCoord = screenToCanvasCoordinates(mouseX, mouseY);
    
    // 左键点击
    if (e.button === 0) {
        // 检查是否点击了色域显示开关
        const width = canvas.width;
        const height = canvas.height;
        const drawWidth = width * 0.95;
        const drawHeight = height * 0.95;
        const boundLeft = (width - drawWidth) / 2;
        const boundTop = (height - drawHeight) / 2;
        
        // 使用与绘制函数相同的计算方式确定开关位置
        const infoX = boundLeft + drawWidth * 0.70; // 修改为0.70，与drawGamutDisplayToggle一致
        const infoY = boundTop + drawHeight * 0.08;
        const toggleX = infoX + 98; // 修改为98，与drawGamutDisplayToggle一致
        const toggleY = infoY + 75; // 修改为75，与drawGamutDisplayToggle一致
        const toggleWidth = 24;
        const toggleHeight = 14;
        
        // 检查是否点击了开关
        if (canvasCoord.x >= toggleX && canvasCoord.x <= toggleX + toggleWidth &&
            canvasCoord.y >= toggleY && canvasCoord.y <= toggleY + toggleHeight) {
            // 切换开关状态
            showGamutBoundaries = !showGamutBoundaries;
            // 重绘
            drawCIE1931Chart();
            e.preventDefault();
            return;
        }
        
        // 检查是否点击了步长控制按钮
        if (activeMode === 'mode1') {
            const buttonWidth = 20;
            const buttonHeight = 20;
            const padding = 10;
            const x = canvas.width - buttonWidth * 2 - padding * 3;
            const y = canvas.height - buttonHeight - padding;
            
            // 减小步长按钮
            if (canvasCoord.x >= x && canvasCoord.x <= x + buttonWidth && 
                canvasCoord.y >= y && canvasCoord.y <= y + buttonHeight) {
                sliderStepSize = Math.max(0.1, sliderStepSize - 0.1);
                drawCIE1931Chart();
                e.preventDefault();
                return;
            }
            
            // 增加步长按钮
            if (canvasCoord.x >= x + buttonWidth + padding && canvasCoord.x <= x + buttonWidth * 2 + padding && 
                canvasCoord.y >= y && canvasCoord.y <= y + buttonHeight) {
                sliderStepSize = Math.min(5.0, sliderStepSize + 0.1);
                drawCIE1931Chart();
                e.preventDefault();
                return;
            }
        }
        
        // 先检查是否点击了按钮（仅模式1中）
        if (activeMode === 'mode1') {
            // 传入原始鼠标位置，函数内部会处理坐标转换
            const sliderResult = isOnSlider(mouseX, mouseY);
            console.log("isOnSlider结果:", sliderResult);
            
            if (sliderResult) {
                // 检查是否点击了加减按钮
                if (sliderResult.includes('_plus') || sliderResult.includes('_minus')) {
                    // 提取颜色名
                    const colorName = sliderResult.split('_')[0];
                    lastSelectedColor = colorName; // 记录选中的颜色
                    const isPlus = sliderResult.includes('_plus');
                    
                    // 设置按钮点击效果
                    setButtonClickEffect(colorName, isPlus ? 'plus' : 'minus');
                    
                    // 获取动态上限值
                    const maxLv = maxLvValues[colorName];
                    const minLv = 0;
                    
                    // 增加或减少光通量
                    if (isPlus) {
                        colorPoints[colorName].lv = Math.min(maxLv, colorPoints[colorName].lv + sliderStepSize);
                    } else {
                        colorPoints[colorName].lv = Math.max(minLv, colorPoints[colorName].lv - sliderStepSize);
                    }
                    
                    // 更新输入框的值
                    document.getElementById(`${colorName}-lv`).value = colorPoints[colorName].lv.toFixed(1);
                    
                    // 重新计算混合色
                    calculateMixedColor();
                    
                    // 重绘已在setButtonClickEffect中调用
                    e.preventDefault();
                    return;
                }
                
                draggingSlider = sliderResult;
                lastSelectedColor = sliderResult; // 记录选中的滑动条颜色
                updateSliderValue(mouseY, sliderResult);
                e.preventDefault();
                return;
            }
        }
        
        // 如果没有点击滑动条，检查是否点击了颜色点
        const cieCoord = screenToCieCoordinates(mouseX, mouseY);
        
        console.log("点击位置:", cieCoord.x.toFixed(4), cieCoord.y.toFixed(4));
        console.log("红色点坐标:", colorPoints.red.x.toFixed(4), colorPoints.red.y.toFixed(4));
        console.log("绿色点坐标:", colorPoints.green.x.toFixed(4), colorPoints.green.y.toFixed(4));
        console.log("蓝色点坐标:", colorPoints.blue.x.toFixed(4), colorPoints.blue.y.toFixed(4));
        
        // 设置点击容差为0.05
        const clickTolerance = 0.05;
        
        // 手动检查每个点的距离
        const redDist = Math.sqrt(
            Math.pow(cieCoord.x - colorPoints.red.x, 2) + 
            Math.pow(cieCoord.y - colorPoints.red.y, 2)
        );
        
        const greenDist = Math.sqrt(
            Math.pow(cieCoord.x - colorPoints.green.x, 2) + 
            Math.pow(cieCoord.y - colorPoints.green.y, 2)
        );
        
        const blueDist = Math.sqrt(
            Math.pow(cieCoord.x - colorPoints.blue.x, 2) + 
            Math.pow(cieCoord.y - colorPoints.blue.y, 2)
        );
        
        console.log("到红色距离:", redDist.toFixed(4));
        console.log("到绿色距离:", greenDist.toFixed(4));
        console.log("到蓝色距离:", blueDist.toFixed(4));
        
        // 找出最近的点
        const distances = {
            'red': redDist,
            'green': greenDist,
            'blue': blueDist
        };
        
        if (activeMode === 'mode2') {
            const targetDist = Math.sqrt(
                Math.pow(cieCoord.x - colorPoints.target.x, 2) + 
                Math.pow(cieCoord.y - colorPoints.target.y, 2)
            );
            distances['target'] = targetDist;
            console.log("到目标距离:", targetDist.toFixed(4));
        }
        
        // 找出最小距离及对应的点
        let minDist = Infinity;
        let hitPoint = null;
        
        for (const [point, dist] of Object.entries(distances)) {
            if (dist < minDist) {
                minDist = dist;
                hitPoint = point;
            }
        }
        
        // 判断是否在容差范围内
        if (minDist <= clickTolerance) {
            console.log("选中点:", hitPoint);
            draggingPoint = hitPoint;
            lastSelectedColor = hitPoint; // 记录选中的颜色点
            e.preventDefault();
        } else {
            console.log("未选中任何点");
        }
    }
}

// 鼠标移动事件 - 修改以支持滑动条
function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 如果正在拖动滑动条
    if (draggingSlider) {
        updateSliderValue(mouseY, draggingSlider);
        e.preventDefault();
        return;
    }
    
    // 如果正在拖动颜色点
    if (draggingPoint) {
        // 将鼠标位置转换为色彩坐标
        const cie = screenToCieCoordinates(mouseX, mouseY);
        
        // 更新颜色点坐标
        colorPoints[draggingPoint].x = cie.x;
        colorPoints[draggingPoint].y = cie.y;
        
        // 更新输入框的值
        updateInputFields();
        
        // 重绘
        drawCIE1931Chart();
        
        // 在拖动过程中显示坐标
        showCoordinates(draggingPoint, mouseX, mouseY);
        
        // 阻止默认行为
        e.preventDefault();
    }
}

// 鼠标松开事件 - 修改以支持滑动条
function onMouseUp(e) {
    draggingPoint = null;
    draggingSlider = null;
    
    // 重绘以清除坐标显示
    if (!e || e.type === 'mouseup') {
        drawCIE1931Chart();
    }
}

// 检查点是否在色谱轨迹内部
function isPointInSpectralLocus(x, y) {
    // 使用射线法判断点是否在多边形内部
    let inside = false;
    
    for (let i = 0, j = spectralLocus.length - 1; i < spectralLocus.length; j = i++) {
        const xi = spectralLocus[i].x;
        const yi = spectralLocus[i].y;
        const xj = spectralLocus[j].x;
        const yj = spectralLocus[j].y;
        
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            
        if (intersect) inside = !inside;
    }
    
    return inside;
}

// 将xy色坐标映射到RGB颜色空间 - 改进版
function xyToRgb(x, y) {
    // 防止除以零错误
    if (y === 0) y = 0.0001;
    
    // 计算XYZ
    const Y = 1.0; // 假设亮度为1
    const X = (x * Y) / y;
    const Z = ((1 - x - y) * Y) / y;
    
    // XYZ到RGB的转换矩阵(sRGB)
    // 更准确的转换矩阵
    const r =  3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
    const g = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
    const b =  0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;
    
    // 转换为0-255范围内的整数，并限制范围
    const normalize = (v) => {
        // 伽马校正和色调映射，使色彩更加饱和
        let normalized = Math.max(0, Math.min(1, v));
        
        // 应用伽马校正
        const gamma = 2.2;
        normalized = Math.pow(normalized, 1/gamma);
        
        // 提高饱和度
        normalized = Math.pow(normalized, 0.85);
        
        return Math.round(normalized * 255);
    };
    
    return {
        r: normalize(r),
        g: normalize(g),
        b: normalize(b)
    };
}

// 获取最近的点
function getNearestPoint(x, y) {
    const points = ['red', 'green', 'blue'];
    if (activeMode === 'mode2') {
        points.push('target');
    }
    
    let nearestPoint = null;
    let minDistance = Infinity;
    
    for (const point of points) {
        const distance = Math.sqrt(
            Math.pow(x - colorPoints[point].x, 2) + 
            Math.pow(y - colorPoints[point].y, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            nearestPoint = point;
        }
    }
    
    // 只有当距离小于阈值时才返回最近点
    return minDistance < 0.2 ? nearestPoint : null;
}

// 检查是否在点附近
function isNearPoint(x, y, point) {
    const distance = Math.sqrt(
        Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
    );
    
    return distance < 0.05; // 增加检测范围，让点更容易被选中
}

// 更新输入框的值
function updateInputFields() {
    // 更新模式1中的输入框
    document.getElementById('red-x').value = colorPoints.red.x.toFixed(4);
    document.getElementById('red-y').value = colorPoints.red.y.toFixed(4);
    document.getElementById('red-lv').value = colorPoints.red.lv.toFixed(1);
    
    document.getElementById('green-x').value = colorPoints.green.x.toFixed(4);
    document.getElementById('green-y').value = colorPoints.green.y.toFixed(4);
    document.getElementById('green-lv').value = colorPoints.green.lv.toFixed(1);
    
    document.getElementById('blue-x').value = colorPoints.blue.x.toFixed(4);
    document.getElementById('blue-y').value = colorPoints.blue.y.toFixed(4);
    document.getElementById('blue-lv').value = colorPoints.blue.lv.toFixed(1);
    
    // 更新模式2中的输入框
    document.getElementById('red-x2').value = colorPoints.red.x.toFixed(4);
    document.getElementById('red-y2').value = colorPoints.red.y.toFixed(4);
    
    document.getElementById('green-x2').value = colorPoints.green.x.toFixed(4);
    document.getElementById('green-y2').value = colorPoints.green.y.toFixed(4);
    
    document.getElementById('blue-x2').value = colorPoints.blue.x.toFixed(4);
    document.getElementById('blue-y2').value = colorPoints.blue.y.toFixed(4);
    
    document.getElementById('target-x').value = colorPoints.target.x.toFixed(4);
    document.getElementById('target-y').value = colorPoints.target.y.toFixed(4);
    document.getElementById('target-lv').value = colorPoints.target.lv.toFixed(1);
    
    // 更新结果显示（如果有计算结果）
    if (colorPoints.mix.x > 0 || colorPoints.mix.y > 0) {
        document.getElementById('mix-x').textContent = colorPoints.mix.x.toFixed(4);
        document.getElementById('mix-y').textContent = colorPoints.mix.y.toFixed(4);
        document.getElementById('mix-lv').textContent = colorPoints.mix.lv.toFixed(2);
    }
    
    // 触发计算更新（根据当前模式）
    if (activeMode === 'mode1') {
        calculateMixedColor();
    }
}

// 计算三基色混合后的颜色
function calculateMixedColor() {
    // 读取当前输入值
    updateColorPointsFromInputs();
    
    // 检查y坐标是否为0，防止除零错误
    if (colorPoints.red.y <= 0 || colorPoints.green.y <= 0 || colorPoints.blue.y <= 0) {
        alert('错误：y坐标不能为0，请调整色坐标！');
        return;
    }
    
    // 计算XYZ值
    const redX = colorPoints.red.x;
    const redY = colorPoints.red.y;
    const redZ = 1 - redX - redY;
    
    const greenX = colorPoints.green.x;
    const greenY = colorPoints.green.y;
    const greenZ = 1 - greenX - greenY;
    
    const blueX = colorPoints.blue.x;
    const blueY = colorPoints.blue.y;
    const blueZ = 1 - blueX - blueY;
    
    // 计算XYZ总和
    const sumX = (redX / redY) * colorPoints.red.lv + 
                 (greenX / greenY) * colorPoints.green.lv + 
                 (blueX / blueY) * colorPoints.blue.lv;
                 
    const sumY = colorPoints.red.lv + colorPoints.green.lv + colorPoints.blue.lv;
    
    const sumZ = (redZ / redY) * colorPoints.red.lv + 
                 (greenZ / greenY) * colorPoints.green.lv + 
                 (blueZ / blueY) * colorPoints.blue.lv;
    
    // 计算混合后的色坐标
    const mixX = sumX / (sumX + sumY + sumZ);
    const mixY = sumY / (sumX + sumY + sumZ);
    const mixLv = sumY;
    
    // 更新混合点
    colorPoints.mix.x = mixX;
    colorPoints.mix.y = mixY;
    colorPoints.mix.lv = mixLv;
    
    // 显示结果
    document.getElementById('mix-x').textContent = mixX.toFixed(4);
    document.getElementById('mix-y').textContent = mixY.toFixed(4);
    document.getElementById('mix-lv').textContent = mixLv.toFixed(2);
    
    // 重绘
    drawCIE1931Chart();
}

// 计算所需的三基色光通量
function calculateRequiredLuminance() {
    // 读取当前输入值
    updateColorPointsFromInputs();
    
    // 检查y坐标是否为0，防止除零错误
    if (colorPoints.red.y <= 0 || colorPoints.green.y <= 0 || colorPoints.blue.y <= 0 || colorPoints.target.y <= 0) {
        alert('错误：y坐标不能为0，请调整色坐标！');
        return;
    }
    
    // 提取数据
    const redX = colorPoints.red.x;
    const redY = colorPoints.red.y;
    const redZ = 1 - redX - redY;
    
    const greenX = colorPoints.green.x;
    const greenY = colorPoints.green.y;
    const greenZ = 1 - greenX - greenY;
    
    const blueX = colorPoints.blue.x;
    const blueY = colorPoints.blue.y;
    const blueZ = 1 - blueX - blueY;
    
    const targetX = colorPoints.target.x;
    const targetY = colorPoints.target.y;
    const targetZ = 1 - targetX - targetY;
    const targetLv = colorPoints.target.lv;
    
    // 构建系数矩阵
    const coeffMatrix = [
        [redX/redY, greenX/greenY, blueX/blueY],
        [1, 1, 1],
        [redZ/redY, greenZ/greenY, blueZ/blueY]
    ];
    
    // 目标值向量
    const targetVector = [
        (targetX/targetY) * targetLv,
        targetLv,
        (targetZ/targetY) * targetLv
    ];
    
    try {
        // 求解线性方程组
        const result = solveLinearEquation(coeffMatrix, targetVector);
        
        // 显示结果
        document.getElementById('red-lv-result').textContent = result[0].toFixed(2);
        document.getElementById('green-lv-result').textContent = result[1].toFixed(2);
        document.getElementById('blue-lv-result').textContent = result[2].toFixed(2);
        
        // 检查是否有负值
        if (result[0] < 0 || result[1] < 0 || result[2] < 0) {
            alert('警告：计算结果包含负值，表示目标颜色在RGB三角形外部，无法通过三基色合成!');
        }
    } catch (error) {
        console.error('计算错误:', error);
        alert('计算错误：无法求解方程组，请检查输入数据!');
    }
}

// 求解线性方程组
function solveLinearEquation(A, b) {
    // 实现高斯消元法
    const n = A.length;
    
    // 创建增广矩阵
    const augmentedMatrix = [];
    for (let i = 0; i < n; i++) {
        augmentedMatrix.push([...A[i], b[i]]);
    }
    
    // 前向消元
    for (let i = 0; i < n; i++) {
        // 如果对角线元素是0，寻找非零元素行交换
        if (Math.abs(augmentedMatrix[i][i]) < 1e-10) {
            let maxRow = i;
            for (let j = i + 1; j < n; j++) {
                if (Math.abs(augmentedMatrix[j][i]) > Math.abs(augmentedMatrix[maxRow][i])) {
                    maxRow = j;
                }
            }
            
            if (Math.abs(augmentedMatrix[maxRow][i]) < 1e-10) {
                throw new Error('矩阵奇异，无法求解');
            }
            
            // 交换行
            [augmentedMatrix[i], augmentedMatrix[maxRow]] = [augmentedMatrix[maxRow], augmentedMatrix[i]];
        }
        
        // 将当前行的主元归一化
        const pivot = augmentedMatrix[i][i];
        for (let j = i; j <= n; j++) {
            augmentedMatrix[i][j] /= pivot;
        }
        
        // 消元
        for (let j = 0; j < n; j++) {
            if (j !== i) {
                const factor = augmentedMatrix[j][i];
                for (let k = i; k <= n; k++) {
                    augmentedMatrix[j][k] -= factor * augmentedMatrix[i][k];
                }
            }
        }
    }
    
    // 提取解
    const solution = [];
    for (let i = 0; i < n; i++) {
        solution.push(augmentedMatrix[i][n]);
    }
    
    return solution;
}

// 显示坐标值
function showCoordinates(pointName, x, y) {
    const point = colorPoints[pointName];
    const pointLabel = {
        'red': '红色',
        'green': '绿色',
        'blue': '蓝色',
        'target': '目标色'
    }[pointName];
    
    // 清除之前的提示框
    ctx.save();
    
    // 在鼠标位置上方绘制坐标提示框
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    
    // 计算文本宽度
    ctx.font = '12px Arial';
    const text = `${pointLabel}: (${point.x.toFixed(4)}, ${point.y.toFixed(4)})`;
    const textWidth = ctx.measureText(text).width;
    
    // 绘制提示框
    ctx.beginPath();
    ctx.rect(x - textWidth/2 - 5, y - 35, textWidth + 10, 25);
    ctx.fill();
    ctx.stroke();
    
    // 绘制文本
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - 22);
    
    ctx.restore();
}

// 添加绘制步长调节按钮
function drawStepSizeControls() {
    // 仅在模式1中显示步长控制
    if (activeMode !== 'mode1') return;
    
    const padding = 10;
    const buttonWidth = 20;
    const buttonHeight = 20;
    
    // 计算位置
    const x = canvas.width - buttonWidth * 2 - padding * 3;
    const y = canvas.height - buttonHeight - padding;
    
    // 绘制减小步长按钮
    ctx.fillStyle = 'rgba(240, 240, 240, 0.9)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    
    // 减小步长按钮
    ctx.beginPath();
    ctx.rect(x, y, buttonWidth, buttonHeight);
    ctx.fill();
    ctx.stroke();
    
    // 减号符号
    ctx.beginPath();
    ctx.moveTo(x + 5, y + buttonHeight/2);
    ctx.lineTo(x + buttonWidth - 5, y + buttonHeight/2);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 增加步长按钮
    ctx.beginPath();
    ctx.rect(x + buttonWidth + padding, y, buttonWidth, buttonHeight);
    ctx.fillStyle = 'rgba(240, 240, 240, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.stroke();
    
    // 加号符号
    ctx.beginPath();
    ctx.moveTo(x + buttonWidth + padding + 5, y + buttonHeight/2);
    ctx.lineTo(x + buttonWidth * 2 + padding - 5, y + buttonHeight/2);
    ctx.moveTo(x + buttonWidth + padding + buttonWidth/2, y + 5);
    ctx.lineTo(x + buttonWidth + padding + buttonWidth/2, y + buttonHeight - 5);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 显示当前步长
    ctx.font = '10px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(`步长: ${sliderStepSize.toFixed(1)}`, x + buttonWidth + padding + 10, y - 5);
}

// 添加调试辅助函数
function debugDrawButtonBoundaries() {
    // 只在模式1中显示边界
    if (activeMode !== 'mode1') return;
    
    // 设置半透明调试样式
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    
    const colors = ['red', 'green', 'blue'];
    
    for (const color of colors) {
        const positions = calculateButtonPositions(color);
        
        // 绘制原始颜色点的位置标记
        ctx.beginPath();
        ctx.arc(positions.controlX, positions.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fill();
        
        // 绘制增加按钮边界
        ctx.beginPath();
        ctx.rect(
            positions.plus.left, 
            positions.plus.top, 
            positions.plus.right - positions.plus.left, 
            positions.plus.bottom - positions.plus.top
        );
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.stroke();
        
        // 绘制减小按钮边界
        ctx.beginPath();
        ctx.rect(
            positions.minus.left, 
            positions.minus.top, 
            positions.minus.right - positions.minus.left, 
            positions.minus.bottom - positions.minus.top
        );
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
        ctx.stroke();
    }
}

// 修改drawPoint函数以确保正确绘制
function drawPoint(x, y, color, label, size = 12) {
    // 外圈白色背景
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 中圈颜色边框
    ctx.beginPath();
    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 内圈颜色填充
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // 标签文字
    ctx.fillStyle = 'black';
    ctx.font = `bold 10px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
}

// 修改将屏幕坐标转换为CIE坐标的函数
function screenToCieCoordinates(screenX, screenY) {
    // 转换为canvas坐标
    const canvasCoord = screenToCanvasCoordinates(screenX, screenY);
    const canvasX = canvasCoord.x;
    const canvasY = canvasCoord.y;
    
    // 获取绘图区域边界
    const bounds = getDrawAreaBounds();
    
    // 计算CIE坐标
    const cieX = (canvasX - bounds.left) / bounds.width;
    const cieY = 1 - (canvasY - bounds.top) / bounds.height;
    
    // 调试信息
    console.log("屏幕点击位置:", screenX, screenY);
    console.log("画布内位置:", canvasX, canvasY);
    console.log("绘图区域边界:", bounds.left, bounds.top, bounds.width, bounds.height);
    console.log("CIE坐标:", cieX, cieY);
    
    // 确保坐标在有效范围内
    return { 
        x: Math.max(0, Math.min(1, cieX)), 
        y: Math.max(0, Math.min(1, cieY)) 
    };
}

// 设置事件监听器
function setupEventListeners() {
    // 标签切换事件
    tab1.addEventListener('click', () => switchTab('mode1'));
    tab2.addEventListener('click', () => switchTab('mode2'));
    
    // 点的拖拽事件
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    
    // 禁用右键菜单
    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
    // 添加键盘事件监听，用于调整滑动条
    document.addEventListener('keydown', onKeyDown);
    
    // 输入框值变化时更新
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            // 从输入框更新颜色点数据
            updateColorPointsFromInputs();
            // 更新所有输入框
            updateInputFields();
            // 重绘色度图
            drawCIE1931Chart();
        });
    });
    
    // 计算按钮
    document.getElementById('calculate-mix').addEventListener('click', calculateMixedColor);
    document.getElementById('calculate-lv').addEventListener('click', calculateRequiredLuminance);
}

// 用于记录最后选中的颜色点
let lastSelectedColor = null;

// 键盘事件处理
function onKeyDown(e) {
    // 只在模式1下生效，且需要有上次选中的颜色
    if (activeMode !== 'mode1' || !lastSelectedColor) return;
    
    const stepSize = e.shiftKey ? sliderStepSize * 0.1 : sliderStepSize; // Shift键按下时使用更小的步长
    const maxLv = maxLvValues[lastSelectedColor]; // 使用动态上限值
    const minLv = 0;
    
    // 处理方向键
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        // 增加光通量
        colorPoints[lastSelectedColor].lv = Math.min(maxLv, colorPoints[lastSelectedColor].lv + stepSize);
        e.preventDefault();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        // 减少光通量
        colorPoints[lastSelectedColor].lv = Math.max(minLv, colorPoints[lastSelectedColor].lv - stepSize);
        e.preventDefault();
    } else if (e.key === 'PageUp') {
        // 增加步长
        sliderStepSize = Math.min(5.0, sliderStepSize + 0.1);
        e.preventDefault();
        drawCIE1931Chart(); // 更新显示
        return;
    } else if (e.key === 'PageDown') {
        // 减小步长
        sliderStepSize = Math.max(0.1, sliderStepSize - 0.1);
        e.preventDefault();
        drawCIE1931Chart(); // 更新显示
        return;
    } else {
        return; // 非方向键不处理
    }
    
    // 更新输入框的值
    document.getElementById(`${lastSelectedColor}-lv`).value = colorPoints[lastSelectedColor].lv.toFixed(1);
    
    // 重新计算混合色
    calculateMixedColor();
    
    // 重绘
    drawCIE1931Chart();
}

// 切换标签页
function switchTab(mode) {
    if (mode === 'mode1') {
        tab1.classList.add('active');
        tab2.classList.remove('active');
        mode1.classList.add('active');
        mode2.classList.remove('active');
    } else {
        tab1.classList.remove('active');
        tab2.classList.add('active');
        mode1.classList.remove('active');
        mode2.classList.add('active');
    }
    
    activeMode = mode;
    
    // 确保两个模式之间的数据同步
    updateColorPointsFromInputs();
    updateInputFields();
    
    // 重绘
    drawCIE1931Chart();
}

// 计算三角形面积
function calculateTriangleArea(p1, p2, p3) {
    return Math.abs(
        (p1.x * (p2.y - p3.y) + 
         p2.x * (p3.y - p1.y) + 
         p3.x * (p1.y - p2.y)) / 2
    );
}

// 计算并显示色域覆盖率信息
function drawGamutCoverageInfo(boundLeft, boundTop, drawWidth, drawHeight) {
    // 如果开关关闭，则不显示
    if (!showGamutBoundaries) return;
    
    // 计算NTSC和sRGB色域覆盖率
    const ntscInfo = calculateGamutCoverage(ntscColorSpace);
    const srgbInfo = calculateGamutCoverage(srgbColorSpace);
    
    // 设置背景 - 将位置向左移动
    const infoX = boundLeft + drawWidth * 0.70; // 从0.78减小到0.70
    const infoY = boundTop + drawHeight * 0.08;
    
    // 增加面板高度，为开关留出空间
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(infoX - 10, infoY - 20, 160, 85);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(infoX - 10, infoY - 20, 160, 85);
    
    // 设置文字样式
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px "Microsoft YaHei", "等线", Arial';
    ctx.textAlign = 'left';
    
    // 显示NTSC色域覆盖率
    ctx.fillText(`NTSC色域: ${ntscInfo.coverage.toFixed(1)}%`, infoX, infoY);
    
    // 显示sRGB色域覆盖率
    ctx.fillText(`sRGB色域: ${srgbInfo.coverage.toFixed(1)}%`, infoX, infoY + 20);
    
    // 根据NTSC色域显示质量描述
    const colorQuality = getColorQualityDescription(ntscInfo.coverage);
    ctx.fillText(colorQuality, infoX, infoY + 40);
}

// 计算色域覆盖率（通用函数）
function calculateGamutCoverage(standardColorSpace) {
    // 计算标准三角形面积
    const standardArea = calculateTriangleArea(
        standardColorSpace.red,
        standardColorSpace.green,
        standardColorSpace.blue
    );
    
    // 计算当前RGB三角形面积
    const currentRGBArea = calculateTriangleArea(
        colorPoints.red,
        colorPoints.green,
        colorPoints.blue
    );
    
    // 简化的色域覆盖率计算
    const coverage = (currentRGBArea / standardArea) * 100;
    
    return {
        standardArea: standardArea,
        currentArea: currentRGBArea,
        coverage: coverage
    };
}

// 绘制色域显示开关
function drawGamutDisplayToggle(boundLeft, boundTop, drawWidth, drawHeight) {
    // 调整开关位置到文字下方 - 保持与信息面板一致
    const infoX = boundLeft + drawWidth * 0.70; // 从0.78减小到0.70，与上面保持一致
    const infoY = boundTop + drawHeight * 0.08;
    
    // 将开关放置在色域信息面板下方
    const toggleX = infoX + 98;
    const toggleY = infoY + 75;
    const toggleWidth = 24;
    const toggleHeight = 14;
    
    // 绘制开关背景
    ctx.fillStyle = showGamutBoundaries ? 'rgba(120, 200, 120, 0.8)' : 'rgba(200, 200, 200, 0.8)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    
    // 圆角矩形
    ctx.beginPath();
    ctx.moveTo(toggleX, toggleY);
    ctx.lineTo(toggleX + toggleWidth - toggleHeight/2, toggleY);
    ctx.arc(toggleX + toggleWidth - toggleHeight/2, toggleY + toggleHeight/2, toggleHeight/2, -Math.PI/2, Math.PI/2);
    ctx.lineTo(toggleX + toggleHeight/2, toggleY + toggleHeight);
    ctx.arc(toggleX + toggleHeight/2, toggleY + toggleHeight/2, toggleHeight/2, Math.PI/2, -Math.PI/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 绘制滑块
    const sliderPos = showGamutBoundaries ? toggleX + toggleWidth - toggleHeight : toggleX;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sliderPos + toggleHeight/2, toggleY + toggleHeight/2, toggleHeight/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 将标签放置在开关左侧
    ctx.fillStyle = '#333333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    ctx.fillText("色域计算与显示", toggleX - 5, toggleY + toggleHeight/2 + 4);
}

// 获取色域质量描述
function getColorQualityDescription(coverage) {
    if (coverage >= 100) {
        return "色域: 专业级";
    } else if (coverage >= 85) {
        return "色域: 优秀";
    } else if (coverage >= 72) {
        return "色域: 良好";
    } else if (coverage >= 60) {
        return "色域: 一般";
    } else {
        return "色域: 较窄";
    }
} 