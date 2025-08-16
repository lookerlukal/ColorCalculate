// 颜色数据表格组件
const ColorTable = {
    // DOM元素引用
    elements: {
        container: null,
        searchInput: null,
        table: null,
        tbody: null,
        pagination: null,
        statusBar: null
    },
    
    // 表格状态
    state: {
        currentPage: 1,
        pageSize: ColorCalculatorConfig.colorTable.pageSize,
        searchKeyword: '',
        sortColumn: 'id',
        sortDirection: 'asc',
        filteredData: []
    },
    
    // 初始化表格
    init(containerId) {
        this.elements.container = document.getElementById(containerId);
        if (!this.elements.container) {
            throw new Error(`找不到容器元素: ${containerId}`);
        }
        
        this.createTableStructure();
        this.bindEvents();
    },
    
    // 创建表格结构
    createTableStructure() {
        this.elements.container.innerHTML = `
            <div class="color-table-wrapper">
                <div class="table-controls">
                    <div class="search-controls">
                        <input type="text" id="color-search" placeholder="搜索颜色ID或名称..." class="search-input">
                        <button id="clear-search" class="clear-btn">清除</button>
                    </div>
                    <div class="view-controls">
                        <label class="checkbox-label">
                            <input type="checkbox" id="show-all-colors" checked>
                            <span>显示所有颜色点</span>
                        </label>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="color-table">
                        <thead>
                            <tr>
                                <th data-sort="id" class="sortable">ID <span class="sort-indicator">↕</span></th>
                                <th data-sort="name" class="sortable">名称 <span class="sort-indicator">↕</span></th>
                                <th data-sort="x" class="sortable">X坐标 <span class="sort-indicator">↕</span></th>
                                <th data-sort="y" class="sortable">Y坐标 <span class="sort-indicator">↕</span></th>
                                <th>颜色预览</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="color-table-body">
                        </tbody>
                    </table>
                </div>
                
                <div class="table-footer">
                    <div class="status-bar" id="table-status">
                        <span>总计: 0 个颜色</span>
                    </div>
                    <div class="pagination" id="table-pagination">
                    </div>
                </div>
            </div>
        `;
        
        // 缓存元素引用
        this.elements.searchInput = document.getElementById('color-search');
        this.elements.table = this.elements.container.querySelector('.color-table');
        this.elements.tbody = document.getElementById('color-table-body');
        this.elements.pagination = document.getElementById('table-pagination');
        this.elements.statusBar = document.getElementById('table-status');
    },
    
    // 绑定事件
    bindEvents() {
        // 搜索功能
        this.elements.searchInput.addEventListener('input', (e) => {
            this.state.searchKeyword = e.target.value;
            this.state.currentPage = 1;
            this.filterAndRender();
        });
        
        // 清除搜索
        document.getElementById('clear-search').addEventListener('click', () => {
            this.elements.searchInput.value = '';
            this.state.searchKeyword = '';
            this.state.currentPage = 1;
            this.filterAndRender();
        });
        
        // 显示/隐藏所有颜色点
        document.getElementById('show-all-colors').addEventListener('change', (e) => {
            const visible = e.target.checked;
            ExcelLoader.colorData.forEach(color => {
                ExcelLoader.setColorVisibility(color.id, visible);
            });
        });
        
        // 表格排序
        this.elements.table.addEventListener('click', (e) => {
            if (e.target.classList.contains('sortable') || e.target.parentElement.classList.contains('sortable')) {
                const th = e.target.classList.contains('sortable') ? e.target : e.target.parentElement;
                const column = th.dataset.sort;
                this.handleSort(column);
            }
        });
        
        // 表格行点击事件（委托）
        this.elements.tbody.addEventListener('click', (e) => {
            this.handleTableClick(e);
        });
    },
    
    // 处理表格点击事件
    handleTableClick(e) {
        const row = e.target.closest('tr');
        if (!row) return;
        
        const colorId = parseInt(row.dataset.colorId);
        if (!colorId) return;
        
        if (e.target.classList.contains('visibility-btn')) {
            // 处理可见性切换
            this.toggleColorVisibility(colorId);
        } else if (e.target.classList.contains('highlight-btn')) {
            // 处理高亮切换
            this.toggleColorHighlight(colorId);
        } else if (e.target.classList.contains('target-btn')) {
            // 处理设为目标色
            this.setAsTargetColor(colorId);
        } else if (row.classList.contains('color-row')) {
            // 处理行点击高亮切换
            this.toggleColorHighlight(colorId);
        }
    },
    
    // 切换颜色可见性
    toggleColorVisibility(colorId) {
        const color = ExcelLoader.getColorById(colorId);
        if (color) {
            ExcelLoader.setColorVisibility(colorId, !color.visible);
            this.renderCurrentPage();
        }
    },
    
    // 切换颜色高亮
    toggleColorHighlight(colorId) {
        const color = ExcelLoader.getColorById(colorId);
        if (color) {
            const newHighlightState = !color.highlighted;
            ExcelLoader.setColorHighlight(colorId, newHighlightState);
            this.renderCurrentPage();
        }
    },
    
    // 设为目标色（添加到模式3的多选列表）
    setAsTargetColor(colorId) {
        const color = ExcelLoader.getColorById(colorId);
        if (!color) return;
        
        // 检查是否已经添加过
        if (typeof ColorCalculatorApp !== 'undefined' && ColorCalculatorApp.state.selectedTargets) {
            const exists = ColorCalculatorApp.state.selectedTargets.some(target => 
                target.type === 'excel' && target.originalId == colorId
            );
            
            if (exists) {
                NotificationSystem.warning(`"${color.name}"已在目标色列表中`);
                return;
            }
            
            // 添加到模式3的目标色列表
            const target = {
                id: `excel_${colorId}_${Date.now()}`,
                name: color.name,
                x: color.x,
                y: color.y,
                lv: 30, // 默认光通量
                type: 'excel',
                originalId: colorId
            };
            
            ColorCalculatorApp.state.selectedTargets.push(target);
            ColorCalculatorApp.updateTargetList();
            
            NotificationSystem.success(`已将"${color.name}"添加到目标色列表`);
        } else {
            console.error('ColorCalculatorApp不可用');
            NotificationSystem.error('添加目标色失败');
        }
    },
    
    // 处理排序
    handleSort(column) {
        if (this.state.sortColumn === column) {
            this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.sortColumn = column;
            this.state.sortDirection = 'asc';
        }
        
        this.updateSortIndicators();
        this.filterAndRender();
    },
    
    // 更新排序指示器
    updateSortIndicators() {
        // 清除所有排序指示器
        this.elements.table.querySelectorAll('.sort-indicator').forEach(indicator => {
            indicator.textContent = '↕';
        });
        
        // 设置当前排序列的指示器
        const currentTh = this.elements.table.querySelector(`[data-sort="${this.state.sortColumn}"]`);
        if (currentTh) {
            const indicator = currentTh.querySelector('.sort-indicator');
            indicator.textContent = this.state.sortDirection === 'asc' ? '↑' : '↓';
        }
    },
    
    // 过滤和渲染数据
    filterAndRender() {
        this.filterData();
        this.renderCurrentPage();
        this.renderPagination();
        this.updateStatusBar();
    },
    
    // 过滤数据
    filterData() {
        let data = ExcelLoader.getColorData();
        
        // 搜索过滤
        if (this.state.searchKeyword) {
            data = ExcelLoader.searchColors(this.state.searchKeyword);
        }
        
        // 排序
        data.sort((a, b) => {
            let aVal = a[this.state.sortColumn];
            let bVal = b[this.state.sortColumn];
            
            // 处理数字类型
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return this.state.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
            
            // 处理字符串类型
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
            
            if (this.state.sortDirection === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
            }
        });
        
        this.state.filteredData = data;
    },
    
    // 渲染当前页
    renderCurrentPage() {
        const startIndex = (this.state.currentPage - 1) * this.state.pageSize;
        const endIndex = startIndex + this.state.pageSize;
        const pageData = this.state.filteredData.slice(startIndex, endIndex);
        
        this.elements.tbody.innerHTML = '';
        
        pageData.forEach(color => {
            const row = this.createTableRow(color);
            this.elements.tbody.appendChild(row);
        });
    },
    
    // 创建表格行
    createTableRow(color) {
        const row = document.createElement('tr');
        row.className = 'color-row';
        row.dataset.colorId = color.id;
        
        if (color.highlighted) {
            row.classList.add('highlighted');
        }
        
        // 计算颜色预览（简化的RGB近似）
        const rgb = this.xyToRGB(color.x, color.y);
        const colorPreview = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        
        row.innerHTML = `
            <td class="id-cell">${color.id}</td>
            <td class="name-cell">${color.name}</td>
            <td class="coord-cell">${PrecisionFormatter.formatValue(color.x, 'coordinate')}</td>
            <td class="coord-cell">${PrecisionFormatter.formatValue(color.y, 'coordinate')}</td>
            <td class="color-preview-cell">
                <div class="color-swatch" style="background-color: ${colorPreview};" title="CIE坐标: (${PrecisionFormatter.formatValue(color.x, 'coordinate')}, ${PrecisionFormatter.formatValue(color.y, 'coordinate')})"></div>
            </td>
            <td class="action-cell">
                <button class="action-btn visibility-btn ${color.visible ? 'visible' : 'hidden'}" 
                        title="${color.visible ? '隐藏' : '显示'}">
                    ${color.visible ? '👁' : '👁‍🗨'}
                </button>
                <button class="action-btn highlight-btn ${color.highlighted ? 'active' : ''}" 
                        title="${color.highlighted ? '取消高亮' : '高亮显示'}">
                    ${color.highlighted ? '⭐' : '☆'}
                </button>
                <button class="action-btn target-btn" 
                        title="设为目标色">
                    🎯
                </button>
            </td>
        `;
        
        return row;
    },
    
    // CIE xy坐标转RGB（简化近似算法）
    xyToRGB(x, y) {
        // 这是一个简化的转换，实际应用中需要更精确的色彩空间转换
        const z = 1 - x - y;
        
        // 转换为XYZ
        const Y = 1; // 假设Y = 1
        const X = Y * x / y;
        const Z = Y * z / y;
        
        // XYZ转RGB（sRGB色彩空间）
        let r = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
        let g = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
        let b = X * 0.0557 + Y * -0.2040 + Z * 1.0570;
        
        // Gamma校正
        r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r;
        g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g;
        b = b > 0.0031308 ? 1.055 * Math.pow(b, 1/2.4) - 0.055 : 12.92 * b;
        
        // 限制在0-255范围内
        return {
            r: Math.max(0, Math.min(255, Math.round(r * 255))),
            g: Math.max(0, Math.min(255, Math.round(g * 255))),
            b: Math.max(0, Math.min(255, Math.round(b * 255)))
        };
    },
    
    // 渲染分页
    renderPagination() {
        const totalPages = Math.ceil(this.state.filteredData.length / this.state.pageSize);
        
        if (totalPages <= 1) {
            this.elements.pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // 上一页按钮
        if (this.state.currentPage > 1) {
            paginationHTML += '<button class="page-btn" data-page="prev">上一页</button>';
        }
        
        // 页码按钮
        const startPage = Math.max(1, this.state.currentPage - 2);
        const endPage = Math.min(totalPages, this.state.currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += '<button class="page-btn" data-page="1">1</button>';
            if (startPage > 2) {
                paginationHTML += '<span class="page-ellipsis">...</span>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.state.currentPage ? 'active' : '';
            paginationHTML += `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<span class="page-ellipsis">...</span>';
            }
            paginationHTML += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        
        // 下一页按钮
        if (this.state.currentPage < totalPages) {
            paginationHTML += '<button class="page-btn" data-page="next">下一页</button>';
        }
        
        this.elements.pagination.innerHTML = paginationHTML;
        
        // 绑定分页事件
        this.elements.pagination.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn')) {
                this.handlePageChange(e.target.dataset.page);
            }
        });
    },
    
    // 处理页面切换
    handlePageChange(page) {
        const totalPages = Math.ceil(this.state.filteredData.length / this.state.pageSize);
        
        if (page === 'prev') {
            this.state.currentPage = Math.max(1, this.state.currentPage - 1);
        } else if (page === 'next') {
            this.state.currentPage = Math.min(totalPages, this.state.currentPage + 1);
        } else {
            this.state.currentPage = parseInt(page);
        }
        
        this.renderCurrentPage();
        this.renderPagination();
        this.updateStatusBar();
    },
    
    // 更新状态栏
    updateStatusBar() {
        const total = ExcelLoader.getColorData().length;
        const filtered = this.state.filteredData.length;
        const visible = ExcelLoader.getVisibleColors().length;
        
        let statusText = `总计: ${total} 个颜色`;
        if (filtered !== total) {
            statusText += ` | 筛选: ${filtered} 个`;
        }
        statusText += ` | 可见: ${visible} 个`;
        
        this.elements.statusBar.innerHTML = statusText;
    },
    
    // 更新表格数据
    updateData() {
        this.state.currentPage = 1;
        this.filterAndRender();
    },
    
    // 跳转到指定颜色
    goToColor(colorId) {
        const color = ExcelLoader.getColorById(colorId);
        if (!color) return;
        
        this.state.searchKeyword = '';
        this.elements.searchInput.value = '';
        
        // 找到颜色在过滤后数据中的位置
        this.filterData();
        const index = this.state.filteredData.findIndex(c => c.id === colorId);
        
        if (index !== -1) {
            const targetPage = Math.ceil((index + 1) / this.state.pageSize);
            this.state.currentPage = targetPage;
            this.filterAndRender();
            
            // 高亮显示该颜色
            ExcelLoader.setColorHighlight(colorId, true);
        }
    }
};