let productsData = {};
let seriesData = [];
let configData = {};

async function loadFromGitHub() {
    const seriesList = await githubSync.fetchSeriesList();
    seriesData = seriesList;
    
    for (const series of seriesList) {
        const metadata = await githubSync.fetchSeriesMetadata(series.id);
        const images = await githubSync.fetchSeriesImages(series.id);
        
        if (metadata) {
            productsData[series.id] = metadata;
        } else {
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
    
    try {
        const configFile = await githubSync.fetchFile('products-config.json');
        if (configFile.content) {
            configData = JSON.parse(atob(configFile.content));
        }
    } catch (e) {
        configData = getDefaultConfig();
    }
    
    return { productsData, seriesData, configData };
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
