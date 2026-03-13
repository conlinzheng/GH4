let allProducts = [];
let currentFilter = 'all';

async function initFrontend() {
    initI18n();
    
    const loadingEl = document.getElementById('productsGrid');
    if (loadingEl) {
        loadingEl.innerHTML = '<div class="loading">' + t('loading') + '</div>';
    }
    
    loadLocalImages();
    renderHeroSlider();
    
    window.addEventListener('languageChanged', () => {
        renderProducts(allProducts);
        renderSeriesFilter();
    });
}

function loadLocalImages() {
    const seriesData = [
        { id: '1-PU系列', name: { zh: 'PU系列', en: 'PU Series', ko: 'PU 시리즈' } },
        { id: '2-真皮系列', name: { zh: '真皮系列', en: 'Genuine Leather', ko: '진피 시리즈' } },
        { id: '3-短靴系列', name: { zh: '短靴系列', en: 'Boots', ko: '부츠 시리즈' } },
        { id: '4-乐福系列', name: { zh: '乐福系列', en: 'Loafers', ko: '로퍼 시리즈' } },
        { id: '5-春季', name: { zh: '春季新款', en: 'Spring New', ko: '봄 신상' } },
        { id: '6-夏季', name: { zh: '夏季清凉', en: 'Summer Cool', ko: '여름 시원함' } },
        { id: '7-秋季', name: { zh: '秋季时尚', en: 'Autumn Fashion', ko: '가을 패션' } },
        { id: '8-冬季', name: { zh: '冬季保暖', en: 'Winter Warm', ko: '겨울保暖' } }
    ];
    
    const productFiles = {
        '1-PU系列': ['产品1 (1).jpg', '产品1 (2).jpg', '产品1 (3).jpg', '产品1 (4).jpg', '产品1 (5).jpg', '产品2 (1).jpg', '产品2 (2).jpg', '产品2 (3).jpg', '产品2 (4).jpg', '产品2 (5).jpg', '产品2 (6).jpg'],
        '2-真皮系列': ['勃肯1 (1).jpg', '勃肯1 (2).jpg', '勃肯1 (3).jpg', '勃肯1 (4).jpg', '勃肯1 (5).jpg', '勃肯1 (6).jpg', '勃肯1 (7).jpg'],
        '3-短靴系列': ['00A (1).jpg', '00A (2).jpg', '00A (3).jpg', '00A (4).jpg', '00A (5).jpg', '00A (6).jpg', '00A (7).jpg'],
        '4-乐福系列': ['B5 (1).jpg', 'B5 (2).jpg', 'B5 (3).jpg', 'B5 (4).jpg', 'B5 (5).jpg', 'B5 (6).jpg'],
        '5-春季': ['新款1 (1).jpg', '新款1 (2).jpg', '新款1 (3).jpg', '新款1 (4).jpg', '新款1 (5).jpg', '新款1 (6).jpg', '新款2 (1).jpg', '新款2 (2).jpg', '新款2 (3).jpg', '新款2 (4).jpg', '新款2 (5).jpg', '新款2 (6).jpg', '新款3 (1).jpg', '新款3 (2).jpg', '新款4 (1).jpg', '新款4 (2).jpg', '新款5 (1).jpg', '新款5 (2).jpg', '新款6 (1).jpg', '新款6 (2).jpg', '新款7 (1).jpg', '新款7 (2).jpg', '新款8 (1).jpg', '新款8 (2).jpg', '新款9 (1).jpg', '新款9 (2).jpg', '新款10 (1).jpg', '新款10 (2).jpg', '新款11 (1).jpg', '新款11 (2).jpg'],
        '6-夏季': ['圆头 (1).jpg', '圆头 (2).jpg', '拖鞋 (1).jpg', '拖鞋 (2).jpg', '拖鞋2 (1).jpg', '拖鞋2 (2).jpg'],
        '7-秋季': ['B6 (1).jpg', 'B6 (2).jpg', 'B6 (3).jpg', 'B6 (4).jpg', 'B6 (5).jpg', 'B6 (6).jpg', 'B6 (7).jpg'],
        '8-冬季': ['B7 (1).jpg', 'B7 (2).jpg', 'B7 (3).jpg', 'B7 (4).jpg', 'B7 (5).jpg', 'B7 (6).jpg', 'B7 (7).jpg']
    };
    
    allProducts = [];
    
    seriesData.forEach(series => {
        const files = productFiles[series.id] || [];
        files.forEach((filename, index) => {
            const nameWithoutExt = filename.replace(/\s*\(\d+\)\.\w+$/, '');
            allProducts.push({
                seriesId: series.id,
                seriesName: series.name,
                filename: filename,
                name: { 
                    zh: nameWithoutExt, 
                    en: nameWithoutExt, 
                    ko: nameWithoutExt 
                },
                description: { 
                    zh: '优质鞋品，舒适时尚', 
                    en: 'High quality shoes', 
                    ko: '고품질 신발' 
                },
                price: ''
            });
        });
    });
    
    renderProducts(allProducts);
    renderSeriesFilter();
}

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    let filteredProducts = products;
    if (currentFilter !== 'all') {
        filteredProducts = products.filter(p => p.seriesId === currentFilter);
    }
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = '<div class="no-products">' + t('noProducts') + '</div>';
        return;
    }
    
    grid.innerHTML = filteredProducts.map(product => {
        const name = getLocalizedField(product, 'name');
        const description = getLocalizedField(product, 'description');
        
        return `
            <div class="product-card">
                <img class="product-image lazy" 
                     data-src="产品图/${product.seriesId}/${product.filename}" 
                     src="产品图/${product.seriesId}/${product.filename}"
                     alt="${name}"
                     onerror="this.src='img1-50/1.png'">
                <div class="product-info">
                    <div class="product-name">${name}</div>
                    <div class="product-desc">${description || ''}</div>
                    ${product.price ? `<div class="product-price">¥${product.price}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    initLazyLoad();
}

function renderSeriesFilter() {
    const filterContainer = document.getElementById('seriesFilter');
    if (!filterContainer) return;
    
    const buttons = [{
        id: 'all',
        name: t('allSeries')
    }];
    
    const uniqueSeries = new Map();
    allProducts.forEach(product => {
        if (!uniqueSeries.has(product.seriesId)) {
            uniqueSeries.set(product.seriesId, product.seriesName);
        }
    });
    
    uniqueSeries.forEach((seriesName, seriesId) => {
        buttons.push({
            id: seriesId,
            name: getLocalizedField(seriesName, 'seriesName') || seriesId
        });
    });
    
    filterContainer.innerHTML = buttons.map(btn => `
        <button class="filter-btn ${currentFilter === btn.id ? 'active' : ''}" 
                data-series="${btn.id}">
            ${btn.name}
        </button>
    `).join('');
    
    filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.series;
            renderSeriesFilter();
            renderProducts(allProducts);
        });
    });
}

function renderHeroSlider() {
    const slider = document.getElementById('heroSlider');
    if (!slider) return;
    
    const bgImages = [];
    for (let i = 1; i <= 5; i++) {
        bgImages.push(`img1-50/${i}.png`);
    }
    
    if (bgImages.length === 0) {
        return;
    }
    
    slider.innerHTML = bgImages.map((src, index) => `
        <img src="${src}" alt="Banner ${index + 1}" style="position:absolute;width:100%;height:100%;object-fit:cover;opacity:0.3;">
    `).join('');
    
    let currentSlide = 0;
    setInterval(() => {
        currentSlide = (currentSlide + 1) % bgImages.length;
    }, 5000);
}

document.addEventListener('DOMContentLoaded', initFrontend);