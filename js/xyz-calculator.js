/**
 * XYZ色彩空间计算模块
 * 实现基于CIE XYZ三刺激值的正确颜色混合计算
 */

const XYZCalculator = {
    
    /**
     * 将色坐标(x,y)和光通量Y转换为三刺激值(X,Y,Z)
     * @param {number} x - CIE x坐标
     * @param {number} y - CIE y坐标  
     * @param {number} Y - 光通量(三刺激值Y)
     * @returns {object} {X, Y, Z} 三刺激值
     */
    xyToXYZ(x, y, Y) {
        if (y <= 0) {
            throw new Error('y坐标不能为0或负数');
        }
        
        const X = (x / y) * Y;
        const Z = ((1 - x - y) / y) * Y;
        
        return { X, Y, Z };
    },
    
    /**
     * 将三刺激值(X,Y,Z)转换为色坐标(x,y)
     * @param {number} X - X三刺激值
     * @param {number} Y - Y三刺激值  
     * @param {number} Z - Z三刺激值
     * @returns {object} {x, y} 色坐标
     */
    XYZToXy(X, Y, Z) {
        const total = X + Y + Z;
        if (total <= 0) {
            throw new Error('三刺激值总和不能为0或负数');
        }
        
        const x = X / total;
        const y = Y / total;
        
        return { x, y };
    },
    
    /**
     * 基于XYZ空间的最大光通量计算（正确算法）
     * @param {object} red - 红色基色 {x, y, maxY}
     * @param {object} green - 绿色基色 {x, y, maxY}  
     * @param {object} blue - 蓝色基色 {x, y, maxY}
     * @param {object} target - 目标色 {x, y}
     * @returns {object} {maxLuminance, coefficients, limitingColor}
     */
    calculateMaxLuminanceXYZ(red, green, blue, target) {
        try {
            // 第一步：转换基色到XYZ空间（使用最大光通量）
            const redXYZ = this.xyToXYZ(red.x, red.y, red.maxY);
            const greenXYZ = this.xyToXYZ(green.x, green.y, green.maxY);
            const blueXYZ = this.xyToXYZ(blue.x, blue.y, blue.maxY);
            
            // 第二步：建立约束方程组
            // 混合后: X_mix = cR*X_R + cG*X_G + cB*X_B
            //        Y_mix = cR*Y_R + cG*Y_G + cB*Y_B  
            //        Z_mix = cR*Z_R + cG*Z_G + cB*Z_B
            // 约束条件: x_target = X_mix/S, y_target = Y_mix/S (S = X_mix + Y_mix + Z_mix)
            // 转换为: y_target * X_mix - x_target * Y_mix = 0
            //        y_target * Z_mix - (1-x_target-y_target) * Y_mix = 0
            
            const solutions = [];
            
            // 第三步：分别假设每个基色满载，求解其他两个系数
            
            // 情况1：假设红色满载 (cR = 1)
            const solution1 = this.solveWithRedMax(redXYZ, greenXYZ, blueXYZ, target);
            if (solution1.valid) {
                solutions.push({
                    ...solution1,
                    limitingColor: 'red',
                    luminance: solution1.cR * red.maxY + solution1.cG * green.maxY + solution1.cB * blue.maxY
                });
            }
            
            // 情况2：假设绿色满载 (cG = 1)  
            const solution2 = this.solveWithGreenMax(redXYZ, greenXYZ, blueXYZ, target);
            if (solution2.valid) {
                solutions.push({
                    ...solution2,
                    limitingColor: 'green',
                    luminance: solution2.cR * red.maxY + solution2.cG * green.maxY + solution2.cB * blue.maxY
                });
            }
            
            // 情况3：假设蓝色满载 (cB = 1)
            const solution3 = this.solveWithBlueMax(redXYZ, greenXYZ, blueXYZ, target);
            if (solution3.valid) {
                solutions.push({
                    ...solution3,
                    limitingColor: 'blue', 
                    luminance: solution3.cR * red.maxY + solution3.cG * green.maxY + solution3.cB * blue.maxY
                });
            }
            
            // 第四步：选择最大光通量的解
            if (solutions.length === 0) {
                return {
                    maxLuminance: 0,
                    coefficients: { red: 0, green: 0, blue: 0 },
                    limitingColor: null,
                    error: '目标色不在RGB三角形内'
                };
            }
            
            const bestSolution = solutions.reduce((max, current) => 
                current.luminance > max.luminance ? current : max
            );
            
            return {
                maxLuminance: bestSolution.luminance,
                coefficients: {
                    red: bestSolution.cR,
                    green: bestSolution.cG,
                    blue: bestSolution.cB
                },
                limitingColor: bestSolution.limitingColor
            };
            
        } catch (error) {
            return {
                maxLuminance: 0,
                coefficients: { red: 0, green: 0, blue: 0 },
                limitingColor: null,
                error: error.message
            };
        }
    },
    
    /**
     * 假设红色满载求解
     */
    solveWithRedMax(redXYZ, greenXYZ, blueXYZ, target) {
        const cR = 1;
        
        // 构建2x2线性方程组求解cG和cB
        // 方程1: y_t * X_mix - x_t * Y_mix = 0
        // 方程2: y_t * Z_mix - z_t * Y_mix = 0
        
        const zt = 1 - target.x - target.y;
        
        // 系数矩阵A * [cG, cB]' = b
        const A = [
            [target.y * greenXYZ.X - target.x * greenXYZ.Y, target.y * blueXYZ.X - target.x * blueXYZ.Y],
            [target.y * greenXYZ.Z - zt * greenXYZ.Y, target.y * blueXYZ.Z - zt * blueXYZ.Y]
        ];
        
        const b = [
            -(target.y * redXYZ.X - target.x * redXYZ.Y) * cR,
            -(target.y * redXYZ.Z - zt * redXYZ.Y) * cR
        ];
        
        const solution = this.solve2x2System(A, b);
        
        if (!solution) {
            return { valid: false };
        }
        
        const cG = solution[0];
        const cB = solution[1];
        
        // 验证系数范围
        const valid = cR >= 0 && cR <= 1 && cG >= 0 && cG <= 1 && cB >= 0 && cB <= 1;
        
        return { cR, cG, cB, valid };
    },
    
    /**
     * 假设绿色满载求解
     */
    solveWithGreenMax(redXYZ, greenXYZ, blueXYZ, target) {
        const cG = 1;
        
        const zt = 1 - target.x - target.y;
        
        const A = [
            [target.y * redXYZ.X - target.x * redXYZ.Y, target.y * blueXYZ.X - target.x * blueXYZ.Y],
            [target.y * redXYZ.Z - zt * redXYZ.Y, target.y * blueXYZ.Z - zt * blueXYZ.Y]
        ];
        
        const b = [
            -(target.y * greenXYZ.X - target.x * greenXYZ.Y) * cG,
            -(target.y * greenXYZ.Z - zt * greenXYZ.Y) * cG
        ];
        
        const solution = this.solve2x2System(A, b);
        
        if (!solution) {
            return { valid: false };
        }
        
        const cR = solution[0];
        const cB = solution[1];
        
        const valid = cR >= 0 && cR <= 1 && cG >= 0 && cG <= 1 && cB >= 0 && cB <= 1;
        
        return { cR, cG, cB, valid };
    },
    
    /**
     * 假设蓝色满载求解
     */
    solveWithBlueMax(redXYZ, greenXYZ, blueXYZ, target) {
        const cB = 1;
        
        const zt = 1 - target.x - target.y;
        
        const A = [
            [target.y * redXYZ.X - target.x * redXYZ.Y, target.y * greenXYZ.X - target.x * greenXYZ.Y],
            [target.y * redXYZ.Z - zt * redXYZ.Y, target.y * greenXYZ.Z - zt * greenXYZ.Y]
        ];
        
        const b = [
            -(target.y * blueXYZ.X - target.x * blueXYZ.Y) * cB,
            -(target.y * blueXYZ.Z - zt * blueXYZ.Y) * cB
        ];
        
        const solution = this.solve2x2System(A, b);
        
        if (!solution) {
            return { valid: false };
        }
        
        const cR = solution[0];
        const cG = solution[1];
        
        const valid = cR >= 0 && cR <= 1 && cG >= 0 && cG <= 1 && cB >= 0 && cB <= 1;
        
        return { cR, cG, cB, valid };
    },
    
    /**
     * 求解2x2线性方程组
     * @param {Array} A - 2x2系数矩阵
     * @param {Array} b - 右侧向量
     * @returns {Array|null} 解向量或null（如果无解）
     */
    solve2x2System(A, b) {
        const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
        
        if (Math.abs(det) < 1e-12) {
            return null; // 矩阵奇异
        }
        
        const x1 = (b[0] * A[1][1] - b[1] * A[0][1]) / det;
        const x2 = (A[0][0] * b[1] - A[1][0] * b[0]) / det;
        
        return [x1, x2];
    },
    
    /**
     * 计算达到指定目标色和光通量所需的RGB光通量（正确算法）
     * @param {object} red - 红色基色 {x, y}
     * @param {object} green - 绿色基色 {x, y}  
     * @param {object} blue - 蓝色基色 {x, y}
     * @param {object} target - 目标色 {x, y, Y}
     * @returns {object} {red, green, blue, valid}
     */
    calculateRequiredLuminanceXYZ(red, green, blue, target) {
        try {
            // 转换基色到XYZ空间（使用单位光通量）
            const redXYZ = this.xyToXYZ(red.x, red.y, 1);
            const greenXYZ = this.xyToXYZ(green.x, green.y, 1);
            const blueXYZ = this.xyToXYZ(blue.x, blue.y, 1);
            
            // 转换目标色到XYZ空间
            const targetXYZ = this.xyToXYZ(target.x, target.y, target.Y);
            
            // 建立线性方程组：
            // L_R * X_R + L_G * X_G + L_B * X_B = X_target
            // L_R * Y_R + L_G * Y_G + L_B * Y_B = Y_target  
            // L_R * Z_R + L_G * Z_G + L_B * Z_B = Z_target
            
            const A = [
                [redXYZ.X, greenXYZ.X, blueXYZ.X],
                [redXYZ.Y, greenXYZ.Y, blueXYZ.Y],
                [redXYZ.Z, greenXYZ.Z, blueXYZ.Z]
            ];
            
            const b = [targetXYZ.X, targetXYZ.Y, targetXYZ.Z];
            
            // 求解3x3线性方程组
            const solution = this.solve3x3System(A, b);
            
            if (!solution) {
                return {
                    red: 0,
                    green: 0, 
                    blue: 0,
                    valid: false,
                    error: '无法求解，目标色可能不在RGB三角形内'
                };
            }
            
            const [lR, lG, lB] = solution;
            
            // 检查解的有效性（所有光通量应为非负数）
            const valid = lR >= 0 && lG >= 0 && lB >= 0;
            
            return {
                red: Math.max(0, lR),
                green: Math.max(0, lG),
                blue: Math.max(0, lB),
                valid,
                error: valid ? null : '计算出负值，目标色不在RGB三角形内'
            };
            
        } catch (error) {
            return {
                red: 0,
                green: 0,
                blue: 0, 
                valid: false,
                error: error.message
            };
        }
    },
    
    /**
     * 求解3x3线性方程组（使用克拉默法则）
     * @param {Array} A - 3x3系数矩阵
     * @param {Array} b - 右侧向量
     * @returns {Array|null} 解向量或null（如果无解）
     */
    solve3x3System(A, b) {
        // 计算主行列式
        const det = this.determinant3x3(A);
        
        if (Math.abs(det) < 1e-12) {
            return null; // 矩阵奇异
        }
        
        // 使用克拉默法则
        const A1 = [
            [b[0], A[0][1], A[0][2]],
            [b[1], A[1][1], A[1][2]], 
            [b[2], A[2][1], A[2][2]]
        ];
        
        const A2 = [
            [A[0][0], b[0], A[0][2]],
            [A[1][0], b[1], A[1][2]],
            [A[2][0], b[2], A[2][2]]
        ];
        
        const A3 = [
            [A[0][0], A[0][1], b[0]],
            [A[1][0], A[1][1], b[1]],
            [A[2][0], A[2][1], b[2]]
        ];
        
        const x1 = this.determinant3x3(A1) / det;
        const x2 = this.determinant3x3(A2) / det;
        const x3 = this.determinant3x3(A3) / det;
        
        return [x1, x2, x3];
    },
    
    /**
     * 计算3x3矩阵的行列式
     * @param {Array} matrix - 3x3矩阵
     * @returns {number} 行列式值
     */
    determinant3x3(matrix) {
        const a = matrix[0][0], b = matrix[0][1], c = matrix[0][2];
        const d = matrix[1][0], e = matrix[1][1], f = matrix[1][2];
        const g = matrix[2][0], h = matrix[2][1], i = matrix[2][2];
        
        return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    },
    
    /**
     * 验证目标色是否在RGB三角形内（基于XYZ空间）
     * @param {object} target - 目标色 {x, y}
     * @param {object} red - 红色基色 {x, y}
     * @param {object} green - 绿色基色 {x, y}  
     * @param {object} blue - 蓝色基色 {x, y}
     * @returns {boolean} 是否在三角形内
     */
    isTargetAchievable(target, red, green, blue) {
        try {
            // 使用简化的重心坐标检查
            const denominator = (green.y - blue.y) * (red.x - blue.x) + (blue.x - green.x) * (red.y - blue.y);
            
            if (Math.abs(denominator) < 1e-12) {
                return false; // 三点共线
            }
            
            const lambda1 = ((green.y - blue.y) * (target.x - blue.x) + (blue.x - green.x) * (target.y - blue.y)) / denominator;
            const lambda2 = ((blue.y - red.y) * (target.x - blue.x) + (red.x - blue.x) * (target.y - blue.y)) / denominator;
            const lambda3 = 1 - lambda1 - lambda2;
            
            return lambda1 >= 0 && lambda2 >= 0 && lambda3 >= 0;
        } catch (error) {
            return false;
        }
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XYZCalculator;
}