/**
 * 测试控制台 - 在浏览器中直接调用验证
 * 在浏览器控制台中运行: testMainApplication()
 */

function testMainApplication() {
    console.log('=== 主应用XYZ算法测试 ===');
    
    // 测试数据（用户提供的示例）
    const testData = {
        red: { x: 0.7000, y: 0.2982, lv: 2.6700 },
        green: { x: 0.2239, y: 0.7236, lv: 7.4455 },
        blue: { x: 0.1233, y: 0.0893, lv: 1.4925 },
        target: { x: 0.3330, y: 0.3330, lv: 0 },
        mix: { x: 0, y: 0, lv: 0 }
    };
    
    const maxLvValues = {
        red: 2.6700,
        green: 7.4455,
        blue: 1.4925
    };
    
    console.log('测试数据:', testData);
    
    try {
        // 测试XYZ计算模块
        console.log('\n=== 测试XYZ模块 ===');
        const xyzResult = XYZCalculator.calculateMaxLuminanceXYZ(
            { x: testData.red.x, y: testData.red.y, maxY: maxLvValues.red },
            { x: testData.green.x, y: testData.green.y, maxY: maxLvValues.green },
            { x: testData.blue.x, y: testData.blue.y, maxY: maxLvValues.blue },
            { x: testData.target.x, y: testData.target.y }
        );
        
        console.log('XYZ模块结果:', xyzResult);
        
        // 测试主程序ColorCalculator
        console.log('\n=== 测试主程序ColorCalculator ===');
        const calculatorResult = ColorCalculator.calculateMaxLuminance(testData, maxLvValues);
        console.log('ColorCalculator结果:', calculatorResult);
        
        // 对比结果
        console.log('\n=== 结果对比 ===');
        console.log(`XYZ模块最大光通量: ${xyzResult.maxLuminance.toFixed(3)}`);
        console.log(`ColorCalculator最大光通量: ${calculatorResult.maxLuminance.toFixed(3)}`);
        console.log(`差异: ${Math.abs(xyzResult.maxLuminance - calculatorResult.maxLuminance).toFixed(6)}`);
        
        // 验证期望结果
        const expectedResult = 9.48;
        console.log(`\n=== 与期望结果对比 ===`);
        console.log(`期望结果: ${expectedResult}`);
        console.log(`XYZ算法误差: ${Math.abs(xyzResult.maxLuminance - expectedResult).toFixed(3)}`);
        console.log(`主程序误差: ${Math.abs(calculatorResult.maxLuminance - expectedResult).toFixed(3)}`);
        
        // 检查系数
        console.log('\n=== 系数对比 ===');
        console.log('XYZ模块系数:', xyzResult.coefficients);
        console.log('主程序比例:', {
            red: calculatorResult.ratio.red / maxLvValues.red,
            green: calculatorResult.ratio.green / maxLvValues.green,
            blue: calculatorResult.ratio.blue / maxLvValues.blue
        });
        
        // 验证成功标准
        const tolerance = 0.1;
        const success = Math.abs(calculatorResult.maxLuminance - expectedResult) < tolerance;
        
        console.log(`\n=== 测试结果 ===`);
        if (success) {
            console.log('✅ 测试通过！主应用XYZ算法工作正常');
        } else {
            console.log('❌ 测试失败！需要进一步检查');
        }
        
        return {
            success,
            xyzResult,
            calculatorResult,
            expected: expectedResult
        };
        
    } catch (error) {
        console.error('测试失败:', error);
        return { success: false, error: error.message };
    }
}

// 测试模式3修复
function testMode3Fix() {
    console.log('=== 测试模式3修复 ===');
    
    const testData = {
        red: { x: 0.7000, y: 0.2982, lv: 0 },
        green: { x: 0.2239, y: 0.7236, lv: 0 },
        blue: { x: 0.1233, y: 0.0893, lv: 0 },
        target: { x: 0.3333, y: 0.3333, lv: 9.0000 }
    };
    
    console.log('测试数据:', testData);
    
    try {
        // 直接测试XYZ模块
        const xyzResult = XYZCalculator.calculateRequiredLuminanceXYZ(
            { x: testData.red.x, y: testData.red.y },
            { x: testData.green.x, y: testData.green.y },
            { x: testData.blue.x, y: testData.blue.y },
            { x: testData.target.x, y: testData.target.y, Y: testData.target.lv }
        );
        
        console.log('XYZ模块结果:', xyzResult);
        
        // 测试ColorCalculator
        const calculatorResult = ColorCalculator.calculateRequiredLuminance(testData);
        console.log('ColorCalculator结果:', calculatorResult);
        
        // 对比旧结果（截图中的数据）
        const oldResults = {
            red: 2.8671,
            green: 2.6951,
            blue: 3.4377
        };
        
        console.log('\n=== 结果对比 ===');
        console.log('旧算法（截图）:', oldResults);
        console.log('新算法（XYZ）:', calculatorResult);
        
        console.log('\n差异分析:');
        console.log(`红色差异: ${Math.abs(calculatorResult.red - oldResults.red).toFixed(4)} lm`);
        console.log(`绿色差异: ${Math.abs(calculatorResult.green - oldResults.green).toFixed(4)} lm`);
        console.log(`蓝色差异: ${Math.abs(calculatorResult.blue - oldResults.blue).toFixed(4)} lm`);
        
        const newTotal = calculatorResult.red + calculatorResult.green + calculatorResult.blue;
        const oldTotal = oldResults.red + oldResults.green + oldResults.blue;
        console.log(`总量差异: ${Math.abs(newTotal - oldTotal).toFixed(4)} lm`);
        
        return {
            success: true,
            xyzResult,
            calculatorResult,
            oldResults
        };
        
    } catch (error) {
        console.error('测试失败:', error);
        return { success: false, error: error.message };
    }
}

// 在控制台中可用的快速测试函数
window.testXYZ = testMainApplication;
window.testMode3 = testMode3Fix;

console.log('测试控制台已加载。在浏览器控制台中运行:');
console.log('- testXYZ() - 测试最大光通量算法');
console.log('- testMode3() - 测试模式3修复');