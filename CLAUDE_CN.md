# CLAUDE.md (中文版)

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

这是一个基于 CIE1931 色度图的 RGB 三基色合成计算器，纯前端实现，无需构建工具。

## 开发环境

- 纯静态网页项目，直接在浏览器中打开 `index.html` 即可运行
- 无需构建、编译或安装依赖
- 兼容现代浏览器（支持 Canvas API）

## 代码架构

### 核心文件结构

1. **index.html** - 主页面，包含两种计算模式的 UI 布局
2. **js/** - 模块化JavaScript架构：
   - **config.js** - 配置和常量管理（95行）
   - **notification.js** - 错误处理和通知系统（150行）
   - **color-calculator.js** - 颜色计算算法（217行）
   - **chart-renderer.js** - CIE1931图表渲染（344行）
   - **app-controller.js** - 主应用控制器（407行）
   - **script.js** - 兼容性层和预设管理（194行）
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

2. **代码架构**
   - 已完成模块化拆分，职责分离清晰
   - 配置管理、错误处理、计算、渲染和应用控制分离
   - 提高了代码可维护性和可测试性

3. **性能优化**
   - 实现了背景缓存优化渲染性能
   - 坐标转换优化和更新节流处理

4. **浏览器兼容性**
   - 需要支持 Canvas API
   - 使用了 localStorage API
   - 建议在 Chrome、Firefox、Edge 等现代浏览器中运行

## Git 管理规范（AI 开发专用）

### 分支策略

**主分支管理**
- `main` - 稳定的生产版本
- `session/YYYY-MM-DD-功能名` - AI 会话开发分支
- `backup/功能名` - 重大重构前的备份分支

**分支命名规范**
```bash
session/2025-01-15-color-mixing      # 颜色混合功能开发
session/2025-01-16-ui-optimization   # UI 优化会话
backup/before-script-refactor        # 重构前备份
```

### 提交规范

**提交信息格式**
```
[AI] type: 简短描述

- 具体改动点1
- 具体改动点2
- 具体改动点3

Session: 2025-01-15
Context: 用户需求简述
Files: 主要修改的文件列表
```

**提交类型**
- `feat` - 新功能
- `fix` - Bug修复  
- `refactor` - 代码重构
- `style` - 样式调整
- `perf` - 性能优化
- `docs` - 文档更新

### AI 开发工作流

**1. 会话开始**
```bash
# 创建新的会话分支
git checkout main
git checkout -b session/$(date +%Y-%m-%d)-功能名称
```

**2. 开发过程中**
- 每完成一个独立功能模块立即提交
- 单文件修改超过 300 行时进行中间提交
- 重大架构调整前创建备份分支

**3. 会话结束**
```bash
# 合并到主分支（保留完整历史）
git checkout main
git merge --no-ff session/分支名
git tag -a "v$(date +%Y%m%d)" -m "AI session: 功能描述"

# 清理分支（可选，建议保留一段时间）
git branch -d session/分支名
```

### 质量控制

**提交前检查清单**
- [ ] 代码功能完整可运行
- [ ] 单个文件未超过 1300 行（需拆分）
- [ ] 浏览器中测试基本功能正常
- [ ] 提交信息包含必要的上下文信息

**回滚策略**
- 每次 AI 会话保持独立分支至少 1 周
- 重要版本使用 Git 标签标记
- 保留 `backup/` 分支用于紧急恢复

**代码变更管理**
- 单次会话代码变更量控制在 500 行以内
- 跨文件重构需要分步提交
- 新增功能与 Bug 修复分开处理

### AI 协作要点

**会话连续性**
- 在 CLAUDE.md 中记录当前开发状态
- 重要决策和架构选择需要文档化
- 未完成的 TODO 项目需要明确标记

**版本管理**
- 使用语义化版本号：`v1.0.0`
- 主要功能发布打正式标签
- 实验性功能使用预发布标签：`v1.1.0-beta`