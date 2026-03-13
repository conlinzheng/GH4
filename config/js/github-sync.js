const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'GH4';
const REPO_NAME = 'GH4';

function getToken() {
    return localStorage.getItem('github_token');
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
    
    if (response.status === 204) {
        return null;
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

async function commitFile(path, content, message, isBase64 = true) {
    const token = getToken();
    if (!token) {
        throw new Error('请先设置GitHub Token');
    }
    
    const endpoint = `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    
    let sha = null;
    try {
        const existing = await fetchFile(path);
        sha = existing.sha;
    } catch (e) {
    }
    
    const encodedContent = isBase64 ? content : btoa(unescape(encodeURIComponent(content)));
    
    const body = {
        message: message,
        content: encodedContent
    };
    
    if (sha) {
        body.sha = sha;
    }
    
    return fetchAPI(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

async function fetchSeriesList() {
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

async function fetchSeriesMetadata(seriesId) {
    try {
        const metadataFile = await fetchFile(`产品图/${seriesId}/products.json`);
        if (metadataFile.content) {
            return JSON.parse(atob(metadataFile.content));
        }
    } catch (e) {
        console.log(`No products.json for series: ${seriesId}`);
    }
    
    return null;
}

async function fetchSeriesImages(seriesId) {
    try {
        const contents = await fetchDirectory(`产品图/${seriesId}`);
        return contents.filter(item => 
            item.type === 'file' && 
            /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name) &&
            !item.name.includes('products.json')
        );
    } catch (e) {
        console.error(`Failed to fetch images for series ${seriesId}:`, e);
        return [];
    }
}

async function pushSeriesMetadata(seriesId, metadata) {
    const content = JSON.stringify(metadata, null, 2);
    return commitFile(`产品图/${seriesId}/products.json`, content, `Update products.json for ${seriesId}`, false);
}

async function uploadImage(seriesId, file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64 = reader.result.split(',')[1];
                const path = `产品图/${seriesId}/${file.name}`;
                await commitFile(path, base64, `Upload ${file.name}`, true);
                resolve();
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function scanForNewImages() {
    const seriesList = await fetchSeriesList();
    const newImages = [];
    
    for (const series of seriesList) {
        const metadata = await fetchSeriesMetadata(series.id);
        const existingImages = metadata && metadata.products ? Object.keys(metadata.products) : [];
        const allImages = await fetchSeriesImages(series.id);
        
        const newForSeries = allImages
            .filter(img => !existingImages.includes(img.name))
            .map(img => ({
                seriesId: series.id,
                filename: img.name,
                downloadUrl: img.download_url
            }));
        
        newImages.push(...newForSeries);
    }
    
    return newImages;
}

window.githubSync = {
    getToken,
    fetchSeriesList,
    fetchSeriesMetadata,
    fetchSeriesImages,
    pushSeriesMetadata,
    uploadImage,
    scanForNewImages,
    commitFile
};