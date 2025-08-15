# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 CIE1931 色度图的 RGB 三基色合成计算器，纯前端实现，无需构建工具。

## 开发环境

- 纯静态网页项目，直接在浏览器中打开 `index.html` 即可运行
- 无需构建、编译或安装依赖
- 兼容现代浏览器（支持 Canvas API）

## 代码架构

### 核心文件结构

1. **index.html** - 主页面，包含两种计算模式的 UI 布局
2. **js/script.js** - 主要业务逻辑（约 1900 行）
   - CIE1931 色度图绘制
   - 颜色点交互（拖拽、点击）
   - 色彩计算（混合计算、光通量计算）
   - 预设管理系统
   - 键盘快捷键处理
3. **js/debug.js** - 调试相关功能
4. **css/style.css** - 样式定义

### 主要功能模块

1. **CIE1931 色度图可视化**
   - `drawCIE1931Chart()` - 主绘制函数
   - 包含光谱轨迹、网格、色域边界显示
   - 支持拖拽交互和实时更新

2. **色彩计算核心**
   - `calculateMixedColor()` - 模式1：计算 RGB 混合结果
   - `calculateRequiredLuminance()` - 模式2：计算达到目标色所需的光通量
   - `calculateMaxLuminance()` - 模式3：计算目标色的最大可达光通量
   - `solveLinearEquation()` - 线性方程求解器（用于光通量计算）

3. **交互系统**
   - 鼠标事件：`onMouseDown`, `onMouseMove`, `onMouseUp`
   - 键盘快捷键：`onKeyDown`
   - 支持点拖拽、滑块调节、步长控制

4. **预设管理**
   - 使用 localStorage 存储预设数据
   - 支持保存、加载、删除预设
   - 内置多个默认预设

### 关键数据结构

```javascript
colorPoints = {
    red: { x, y, lv },    // 红色基色
    green: { x, y, lv },  // 绿色基色
    blue: { x, y, lv },   // 蓝色基色
    target: { x, y, lv }, // 目标色（模式2）
    mix: { x, y, lv }     // 混合结果（模式1）
}
```

### 坐标系统

- CIE 坐标范围：x, y ∈ [0, 1]
- Canvas 坐标需要转换：
  - `screenToCieCoordinates()` - 屏幕坐标转 CIE 坐标
  - `getCanvasScaleFactor()` - 处理高 DPI 屏幕

## 开发建议

1. **调试方法**
   - 直接在浏览器开发者工具中调试
   - `debug.js` 提供了辅助调试功能

2. **代码优化建议**
   - script.js 文件较大（1900+ 行），可考虑模块化拆分
   - 建议拆分为：
     - chart-renderer.js（图表绘制）
     - color-calculator.js（颜色计算）
     - interaction-handler.js（交互处理）
     - preset-manager.js（预设管理）

3. **性能注意事项**
   - Canvas 重绘频繁，注意优化绘制性能
   - 鼠标拖拽时使用节流处理

4. **浏览器兼容性**
   - 需要支持 Canvas API
   - 使用了 localStorage API
   - 建议在 Chrome、Firefox、Edge 等现代浏览器中运行