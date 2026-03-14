let currentEditingProduct = null;
let resetProductsInitialized = false;

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
    
    if (!resetProductsInitialized) {
        resetProductsInitialized = true;
        document.getElementById('resetProductsBtn').addEventListener('click', async function() {
            if (!confirm('确定要重置产品列表吗？这将重新扫描GitHub仓库中的产品图片文件夹。')) return;
            
            try {
                const productsList = document.getElementById('productsList');
                productsList.innerHTML = '<div class="loading">正在重置产品列表...</div>';
                
                await dataManager.resetProducts();
                renderProducts();
                showNotification('产品列表已重置并保存到GitHub', 'success');
            } catch (e) {
                showNotification('重置失败: ' + e.message, 'error');
            }
        });
    }
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
            productEntries.forEach(([productKey, product]) => {
                html += renderProductItem(series.id, productKey, product);
            });
        }
        
        html += '</div>';
    });
    
    productsList.innerHTML = html;
    
    productsList.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const seriesId = btn.dataset.series;
            const productKey = btn.dataset.productkey;
            openProductEditor(seriesId, productKey);
        });
    });
    
    productsList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const seriesId = btn.dataset.series;
            const productKey = btn.dataset.productkey;
            if (confirm('确定要删除这个产品吗？')) {
                dataManager.deleteProduct(seriesId, productKey);
                renderProducts();
                showNotification('产品已删除', 'success');
            }
        });
    });
}

function renderProductItem(seriesId, productKey, product) {
    const name = product.name?.zh || productKey;
    const images = product.images || [];
    const mainImage = images[0] || '';
    const imageCount = images.length;
    const materials = product.materials || {};
    const custom = product.customization || { available: false, minOrder: 0 };
    
    const materialInfo = [];
    if (materials.upper) materialInfo.push(`鞋面: ${materials.upper}`);
    if (materials.lining) materialInfo.push(`内里: ${materials.lining}`);
    if (materials.sole) materialInfo.push(`鞋底: ${materials.sole}`);
    
    const customInfo = custom.available ? ` | 可定制(起订${custom.minOrder}双)` : '';
    
    return `
        <div class="product-item">
            <div class="product-thumb">
                <img src="../产品图/${seriesId}/${mainImage}" alt="${name}" onerror="this.src='../img1-50/1.png'" />
            </div>
            <div class="product-info">
                <div class="product-name">${name}</div>
                <div class="product-meta">
                    ${mainImage} | ${imageCount}张图 | ¥${product.price || '未设置'}
                    ${customInfo}
                </div>
                ${materialInfo.length > 0 ? `<div class="product-materials">${materialInfo.join(' | ')}</div>` : ''}
            </div>
            <div class="product-actions">
                <button class="btn btn-secondary edit-btn" data-series="${seriesId}" data-productkey="${productKey}">编辑</button>
                <button class="btn btn-danger delete-btn" data-series="${seriesId}" data-productkey="${productKey}">删除</button>
            </div>
        </div>
    `;
}

function openProductEditor(seriesId, productKey) {
    const products = dataManager.getProductsBySeries(seriesId);
    const product = products[productKey];
    currentEditingProduct = { seriesId, productKey };
    
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productEditForm');
    
    const images = product?.images || [];
    const materials = product?.materials || {};
    const custom = product?.customization || { available: false, minOrder: 0 };
    
    title.textContent = `编辑产品 - ${productKey} (${images.length}张图片)`;
    
    form.innerHTML = `
        <div class="form-group">
            <label>产品图片</label>
            <div class="image-gallery">
                ${images.map((img, idx) => `
                    <div class="gallery-item ${idx === 0 ? 'main' : ''}">
                        <img src="../产品图/${seriesId}/${img}" alt="${img}" onerror="this.src='../img1-50/1.png'" />
                        <span class="image-label">${idx === 0 ? '主图' : '详情图'}</span>
                    </div>
                `).join('')}
            </div>
        </div>
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
        <div class="form-group">
            <label>材质信息</label>
            <div class="materials-grid">
                <div class="material-item">
                    <span>鞋面材质:</span>
                    <input type="text" class="form-control material-input" data-material="upper" value="${materials.upper || ''}" placeholder="如: 真皮/PU/帆布">
                </div>
                <div class="material-item">
                    <span>内里材质:</span>
                    <input type="text" class="form-control material-input" data-material="lining" value="${materials.lining || ''}" placeholder="如: 棉/羊毛/透气网布">
                </div>
                <div class="material-item">
                    <span>鞋底材质:</span>
                    <input type="text" class="form-control material-input" data-material="sole" value="${materials.sole || ''}" placeholder="如: 橡胶/EVA/聚氨酯">
                </div>
            </div>
        </div>
        <div class="form-group">
            <label>定制服务</label>
            <div class="customization-options">
                <label class="checkbox-label">
                    <input type="checkbox" class="customization-check" ${custom.available ? 'checked' : ''}>
                    支持定制
                </label>
                <div class="min-order-field" style="display: ${custom.available ? 'block' : 'none'};">
                    <span>起订量:</span>
                    <input type="number" class="form-control min-order-input" value="${custom.minOrder || 0}" min="0" placeholder="双">
                </div>
            </div>
        </div>
    `;
    
    const customCheck = form.querySelector('.customization-check');
    const minOrderField = form.querySelector('.min-order-field');
    customCheck.addEventListener('change', () => {
        minOrderField.style.display = customCheck.checked ? 'block' : 'none';
    });
    
    new Tabs('productEditForm');
    
    modal.style.display = 'flex';
    
    document.getElementById('saveProductBtn').onclick = saveProduct;
    document.getElementById('cancelProductBtn').onclick = () => {
        modal.style.display = 'none';
    };
}

function saveProduct() {
    if (!currentEditingProduct) return;
    
    const { seriesId, productKey } = currentEditingProduct;
    
    const products = dataManager.getProductsBySeries(seriesId);
    const existingProduct = products[productKey];
    
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
    
    const materialInputs = document.querySelectorAll('.material-input');
    const materials = {};
    materialInputs.forEach(input => {
        materials[input.dataset.material] = input.value;
    });
    
    const customCheck = document.querySelector('.customization-check');
    const minOrderInput = document.querySelector('.min-order-input');
    const customization = {
        available: customCheck.checked,
        minOrder: parseInt(minOrderInput.value) || 0
    };
    
    const productData = {
        name,
        description,
        price: priceInput.value,
        materials,
        customization,
        images: existingProduct?.images || []
    };
    
    dataManager.updateProduct(seriesId, productKey, productData);
    
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
        
        const groupedImages = {};
        newImages.forEach(img => {
            const baseName = img.filename.replace(/\s*\(\d+\)\.\w+$/, '');
            if (!groupedImages[img.seriesId]) {
                groupedImages[img.seriesId] = {};
            }
            if (!groupedImages[img.seriesId][baseName]) {
                groupedImages[img.seriesId][baseName] = [];
            }
            groupedImages[img.seriesId][baseName].push(img.filename);
        });
        
        Object.entries(groupedImages).forEach(([seriesId, products]) => {
            Object.entries(products).forEach(([baseName, images]) => {
                images.sort((a, b) => {
                    const numA = parseInt(a.match(/\((\d+)\)/)?.[1] || '0');
                    const numB = parseInt(b.match(/\((\d+)\)/)?.[1] || '0');
                    return numA - numB;
                });
                
                const productData = {
                    name: { zh: baseName, en: baseName, ko: baseName },
                    description: { zh: '', en: '', ko: '' },
                    price: '',
                    materials: {},
                    customization: { available: false, minOrder: 0 },
                    images: images
                };
                dataManager.addProduct(seriesId, baseName, productData);
            });
        });
        
        renderProducts();
        showNotification(`发现 ${newImages.length} 张新图片，合并为 ${Object.values(groupedImages).reduce((sum, p) => sum + Object.keys(p).length, 0)} 个产品`, 'success');
    } catch (error) {
        productsList.innerHTML = `<div class="error-message">扫描失败: ${error.message}</div>`;
    }
}

window.initProducts = initProducts;
window.renderProducts = renderProducts;
window.handleResetProducts = async function() {
    if (!confirm('确定要重置产品列表吗？这将重新扫描GitHub仓库中的产品图片文件夹。')) return;
    
    try {
        const productsList = document.getElementById('productsList');
        productsList.innerHTML = '<div class="loading">正在重置产品列表...</div>';
        
        await dataManager.resetProducts();
        renderProducts();
        showNotification('产品列表已重置', 'success');
    } catch (e) {
        showNotification('重置失败: ' + e.message, 'error');
    }
};
