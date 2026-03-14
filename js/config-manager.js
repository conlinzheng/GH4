const ConfigManager = {
    configPath: 'products-config.json',
    
    async load() {
        try {
            const res = await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/${this.configPath}`, {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });
            if (res.ok) {
                const data = await res.json();
                return JSON.parse(decodeURIComponent(escape(atob(data.content))));
            }
        } catch (e) {
            console.log('Load config failed:', e);
        }
        return this.getDefault();
    },
    
    getDefault() {
        return {
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
    },
    
    async save(config, message = 'Update config') {
        const token = localStorage.getItem('github_token');
        if (!token) {
            throw new Error('No token');
        }
        
        let sha = null;
        try {
            const res = await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/${this.configPath}`, {
                headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
            });
            if (res.ok) {
                const data = await res.json();
                sha = data.sha;
            }
        } catch (e) {}
        
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(config, null, 2))));
        
        const url = `https://api.github.com/repos/conlinzheng/GH4/contents/${this.configPath}`;
        const method = sha ? 'PUT' : 'PUT';
        
        const body = {
            message: message,
            content: content,
            sha: sha
        };
        
        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!res.ok) {
            throw new Error('Save failed');
        }
        
        return await res.json();
    },
    
    applyToPage(config) {
        const logoEl = document.querySelector('.logo');
        if (logoEl && config.siteName) {
            logoEl.textContent = config.siteName;
        }
        
        const footerEl = document.getElementById('footerContent');
        if (footerEl && config.footer?.text) {
            footerEl.querySelector('p').textContent = config.footer.text;
        }
        
        const heroTitleEl = document.getElementById('heroTitle');
        const heroSubtitleEl = document.getElementById('heroSubtitle');
        const lang = localStorage.getItem('language') || 'zh';
        
        if (heroTitleEl && config.heroTitle) {
            heroTitleEl.textContent = config.heroTitle[lang] || config.heroTitle.zh || '';
        }
        if (heroSubtitleEl && config.heroSubtitle) {
            heroSubtitleEl.textContent = config.heroSubtitle[lang] || config.heroSubtitle.zh || '';
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
}
