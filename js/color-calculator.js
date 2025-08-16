// 颜色计算核心模块
const ColorCalculator = {
    // 计算RGB混合结果 (模式1)
    calculateMixedColor(colorPoints) {
        try {
            const { red, green, blue } = colorPoints;
            
            // 验证输入
            if (!this.validateColorPoint(red) || !this.validateColorPoint(green) || !this.validateColorPoint(blue)) {
                throw new Error('颜色点参数无效');
            }
            
            // 计算总光通量
            const totalLv = red.lv + green.lv + blue.lv;
            
            if (totalLv === 0) {
                return { x: 0, y: 0, lv: 0 };
            }
            
            // 计算加权平均坐标
            const x = (red.x * red.lv + green.x * green.lv + blue.x * blue.lv) / totalLv;
            const y = (red.y * red.lv + green.y * green.lv + blue.y * blue.lv) / totalLv;
            
            return {
                x: this.roundToPrecision(x, ColorCalculatorConfig.precision.coordinate),
                y: this.roundToPrecision(y, ColorCalculatorConfig.precision.coordinate),
                lv: this.roundToPrecision(totalLv, ColorCalculatorConfig.precision.luminance)
            };
        } catch (error) {
            ErrorHandler.handle(error, 'ColorCalculator.calculateMixedColor');
            return { x: 0, y: 0, lv: 0 };
        }
    },
    
    // 计算达到目标色所需的光通量 (模式2) - 使用正确的XYZ算法
    calculateRequiredLuminance(colorPoints) {
        try {
            const { red, green, blue, target } = colorPoints;
            
            // 验证输入
            if (!this.validateColorPoint(target) || 
                !this.validateColorPoint(red) || 
                !this.validateColorPoint(green) || 
                !this.validateColorPoint(blue)) {
                throw new Error('输入参数无效');
            }
            
            // 使用正确的XYZ空间算法
            const result = XYZCalculator.calculateRequiredLuminanceXYZ(
                { x: red.x, y: red.y },
                { x: green.x, y: green.y },
                { x: blue.x, y: blue.y },
                { x: target.x, y: target.y, Y: target.lv }
            );
            
            if (!result.valid) {
                Logger.warn(`XYZ计算警告: ${result.error}`, 'ColorCalculator');
                if (result.error && result.error.includes('负值')) {
                    throw new Error('目标色不在RGB三角形内，无法通过RGB混合得到');
                }
            }
            
            return {
                red: this.roundToPrecision(result.red, ColorCalculatorConfig.precision.luminance),
                green: this.roundToPrecision(result.green, ColorCalculatorConfig.precision.luminance),
                blue: this.roundToPrecision(result.blue, ColorCalculatorConfig.precision.luminance)
            };
            
        } catch (error) {
            ErrorHandler.handle(error, 'ColorCalculator.calculateRequiredLuminance');
            return { red: 0, green: 0, blue: 0 };
        }
    },
    
    // 计算目标色的最大可达光通量 (模式3)
    calculateMaxLuminance(colorPoints, maxLvValues = null) {
        try {
            const { red, green, blue, target } = colorPoints;
            
            // 验证输入
            if (!this.validateColorPoint(target)) {
                throw new Error('目标色参数无效');
            }
            
            // 检查目标色是否在RGB三角形内
            if (!this.isPointInTriangle(target, red, green, blue)) {
                NotificationSystem.warning('目标色不在RGB三角形内，无法实现');
                return { maxLuminance: 0, ratio: { red: 0, green: 0, blue: 0 } };
            }
            
            // 使用传入的最大光通量值，如果没有则使用配置文件中的默认值
            const maxLv = maxLvValues || ColorCalculatorConfig.slider.maxLvValues;
            
            // 使用线性优化算法替代网格搜索
            return this.optimizeMaxLuminance(red, green, blue, target, maxLv);
            
        } catch (error) {
            ErrorHandler.handle(error, 'ColorCalculator.calculateMaxLuminance');
            return { maxLuminance: 0, ratio: { red: 0, green: 0, blue: 0 } };
        }
    },
    
    // 基于XYZ空间的正确最大光通量计算
    optimizeMaxLuminance(red, green, blue, target, maxLv) {
        try {
            // 使用正确的XYZ空间算法
            const result = XYZCalculator.calculateMaxLuminanceXYZ(
                { x: red.x, y: red.y, maxY: maxLv.red },
                { x: green.x, y: green.y, maxY: maxLv.green },
                { x: blue.x, y: blue.y, maxY: maxLv.blue },
                { x: target.x, y: target.y }
            );
            
            if (result.error) {
                Logger.warn(`XYZ计算警告: ${result.error}`, 'ColorCalculator');
            }
            
            return {
                maxLuminance: this.roundToPrecision(result.maxLuminance, ColorCalculatorConfig.precision.luminance),
                ratio: {
                    red: this.roundToPrecision(result.coefficients.red * maxLv.red, ColorCalculatorConfig.precision.luminance),
                    green: this.roundToPrecision(result.coefficients.green * maxLv.green, ColorCalculatorConfig.precision.luminance),
                    blue: this.roundToPrecision(result.coefficients.blue * maxLv.blue, ColorCalculatorConfig.precision.luminance)
                },
                limitingColor: result.limitingColor
            };
            
        } catch (error) {
            Logger.error(`XYZ计算失败: ${error.message}`, 'ColorCalculator');
            // 返回默认值
            return {
                maxLuminance: 0,
                ratio: { red: 0, green: 0, blue: 0 }
            };
        }
    },
    
    // 线性方程组求解器（高斯消元法）
    solveLinearEquation(A, b) {
        const n = A.length;
        const augmented = A.map((row, i) => [...row, b[i]]);
        
        // 前向消元
        for (let i = 0; i < n; i++) {
            // 寻找主元
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = k;
                }
            }
            
            // 交换行
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
            
            // 检查奇异矩阵
            if (Math.abs(augmented[i][i]) < 1e-12) {
                return null; // 矩阵奇异，无解或无限解
            }
            
            // 消元
            for (let k = i + 1; k < n; k++) {
                const factor = augmented[k][i] / augmented[i][i];
                for (let j = i; j <= n; j++) {
                    augmented[k][j] -= factor * augmented[i][j];
                }
            }
        }
        
        // 回代求解
        const solution = new Array(n);
        for (let i = n - 1; i >= 0; i--) {
            solution[i] = augmented[i][n];
            for (let j = i + 1; j < n; j++) {
                solution[i] -= augmented[i][j] * solution[j];
            }
            solution[i] /= augmented[i][i];
        }
        
        return solution;
    },
    
    // 判断点是否在三角形内
    isPointInTriangle(point, v1, v2, v3) {
        const d1 = this.sign(point, v1, v2);
        const d2 = this.sign(point, v2, v3);
        const d3 = this.sign(point, v3, v1);
        
        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        
        return !(hasNeg && hasPos);
    },
    
    sign(p1, p2, p3) {
        return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    },
    
    // 验证颜色点参数
    validateColorPoint(point) {
        if (!point) {
            console.warn('颜色点为空或未定义');
            return false;
        }
        if (typeof point.x !== 'number' || point.x < 0 || point.x > 1) {
            console.warn(`无效的x坐标: ${point.x} (类型: ${typeof point.x})`);
            return false;
        }
        if (typeof point.y !== 'number' || point.y < 0 || point.y > 1) {
            console.warn(`无效的y坐标: ${point.y} (类型: ${typeof point.y})`);
            return false;
        }
        if (typeof point.lv !== 'number' || point.lv < 0) {
            console.warn(`无效的光通量: ${point.lv} (类型: ${typeof point.lv})`);
            return false;
        }
        return true;
    },
    
    // 数值精度处理
    roundToPrecision(value, precision) {
        const factor = Math.pow(10, precision);
        return Math.round(value * factor) / factor;
    },
    
    // =================== LED BIN色域检测方法 ===================
    
    // 批量检测目标色是否超出LED BIN色域边界
    checkGamutBoundaryForTargets(targetColors) {
        // 检查LED BIN模式是否启用
        if (!LEDBinManager.isLEDBinModeEnabled()) {
            return {
                success: false,
                error: 'LED BIN模式未完全启用，请先为红、绿、蓝三色都选择对应的亮度和色度BIN'
            };
        }
        
        const results = [];
        const gamutInfo = LEDBinManager.getLEDBinStatus();
        
        if (!gamutInfo.allEnabled || !gamutInfo.gamut) {
            return {
                success: false,
                error: 'LED BIN选择不完整，无法确定色域范围'
            };
        }
        
        // 逐个检测目标色
        targetColors.forEach((color, index) => {
            const point = { x: color.x, y: color.y };
            const gamutCheck = LEDBinManager.isPointInMinimumGamut(point);
            
            results.push({
                id: color.id || index,
                name: color.name || `颜色${index + 1}`,
                x: color.x,
                y: color.y,
                inGamut: gamutCheck.inGamut,
                distance: gamutCheck.distance || 0,
                originalData: color
            });
        });
        
        // 统计结果
        const outOfGamutCount = results.filter(r => !r.inGamut).length;
        const totalCount = results.length;
        
        return {
            success: true,
            results: results,
            summary: {
                total: totalCount,
                inGamut: totalCount - outOfGamutCount,
                outOfGamut: outOfGamutCount,
                percentage: totalCount > 0 ? ((totalCount - outOfGamutCount) / totalCount * 100).toFixed(1) : 0
            },
            gamut: gamutInfo.gamut
        };
    },
    
    // 单个目标色的色域检测
    checkSingleColorGamut(colorPoint) {
        if (!LEDBinManager.isLEDBinModeEnabled()) {
            return {
                inGamut: false,
                error: 'LED BIN模式未完全启用'
            };
        }
        
        const point = { x: colorPoint.x, y: colorPoint.y };
        return LEDBinManager.isPointInMinimumGamut(point);
    },
    
    // 获取色域信息摘要
    getGamutSummary() {
        const binStatus = LEDBinManager.getLEDBinStatus();
        
        if (!binStatus.allEnabled) {
            return {
                enabled: false,
                message: 'LED BIN模式未完全启用'
            };
        }
        
        const gamut = binStatus.gamut;
        if (!gamut) {
            return {
                enabled: false,
                message: '无法计算色域范围'
            };
        }
        
        return {
            enabled: true,
            gamut: gamut,
            vertices: {
                red: gamut.red,
                green: gamut.green,
                blue: gamut.blue
            },
            area: gamut.area,
            ledBins: {
                red: binStatus.ledStatus.red,
                green: binStatus.ledStatus.green,
                blue: binStatus.ledStatus.blue
            }
        };
    }
};