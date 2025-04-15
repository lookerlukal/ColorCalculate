# 色彩合成计算器

这是一个用于RGB三基色合成计算的网页应用程序，基于CIE1931色度图。

## 功能特点

1. **模式1：计算混合结果**
   - 输入RGB三基色的色坐标(x,y)和光通量值(Lv)
   - 计算三基色混合后的合成色坐标和光通量

2. **模式2：计算光通量需求**
   - 输入合成目标色的色坐标(x,y)和光通量值(Lv)
   - 输入RGB三基色的色坐标(x,y)
   - 计算达到目标色所需的RGB三基色各自的光通量值

3. **交互式CIE1931色度图**
   - 在色度图上直观地显示三基色和目标色的位置
   - 可以直接在图上拖动点来调整色坐标
   - 实时显示RGB色域范围

## 使用方法

1. 在浏览器中打开`index.html`文件
2. 选择需要的计算模式：
   - 模式1：计算混合结果
   - 模式2：计算光通量需求
3. 输入相应的参数或在色度图上直接拖动点
4. 点击计算按钮获取结果

## 注意事项

- 默认目标色为白色(x=0.3333, y=0.3333)
- 在模式2中，如果目标色不在RGB三角形内部，计算结果可能包含负值，这表示无法通过三基色合成该目标色
- 所有色坐标(x,y)的有效范围为0-1

## 参考资料

- CIE1931色度图是国际照明委员会(CIE)制定的色彩标准
- 计算基于色度学和色彩混合原理 