// 色彩计算器配置文件
const ColorCalculatorConfig = {
    // Canvas 设置
    canvas: {
        width: 600,
        height: 600,
        gridResolution: 300 // 色度图网格分辨率
    },

    // 滑动条设置
    slider: {
        defaultStepSize: 1.0,
        maxLvValues: {
            red: 30,
            green: 30,
            blue: 30
        }
    },

    // 标准色域定义
    colorSpaces: {
        ntsc: {
            red: { x: 0.67, y: 0.33 },
            green: { x: 0.21, y: 0.71 },
            blue: { x: 0.14, y: 0.08 }
        },
        srgb: {
            red: { x: 0.64, y: 0.33 },
            green: { x: 0.30, y: 0.60 },
            blue: { x: 0.15, y: 0.06 }
        }
    },

    // 默认颜色点位置
    defaultColorPoints: {
        red: { x: 0.7, y: 0.3, lv: 10 },
        green: { x: 0.2, y: 0.7, lv: 10 },
        blue: { x: 0.1, y: 0.1, lv: 10 },
        target: { x: 0.3333, y: 0.3333, lv: 30 },
        mix: { x: 0, y: 0, lv: 0 }
    },

    // CIE1931 光谱轨迹数据
    spectralLocus: [
        { x: 0.1741, y: 0.0050 }, { x: 0.1740, y: 0.0050 }, { x: 0.1738, y: 0.0049 },
        { x: 0.1736, y: 0.0049 }, { x: 0.1733, y: 0.0048 }, { x: 0.1730, y: 0.0048 },
        { x: 0.1726, y: 0.0048 }, { x: 0.1721, y: 0.0048 }, { x: 0.1714, y: 0.0051 },
        { x: 0.1703, y: 0.0058 }, { x: 0.1689, y: 0.0069 }, { x: 0.1669, y: 0.0086 },
        { x: 0.1644, y: 0.0109 }, { x: 0.1611, y: 0.0138 }, { x: 0.1566, y: 0.0177 },
        { x: 0.1510, y: 0.0227 }, { x: 0.1440, y: 0.0297 }, { x: 0.1355, y: 0.0399 },
        { x: 0.1241, y: 0.0578 }, { x: 0.1096, y: 0.0868 }, { x: 0.0913, y: 0.1327 },
        { x: 0.0687, y: 0.2007 }, { x: 0.0454, y: 0.2950 }, { x: 0.0235, y: 0.4127 },
        { x: 0.0082, y: 0.5384 }, { x: 0.0039, y: 0.6548 }, { x: 0.0139, y: 0.7502 },
        { x: 0.0389, y: 0.8120 }, { x: 0.0743, y: 0.8338 }, { x: 0.1142, y: 0.8262 },
        { x: 0.1547, y: 0.8059 }, { x: 0.1929, y: 0.7816 }, { x: 0.2296, y: 0.7543 },
        { x: 0.2658, y: 0.7243 }, { x: 0.3016, y: 0.6923 }, { x: 0.3373, y: 0.6589 },
        { x: 0.3731, y: 0.6245 }, { x: 0.4087, y: 0.5896 }, { x: 0.4441, y: 0.5547 },
        { x: 0.4788, y: 0.5202 }, { x: 0.5125, y: 0.4866 }, { x: 0.5448, y: 0.4544 },
        { x: 0.5752, y: 0.4242 }, { x: 0.6029, y: 0.3965 }, { x: 0.6270, y: 0.3725 },
        { x: 0.6482, y: 0.3514 }, { x: 0.6658, y: 0.3340 }, { x: 0.6801, y: 0.3197 },
        { x: 0.6915, y: 0.3083 }, { x: 0.7006, y: 0.2993 }, { x: 0.7079, y: 0.2920 },
        { x: 0.7140, y: 0.2859 }, { x: 0.7190, y: 0.2809 }, { x: 0.7230, y: 0.2770 },
        { x: 0.7260, y: 0.2740 }, { x: 0.7283, y: 0.2717 }, { x: 0.7300, y: 0.2700 },
        { x: 0.7311, y: 0.2689 }, { x: 0.7320, y: 0.2680 }, { x: 0.7327, y: 0.2673 },
        { x: 0.7334, y: 0.2666 }, { x: 0.7340, y: 0.2660 }, { x: 0.7344, y: 0.2656 },
        { x: 0.7346, y: 0.2654 }, { x: 0.7347, y: 0.2653 }
    ],

    // 界面设置
    ui: {
        defaultMode: 'mode1',
        showGamutBoundaries: true,
        pointRadius: 8,
        lineWidth: 2,
        gridAlpha: 0.3
    },

    // 数值精度设置
    precision: {
        coordinate: 4,    // 坐标精度（小数点后位数）
        luminance: 1,     // 光通量精度
        calculation: 6    // 计算精度
    },

    // Excel导入相关配置
    excel: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        supportedFormats: ['.xlsx', '.xls'],
        supportedMimeTypes: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ],
        defaultDataPath: './InputData/目标色.xlsx',
        expectedColumns: {
            id: 0,        // 第1列：序号/ID
            x: 1,         // 第2列：X坐标
            y: 2          // 第3列：Y坐标
        },
        dataValidation: {
            minCoordinate: 0,
            maxCoordinate: 1,
            maxDataPoints: 1000
        }
    },
    
    // 颜色表格配置
    colorTable: {
        pageSize: 20,           // 每页显示的行数
        maxPageSize: 100,       // 最大页面大小
        searchDebounceTime: 300, // 搜索防抖时间（毫秒）
        colorPreviewSize: 16,   // 颜色预览方块大小
        highlightDuration: 2000 // 高亮持续时间（毫秒）
    },
    
    // 颜色点绘制配置
    colorPoints: {
        normal: {
            radius: 2,
            strokeWidth: 0.5,
            strokeColor: 'rgba(0, 0, 0, 0.6)'
        },
        highlighted: {
            radius: 6,
            strokeWidth: 2,
            strokeColor: '#FF8C00',
            fillColor: '#FFD700',
            glowRadius: 4,
            glowColor: 'rgba(255, 255, 0, 0.8)'
        },
        clickTolerance: 10      // 点击检测容忍度（像素）
    },

    // 错误消息
    errorMessages: {
        invalidInput: '输入值无效，请检查数值范围',
        calculationFailed: '计算失败，请检查输入参数',
        browserNotSupported: '浏览器不支持所需功能',
        canvasNotSupported: '浏览器不支持Canvas API',
        storageNotSupported: '浏览器不支持本地存储功能',
        excelParsingFailed: 'Excel文件解析失败，请检查文件格式',
        fileNotSupported: '不支持的文件格式，请选择.xlsx或.xls文件',
        fileTooLarge: '文件过大，请选择小于10MB的文件',
        noValidData: '文件中没有找到有效的颜色数据',
        dataOutOfRange: '数据超出有效范围，坐标值应在0-1之间'
    }
};

// 冻结配置对象，防止意外修改
Object.freeze(ColorCalculatorConfig);