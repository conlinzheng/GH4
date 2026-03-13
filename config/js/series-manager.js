async function initSeries() {
    const seriesList = document.getElementById('seriesList');
    seriesList.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        await dataManager.loadFromGitHub();
        renderSeriesList();
    } catch (error) {
        seriesList.innerHTML = `<div class="error-message">加载失败: ${error.message}</div>`;
    }
    
    document.getElementById('addSeriesBtn').addEventListener('click', addSeries);
}

function renderSeriesList() {
    const seriesList = document.getElementById('seriesList');
    const seriesData = dataManager.getSeriesData();
    
    if (seriesData.length === 0) {
        seriesList.innerHTML = '<div class="no-products">暂无系列</div>';
        return;
    }
    
    seriesList.innerHTML = seriesData.map(series => `
        <div class="series-item">
            <div class="product-info">
                <div class="product-name">${series.id}</div>
            </div>
            <div class="product-actions">
                <button class="btn btn-danger delete-series-btn" data-series="${series.id}">删除</button>
            </div>
        </div>
    `).join('');
    
    seriesList.querySelectorAll('.delete-series-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const seriesId = btn.dataset.series;
            if (confirm(`确定要删除系列 "${seriesId}" 吗？`)) {
                showNotification('删除系列功能需要手动在GitHub仓库操作', 'warning');
            }
        });
    });
}

async function addSeries() {
    const seriesName = prompt('请输入新系列名称（如：9-特殊系列）:');
    
    if (!seriesName) return;
    
    const seriesData = dataManager.getSeriesData();
    if (seriesData.some(s => s.id === seriesName)) {
        showNotification('系列已存在', 'warning');
        return;
    }
    
    try {
        await githubSync.commitFile(`产品图/${seriesName}/products.json`, 
            JSON.stringify({ seriesName: { zh: seriesName }, products: {} }, null, 2),
            `Create series ${seriesName}`,
            false
        );
        
        showNotification('系列创建成功', 'success');
        initSeries();
    } catch (error) {
        showNotification('创建系列失败: ' + error.message, 'error');
    }
}

window.initSeries = initSeries;