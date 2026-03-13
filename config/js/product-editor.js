let currentEditingProduct = null;

async function initProducts() {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        await dataManager.loadFromGitHub();
        renderProducts();
    } catch (error) {
        productsList.innerHTML = `<div class="error-message">加载失败: ${error.message}</div>`;
    }
    
    document.getElementById('scanImagesBtn').addEventListener('click', scanNewImages);
}

function renderProducts() {
    const productsList = document.getElementById('productsList');
    const seriesList = dataManager.getSeriesData();
    
    if (seriesList.length === 0) {
        productsList.innerHTML = '<div class="no-products">暂无系列，请先添加系列</div>';
        return;
    }
    
    let html = '';
    
    seriesList.forEach(series => {
        const products = dataManager.getProductsBySeries(series.id);
        const productEntries = Object.entries(products);
        
        html += `<div class="series-group">`;
        html += `<h3 class="series-title">${series.id}</h3>`;
        
        if (productEntries.length === 0) {
            html += '<p class="no-products">该系列暂无产品</p>';
        } else {
            productEntries.forEach(([filename, product]) => {
                html += renderProductItem(series.id, filename, product);
            });
        }
        
        html += '</div>';
    });
    
    productsList.innerHTML = html;
    
    productsList.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const seriesId = btn.dataset.series;
            const filename = btn.dataset.filename;
            openProductEditor(seriesId, filename);
        });
    });
    
    productsList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const seriesId = btn.dataset.series;
            const filename = btn.dataset.filename;
            if (confirm('确定要删除这个产品吗？')) {
                dataManager.deleteProduct(seriesId, filename);
                renderProducts();
                showNotification('产品已删除', 'success');
            }
        });
    });
}

function renderProductItem(seriesId, filename, product) {
    const name = product.name?.zh || filename;
    return `
        <div class="product-item">
            <div class="product-info">
                <div class="product-name">${name}</div>
                <div class="product-meta">${filename} | 价格: ${product.price || '未设置'}</div>
            </div>
            <div class="product-actions">
                <button class="btn btn-secondary edit-btn" data-series="${seriesId}" data-filename="${filename}">编辑</button>
                <button class="btn btn-danger delete-btn" data-series="${seriesId}" data-filename="${filename}">删除</button>
            </div>
        </div>
    `;
}

function openProductEditor(seriesId, filename) {
    const product = dataManager.getProductsBySeries(seriesId)[filename];
    currentEditingProduct = { seriesId, filename };
    
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productEditForm');
    
    title.textContent = `编辑产品 - ${filename}`;
    
    form.innerHTML = `
        <div class="form-group">
            <label>产品名称</label>
            <div class="language-tabs">
                <button data-lang="zh" class="active">中文</button>
                <button data-lang="en">English</button>
                <button data-lang="ko">한국어</button>
            </div>
            <div class="language-pane active" data-lang="zh">
                <input type="text" class="form-control name-input" data-lang="zh" value="${product?.name?.zh || ''}" placeholder="中文名称">
            </div>
            <div class="language-pane" data-lang="en">
                <input type="text" class="form-control name-input" data-lang="en" value="${product?.name?.en || ''}" placeholder="English Name">
            </div>
            <div class="language-pane" data-lang="ko">
                <input type="text" class="form-control name-input" data-lang="ko" value="${product?.name?.ko || ''}" placeholder="한국어 이름">
            </div>
        </div>
        <div class="form-group">
            <label>产品描述</label>
            <div class="language-tabs">
                <button data-lang="zh" class="active">中文</button>
                <button data-lang="en">English</button>
                <button data-lang="ko">한국어</button>
            </div>
            <div class="language-pane active" data-lang="zh">
                <textarea class="form-control desc-input" data-lang="zh" placeholder="中文描述">${product?.description?.zh || ''}</textarea>
            </div>
            <div class="language-pane" data-lang="en">
                <textarea class="form-control desc-input" data-lang="en" placeholder="English Description">${product?.description?.en || ''}</textarea>
            </div>
            <div class="language-pane" data-lang="ko">
                <textarea class="form-control desc-input" data-lang="ko" placeholder="한국어 설명">${product?.description?.ko || ''}</textarea>
            </div>
        </div>
        <div class="form-group">
            <label>价格</label>
            <input type="text" class="form-control price-input" value="${product?.price || ''}" placeholder="价格">
        </div>
    `;
    
    new Tabs('productEditForm');
    
    modal.style.display = 'flex';
    
    document.getElementById('saveProductBtn').onclick = saveProduct;
    document.getElementById('cancelProductBtn').onclick = () => {
        modal.style.display = 'none';
    };
}

function saveProduct() {
    if (!currentEditingProduct) return;
    
    const { seriesId, filename } = currentEditingProduct;
    
    const nameInputs = document.querySelectorAll('.name-input');
    const descInputs = document.querySelectorAll('.desc-input');
    const priceInput = document.querySelector('.price-input');
    
    const name = {};
    const description = {};
    
    nameInputs.forEach(input => {
        name[input.dataset.lang] = input.value;
    });
    
    descInputs.forEach(input => {
        description[input.dataset.lang] = input.value;
    });
    
    const productData = {
        name,
        description,
        price: priceInput.value,
        materials: {}
    };
    
    dataManager.updateProduct(seriesId, filename, productData);
    
    document.getElementById('productModal').style.display = 'none';
    renderProducts();
    showNotification('产品已保存', 'success');
    
    dataManager.saveToGitHub().then(() => {
        showNotification('已同步到GitHub', 'success');
    }).catch(err => {
        showNotification('同步失败: ' + err.message, 'error');
    });
}

async function scanNewImages() {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '<div class="loading">正在扫描新图片...</div>';
    
    try {
        const newImages = await githubSync.scanForNewImages();
        
        if (newImages.length === 0) {
            productsList.innerHTML = '<div class="no-products">没有发现新图片</div>';
            return;
        }
        
        newImages.forEach(img => {
            const baseName = img.filename.replace(/\.[^/.]+$/, '');
            const productData = {
                name: { zh: baseName, en: baseName, ko: baseName },
                description: { zh: '', en: '', ko: '' },
                price: '',
                materials: {}
            };
            dataManager.addProduct(img.seriesId, img.filename, productData);
        });
        
        renderProducts();
        showNotification(`发现 ${newImages.length} 张新图片`, 'success');
    } catch (error) {
        productsList.innerHTML = `<div class="error-message">扫描失败: ${error.message}</div>`;
    }
}

window.initProducts = initProducts;
