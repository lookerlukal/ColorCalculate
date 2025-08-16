// CIE1931 色度图渲染模块
const ChartRenderer = {
    canvas: null,
    ctx: null,
    imageCache: null, // 缓存背景图像
    needsRedraw: true,
    
    // 缩放和平移相关
    transform: {
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        minScale: 0.5,
        maxScale: 5.0
    },
    
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
    draw(colorPoints, activeMode, showSRGBGamut, showNTSCGamut, showLEDBinGamut, showPreciseGamut) {
        const config = ColorCalculatorConfig.canvas;
        
        // 清空画布
        this.ctx.clearRect(0, 0, config.width, config.height);
        
        // 应用变换
        this.ctx.save();
        this.ctx.translate(config.width / 2 + this.transform.offsetX, config.height / 2 + this.transform.offsetY);
        this.ctx.scale(this.transform.scale, this.transform.scale);
        this.ctx.translate(-config.width / 2, -config.height / 2);
        
        // 绘制缓存的背景
        if (this.imageCache) {
            this.ctx.drawImage(this.imageCache, 0, 0);
        }
        
        // 绘制色域边界
        this.drawColorSpaceBoundaries(showSRGBGamut, showNTSCGamut, showLEDBinGamut, showPreciseGamut);
        
        // 绘制LED BIN区域
        if (typeof LEDBinManager !== 'undefined' && ColorCalculatorConfig.ledBin.display.showBinAreas) {
            this.drawLEDBinAreas();
        }
        
        // 绘制颜色点和连线
        this.drawColorPoints(colorPoints, activeMode);
        this.drawConnections(colorPoints, activeMode);
        
        // 绘制调试信息（如果启用）
        if (typeof debugTool !== 'undefined' && debugTool.active) {
            debugTool.drawDebugVisuals(this.ctx, 0, 0, config.width, config.height);
        }
        
        // 恢复变换
        this.ctx.restore();
        
        // 绘制缩放信息
        this.drawZoomInfo();
    },
    
    // 绘制色度图背景色彩
    drawChromaticityBackground(ctx, width, height) {
        const resolution = 300; // 提高分辨率减少锯齿
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        // 使用更精细的采样来减少锯齿
        const stepY = height / resolution;
        const stepX = width / resolution;
        
        for (let y = 0; y < height; y += stepY) {
            for (let x = 0; x < width; x += stepX) {
                const actualY = Math.floor(y);
                const actualX = Math.floor(x);
                const cieCoords = this.screenToCieCoordinates(actualX, actualY, width, height);
                
                if (this.isInsideSpectralLocus(cieCoords)) {
                    const rgb = this.xyToRGB(cieCoords.x, cieCoords.y);
                    
                    // 使用双线性插值填充像素块以减少锯齿
                    const blockSizeX = Math.ceil(stepX);
                    const blockSizeY = Math.ceil(stepY);
                    
                    for (let dy = 0; dy < blockSizeY && actualY + dy < height; dy++) {
                        for (let dx = 0; dx < blockSizeX && actualX + dx < width; dx++) {
                            const idx = ((actualY + dy) * width + (actualX + dx)) * 4;
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
    
    // 绘制网格和坐标轴
    drawGrid(ctx, width, height) {
        ctx.strokeStyle = `rgba(0, 0, 0, ${ColorCalculatorConfig.ui.gridAlpha})`;
        ctx.lineWidth = 0.5;
        
        const gridSpacing = 0.1;
        const maxCoord = 0.9; // 统一最大坐标范围
        
        // 垂直线和x轴标注
        for (let x = 0; x <= maxCoord; x += gridSpacing) {
            const startScreen = this.cieToScreenCoordinates(x, 0, width, height);
            const endScreen = this.cieToScreenCoordinates(x, maxCoord, width, height);
            
            ctx.beginPath();
            ctx.moveTo(startScreen.x, startScreen.y);
            ctx.lineTo(endScreen.x, endScreen.y);
            ctx.stroke();
            
            // 绘制x轴标注（每0.1一个刻度）
            ctx.fillStyle = '#000';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(x.toFixed(1), startScreen.x, startScreen.y + 15);
        }
        
        // 水平线和y轴标注
        for (let y = 0; y <= maxCoord; y += gridSpacing) {
            const startScreen = this.cieToScreenCoordinates(0, y, width, height);
            const endScreen = this.cieToScreenCoordinates(maxCoord, y, width, height);
            
            ctx.beginPath();
            ctx.moveTo(startScreen.x, startScreen.y);
            ctx.lineTo(endScreen.x, endScreen.y);
            ctx.stroke();
            
            // 绘制y轴标注（每0.1一个刻度）
            ctx.fillStyle = '#000';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(y.toFixed(1), startScreen.x - 5, startScreen.y + 3);
        }
        
        // 绘制坐标轴标签
        ctx.fillStyle = '#000';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        const xAxisLabelPos = this.cieToScreenCoordinates(maxCoord / 2, 0, width, height);
        ctx.fillText('x', xAxisLabelPos.x, xAxisLabelPos.y + 35);
        
        ctx.save();
        const yAxisLabelPos = this.cieToScreenCoordinates(0, maxCoord / 2, width, height);
        ctx.translate(15, yAxisLabelPos.y);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('y', 0, 0);
        ctx.restore();
    },
    
    // 绘制色域边界
    drawColorSpaceBoundaries(showSRGBGamut, showNTSCGamut, showLEDBinGamut, showPreciseGamut) {
        const colorSpaces = ColorCalculatorConfig.colorSpaces;
        
        // 绘制 sRGB 色域
        if (showSRGBGamut) {
            this.drawTriangle(colorSpaces.srgb, '#0066cc', 'sRGB');
        }
        
        // 绘制 NTSC 色域
        if (showNTSCGamut) {
            this.drawTriangle(colorSpaces.ntsc, '#cc0066', 'NTSC');
        }
        
        // 绘制LED BIN最小色域
        if (showLEDBinGamut) {
            this.drawLEDBinMinimumGamut();
        }
        
        // 绘制精确交集色域
        if (showPreciseGamut) {
            this.drawPreciseIntersectionGamut();
        }
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
        
        // 绘制Excel导入的数据点（在主要点之前绘制，作为背景）
        if (activeMode === 'mode4' || (typeof ExcelLoader !== 'undefined' && ExcelLoader.isDataLoaded)) {
            this.drawExcelDataPoints();
        }
        
        // 绘制RGB三基色点
        this.drawPoint(colorPoints.red, '#FF0000', 'R');
        this.drawPoint(colorPoints.green, '#00FF00', 'G');
        this.drawPoint(colorPoints.blue, '#0000FF', 'B');
        
        // 根据模式绘制其他点
        if (activeMode === 'mode1') {
            this.drawPoint(colorPoints.mix, '#FF00FF', 'Mix');
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
        const maxCoord = 0.9; // CIE图的最大坐标范围
        // 使用最小的边作为绘制区域，确保x和y轴等比例
        const minDimension = Math.min(canvasWidth, canvasHeight) - 2 * margin;
        
        return {
            x: margin + (cieX / maxCoord) * minDimension,
            y: canvasHeight - margin - (cieY / maxCoord) * minDimension
        };
    },
    
    screenToCieCoordinates(screenX, screenY, canvasWidth, canvasHeight) {
        const margin = 50;
        const maxCoord = 0.9; // CIE图的最大坐标范围
        // 使用最小的边作为绘制区域，确保x和y轴等比例
        const minDimension = Math.min(canvasWidth, canvasHeight) - 2 * margin;
        
        return {
            x: ((screenX - margin) / minDimension) * maxCoord,
            y: ((canvasHeight - margin - screenY) / minDimension) * maxCoord
        };
    },
    
    // 考虑变换的坐标转换函数
    transformedScreenToCieCoordinates(screenX, screenY, canvasWidth, canvasHeight) {
        // 考虑canvas的transform状态，先将鼠标坐标转换为canvas内部坐标
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        // 反向应用偏移
        const offsetAdjustedX = screenX - this.transform.offsetX;
        const offsetAdjustedY = screenY - this.transform.offsetY;
        
        // 相对于中心点的坐标
        const relativeX = offsetAdjustedX - centerX;
        const relativeY = offsetAdjustedY - centerY;
        
        // 反向缩放
        const unscaledX = relativeX / this.transform.scale + centerX;
        const unscaledY = relativeY / this.transform.scale + centerY;
        
        // 转换为CIE坐标
        return this.screenToCieCoordinates(unscaledX, unscaledY, canvasWidth, canvasHeight);
    },
    
    // 考虑变换的CIE到屏幕坐标转换
    transformedCieToScreenCoordinates(cieX, cieY, canvasWidth, canvasHeight) {
        // 首先转换为基础屏幕坐标
        const baseScreen = this.cieToScreenCoordinates(cieX, cieY, canvasWidth, canvasHeight);
        
        // 应用变换
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        // 相对于中心点的坐标
        const relativeX = baseScreen.x - centerX;
        const relativeY = baseScreen.y - centerY;
        
        // 缩放
        const scaledX = relativeX * this.transform.scale;
        const scaledY = relativeY * this.transform.scale;
        
        // 加上偏移和中心点
        return {
            x: scaledX + centerX + this.transform.offsetX,
            y: scaledY + centerY + this.transform.offsetY
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
    
    // 调试信息绘制
    drawDebugInfo(mouseX, mouseY) {
        const ctx = this.ctx;
        ctx.save();
        
        // 绘制鼠标位置十字线
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(mouseX - 10, mouseY);
        ctx.lineTo(mouseX + 10, mouseY);
        ctx.moveTo(mouseX, mouseY - 10);
        ctx.lineTo(mouseX, mouseY + 10);
        ctx.stroke();
        
        // 显示坐标信息
        ctx.fillStyle = 'black';
        ctx.font = '12px monospace';
        ctx.fillRect(mouseX + 15, mouseY - 20, 200, 15);
        ctx.fillStyle = 'white';
        ctx.fillText(`Mouse: (${mouseX.toFixed(0)}, ${mouseY.toFixed(0)})`, mouseX + 16, mouseY - 8);
        
        // 显示DPI和缩放信息在左上角
        const infoY = 20;
        ctx.fillStyle = 'black';
        ctx.fillRect(8, 8, 300, 80);
        ctx.fillStyle = 'white';
        ctx.fillText(`DPR: ${window.devicePixelRatio}`, 10, infoY);
        ctx.fillText(`Scale: ${this.transform.scale.toFixed(2)}`, 10, infoY + 15);
        ctx.fillText(`Canvas: ${this.canvas.width}x${this.canvas.height}`, 10, infoY + 30);
        ctx.fillText(`CSS: ${this.canvas.style.width}x${this.canvas.style.height}`, 10, infoY + 45);
        ctx.fillText(`Offset: ${this.transform.offsetX.toFixed(0)}, ${this.transform.offsetY.toFixed(0)}`, 10, infoY + 60);
        
        ctx.restore();
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
    
    // 绘制缩放信息
    drawZoomInfo() {
        if (this.transform.scale === 1.0 && this.transform.offsetX === 0 && this.transform.offsetY === 0) {
            return; // 默认状态不显示
        }
        
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'left';
        
        const info = `缩放: ${(this.transform.scale * 100).toFixed(0)}%`;
        const textWidth = this.ctx.measureText(info).width;
        
        // 绘制背景
        this.ctx.fillRect(10, 10, textWidth + 20, 25);
        
        // 绘制文字
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(info, 20, 27);
        
        this.ctx.restore();
    },
    
    // 重置缩放和平移
    resetTransform() {
        this.transform.scale = 1.0;
        this.transform.offsetX = 0;
        this.transform.offsetY = 0;
        Logger.info('重置缩放和平移', 'ChartRenderer');
    },
    
    // 强制重新绘制背景（当配置改变时调用）
    invalidateCache() {
        this.needsRedraw = true;
        this.preRenderBackground();
    },
    
    // 绘制Excel导入的数据点
    drawExcelDataPoints() {
        if (typeof ExcelLoader === 'undefined' || !ExcelLoader.isDataLoaded) {
            return;
        }
        
        const visibleColors = ExcelLoader.getVisibleColors();
        const highlightedColors = ExcelLoader.getHighlightedColors();
        
        // 批量绘制普通数据点
        this.ctx.save();
        
        // 普通点的样式
        const normalRadius = ColorCalculatorConfig.colorPoints.normal.radius;
        const highlightRadius = ColorCalculatorConfig.colorPoints.highlighted.radius;
        
        // 绘制普通可见点
        visibleColors.forEach(color => {
            if (!color.highlighted) {
                this.drawExcelDataPoint(color, normalRadius, false);
            }
        });
        
        // 绘制所有高亮点（在最上层）
        highlightedColors.forEach(color => {
            this.drawExcelDataPoint(color, highlightRadius, true);
        });
        
        this.ctx.restore();
    },
    
    // 绘制单个Excel数据点
    drawExcelDataPoint(colorData, radius, isHighlighted) {
        const config = ColorCalculatorConfig.canvas;
        const screenCoords = this.cieToScreenCoordinates(colorData.x, colorData.y, config.width, config.height);
        
        // 检查点是否在可见区域内
        if (screenCoords.x < 0 || screenCoords.x > config.width || 
            screenCoords.y < 0 || screenCoords.y > config.height) {
            return;
        }
        
        this.ctx.save();
        
        if (isHighlighted) {
            // 高亮点样式
            // 绘制光晕效果
            const glowRadius = ColorCalculatorConfig.colorPoints.highlighted.glowRadius;
            const gradient = this.ctx.createRadialGradient(
                screenCoords.x, screenCoords.y, 0,
                screenCoords.x, screenCoords.y, radius + glowRadius
            );
            gradient.addColorStop(0, ColorCalculatorConfig.colorPoints.highlighted.glowColor);
            gradient.addColorStop(0.7, 'rgba(255, 255, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(screenCoords.x, screenCoords.y, radius + glowRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // 绘制高亮点
            this.ctx.fillStyle = ColorCalculatorConfig.colorPoints.highlighted.fillColor;
            this.ctx.beginPath();
            this.ctx.arc(screenCoords.x, screenCoords.y, radius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // 绘制边框
            this.ctx.strokeStyle = ColorCalculatorConfig.colorPoints.highlighted.strokeColor;
            this.ctx.lineWidth = ColorCalculatorConfig.colorPoints.highlighted.strokeWidth;
            this.ctx.beginPath();
            this.ctx.arc(screenCoords.x, screenCoords.y, radius, 0, 2 * Math.PI);
            this.ctx.stroke();
            
            // 绘制标签
            this.ctx.fillStyle = '#000';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText(colorData.name, screenCoords.x, screenCoords.y - radius - 8);
            
            // 绘制坐标信息
            this.ctx.font = '10px Arial';
            this.ctx.fillText(
                `(${PrecisionFormatter.formatValue(colorData.x, 'coordinate')}, ${PrecisionFormatter.formatValue(colorData.y, 'coordinate')})`, 
                screenCoords.x, 
                screenCoords.y + radius + 15
            );
        } else {
            // 普通点样式
            // 根据色坐标计算颜色
            const rgb = this.xyToRGB(colorData.x, colorData.y);
            const pointColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            
            // 绘制点
            this.ctx.fillStyle = pointColor;
            this.ctx.beginPath();
            this.ctx.arc(screenCoords.x, screenCoords.y, radius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // 绘制边框
            this.ctx.strokeStyle = ColorCalculatorConfig.colorPoints.normal.strokeColor;
            this.ctx.lineWidth = ColorCalculatorConfig.colorPoints.normal.strokeWidth;
            this.ctx.beginPath();
            this.ctx.arc(screenCoords.x, screenCoords.y, radius, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    },
    
    // 查找鼠标位置附近的Excel数据点
    findExcelDataPointAt(screenX, screenY, tolerance = ColorCalculatorConfig.colorPoints.clickTolerance) {
        if (typeof ExcelLoader === 'undefined' || !ExcelLoader.isDataLoaded) {
            return null;
        }
        
        const config = ColorCalculatorConfig.canvas;
        const visibleColors = ExcelLoader.getVisibleColors();
        
        for (const color of visibleColors) {
            const screenCoords = this.cieToScreenCoordinates(color.x, color.y, config.width, config.height);
            const distance = Math.sqrt(
                Math.pow(screenX - screenCoords.x, 2) + 
                Math.pow(screenY - screenCoords.y, 2)
            );
            
            if (distance <= tolerance) {
                return color;
            }
        }
        
        return null;
    },
    
    // 获取Excel数据点的悬停信息
    getExcelDataPointTooltip(colorData) {
        return {
            title: colorData.name,
            lines: [
                `ID: ${colorData.id}`,
                `X: ${PrecisionFormatter.formatValue(colorData.x, 'coordinate')}`,
                `Y: ${PrecisionFormatter.formatValue(colorData.y, 'coordinate')}`,
                '点击高亮显示'
            ]
        };
    },
    
    // =================== LED BIN区域绘制方法 ===================
    
    // 绘制所有LED BIN区域
    drawLEDBinAreas() {
        const colors = ['red', 'green', 'blue'];
        
        colors.forEach(color => {
            const selection = LEDBinManager.getSelection(color);
            if (selection.colorBin) {
                this.drawColorBin(color, selection.colorBin, true); // 选中的BIN高亮显示
            }
        });
    },
    
    // 绘制单个色度BIN区域
    drawColorBin(color, binId, isSelected = false) {
        const coords = LEDBinManager.getColorBinCoordinates(color, binId);
        if (!coords || coords.length < 3) return;
        
        const config = ColorCalculatorConfig.canvas;
        const ledConfig = ColorCalculatorConfig.ledBin.colors;
        
        // 获取样式配置
        const style = isSelected ? ledConfig.selected : ledConfig[color];
        
        // 转换为屏幕坐标
        const screenCoords = coords.map(point => 
            this.cieToScreenCoordinates(point.x, point.y, config.width, config.height)
        );
        
        // 绘制填充区域
        this.ctx.beginPath();
        this.ctx.moveTo(screenCoords[0].x, screenCoords[0].y);
        for (let i = 1; i < screenCoords.length; i++) {
            this.ctx.lineTo(screenCoords[i].x, screenCoords[i].y);
        }
        this.ctx.closePath();
        
        // 设置填充样式
        this.ctx.fillStyle = style.fill;
        this.ctx.fill();
        
        // 设置边框样式
        this.ctx.strokeStyle = style.stroke;
        this.ctx.lineWidth = style.strokeWidth;
        this.ctx.setLineDash([]); // 实线
        
        // 添加阴影效果（仅对选中的BIN）
        if (isSelected && style.shadowBlur) {
            this.ctx.shadowBlur = style.shadowBlur;
            this.ctx.shadowColor = style.shadowColor;
        }
        
        this.ctx.stroke();
        
        // 重置阴影
        this.ctx.shadowBlur = 0;
        
        // 绘制BIN标签
        if (ColorCalculatorConfig.ledBin.display.showBinLabels) {
            this.drawBinLabel(screenCoords, binId, color, isSelected);
        }
    },
    
    // 绘制BIN标签
    drawBinLabel(screenCoords, binId, color, isSelected) {
        // 计算标签位置（多边形中心）
        const centerX = screenCoords.reduce((sum, coord) => sum + coord.x, 0) / screenCoords.length;
        const centerY = screenCoords.reduce((sum, coord) => sum + coord.y, 0) / screenCoords.length;
        
        // 设置文本样式
        this.ctx.font = isSelected ? 'bold 11px Arial' : '10px Arial';
        this.ctx.fillStyle = isSelected ? '#FFD700' : '#333333';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 添加文本阴影增强可读性
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 2;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        // 绘制标签
        this.ctx.fillText(binId, centerX, centerY);
        
        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    },
    
    // 根据颜色获取所有BIN区域（用于悬停检测等）
    getAllBinAreasForColor(color) {
        const binList = LEDBinManager.getColorBinList(color);
        return binList.map(binId => ({
            binId: binId,
            coordinates: LEDBinManager.getColorBinCoordinates(color, binId),
            color: color
        }));
    },
    
    // 检测鼠标点击是否在某个BIN区域内
    getBinAtPosition(screenX, screenY) {
        const config = ColorCalculatorConfig.canvas;
        const cieCoords = this.screenToCieCoordinates(screenX, screenY, config.width, config.height);
        
        const colors = ['red', 'green', 'blue'];
        
        for (const color of colors) {
            const binList = LEDBinManager.getColorBinList(color);
            for (const binId of binList) {
                if (LEDBinManager.isPointInBin(color, binId, cieCoords.x, cieCoords.y)) {
                    return { color, binId };
                }
            }
        }
        
        return null;
    },
    
    // 高亮显示特定的BIN区域
    highlightBin(color, binId) {
        // 重新绘制图表
        if (typeof ColorCalculatorApp !== 'undefined' && ColorCalculatorApp.updateDisplay) {
            ColorCalculatorApp.updateDisplay();
        }
        
        // 额外绘制高亮效果
        this.drawColorBin(color, binId, true);
    },
    
    // 清除BIN高亮
    clearBinHighlight() {
        // 重新绘制图表以清除高亮
        if (typeof ColorCalculatorApp !== 'undefined' && ColorCalculatorApp.updateDisplay) {
            ColorCalculatorApp.updateDisplay();
        }
    },
    
    // 绘制LED BIN最小色域
    drawLEDBinMinimumGamut() {
        if (typeof LEDBinManager === 'undefined') return;
        
        // 获取LED BIN的最小色域
        const minimumGamut = LEDBinManager.getMinimumGamut();
        if (!minimumGamut) return;
        
        // 构造色域对象，与sRGB、NTSC格式保持一致
        const gamutColorSpace = {
            red: minimumGamut.red,
            green: minimumGamut.green,
            blue: minimumGamut.blue
        };
        
        // 使用和sRGB相同的绘制方法，但采用不同的颜色和标签
        this.drawTriangle(gamutColorSpace, '#FF6600', 'LED BIN');
    },
    
    // 绘制精确交集色域
    drawPreciseIntersectionGamut() {
        if (typeof LEDBinManager === 'undefined') return;
        
        try {
            // 计算精确交集多边形
            const precisePolygon = LEDBinManager.calculatePreciseIntersectionPolygon();
            if (!precisePolygon || precisePolygon.length < 3) {
                console.warn('精确交集多边形计算失败或结果无效');
                return;
            }
            
            this.drawPolygon(precisePolygon, '#9900CC', '精确交集');
        } catch (error) {
            console.error('绘制精确交集色域时出错:', error);
        }
    },
    
    // 绘制多边形
    drawPolygon(polygon, color, label) {
        if (!polygon || polygon.length < 3) return;
        
        const config = ColorCalculatorConfig.canvas;
        
        // 转换为屏幕坐标
        const screenPoints = polygon.map(point => 
            this.cieToScreenCoordinates(point.x, point.y, config.width, config.height)
        );
        
        // 绘制多边形
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([]); // 实线
        
        // 移动到第一个点
        this.ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
        
        // 连接所有点
        for (let i = 1; i < screenPoints.length; i++) {
            this.ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
        }
        
        // 闭合路径
        this.ctx.closePath();
        this.ctx.stroke();
        
        // 可选：绘制标签
        if (label && screenPoints.length > 0) {
            // 计算多边形中心点用于放置标签
            const centerX = screenPoints.reduce((sum, p) => sum + p.x, 0) / screenPoints.length;
            const centerY = screenPoints.reduce((sum, p) => sum + p.y, 0) / screenPoints.length;
            
            this.ctx.save();
            this.ctx.fillStyle = color;
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(label, centerX, centerY);
            this.ctx.restore();
        }
    }
};