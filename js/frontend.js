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
    
    allProducts = [];
    
    seriesData.forEach(series => {
        allProducts.push({
            seriesId: series.id,
            seriesName: series.name,
            isSeries: true
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
        if (product.isSeries) {
            const name = getLocalizedField(product, 'seriesName');
            return `
                <div class="product-card series-card">
                    <div class="series-image-container">
                        <img class="product-image" 
                             src="产品图/${product.id}/"
                             alt="${name}"
                             onerror="this.style.display='none'">
                        <div class="series-overlay">
                            <div class="product-name">${name}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
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
    
    const buttons = [{
        id: 'all',
        name: t('allSeries')
    }];
    
    const uniqueSeries = [];
    allProducts.forEach(product => {
        if (product.isSeries && !uniqueSeries.find(s => s.id === product.seriesId)) {
            uniqueSeries.push(product);
        }
    });
    
    uniqueSeries.forEach(product => {
        buttons.push({
            id: product.seriesId,
            name: getLocalizedField(product, 'seriesName') || product.seriesId
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