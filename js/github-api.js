const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'conlinzheng';
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
        const contents = await fetchDirectory(`产品图/${seriesId}`);
        const imageFiles = contents.filter(item => 
            item.type === 'file' && 
            /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name)
        );
        
        const products = {};
        imageFiles.forEach(img => {
            const baseName = img.name.replace(/\s*\(\d+\)\.\w+$/, '');
            products[img.name] = {
                name: { zh: baseName, en: baseName, ko: baseName },
                description: { zh: '', en: '', ko: '' },
                price: ''
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