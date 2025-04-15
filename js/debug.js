// 调试工具 - 用于定位颜色点拖动问题
const debugTool = {
    // 状态变量
    active: false,
    showHitAreas: false,
    tolerance: 0.03,
    hoverPoint: null,
    debugPanel: null,
    coordDisplay: null,
    
    // 初始化调试工具
    init: function() {
        this.createDebugPanel();
        this.createCoordDisplay();
        this.setupEventListeners();
        console.log('调试工具已初始化');
    },
    
    // 创建调试面板
    createDebugPanel: function() {
        // 创建面板容器
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        Object.assign(panel.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            width: '200px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            zIndex: '10000',
            display: 'none'
        });
        
        // 添加标题
        const title = document.createElement('h3');
        title.textContent = '调试工具';
        title.style.margin = '0 0 10px 0';
        panel.appendChild(title);
        
        // 添加开关
        const toggleShowAreas = document.createElement('div');
        toggleShowAreas.innerHTML = `
            <label><input type="checkbox" id="show-hit-areas"> 显示点击区域</label>
        `;
        panel.appendChild(toggleShowAreas);
        
        // 添加容差调节
        const toleranceControl = document.createElement('div');
        toleranceControl.style.margin = '10px 0';
        toleranceControl.innerHTML = `
            <label>点击容差: <span id="tolerance-value">0.03</span></label><br>
            <input type="range" id="tolerance-slider" min="0.01" max="0.1" step="0.01" value="0.03" style="width:100%">
        `;
        panel.appendChild(toleranceControl);
        
        // 添加信息区域
        const infoArea = document.createElement('div');
        infoArea.id = 'debug-info';
        infoArea.style.marginTop = '10px';
        infoArea.style.padding = '5px';
        infoArea.style.background = 'rgba(255,255,255,0.1)';
        infoArea.style.borderRadius = '3px';
        infoArea.innerHTML = '鼠标移动查看坐标信息';
        panel.appendChild(infoArea);
        
        // 添加到文档
        document.body.appendChild(panel);
        this.debugPanel = panel;
        
        // 设置控件事件
        document.getElementById('show-hit-areas').addEventListener('change', (e) => {
            this.showHitAreas = e.target.checked;
            drawCIE1931Chart(); // 重绘图表
        });
        
        document.getElementById('tolerance-slider').addEventListener('input', (e) => {
            this.tolerance = parseFloat(e.target.value);
            document.getElementById('tolerance-value').textContent = this.tolerance.toFixed(2);
        });
    },
    
    // 创建坐标显示器
    createCoordDisplay: function() {
        const display = document.createElement('div');
        display.id = 'coord-display';
        Object.assign(display.style, {
            position: 'absolute',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '5px',
            borderRadius: '3px',
            fontSize: '12px',
            zIndex: '1000',
            pointerEvents: 'none',
            display: 'none'
        });
        document.body.appendChild(display);
        this.coordDisplay = display;
    },
    
    // 设置事件监听
    setupEventListeners: function() {
        // 添加快捷键切换调试模式
        document.addEventListener('keydown', (e) => {
            // 按下 Ctrl+D 切换调试面板
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.active = !this.active;
                this.debugPanel.style.display = this.active ? 'block' : 'none';
                if (!this.active) {
                    this.coordDisplay.style.display = 'none';
                }
                drawCIE1931Chart(); // 重绘图表
            }
        });
        
        // 在canvas上添加额外的鼠标移动事件
        canvas.addEventListener('mousemove', (e) => {
            if (!this.active) return;
            
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // 转换为CIE坐标
            const cieCoord = screenToCieCoordinates(mouseX, mouseY);
            
            // 更新坐标显示
            this.updateCoordDisplay(cieCoord, mouseX, mouseY);
            
            // 检测最近的点
            this.checkNearestPoint(cieCoord);
        });
        
        // 在canvas上添加鼠标离开事件
        canvas.addEventListener('mouseleave', () => {
            if (this.coordDisplay) {
                this.coordDisplay.style.display = 'none';
            }
        });
    },
    
    // 更新坐标显示
    updateCoordDisplay: function(cieCoord, mouseX, mouseY) {
        if (!this.coordDisplay) return;
        
        this.coordDisplay.textContent = `x: ${cieCoord.x.toFixed(4)}, y: ${cieCoord.y.toFixed(4)}`;
        this.coordDisplay.style.left = (mouseX + 10) + 'px';
        this.coordDisplay.style.top = (mouseY + 10) + 'px';
        this.coordDisplay.style.display = 'block';
    },
    
    // 检查最近的点
    checkNearestPoint: function(cieCoord) {
        const hitTestPoints = ['red', 'green', 'blue'];
        if (activeMode === 'mode2') hitTestPoints.push('target');
        
        let closestPoint = null;
        let minDistance = Infinity;
        let distances = {};
        
        // 检查每个可拖动的点
        for (const pointName of hitTestPoints) {
            const point = colorPoints[pointName];
            const distance = Math.sqrt(
                Math.pow(cieCoord.x - point.x, 2) + 
                Math.pow(cieCoord.y - point.y, 2)
            );
            
            distances[pointName] = distance;
            
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = pointName;
            }
        }
        
        // 更新信息区域
        const infoArea = document.getElementById('debug-info');
        if (infoArea) {
            let html = '<b>距离信息:</b><br>';
            for (const pointName in distances) {
                const distance = distances[pointName];
                const isClosest = pointName === closestPoint;
                const wouldHit = distance < this.tolerance;
                
                let color = 'white';
                if (isClosest) color = wouldHit ? 'lime' : 'yellow';
                
                html += `<span style="color:${color}">${pointName}: ${distance.toFixed(4)}${wouldHit ? ' ✓' : ''}</span><br>`;
            }
            
            const withinTolerance = minDistance < this.tolerance;
            html += `<br><b>点击结果:</b> ${withinTolerance ? '命中 ' + closestPoint : '无命中'}`;
            
            infoArea.innerHTML = html;
        }
        
        // 更新悬停点
        this.hoverPoint = minDistance < this.tolerance ? closestPoint : null;
        canvas.style.cursor = this.hoverPoint ? 'pointer' : 'default';
    },
    
    // 绘制调试可视化内容
    drawDebugVisuals: function(ctx, boundLeft, boundTop, drawWidth, drawHeight) {
        if (!this.active || !this.showHitAreas) return;
        
        // 创建坐标映射函数
        const mapX = x => boundLeft + x * drawWidth;
        const mapY = y => boundTop + (1 - y) * drawHeight;
        
        // 可视化每个点的点击判定区域
        const hitTestPoints = ['red', 'green', 'blue'];
        if (activeMode === 'mode2') hitTestPoints.push('target');
        
        for (const pointName of hitTestPoints) {
            const point = colorPoints[pointName];
            const x = mapX(point.x);
            const y = mapY(point.y);
            
            // 绘制判定区域边界（一个圆圈表示点击容差范围）
            ctx.beginPath();
            ctx.arc(x, y, this.tolerance * drawWidth, 0, Math.PI * 2);
            
            // 设置样式 - 悬停点使用高亮颜色
            if (this.hoverPoint === pointName) {
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
                ctx.lineWidth = 2/zoomLevel;
            } else {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1/zoomLevel;
            }
            
            ctx.stroke();
        }
    }
};

// 修改findHitPoint函数，使用调试工具的容差值
function findHitPoint(x, y) {
    const hitTestPoints = ['red', 'green', 'blue'];
    if (activeMode === 'mode2') hitTestPoints.push('target');
    
    // 使用调试工具中的容差值
    const tolerance = debugTool.active ? debugTool.tolerance : 0.03;
    let closestPoint = null;
    let minDistance = tolerance;
    
    // 检查每个可拖动的点
    for (const pointName of hitTestPoints) {
        const point = colorPoints[pointName];
        const distance = Math.sqrt(
            Math.pow(x - point.x, 2) + 
            Math.pow(y - point.y, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            closestPoint = pointName;
        }
    }
    
    return closestPoint;
}

// 修改drawCIE1931Chart函数，添加调试可视化调用
// 在原函数最后，ctx.restore()之后，添加以下代码：
/*
// 绘制调试可视化内容
if (typeof debugTool !== 'undefined' && debugTool.active) {
    const boundLeft = centerX - drawWidth/2;
    const boundTop = centerY - drawHeight/2;
    debugTool.drawDebugVisuals(ctx, boundLeft, boundTop, drawWidth, drawHeight);
}
*/

// 页面加载后初始化调试工具
window.addEventListener('load', function() {
    // 确保所有DOM元素都已加载
    setTimeout(() => {
        debugTool.init();
        console.log('调试工具已准备就绪，按Ctrl+D启用');
    }, 500);
}); 