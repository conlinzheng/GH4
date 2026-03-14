let productsData = {};
let seriesData = [];
let configData = {};

function getBaseProductName(filename) {
    return filename.replace(/\s*\(\d+\)\.\w+$/, '');
}

function groupImagesAsProducts(images) {
    const productMap = {};
    
    images.forEach(img => {
        const baseName = getBaseProductName(img.name || img);
        
        if (!productMap[baseName]) {
            productMap[baseName] = {
                name: { zh: baseName, en: baseName, ko: baseName },
                description: { zh: '', en: '', ko: '' },
                price: '',
                materials: {},
                images: []
            };
        }
        
        productMap[baseName].images.push(img.name || img);
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

async function loadFromGitHub() {
    try {
        const token = localStorage.getItem('github_token');
        if (!token) {
            loadLocalData();
            return { productsData, seriesData, configData };
        }
        
        const seriesList = await githubSync.fetchSeriesList();
        seriesData = seriesList;
        
        for (const series of seriesList) {
            const images = await githubSync.fetchSeriesImages(series.id);
            
            if (images.length > 0) {
                const products = groupImagesAsProducts(images);
                
                const savedMetadata = await githubSync.fetchSeriesMetadata(series.id);
                if (savedMetadata && savedMetadata.products) {
                    Object.keys(products).forEach(key => {
                        if (savedMetadata.products[key]) {
                            products[key] = { ...products[key], ...savedMetadata.products[key] };
                        }
                    });
                }
                
                productsData[series.id] = {
                    seriesName: savedMetadata?.seriesName || { zh: series.id, en: series.id, ko: series.id },
                    products: products
                };
            }
        }
        
        configData = getDefaultConfig();
    } catch (e) {
        console.log('Failed to load from GitHub, using local data:', e);
        loadLocalData();
    }
    
    return { productsData, seriesData, configData };
}

function loadLocalData() {
    seriesData = [
        { id: '1-PU系列', name: '1-PU系列' },
        { id: '2-真皮系列', name: '2-真皮系列' },
        { id: '3-短靴系列', name: '3-短靴系列' },
        { id: '4-乐福系列', name: '4-乐福系列' },
        { id: '5-春季', name: '5-春季' },
        { id: '6-夏季', name: '6-夏季' },
        { id: '7-秋季', name: '7-秋季' },
        { id: '8-冬季', name: '8-冬季' }
    ];
    
    productsData = {};
    
    async function loadImagesFromGitHub() {
        const token = localStorage.getItem('github_token');
        if (!token) return;
        
        for (const series of seriesData) {
            try {
                const res = await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/产品图/${series.id}`, {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                if (res.ok) {
                    const contents = await res.json();
                    const images = contents
                        .filter(item => item.type === 'file' && item.name.match(/\.(jpg|jpeg|png|gif)$/i))
                        .map(item => item.name);
                    if (images.length > 0) {
                        const products = groupImagesAsProducts(images);
                        productsData[series.id] = {
                            seriesName: { zh: series.name, en: series.name, ko: series.name },
                            products: products
                        };
                    }
                }
            } catch (e) {
                console.log(`Failed to load images for ${series.id}:`, e);
            }
        }
    }
    
    loadImagesFromGitHub().then(() => {
        configData = getDefaultConfig();
    });
}

function getDefaultConfig() {
    return {
        siteName: '鞋类产品展示',
        contact: {
            email: 'contact@example.com',
            phone: '+86 123 4567 8900',
            address: '某某市某某区某某街道'
        },
        footer: {
            text: '© 2024 鞋类品牌. All rights reserved.'
        }
    };
}

function getProductsBySeries(seriesId) {
    if (!productsData[seriesId]) return [];
    return productsData[seriesId].products || {};
}

function updateProduct(seriesId, productId, data) {
    if (!productsData[seriesId]) {
        productsData[seriesId] = { seriesName: {}, products: {} };
    }
    if (!productsData[seriesId].products) {
        productsData[seriesId].products = {};
    }
    productsData[seriesId].products[productId] = data;
}

function addProduct(seriesId, productId, data) {
    if (!productsData[seriesId]) {
        productsData[seriesId] = { seriesName: {}, products: {} };
    }
    if (!productsData[seriesId].products) {
        productsData[seriesId].products = {};
    }
    productsData[seriesId].products[productId] = data;
}

function deleteProduct(seriesId, productId) {
    if (productsData[seriesId] && productsData[seriesId].products) {
        delete productsData[seriesId].products[productId];
    }
}

async function saveToGitHub() {
    const token = localStorage.getItem('github_token');
    if (!token) {
        showNotification('请先设置 GitHub Token', 'warning');
        return;
    }
    
    for (const seriesId of Object.keys(productsData)) {
        await githubSync.pushSeriesMetadata(seriesId, productsData[seriesId]);
    }
    
    const configContent = JSON.stringify(configData, null, 2);
    await githubSync.commitFile('products-config.json', configContent, 'Update config', false);
}

async function resetProducts() {
    const token = localStorage.getItem('github_token');
    if (!token) {
        showNotification('请先设置 GitHub Token', 'warning');
        throw new Error('请先设置 GitHub Token');
    }
    
    productsData = {};
    seriesData = [];
    
    const seriesList = await githubSync.fetchSeriesList();
    seriesData = seriesList;
    
    for (const series of seriesList) {
        const images = await githubSync.fetchSeriesImages(series.id);
        
        if (images.length > 0) {
            const products = groupImagesAsProducts(images);
            
            productsData[series.id] = {
                seriesName: { zh: series.id, en: series.id, ko: series.id },
                products: products
            };
        }
    }
    
    let savedCount = 0;
    for (const seriesId of Object.keys(productsData)) {
        await githubSync.pushSeriesMetadata(seriesId, productsData[seriesId]);
        savedCount++;
    }
    
    showNotification(`已保存 ${savedCount} 个系列的JSON文件到GitHub`, 'success');
    return { productsData, seriesData };
}

function getSeriesData() {
    return seriesData;
}

function getConfigData() {
    return configData;
}

function setConfigData(data) {
    configData = data;
}

window.dataManager = {
    loadFromGitHub,
    getProductsBySeries,
    updateProduct,
    addProduct,
    deleteProduct,
    saveToGitHub,
    resetProducts,
    getSeriesData,
    getConfigData,
    setConfigData
};