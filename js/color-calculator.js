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
    
    // 计算达到目标色所需的光通量 (模式2)
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
            
            // 构建线性方程组 Ax = b
            // x*Lr + xg*Lg + xb*Lb = xt*(Lr + Lg + Lb)
            // yr*Lr + yg*Lg + yb*Lb = yt*(Lr + Lg + Lb)
            // Lr + Lg + Lb = Lt
            
            const A = [
                [red.x - target.x, green.x - target.x, blue.x - target.x],
                [red.y - target.y, green.y - target.y, blue.y - target.y],
                [1, 1, 1]
            ];
            
            const b = [0, 0, target.lv];
            
            const solution = this.solveLinearEquation(A, b);
            
            if (!solution) {
                throw new Error('无法计算所需光通量，请检查目标色是否在RGB三角形内');
            }
            
            return {
                red: Math.max(0, this.roundToPrecision(solution[0], ColorCalculatorConfig.precision.luminance)),
                green: Math.max(0, this.roundToPrecision(solution[1], ColorCalculatorConfig.precision.luminance)),
                blue: Math.max(0, this.roundToPrecision(solution[2], ColorCalculatorConfig.precision.luminance))
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
            let maxLuminance = 0;
            let bestRatio = { red: 0, green: 0, blue: 0 };
            
            // 优化算法：使用网格搜索
            const steps = 20; // 搜索精度
            for (let rStep = 0; rStep <= steps; rStep++) {
                for (let gStep = 0; gStep <= steps; gStep++) {
                    for (let bStep = 0; bStep <= steps; bStep++) {
                        const testRed = { ...red, lv: (rStep / steps) * maxLv.red };
                        const testGreen = { ...green, lv: (gStep / steps) * maxLv.green };
                        const testBlue = { ...blue, lv: (bStep / steps) * maxLv.blue };
                        
                        const mixResult = this.calculateMixedColor({
                            red: testRed,
                            green: testGreen,
                            blue: testBlue
                        });
                        
                        // 检查是否接近目标色
                        const tolerance = 0.01;
                        if (Math.abs(mixResult.x - target.x) < tolerance && 
                            Math.abs(mixResult.y - target.y) < tolerance &&
                            mixResult.lv > maxLuminance) {
                            maxLuminance = mixResult.lv;
                            bestRatio = {
                                red: testRed.lv,
                                green: testGreen.lv,
                                blue: testBlue.lv
                            };
                        }
                    }
                }
            }
            
            return {
                maxLuminance: this.roundToPrecision(maxLuminance, ColorCalculatorConfig.precision.luminance),
                ratio: {
                    red: this.roundToPrecision(bestRatio.red, ColorCalculatorConfig.precision.luminance),
                    green: this.roundToPrecision(bestRatio.green, ColorCalculatorConfig.precision.luminance),
                    blue: this.roundToPrecision(bestRatio.blue, ColorCalculatorConfig.precision.luminance)
                }
            };
        } catch (error) {
            ErrorHandler.handle(error, 'ColorCalculator.calculateMaxLuminance');
            return { maxLuminance: 0, ratio: { red: 0, green: 0, blue: 0 } };
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
            if (Math.abs(augmented[i][i]) < 1e-10) {
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
        return point && 
               typeof point.x === 'number' && point.x >= 0 && point.x <= 1 &&
               typeof point.y === 'number' && point.y >= 0 && point.y <= 1 &&
               typeof point.lv === 'number' && point.lv >= 0;
    },
    
    // 数值精度处理
    roundToPrecision(value, precision) {
        const factor = Math.pow(10, precision);
        return Math.round(value * factor) / factor;
    }
};