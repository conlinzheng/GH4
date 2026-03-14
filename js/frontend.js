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
    
    await loadFromGitHub();
    loadLocalImages();
    renderHeroSlider();
    applyConfig();
    
    window.addEventListener('languageChanged', () => {
        renderProducts(allProducts);
        renderSeriesFilter();
        applyConfig();
    });
}

async function loadFromGitHub() {
    const token = localStorage.getItem('github_token');
    if (!token) {
        console.log('No token, using local data');
        return;
    }
    
    try {
        const configRes = await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/products-config.json`, {
            headers: {
                'Authorization': `token ${token}`,
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

function getBaseProductName(filename) {
    return filename.replace(/\s*\(\d+\)\.\w+$/, '');
}

function groupImagesAsProducts(files, seriesId, seriesName) {
    const productMap = {};
    
    files.forEach(filename => {
        const baseName = getBaseProductName(filename);
        
        if (!productMap[baseName]) {
            productMap[baseName] = {
                seriesId: seriesId,
                seriesName: seriesName,
                productKey: baseName,
                images: []
            };
        }
        
        productMap[baseName].images.push(filename);
    });
    
    Object.values(productMap).forEach(product => {
        product.images.sort((a, b) => {
            const numA = parseInt(a.match(/\((\d+)\)/)?.[1] || '0');
            const numB = parseInt(b.match(/\((\d+)\)/)?.[1] || '0');
            return numA - numB;
        });
    });
    
    return productMap;
}

async function loadFromGitHubProducts() {
    const token = localStorage.getItem('github_token');
    if (!token) return null;
    
    try {
        const seriesRes = await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/产品图`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!seriesRes.ok) return null;
        
        const seriesList = await seriesRes.json();
        const productsMetadata = {};
        
        for (const series of seriesList) {
            if (series.type === 'dir') {
                try {
                    const metaRes = await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/产品图/${series.name}/products.json`, {
                        headers: {
                            'Authorization': `token ${token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });
                    
                    if (metaRes.ok) {
                        const metaData = await metaRes.json();
                        productsMetadata[series.name] = JSON.parse(decodeURIComponent(escape(atob(metaData.content))));
                    }
                } catch (e) {
                    console.log('No metadata for series:', series.name);
                }
            }
        }
        
        return productsMetadata;
    } catch (e) {
        console.log('Failed to load products from GitHub:', e);
        return null;
    }
}

async function loadLocalImages() {
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
    
    const productsMetadata = await loadFromGitHubProducts();
    
    allProducts = [];
    
    seriesData.forEach(series => {
        const files = productFiles[series.id] || [];
        const groupedProducts = groupImagesAsProducts(files, series.id, series.name);
        
        Object.values(groupedProducts).forEach(product => {
            const meta = productsMetadata?.[series.id]?.[product.productKey];
            
            allProducts.push({
                seriesId: product.seriesId,
                seriesName: product.seriesName,
                productKey: product.productKey,
                mainImage: product.images[0],
                detailImages: product.images.slice(1),
                name: meta?.name || { 
                    zh: product.productKey, 
                    en: product.productKey, 
                    ko: product.productKey 
                },
                description: meta?.description || { 
                    zh: '优质鞋品，舒适时尚', 
                    en: 'High quality shoes', 
                    ko: '고품질 신발' 
                },
                price: meta?.price || '',
                materials: meta?.materials || {},
                customization: meta?.customization || { available: false, minOrder: 0 }
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