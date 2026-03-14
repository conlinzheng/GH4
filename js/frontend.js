let allProducts = [];
let currentFilter = 'all';
let siteConfig = {
    siteName: '鞋类产品展示',
    contact: { email: '', phone: '', address: '' },
    footer: { text: '© 2024 鞋类品牌. All rights reserved.' },
    heroTitle: { zh: '精选鞋款', en: 'Featured Shoes', ko: '추천 신발' },
    heroSubtitle: { zh: '舒适时尚 品质保证', en: 'Comfortable and Stylish', ko: '편안하고 세련된 품질 보장' },
    heroSlides: [
        { image: 'img1-50/1.png', title: '', subtitle: '' },
        { image: 'img1-50/2.png', title: '', subtitle: '' },
        { image: 'img1-50/3.png', title: '', subtitle: '' },
        { image: 'img1-50/4.png', title: '', subtitle: '' },
        { image: 'img1-50/5.png', title: '', subtitle: '' }
    ]
};

async function initFrontend() {
    initI18n();
    
    const loadingEl = document.getElementById('productsGrid');
    if (loadingEl) {
        loadingEl.innerHTML = '<div class="loading">' + t('loading') + '</div>';
    }
    
    await loadConfigFromGitHub();
    allProducts = await ProductDataManager.loadAllProducts();
    
    renderHeroSlider();
    applyConfig();
    renderProducts(allProducts);
    renderSeriesFilter();
    
    window.addEventListener('languageChanged', () => {
        renderProducts(allProducts);
        renderSeriesFilter();
        applyConfig();
    });
}

async function loadConfigFromGitHub() {
    try {
        const configRes = await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/products-config.json`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (configRes.ok) {
            const configData = await configRes.json();
            const configContent = JSON.parse(decodeURIComponent(escape(atob(configData.content))));
            siteConfig = { ...siteConfig, ...configContent };
        }
    } catch (e) {
        console.log('Failed to load config from GitHub:', e);
    }
}

function applyConfig() {
    const logoEl = document.querySelector('.logo');
    if (logoEl && siteConfig.siteName) {
        logoEl.textContent = siteConfig.siteName;
    }
    
    const footerEl = document.getElementById('footerContent');
    if (footerEl && siteConfig.footer?.text) {
        footerEl.querySelector('p').textContent = siteConfig.footer.text;
    }
    
    const heroTitleEl = document.getElementById('heroTitle');
    const heroSubtitleEl = document.getElementById('heroSubtitle');
    const lang = localStorage.getItem('language') || 'zh';
    
    if (heroTitleEl && siteConfig.heroTitle) {
        heroTitleEl.textContent = siteConfig.heroTitle[lang] || siteConfig.heroTitle.zh || '';
    }
    if (heroSubtitleEl && siteConfig.heroSubtitle) {
        heroSubtitleEl.textContent = siteConfig.heroSubtitle[lang] || siteConfig.heroSubtitle.zh || '';
    }
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
    
    grid.innerHTML = filteredProducts.map((product, index) => {
        const name = getLocalizedField(product, 'name');
        const description = getLocalizedField(product, 'description');
        const mainImage = product.mainImage || product.filename;
        
        return `
            <div class="product-card" data-index="${index}">
                <img class="product-image lazy" 
                     data-src="产品图/${product.seriesId}/${mainImage}" 
                     src="产品图/${product.seriesId}/${mainImage}"
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
    
    grid.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const index = parseInt(card.dataset.index);
            openProductModal(filteredProducts[index]);
        });
    });
    
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
    
    const slides = siteConfig.heroSlides || [];
    if (slides.length === 0) return;
    
    slider.innerHTML = slides.map((slide, index) => `
        <div class="slide ${index === 0 ? 'active' : ''}" data-index="${index}">
            <img src="${slide.image}" alt="Banner ${index + 1}">
        </div>
    `).join('') + `
        <div class="slider-nav">
            ${slides.map((_, index) => `<span class="nav-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>`).join('')}
        </div>
    `;
    
    let currentSlide = 0;
    const slideElements = slider.querySelectorAll('.slide');
    const navDots = slider.querySelectorAll('.nav-dot');
    
    function showSlide(index) {
        slideElements.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        navDots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        currentSlide = index;
    }
    
    setInterval(() => {
        const nextSlide = (currentSlide + 1) % slides.length;
        showSlide(nextSlide);
    }, 5000);
    
    navDots.forEach(dot => {
        dot.addEventListener('click', () => {
            showSlide(parseInt(dot.dataset.index));
        });
    });
}

function openProductModal(product) {
    const modal = document.getElementById('productModal');
    const gallery = document.getElementById('modalGallery');
    const info = document.getElementById('modalInfo');
    
    if (!modal || !gallery || !info) return;
    
    const name = getLocalizedField(product, 'name');
    const description = getLocalizedField(product, 'description');
    const allImages = [product.mainImage, ...(product.detailImages || [])].filter(Boolean);
    
    let currentImageIndex = 0;
    
    function updateMainImage(index) {
        currentImageIndex = index;
        const mainImg = gallery.querySelector('.main-image img');
        if (mainImg) {
            mainImg.src = `产品图/${product.seriesId}/${allImages[index]}`;
        }
        gallery.querySelectorAll('.thumbnail').forEach((t, i) => {
            t.classList.toggle('active', i === index);
        });
    }
    
    function openLightbox(imageSrc) {
        let lightbox = document.getElementById('imageLightbox');
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'imageLightbox';
            lightbox.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:3000;cursor:pointer;';
            lightbox.innerHTML = '<img id="lightboxImg" style="max-width:95%;max-height:95%;object-fit:contain;">';
            document.body.appendChild(lightbox);
            lightbox.addEventListener('click', () => lightbox.style.display = 'none');
        }
        document.getElementById('lightboxImg').src = imageSrc;
        lightbox.style.display = 'flex';
    }
    
    gallery.innerHTML = `
        <div class="image-carousel">
            <button class="carousel-btn prev-btn">&lt;</button>
            <div class="main-image">
                <img src="产品图/${product.seriesId}/${allImages[0]}" alt="${name}">
            </div>
            <button class="carousel-btn next-btn">&gt;</button>
        </div>
        <div class="thumbnails">
            ${allImages.map((img, idx) => `
                <img src="产品图/${product.seriesId}/${img}" 
                     alt="${name}" 
                     class="thumbnail ${idx === 0 ? 'active' : ''}"
                     data-index="${idx}">
            `).join('')}
        </div>
    `;
    
    gallery.querySelector('.prev-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const newIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
        updateMainImage(newIndex);
    });
    
    gallery.querySelector('.next-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const newIndex = (currentImageIndex + 1) % allImages.length;
        updateMainImage(newIndex);
    });
    
    gallery.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(thumb.dataset.index);
            updateMainImage(index);
        });
    });
    
    gallery.querySelector('.main-image img').addEventListener('click', (e) => {
        e.stopPropagation();
        const currentSrc = e.target.src;
        openLightbox(currentSrc);
    });
    
    const materials = product.materials || {};
    const custom = product.customization || { available: false, minOrder: 0 };
    
    info.innerHTML = `
        <h2 class="product-title">${name}</h2>
        <p class="product-description">${description || ''}</p>
        
        <div class="product-details">
            <div class="detail-row">
                <span class="label">鞋面材质:</span>
                <span class="value">${materials.upper || '未设置'}</span>
            </div>
            <div class="detail-row">
                <span class="label">内里材质:</span>
                <span class="value">${materials.lining || '未设置'}</span>
            </div>
            <div class="detail-row">
                <span class="label">鞋底材质:</span>
                <span class="value">${materials.sole || '未设置'}</span>
            </div>
            <div class="detail-row">
                <span class="label">支持定制:</span>
                <span class="value">${custom.available ? '是' : '否'}</span>
            </div>
            <div class="detail-row">
                <span class="label">起订量:</span>
                <span class="value">${custom.available ? custom.minOrder + ' 双' : '-'}</span>
            </div>
            <div class="detail-row price-row">
                <span class="label">价格:</span>
                <span class="value price">${product.price ? `¥${product.price}` : '未设置'}</span>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    document.getElementById('closeModal').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', initFrontend);