let productsData = {};
let seriesData = [];
let configData = {};

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
            const metadata = await githubSync.fetchSeriesMetadata(series.id);
            const images = await githubSync.fetchSeriesImages(series.id);
            
            if (metadata) {
                productsData[series.id] = metadata;
            } else if (images.length > 0) {
                const products = {};
                images.forEach(img => {
                    const baseName = img.name.replace(/\.[^/.]+$/, '');
                    products[img.name] = {
                        name: { zh: baseName, en: baseName, ko: baseName },
                        description: { zh: '', en: '', ko: '' },
                        price: '',
                        materials: {}
                    };
                });
                
                productsData[series.id] = {
                    seriesName: { zh: series.id, en: series.id, ko: series.id },
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
    
    Object.entries(productFiles).forEach(([seriesId, files]) => {
        const products = {};
        files.forEach(filename => {
            const baseName = filename.replace(/\s*\(\d+\)\.\w+$/, '');
            products[filename] = {
                name: { zh: baseName, en: baseName, ko: baseName },
                description: { zh: '', en: '', ko: '' },
                price: '',
                materials: {}
            };
        });
        
        productsData[seriesId] = {
            seriesName: { zh: seriesId, en: seriesId, ko: seriesId },
            products: products
        };
    });
    
    configData = getDefaultConfig();
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
    getSeriesData,
    getConfigData,
    setConfigData
};