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
            
            // 使用线性优化算法替代网格搜索
            return this.optimizeMaxLuminance(red, green, blue, target, maxLv);
            
        } catch (error) {
            ErrorHandler.handle(error, 'ColorCalculator.calculateMaxLuminance');
            return { maxLuminance: 0, ratio: { red: 0, green: 0, blue: 0 } };
        }
    },
    
    // 线性优化算法计算最大光通量
    optimizeMaxLuminance(red, green, blue, target, maxLv) {
        let maxLuminance = 0;
        let bestRatio = { red: 0, green: 0, blue: 0 };
        
        // 使用参数化方法：设Blue为参数t，求解Red和Green
        // 混合色坐标方程：
        // x_t * (Lr + Lg + Lb) = x_r * Lr + x_g * Lg + x_b * Lb
        // y_t * (Lr + Lg + Lb) = y_r * Lr + y_g * Lg + y_b * Lb
        // 
        // 简化为：
        // (x_r - x_t) * Lr + (x_g - x_t) * Lg = (x_t - x_b) * Lb
        // (y_r - y_t) * Lr + (y_g - y_t) * Lg = (y_t - y_b) * Lb
        
        const samples = 2000; // 高精度采样
        
        for (let i = 0; i <= samples; i++) {
            const lb = (i / samples) * maxLv.blue;
            
            // 构建线性方程组求解Lr和Lg
            const A = [
                [red.x - target.x, green.x - target.x],
                [red.y - target.y, green.y - target.y]
            ];
            
            const b = [
                (target.x - blue.x) * lb,
                (target.y - blue.y) * lb
            ];
            
            // 求解2x2线性方程组
            const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
            
            if (Math.abs(det) < 1e-10) {
                continue; // 矩阵奇异，跳过
            }
            
            const lr = (b[0] * A[1][1] - b[1] * A[0][1]) / det;
            const lg = (A[0][0] * b[1] - A[1][0] * b[0]) / det;
            
            // 检查约束条件
            if (lr >= 0 && lr <= maxLv.red && lg >= 0 && lg <= maxLv.green && lb >= 0) {
                const totalLv = lr + lg + lb;
                
                // 验证混合色是否准确匹配目标色
                if (totalLv > 0) {
                    const mixX = (red.x * lr + green.x * lg + blue.x * lb) / totalLv;
                    const mixY = (red.y * lr + green.y * lg + blue.y * lb) / totalLv;
                    
                    const errorX = Math.abs(mixX - target.x);
                    const errorY = Math.abs(mixY - target.y);
                    
                    // 使用更严格的容差
                    if (errorX < 0.001 && errorY < 0.001) {
                        if (totalLv > maxLuminance) {
                            maxLuminance = totalLv;
                            bestRatio = { red: lr, green: lg, blue: lb };
                        }
                    }
                }
            }
        }
        
        // 如果没有找到解，尝试其他参数化方式（Red为参数）
        if (maxLuminance === 0) {
            for (let i = 0; i <= samples; i++) {
                const lr = (i / samples) * maxLv.red;
                
                const A = [
                    [green.x - target.x, blue.x - target.x],
                    [green.y - target.y, blue.y - target.y]
                ];
                
                const b = [
                    (target.x - red.x) * lr,
                    (target.y - red.y) * lr
                ];
                
                const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
                
                if (Math.abs(det) < 1e-10) continue;
                
                const lg = (b[0] * A[1][1] - b[1] * A[0][1]) / det;
                const lb = (A[0][0] * b[1] - A[1][0] * b[0]) / det;
                
                if (lg >= 0 && lg <= maxLv.green && lb >= 0 && lb <= maxLv.blue && lr >= 0) {
                    const totalLv = lr + lg + lb;
                    
                    if (totalLv > 0) {
                        const mixX = (red.x * lr + green.x * lg + blue.x * lb) / totalLv;
                        const mixY = (red.y * lr + green.y * lg + blue.y * lb) / totalLv;
                        
                        const errorX = Math.abs(mixX - target.x);
                        const errorY = Math.abs(mixY - target.y);
                        
                        if (errorX < 0.001 && errorY < 0.001) {
                            if (totalLv > maxLuminance) {
                                maxLuminance = totalLv;
                                bestRatio = { red: lr, green: lg, blue: lb };
                            }
                        }
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
    }
};