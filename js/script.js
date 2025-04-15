// DOM元素引用
const canvas = document.getElementById('cie1931');
const ctx = canvas.getContext('2d');
const tab1 = document.getElementById('tab1');
const tab2 = document.getElementById('tab2');
const mode1 = document.getElementById('mode1');
const mode2 = document.getElementById('mode2');

// 缩放相关变量
let zoomLevel = 1;
let panOffsetX = 0;
let panOffsetY = 0;
let isDraggingCanvas = false;
let lastMouseX = 0;
let lastMouseY = 0;

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
}

// 绘制CIE1931色度图
function drawCIE1931Chart() {
    const width = canvas.width;
    const height = canvas.height;
    
    // 设置绘图区域尺寸，考虑缩放和平移
    const drawWidth = width * 0.9; 
    const drawHeight = height * 0.9;
    
    // 实际绘图区域的中心点
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // 保存当前状态
    ctx.save();
    
    // 平移到中心，应用缩放，再平移回原位置加上用户的平移量
    ctx.translate(centerX, centerY);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-centerX + panOffsetX/zoomLevel, -centerY + panOffsetY/zoomLevel);
    
    // 移除网格线，只保留轴线
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 1/zoomLevel;
    ctx.beginPath();
    
    // X轴
    ctx.moveTo(centerX - drawWidth/2, centerY + drawHeight/2);
    ctx.lineTo(centerX + drawWidth/2, centerY + drawHeight/2);
    
    // Y轴
    ctx.moveTo(centerX - drawWidth/2, centerY + drawHeight/2);
    ctx.lineTo(centerX - drawWidth/2, centerY - drawHeight/2);
    
    ctx.stroke();
    
    // 标注坐标
    ctx.fillStyle = '#666666';
    ctx.font = `${12/zoomLevel}px Arial`;
    ctx.textAlign = 'center';
    
    // X轴标注（缩放后的）
    const stepX = drawWidth / 8; // 分成8份，每份0.1单位
    for (let i = 0; i <= 8; i++) {
        const x = centerX - drawWidth/2 + i * stepX;
        const value = (i * 0.1).toFixed(1);
        ctx.fillText(value, x, centerY + drawHeight/2 + 15/zoomLevel);
    }
    
    ctx.textAlign = 'right';
    // Y轴标注（缩放后的）
    const stepY = drawHeight / 9; // 分成9份，每份0.1单位
    for (let i = 0; i <= 9; i++) {
        const y = centerY + drawHeight/2 - i * stepY;
        const value = (i * 0.1).toFixed(1);
        ctx.fillText(value, centerX - drawWidth/2 - 5/zoomLevel, y + 5/zoomLevel);
    }
    
    // 绘制彩色CIE1931色谱轨迹 - 超高精度版本
    const gridSize = 300; // 提高精细度到300x300
    const stepCellX = drawWidth / gridSize;
    const stepCellY = drawHeight / gridSize;
    
    // 计算绘图区域的边界
    const boundLeft = centerX - drawWidth/2;
    const boundTop = centerY - drawHeight/2;
    
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
    ctx.lineWidth = 2/zoomLevel;
    ctx.stroke();
    
    // 绘制RGB三角形
    drawRGBTriangle(centerX, centerY, drawWidth, drawHeight);
    
    // 绘制各个点
    drawColorPoints(centerX, centerY, drawWidth, drawHeight);
    
    // 恢复状态，用于绘制不受缩放影响的UI元素
    ctx.restore();
    
    // 绘制缩放控制按钮
    drawZoomControls();
    
    // 绘制底部标题
    ctx.fillStyle = '#333333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("CIE1931色度图（可缩放、拖拽，点击或拖动可更改颜色位置）", width/2, height - 10);
}

// 绘制缩放控制按钮
function drawZoomControls() {
    const padding = 10;
    const buttonSize = 30;
    
    // 缩放重置按钮
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    
    // 放大按钮
    ctx.beginPath();
    ctx.rect(padding, padding, buttonSize, buttonSize);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#333333';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("+", padding + buttonSize/2, padding + buttonSize/2);
    
    // 缩小按钮
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.rect(padding, padding + buttonSize + 5, buttonSize, buttonSize);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#333333';
    ctx.fillText("-", padding + buttonSize/2, padding + buttonSize + 5 + buttonSize/2);
    
    // 重置按钮
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.rect(padding, padding + (buttonSize + 5) * 2, buttonSize, buttonSize);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText("R", padding + buttonSize/2, padding + (buttonSize + 5) * 2 + buttonSize/2);
}

// 绘制RGB颜色三角形
function drawRGBTriangle(centerX, centerY, drawWidth, drawHeight) {
    ctx.beginPath();
    
    // 创建坐标映射函数
    const boundLeft = centerX - drawWidth/2;
    const boundTop = centerY - drawHeight/2;
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
    ctx.lineWidth = 1/zoomLevel;
    ctx.stroke();
}

// 绘制颜色点
function drawColorPoints(centerX, centerY, drawWidth, drawHeight) {
    // 创建坐标映射函数
    const boundLeft = centerX - drawWidth/2;
    const boundTop = centerY - drawHeight/2;
    const mapX = x => boundLeft + x * drawWidth;
    const mapY = y => boundTop + (1 - y) * drawHeight;
    
    // 点大小应根据缩放调整
    const pointSize = 12/zoomLevel;
    
    // 绘制红色点
    drawPoint(
        mapX(colorPoints.red.x),
        mapY(colorPoints.red.y),
        'red',
        'R',
        pointSize
    );
    
    // 绘制绿色点
    drawPoint(
        mapX(colorPoints.green.x),
        mapY(colorPoints.green.y),
        'green',
        'G',
        pointSize
    );
    
    // 绘制蓝色点
    drawPoint(
        mapX(colorPoints.blue.x),
        mapY(colorPoints.blue.y),
        'blue',
        'B',
        pointSize
    );
    
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

// 绘制单个点
function drawPoint(x, y, color, label, size = 12) {
    // 外圈白色背景
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1/zoomLevel;
    ctx.stroke();
    
    // 中圈颜色边框
    ctx.beginPath();
    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3/zoomLevel;
    ctx.stroke();
    
    // 内圈颜色填充
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // 标签文字
    ctx.fillStyle = 'black';
    ctx.font = `bold ${10/zoomLevel}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
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
    
    // 添加鼠标滚轮事件用于缩放
    canvas.addEventListener('wheel', onWheel);
    
    // 禁用右键菜单
    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
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

// 鼠标按下事件
function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 检查是否点击了缩放控制按钮
    if (isInZoomControls(mouseX, mouseY)) {
        handleZoomControlClick(mouseX, mouseY);
        return;
    }
    
    // 处理鼠标右键 - 用于拖动画布
    if (e.button === 2) {
        isDraggingCanvas = true;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        e.preventDefault();
        return;
    }
    
    // 左键点击处理颜色点
    if (e.button === 0) {
        // 绘图区域的中心和大小
        const centerX = canvas.width * 0.5;
        const centerY = canvas.height * 0.5;
        const drawWidth = canvas.width * 0.9;
        const drawHeight = canvas.height * 0.9;
        
        // 首先检查是否直接点击了某个颜色点（在屏幕坐标系中）
        const radiusForHitTest = 15; // 点击检测半径
        let pointHit = null;
        
        // 创建坐标映射函数（从色彩坐标转换到画布坐标）
        const boundLeft = centerX - drawWidth/2;
        const boundTop = centerY - drawHeight/2;
        const mapX = x => boundLeft + x * drawWidth;
        const mapY = y => boundTop + (1 - y) * drawHeight;
        
        // 应用当前的缩放和平移
        const transformMapX = x => centerX + (mapX(x) - centerX) * zoomLevel + panOffsetX;
        const transformMapY = y => centerY + (mapY(y) - centerY) * zoomLevel + panOffsetY;
        
        // 检查是否点击了任何颜色点
        const pointsToCheck = ['red', 'green', 'blue'];
        if (activeMode === 'mode2') {
            pointsToCheck.push('target');
        }
        
        for (const pointName of pointsToCheck) {
            const point = colorPoints[pointName];
            const pointScreenX = transformMapX(point.x);
            const pointScreenY = transformMapY(point.y);
            
            const distance = Math.sqrt(
                Math.pow(mouseX - pointScreenX, 2) + 
                Math.pow(mouseY - pointScreenY, 2)
            );
            
            if (distance <= radiusForHitTest) {
                pointHit = pointName;
                break;
            }
        }
        
        if (pointHit) {
            // 如果点击了颜色点，开始拖动该点
            draggingPoint = pointHit;
            e.preventDefault();
        }
    }
}

// 鼠标移动事件
function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (isDraggingCanvas) {
        // 计算平移量
        const deltaX = mouseX - lastMouseX;
        const deltaY = mouseY - lastMouseY;
        
        // 更新平移位置
        panOffsetX += deltaX;
        panOffsetY += deltaY;
        
        // 更新上次鼠标位置
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        
        // 重绘
        drawCIE1931Chart();
        return;
    }
    
    if (!draggingPoint) return;
    
    // 绘图区域的中心和大小
    const centerX = canvas.width * 0.5;
    const centerY = canvas.height * 0.5;
    const drawWidth = canvas.width * 0.9;
    const drawHeight = canvas.height * 0.9;
    
    // 创建坐标映射函数
    const boundLeft = centerX - drawWidth/2;
    const boundTop = centerY - drawHeight/2;
    
    // 计算鼠标在缩放和平移后的相对位置（转换回色彩坐标系）
    const transformedX = (mouseX - centerX - panOffsetX) / zoomLevel + centerX;
    const transformedY = (mouseY - centerY - panOffsetY) / zoomLevel + centerY;
    
    // 转换为标准化的色彩坐标 (0-1范围)
    const normalizedX = (transformedX - boundLeft) / drawWidth;
    const normalizedY = 1 - (transformedY - boundTop) / drawHeight;
    
    // 更新拖拽点的位置
    if (draggingPoint === 'red' || draggingPoint === 'green' || draggingPoint === 'blue' || draggingPoint === 'target') {
        colorPoints[draggingPoint].x = Math.max(0, Math.min(0.8, normalizedX));
        colorPoints[draggingPoint].y = Math.max(0, Math.min(0.9, normalizedY));
        
        // 更新输入框的值
        updateInputFields();
        
        // 重绘
        drawCIE1931Chart();
        
        // 在拖动过程中显示坐标
        showCoordinates(draggingPoint, mouseX, mouseY);
    }
    
    // 阻止默认行为，如页面滚动
    e.preventDefault();
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

// 鼠标松开事件
function onMouseUp(e) {
    draggingPoint = null;
    isDraggingCanvas = false;
    
    // 重绘以清除坐标显示
    if (!e || e.type === 'mouseup') {
        drawCIE1931Chart();
    }
}

// 鼠标滚轮事件处理缩放
function onWheel(e) {
    e.preventDefault();
    
    // 确定缩放方向
    const delta = -Math.sign(e.deltaY);
    
    // 调整缩放级别
    zoomLevel += delta * 0.1;
    
    // 限制缩放范围
    zoomLevel = Math.max(0.5, Math.min(5, zoomLevel));
    
    // 重绘
    drawCIE1931Chart();
}

// 检查点击是否在缩放控制区域内
function isInZoomControls(x, y) {
    const padding = 10;
    const buttonSize = 30;
    
    // 检查放大按钮
    if (x >= padding && x <= padding + buttonSize && 
        y >= padding && y <= padding + buttonSize) {
        return true;
    }
    
    // 检查缩小按钮
    if (x >= padding && x <= padding + buttonSize && 
        y >= padding + buttonSize + 5 && y <= padding + buttonSize * 2 + 5) {
        return true;
    }
    
    // 检查重置按钮
    if (x >= padding && x <= padding + buttonSize && 
        y >= padding + (buttonSize + 5) * 2 && y <= padding + (buttonSize + 5) * 2 + buttonSize) {
        return true;
    }
    
    return false;
}

// 处理缩放控制按钮点击
function handleZoomControlClick(x, y) {
    const padding = 10;
    const buttonSize = 30;
    
    // 检查放大按钮
    if (x >= padding && x <= padding + buttonSize && 
        y >= padding && y <= padding + buttonSize) {
        zoomLevel *= 1.2;
        zoomLevel = Math.min(5, zoomLevel);
    }
    
    // 检查缩小按钮
    else if (x >= padding && x <= padding + buttonSize && 
             y >= padding + buttonSize + 5 && y <= padding + buttonSize * 2 + 5) {
        zoomLevel /= 1.2;
        zoomLevel = Math.max(0.5, zoomLevel);
    }
    
    // 检查重置按钮
    else if (x >= padding && x <= padding + buttonSize && 
             y >= padding + (buttonSize + 5) * 2 && y <= padding + (buttonSize + 5) * 2 + buttonSize) {
        zoomLevel = 1;
        panOffsetX = 0;
        panOffsetY = 0;
    }
    
    // 重绘
    drawCIE1931Chart();
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
    let nearestPoint = null;
    let minDistance = 0.05; // 初始化为检测阈值
    
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
    
    return nearestPoint;
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