const GITHUB_CONFIG = {
    owner: 'conlinzheng',
    repo: 'GH4',
    basePath: '产品图'
};

const SERIES_LIST = [
    { id: '1-PU系列', name: { zh: 'PU系列', en: 'PU Series', ko: 'PU 시리즈' } },
    { id: '2-真皮系列', name: { zh: '真皮系列', en: 'Genuine Leather', ko: '진피 시리즈' } },
    { id: '3-短靴系列', name: { zh: '短靴系列', en: 'Boots', ko: '부츠 시리즈' } },
    { id: '4-乐福系列', name: { zh: '乐福系列', en: 'Loafers', ko: '로퍼 시리즈' } },
    { id: '5-春季', name: { zh: '春季新款', en: 'Spring New', ko: '봄 신상' } },
    { id: '6-夏季', name: { zh: '夏季清凉', en: 'Summer Cool', ko: '여름 시원함' } },
    { id: '7-秋季', name: { zh: '秋季时尚', en: 'Autumn Fashion', ko: '가을 패션' } },
    { id: '8-冬季', name: { zh: '冬季保暖', en: 'Winter Warm', ko: '겨울保暖' } }
];

const ProductDataManager = {
    getSeriesList() {
        return SERIES_LIST;
    },

    async fetchGitHub(path) {
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
        const res = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (!res.ok) return null;
        return await res.json();
    },

    getBaseProductName(filename) {
        return filename.replace(/\s*\(\d+\)\.\w+$/, '');
    },

    sortImages(images) {
        return [...images].sort((a, b) => {
            const numA = parseInt(a.match(/\((\d+)\)/)?.[1] || '0');
            const numB = parseInt(b.match(/\((\d+)\)/)?.[1] || '0');
            return numA - numB;
        });
    },

    async loadAllProducts() {
        const allProducts = [];
        
        const seriesRes = await this.fetchGitHub(GITHUB_CONFIG.basePath);
        if (!seriesRes || !Array.isArray(seriesRes)) {
            console.log('Failed to load series list');
            return allProducts;
        }

        for (const series of SERIES_LIST) {
            const seriesProducts = await this.loadSeriesProducts(series.id, series.name);
            allProducts.push(...seriesProducts);
        }

        return allProducts;
    },

    async loadSeriesProducts(seriesId, seriesName) {
        const products = [];
        
        const contents = await this.fetchGitHub(`${GITHUB_CONFIG.basePath}/${seriesId}`);
        if (!contents || !Array.isArray(contents)) {
            return products;
        }

        const imageFiles = contents.filter(item => 
            item.type === 'file' && 
            item.name.match(/\.(jpg|jpeg|png|gif)$/i)
        );

        const productMap = {};
        imageFiles.forEach(file => {
            const baseName = this.getBaseProductName(file.name);
            if (!productMap[baseName]) {
                productMap[baseName] = { images: [] };
            }
            productMap[baseName].images.push(file.name);
        });

        let metadata = { products: {} };
        try {
            const metaRes = await this.fetchGitHub(`${GITHUB_CONFIG.basePath}/${seriesId}/products.json`);
            if (metaRes && metaRes.content) {
                const decoded = decodeURIComponent(escape(atob(metaRes.content)));
                metadata = JSON.parse(decoded);
            }
        } catch (e) {
            console.log('No metadata for series:', seriesId);
        }

        Object.entries(productMap).forEach(([key, data]) => {
            data.images = this.sortImages(data.images);
            
            const meta = metadata.products?.[key] || {};
            
            products.push({
                seriesId: seriesId,
                seriesName: seriesName,
                productKey: key,
                mainImage: data.images[0],
                detailImages: data.images.slice(1),
                name: meta.name || { zh: key, en: key, ko: key },
                description: meta.description || { zh: '', en: '', ko: '' },
                price: meta.price || '',
                materials: meta.materials || {}
            });
        });

        return products;
    },

    async saveSeriesMetadata(seriesId, seriesName, products) {
        const productMap = {};
        
        products.forEach(p => {
            productMap[p.productKey] = {
                images: p.detailImages?.length > 0 
                    ? [p.mainImage, ...p.detailImages] 
                    : [p.mainImage],
                name: p.name,
                description: p.description,
                price: p.price,
                materials: p.materials
            };
        });

        const metadata = {
            seriesName: seriesName,
            products: productMap
        };

        return metadata;
    },

    getImagePath(seriesId, filename) {
        return `${GITHUB_CONFIG.basePath}/${seriesId}/${filename}`;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GITHUB_CONFIG, SERIES_LIST, ProductDataManager };
}
