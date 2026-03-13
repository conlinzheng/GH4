const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'GH4';
const REPO_NAME = 'GH4';

let githubToken = localStorage.getItem('github_token');

function setToken(token) {
    githubToken = token;
    localStorage.setItem('github_token', token);
}

function getToken() {
    return githubToken || localStorage.getItem('github_token');
}

async function fetchAPI(endpoint, options = {}) {
    const token = getToken();
    const url = `${GITHUB_API_BASE}${endpoint}`;
    
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `token ${token}`;
    }
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (response.status === 403) {
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');
        throw new Error('API请求频率超限，请稍后重试');
    }
    
    if (response.status === 401) {
        throw new Error('GitHub Token无效，请检查配置');
    }
    
    if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
    }
    
    return response.json();
}

async function fetchDirectory(path) {
    const endpoint = `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    return fetchAPI(endpoint);
}

async function fetchFile(path) {
    const endpoint = `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    return fetchAPI(endpoint);
}

async function fetchProductsConfig() {
    try {
        const data = await fetchFile('products-config.json');
        if (data.content) {
            return JSON.parse(atob(data.content));
        }
    } catch (e) {
        console.log('products-config.json not found, using defaults');
    }
    return getDefaultConfig();
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

async function getSeriesList() {
    try {
        const contents = await fetchDirectory('产品图');
        return contents
            .filter(item => item.type === 'dir')
            .map(dir => ({
                id: dir.name,
                name: dir.name
            }));
    } catch (e) {
        console.error('Failed to fetch series list:', e);
        return [];
    }
}

async function getSeriesProducts(seriesId) {
    try {
        const metadataFile = await fetchFile(`产品图/${seriesId}/products.json`);
        if (metadataFile.content) {
            return JSON.parse(atob(metadataFile.content));
        }
    } catch (e) {
        console.log(`No products.json found for series: ${seriesId}`);
    }
    
    try {
        const contents = await fetchDirectory(`产品图/${seriesId}`);
        const imageFiles = contents.filter(item => 
            item.type === 'file' && 
            /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name) &&
            !item.name.includes('products.json')
        );
        
        const products = {};
        imageFiles.forEach(img => {
            const baseName = img.name.replace(/\.[^/.]+$/, '');
            products[img.name] = {
                name: { zh: baseName, en: baseName, ko: baseName },
                description: { zh: '', en: '', ko: '' },
                price: '',
                materials: {}
            };
        });
        
        return {
            seriesName: { zh: seriesId, en: seriesId, ko: seriesId },
            products: products
        };
    } catch (e) {
        console.error(`Failed to fetch products for series ${seriesId}:`, e);
        return { seriesName: { zh: seriesId }, products: {} };
    }
}

async function getAllProducts() {
    const seriesList = await getSeriesList();
    const allProducts = [];
    
    for (const series of seriesList) {
        const seriesData = await getSeriesProducts(series.id);
        if (seriesData.products) {
            Object.entries(seriesData.products).forEach(([filename, product]) => {
                allProducts.push({
                    seriesId: series.id,
                    seriesName: seriesData.seriesName,
                    filename: filename,
                    ...product
                });
            });
        }
    }
    
    return allProducts;
}

async function saveSeriesMetadata(seriesId, metadata) {
    const token = getToken();
    if (!token) {
        throw new Error('请先配置GitHub Token');
    }
    
    const path = `产品图/${seriesId}/products.json`;
    const content = JSON.stringify(metadata, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    
    let sha = null;
    try {
        const existing = await fetchFile(path);
        sha = existing.sha;
    } catch (e) {
    }
    
    const endpoint = `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    const method = sha ? 'PUT' : 'PUT';
    
    const body = {
        message: `Update products.json for ${seriesId}`,
        content: encodedContent,
        sha: sha
    };
    
    return fetchAPI(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}
