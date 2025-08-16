/**
 * 测试XYZ算法的正确性
 * 使用用户提供的示例数据
 */

// 测试数据
const testData = {
    red: { x: 0.7000, y: 0.2982, maxY: 2.6700 },
    green: { x: 0.2239, y: 0.7236, maxY: 7.4455 },
    blue: { x: 0.1233, y: 0.0893, maxY: 1.4925 },
    target: { x: 0.3330, y: 0.3330 }
};

console.log('=== XYZ算法正确性测试 ===');
console.log('测试数据：', testData);

// 手工计算期望结果（基于用户提供的正确理论）
console.log('\n=== 第一步：转换到XYZ空间 ===');

function manualXYZConversion(x, y, Y) {
    return {
        X: (x / y) * Y,
        Y: Y,
        Z: ((1 - x - y) / y) * Y
    };
}

const redXYZ = manualXYZConversion(testData.red.x, testData.red.y, testData.red.maxY);
const greenXYZ = manualXYZConversion(testData.green.x, testData.green.y, testData.green.maxY);
const blueXYZ = manualXYZConversion(testData.blue.x, testData.blue.y, testData.blue.maxY);

console.log('红色XYZ:', redXYZ);
console.log('绿色XYZ:', greenXYZ);
console.log('蓝色XYZ:', blueXYZ);

// 验证期望结果（根据用户的计算）
const expectedXYZ = {
    red: { X: 6.2676, Y: 2.6700, Z: 0.0161 },
    green: { X: 2.3045, Y: 7.4455, Z: 0.5402 },
    blue: { X: 2.0574, Y: 1.4925, Z: 13.1591 }
};

console.log('\n=== 验证XYZ转换正确性 ===');
function checkXYZAccuracy(computed, expected, name) {
    const tolerance = 0.01;
    const errorX = Math.abs(computed.X - expected.X);
    const errorY = Math.abs(computed.Y - expected.Y);
    const errorZ = Math.abs(computed.Z - expected.Z);
    
    console.log(`${name}: X误差=${errorX.toFixed(4)}, Y误差=${errorY.toFixed(4)}, Z误差=${errorZ.toFixed(4)}`);
    
    if (errorX < tolerance && errorY < tolerance && errorZ < tolerance) {
        console.log(`✓ ${name} XYZ转换正确`);
        return true;
    } else {
        console.log(`✗ ${name} XYZ转换有误差`);
        return false;
    }
}

checkXYZAccuracy(redXYZ, expectedXYZ.red, '红色');
checkXYZAccuracy(greenXYZ, expectedXYZ.green, '绿色');
checkXYZAccuracy(blueXYZ, expectedXYZ.blue, '蓝色');

console.log('\n=== 第二步：建立约束方程 ===');

// 目标色约束
const zt = 1 - testData.target.x - testData.target.y;
console.log(`z_target = 1 - ${testData.target.x} - ${testData.target.y} = ${zt}`);

// 由于x=y=0.333，约束简化为 X_mix = Y_mix 和 Z_mix = Y_mix
console.log('约束1: X_mix = Y_mix (因为x=y=0.333)');
console.log('约束2: Z_mix = Y_mix (因为z=0.333)');

console.log('\n=== 第三步：手工线性规划求解 ===');

// 假设红色满载 (cR = 1)
console.log('\n假设红色满载 (cR = 1):');

// 约束方程：
// X_mix = Y_mix => cR*X_R + cG*X_G + cB*X_B = cR*Y_R + cG*Y_G + cB*Y_B
// Z_mix = Y_mix => cR*Z_R + cG*Z_G + cB*Z_B = cR*Y_R + cG*Y_G + cB*Y_B

// 化简为：
// cG*(X_G - Y_G) + cB*(X_B - Y_B) = -(X_R - Y_R) * cR
// cG*(Z_G - Y_G) + cB*(Z_B - Y_B) = -(Z_R - Y_R) * cR

const cR = 1;
const A = [
    [greenXYZ.X - greenXYZ.Y, blueXYZ.X - blueXYZ.Y],
    [greenXYZ.Z - greenXYZ.Y, blueXYZ.Z - blueXYZ.Y]
];

const b = [
    -(redXYZ.X - redXYZ.Y) * cR,
    -(redXYZ.Z - redXYZ.Y) * cR
];

console.log('系数矩阵A:', A);
console.log('右侧向量b:', b);

// 求解2x2方程组
const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
console.log('行列式det =', det);

if (Math.abs(det) > 1e-12) {
    const cG = (b[0] * A[1][1] - b[1] * A[0][1]) / det;
    const cB = (A[0][0] * b[1] - A[1][0] * b[0]) / det;
    
    console.log(`解: cR=${cR}, cG=${cG.toFixed(4)}, cB=${cB.toFixed(4)}`);
    
    // 验证约束
    const valid = cR >= 0 && cR <= 1 && cG >= 0 && cG <= 1 && cB >= 0 && cB <= 1;
    console.log('系数范围检查:', valid ? '✓ 有效' : '✗ 无效');
    
    if (valid) {
        const Y_mix = cR * redXYZ.Y + cG * greenXYZ.Y + cB * blueXYZ.Y;
        console.log(`总光通量: Y_mix = ${Y_mix.toFixed(3)}`);
        
        // 验证约束是否满足
        const X_mix = cR * redXYZ.X + cG * greenXYZ.X + cB * blueXYZ.X;
        const Z_mix = cR * redXYZ.Z + cG * greenXYZ.Z + cB * blueXYZ.Z;
        
        console.log(`验证: X_mix=${X_mix.toFixed(3)}, Y_mix=${Y_mix.toFixed(3)}, Z_mix=${Z_mix.toFixed(3)}`);
        console.log(`X_mix ≈ Y_mix? ${Math.abs(X_mix - Y_mix) < 0.01 ? '✓' : '✗'}`);
        console.log(`Z_mix ≈ Y_mix? ${Math.abs(Z_mix - Y_mix) < 0.01 ? '✓' : '✗'}`);
        
        // 验证最终色坐标
        const total = X_mix + Y_mix + Z_mix;
        const final_x = X_mix / total;
        const final_y = Y_mix / total;
        
        console.log(`最终色坐标: (${final_x.toFixed(4)}, ${final_y.toFixed(4)})`);
        console.log(`目标色坐标: (${testData.target.x}, ${testData.target.y})`);
        console.log(`色坐标误差: x误差=${Math.abs(final_x - testData.target.x).toFixed(6)}, y误差=${Math.abs(final_y - testData.target.y).toFixed(6)}`);
        
        console.log('\n=== 期望结果对比 ===');
        console.log('用户计算的期望结果: 最大光通量 ≈ 9.48');
        console.log(`我们的计算结果: 最大光通量 = ${Y_mix.toFixed(3)}`);
        console.log(`差异: ${Math.abs(Y_mix - 9.48).toFixed(3)}`);
    }
} else {
    console.log('矩阵奇异，无法求解');
}

console.log('\n=== 测试完成 ===');