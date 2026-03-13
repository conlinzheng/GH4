let allProducts = [];
let currentFilter = 'all';

async function initFrontend() {
    initI18n();
    
    const loadingEl = document.getElementById('productsGrid');
    if (loadingEl) {
        loadingEl.innerHTML = '<div class="loading">' + t('loading') + '</div>';
    }
    
    try {
        const cachedProducts = get('products');
        if (cachedProducts) {
            allProducts = cachedProducts;
            renderProducts(allProducts);
            renderSeriesFilter();
        }
        
        const products = await getAllProducts();
        allProducts = products;
        set('products', products);
        renderProducts(products);
        renderSeriesFilter();
        
    } catch (error) {
        handleError(error);
    }
    
    window.addEventListener('languageChanged', () => {
        renderProducts(allProducts);
        renderSeriesFilter();
    });
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
        const seriesName = getLocalizedField(product.seriesName || {}, '');
        
        const imagePath = `产品图/${product.seriesId}/${product.filename}`;
        
        return `
            <div class="product-card">
                <img class="product-image lazy" 
                     data-src="${imagePath}" 
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
            const seriesName = product.seriesName ? getLocalizedField(product.seriesName, 'seriesName') : product.seriesId;
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
            name: getLocalizedField(seriesNameObj, 'seriesName') || seriesId
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
        if (document.querySelector(`img1-50/${i}.png`)) {
            bgImages.push(`img1-50/${i}.png`);
        }
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