// CIE1931 色度图渲染模块
const ChartRenderer = {
    canvas: null,
    ctx: null,
    imageCache: null, // 缓存背景图像
    needsRedraw: true,
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.setupCanvas();
        this.preRenderBackground();
    },
    
    setupCanvas() {
        const config = ColorCalculatorConfig.canvas;
        const scaleFactor = this.getCanvasScaleFactor();
        
        // 设置高DPI支持
        this.canvas.width = config.width * scaleFactor;
        this.canvas.height = config.height * scaleFactor;
        this.canvas.style.width = config.width + 'px';
        this.canvas.style.height = config.height + 'px';
        
        this.ctx.scale(scaleFactor, scaleFactor);
        this.ctx.imageSmoothingEnabled = true;
    },
    
    getCanvasScaleFactor() {
        const dpr = window.devicePixelRatio || 1;
        return Math.min(dpr, 2); // 限制最大缩放倍数
    },
    
    // 预渲染背景（性能优化）
    preRenderBackground() {
        const config = ColorCalculatorConfig.canvas;
        const bgCanvas = document.createElement('canvas');
        const bgCtx = bgCanvas.getContext('2d');
        
        bgCanvas.width = config.width;
        bgCanvas.height = config.height;
        
        // 绘制背景色度图
        this.drawChromaticityBackground(bgCtx, config.width, config.height);
        this.drawSpectralLocus(bgCtx, config.width, config.height);
        this.drawGrid(bgCtx, config.width, config.height);
        
        // 缓存背景图像
        this.imageCache = bgCanvas;
        this.needsRedraw = false;
    },
    
    // 主绘制函数
    draw(colorPoints, activeMode, showGamutBoundaries) {
        const config = ColorCalculatorConfig.canvas;
        
        // 清空画布
        this.ctx.clearRect(0, 0, config.width, config.height);
        
        // 绘制缓存的背景
        if (this.imageCache) {
            this.ctx.drawImage(this.imageCache, 0, 0);
        }
        
        // 绘制色域边界
        if (showGamutBoundaries) {
            this.drawColorSpaceBoundaries();
        }
        
        // 绘制颜色点和连线
        this.drawColorPoints(colorPoints, activeMode);
        this.drawConnections(colorPoints, activeMode);
        
        // 绘制调试信息（如果启用）
        if (typeof debugTool !== 'undefined' && debugTool.active) {
            debugTool.drawDebugVisuals(this.ctx, 0, 0, config.width, config.height);
        }
    },
    
    // 绘制色度图背景色彩
    drawChromaticityBackground(ctx, width, height) {
        const resolution = 100; // 降低分辨率提高性能
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y += Math.ceil(height / resolution)) {
            for (let x = 0; x < width; x += Math.ceil(width / resolution)) {
                const cieCoords = this.screenToCieCoordinates(x, y, width, height);
                
                if (this.isInsideSpectralLocus(cieCoords)) {
                    const rgb = this.xyToRGB(cieCoords.x, cieCoords.y);
                    const pixelIndex = (y * width + x) * 4;
                    
                    // 填充周围像素（降低分辨率的补偿）
                    const blockSize = Math.ceil(width / resolution);
                    for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
                        for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
                            const idx = ((y + dy) * width + (x + dx)) * 4;
                            if (idx < data.length) {
                                data[idx] = rgb.r;
                                data[idx + 1] = rgb.g;
                                data[idx + 2] = rgb.b;
                                data[idx + 3] = 255;
                            }
                        }
                    }
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    },
    
    // 绘制光谱轨迹
    drawSpectralLocus(ctx, width, height) {
        const locus = ColorCalculatorConfig.spectralLocus;
        
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = ColorCalculatorConfig.ui.lineWidth;
        
        locus.forEach((point, index) => {
            const screenCoords = this.cieToScreenCoordinates(point.x, point.y, width, height);
            if (index === 0) {
                ctx.moveTo(screenCoords.x, screenCoords.y);
            } else {
                ctx.lineTo(screenCoords.x, screenCoords.y);
            }
        });
        
        // 连接首尾形成封闭图形
        const firstPoint = locus[0];
        const lastPoint = locus[locus.length - 1];
        const firstScreen = this.cieToScreenCoordinates(firstPoint.x, firstPoint.y, width, height);
        ctx.lineTo(firstScreen.x, firstScreen.y);
        
        ctx.stroke();
    },
    
    // 绘制网格
    drawGrid(ctx, width, height) {
        ctx.strokeStyle = `rgba(0, 0, 0, ${ColorCalculatorConfig.ui.gridAlpha})`;
        ctx.lineWidth = 0.5;
        
        const gridSpacing = 0.1;
        
        // 垂直线
        for (let x = 0; x <= 0.8; x += gridSpacing) {
            const startScreen = this.cieToScreenCoordinates(x, 0, width, height);
            const endScreen = this.cieToScreenCoordinates(x, 0.9, width, height);
            
            ctx.beginPath();
            ctx.moveTo(startScreen.x, startScreen.y);
            ctx.lineTo(endScreen.x, endScreen.y);
            ctx.stroke();
        }
        
        // 水平线
        for (let y = 0; y <= 0.9; y += gridSpacing) {
            const startScreen = this.cieToScreenCoordinates(0, y, width, height);
            const endScreen = this.cieToScreenCoordinates(0.8, y, width, height);
            
            ctx.beginPath();
            ctx.moveTo(startScreen.x, startScreen.y);
            ctx.lineTo(endScreen.x, endScreen.y);
            ctx.stroke();
        }
    },
    
    // 绘制色域边界
    drawColorSpaceBoundaries() {
        if (!ColorCalculatorConfig.ui.showGamutBoundaries) return;
        
        const colorSpaces = ColorCalculatorConfig.colorSpaces;
        
        // 绘制 sRGB 色域
        this.drawTriangle(colorSpaces.srgb, '#0066cc', 'sRGB');
        
        // 绘制 NTSC 色域
        this.drawTriangle(colorSpaces.ntsc, '#cc0066', 'NTSC');
    },
    
    drawTriangle(colorSpace, color, label) {
        const config = ColorCalculatorConfig.canvas;
        const { red, green, blue } = colorSpace;
        
        // 转换为屏幕坐标
        const redScreen = this.cieToScreenCoordinates(red.x, red.y, config.width, config.height);
        const greenScreen = this.cieToScreenCoordinates(green.x, green.y, config.width, config.height);
        const blueScreen = this.cieToScreenCoordinates(blue.x, blue.y, config.width, config.height);
        
        // 绘制三角形
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.moveTo(redScreen.x, redScreen.y);
        this.ctx.lineTo(greenScreen.x, greenScreen.y);
        this.ctx.lineTo(blueScreen.x, blueScreen.y);
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.setLineDash([]); // 重置线型
        
        // 绘制标签
        const centerX = (redScreen.x + greenScreen.x + blueScreen.x) / 3;
        const centerY = (redScreen.y + greenScreen.y + blueScreen.y) / 3;
        
        this.ctx.fillStyle = color;
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, centerX, centerY);
    },
    
    // 绘制颜色点
    drawColorPoints(colorPoints, activeMode) {
        const config = ColorCalculatorConfig;
        
        // 绘制RGB三基色点
        this.drawPoint(colorPoints.red, '#FF0000', 'R');
        this.drawPoint(colorPoints.green, '#00FF00', 'G');
        this.drawPoint(colorPoints.blue, '#0000FF', 'B');
        
        // 根据模式绘制其他点
        if (activeMode === 'mode1') {
            this.drawPoint(colorPoints.mix, '#FF00FF', 'Mix');
        } else if (activeMode === 'mode2' || activeMode === 'mode3') {
            this.drawPoint(colorPoints.target, '#FFA500', 'Target');
        }
    },
    
    drawPoint(point, color, label) {
        const config = ColorCalculatorConfig.canvas;
        const screenCoords = this.cieToScreenCoordinates(point.x, point.y, config.width, config.height);
        
        // 绘制点
        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        this.ctx.arc(screenCoords.x, screenCoords.y, ColorCalculatorConfig.ui.pointRadius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 绘制边框
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.arc(screenCoords.x, screenCoords.y, ColorCalculatorConfig.ui.pointRadius, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // 绘制标签
        this.ctx.fillStyle = '#000';
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, screenCoords.x, screenCoords.y - 15);
    },
    
    // 绘制连接线
    drawConnections(colorPoints, activeMode) {
        if (activeMode !== 'mode1') return;
        
        const config = ColorCalculatorConfig.canvas;
        
        // 绘制RGB三角形
        const redScreen = this.cieToScreenCoordinates(colorPoints.red.x, colorPoints.red.y, config.width, config.height);
        const greenScreen = this.cieToScreenCoordinates(colorPoints.green.x, colorPoints.green.y, config.width, config.height);
        const blueScreen = this.cieToScreenCoordinates(colorPoints.blue.x, colorPoints.blue.y, config.width, config.height);
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
        this.ctx.lineWidth = 1;
        
        this.ctx.moveTo(redScreen.x, redScreen.y);
        this.ctx.lineTo(greenScreen.x, greenScreen.y);
        this.ctx.lineTo(blueScreen.x, blueScreen.y);
        this.ctx.closePath();
        this.ctx.stroke();
    },
    
    // 坐标转换函数
    cieToScreenCoordinates(cieX, cieY, canvasWidth, canvasHeight) {
        const margin = 50;
        const drawWidth = canvasWidth - 2 * margin;
        const drawHeight = canvasHeight - 2 * margin;
        
        return {
            x: margin + cieX * drawWidth,
            y: canvasHeight - margin - cieY * drawHeight
        };
    },
    
    screenToCieCoordinates(screenX, screenY, canvasWidth, canvasHeight) {
        const margin = 50;
        const drawWidth = canvasWidth - 2 * margin;
        const drawHeight = canvasHeight - 2 * margin;
        
        return {
            x: (screenX - margin) / drawWidth,
            y: (canvasHeight - margin - screenY) / drawHeight
        };
    },
    
    // 检查点是否在光谱轨迹内
    isInsideSpectralLocus(point) {
        // 使用射线法判断点是否在多边形内
        const locus = ColorCalculatorConfig.spectralLocus;
        let inside = false;
        
        for (let i = 0, j = locus.length - 1; i < locus.length; j = i++) {
            if (((locus[i].y > point.y) !== (locus[j].y > point.y)) &&
                (point.x < (locus[j].x - locus[i].x) * (point.y - locus[i].y) / (locus[j].y - locus[i].y) + locus[i].x)) {
                inside = !inside;
            }
        }
        
        return inside;
    },
    
    // CIE xy 到 RGB 的近似转换（用于背景着色）
    xyToRGB(x, y) {
        // 这是一个简化的转换，仅用于显示目的
        const z = 1 - x - y;
        
        // XYZ to RGB (simplified sRGB matrix)
        let r = 3.2406 * x - 1.5372 * y - 0.4986 * z;
        let g = -0.9689 * x + 1.8758 * y + 0.0415 * z;
        let b = 0.0557 * x - 0.2040 * y + 1.0570 * z;
        
        // Gamma correction
        r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r;
        g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g;
        b = b > 0.0031308 ? 1.055 * Math.pow(b, 1/2.4) - 0.055 : 12.92 * b;
        
        return {
            r: Math.max(0, Math.min(255, Math.round(r * 255))),
            g: Math.max(0, Math.min(255, Math.round(g * 255))),
            b: Math.max(0, Math.min(255, Math.round(b * 255)))
        };
    },
    
    // 强制重新绘制背景（当配置改变时调用）
    invalidateCache() {
        this.needsRedraw = true;
        this.preRenderBackground();
    }
};