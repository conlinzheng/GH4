let allProducts = [];
let currentFilter = 'all';

async function initFrontend() {
    initI18n();
    
    const loadingEl = document.getElementById('productsGrid');
    if (loadingEl) {
        loadingEl.innerHTML = '<div class="loading">' + t('loading') + '</div>';
    }
    
    loadLocalImages();
    
    window.addEventListener('languageChanged', () => {
        renderProducts(allProducts);
        renderSeriesFilter();
    });
}

function loadLocalImages() {
    const seriesMap = {
        1: { id: 'PU系列', name: { zh: 'PU系列', en: 'PU Series', ko: 'PU 시리즈' } },
        2: { id: '真皮系列', name: { zh: '真皮系列', en: 'Genuine Leather', ko: '진피 시리즈' } },
        3: { id: '短靴系列', name: { zh: '短靴系列', en: 'Boots', ko: '부츠 시리즈' } },
        4: { id: '乐福系列', name: { zh: '乐福系列', en: 'Loafers', ko: '로퍼 시리즈' } },
        5: { id: '春季新款', name: { zh: '春季新款', en: 'Spring New', ko: '봄 신상' } },
        6: { id: '夏季清凉', name: { zh: '夏季清凉', en: 'Summer Cool', ko: '여름 시원함' } },
        7: { id: '秋季时尚', name: { zh: '秋季时尚', en: 'Autumn Fashion', ko: '가을 패션' } },
        8: { id: '冬季保暖', name: { zh: '冬季保暖', en: 'Winter Warm', ko: '겨울保暖' } }
    };
    
    allProducts = [];
    
    for (let i = 1; i <= 50; i++) {
        const seriesIndex = Math.ceil(i / 6);
        const series = seriesMap[seriesIndex] || seriesMap[1];
        
        allProducts.push({
            seriesId: series.id,
            seriesName: series.name,
            filename: `${i}.png`,
            name: { zh: `产品 ${i}`, en: `Product ${i}`, ko: `제품 ${i}` },
            description: { zh: '优质鞋品，舒适时尚', en: 'High quality shoes, comfortable and stylish', ko: '고품질 신발, 편안하고 세련됨' },
            price: ''
        });
    }
    
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
                     data-src="img1-50/${product.filename}" 
                     src="img1-50/${product.filename}"
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
    
    const seriesMap = new Map();
    allProducts.forEach(product => {
        if (!seriesMap.has(product.seriesId)) {
            seriesMap.set(product.seriesId, product.seriesName || { zh: product.seriesId });
        }
    });
    
    const buttons = [{
        id: 'all',
        name: t('allSeries')
    }];
    
    seriesMap.forEach((seriesNameObj, seriesId) => {
        buttons.push({
            id: seriesId,
            name: getLocalizedField(seriesNameObj, 'name') || seriesId
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