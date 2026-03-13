const translations = {
    zh: {
        home: '首页',
        about: '关于我们',
        contact: '联系我们',
        heroTitle: '精选鞋款',
        heroSubtitle: '舒适时尚 品质保证',
        productsTitle: '全部产品',
        allSeries: '全部系列',
        aboutTitle: '关于我们',
        aboutDesc1: '我们专注于为客户提供高品质的鞋类产品，多年来一直致力于设计舒适、时尚、耐用的鞋履。',
        aboutDesc2: '我们的产品涵盖多个系列，包括PU系列、真皮系列、短靴系列、乐福鞋系列等，满足不同客户的需求。',
        aboutDesc3: '我们始终坚持品质第一的原则，从原材料选择到生产工艺，都严格把控，确保每一双鞋都达到最优品质。',
        contactTitle: '联系我们',
        contactEmailLabel: '邮箱：',
        contactPhoneLabel: '电话：',
        contactAddressLabel: '地址：',
        loading: '加载中...',
        error: '加载失败',
        noProducts: '暂无产品',
        price: '价格',
        viewDetails: '查看详情'
    },
    en: {
        home: 'Home',
        about: 'About',
        contact: 'Contact',
        heroTitle: 'Premium Footwear',
        heroSubtitle: 'Comfortable, Stylish, Quality Guaranteed',
        productsTitle: 'All Products',
        allSeries: 'All Series',
        aboutTitle: 'About Us',
        aboutDesc1: 'We specialize in providing high-quality footwear for our customers, dedicated to designing comfortable, stylish, and durable shoes for years.',
        aboutDesc2: 'Our products cover multiple series including PU Series, Genuine Leather Series, Boots Series, Loafers Series, etc., meeting different customer needs.',
        aboutDesc3: 'We always adhere to the principle of quality first, from raw material selection to production process, strictly controlling to ensure every pair of shoes meets the highest quality standards.',
        contactTitle: 'Contact Us',
        contactEmailLabel: 'Email: ',
        contactPhoneLabel: 'Phone: ',
        contactAddressLabel: 'Address: ',
        loading: 'Loading...',
        error: 'Failed to load',
        noProducts: 'No products available',
        price: 'Price',
        viewDetails: 'View Details'
    },
    ko: {
        home: '홈',
        about: '회사 소개',
        contact: '연락처',
        heroTitle: '프리미엄 신발',
        heroSubtitle: '편안함, 스타일, 품질 보장',
        productsTitle: '전체 제품',
        allSeries: '전체 시리즈',
        aboutTitle: '회사 소개',
        aboutDesc1: '저희는 고객에게 고품질 신발 제품을 제공하기 위해 노력하고 있으며, 수년 동안 편안하고 세련되며 내구성 있는 신발을 디자인하는 데 전념해 왔습니다.',
        aboutDesc2: '저희 제품에는 PU 시리즈, 진피 시리즈, 부츠 시리즈, 로퍼 시리즈 등 다양한 시리즈가 포함되어 있어 다양한 고객 요구를 충족합니다.',
        aboutDesc3: '저희는 항상 품질을 우선시하는 원칙을 견지하며, 원자재 선택부터 생산 공정까지 철저하게 관리하여 모든 신발이 최고 품질 표준을 충족하도록 합니다.',
        contactTitle: '연락처',
        contactEmailLabel: '이메일: ',
        contactPhoneLabel: '전화: ',
        contactAddressLabel: '주소: ',
        loading: '로딩 중...',
        error: '로드 실패',
        noProducts: '제품이 없습니다',
        price: '가격',
        viewDetails: '상세 보기'
    }
};

let currentLanguage = localStorage.getItem('language') || 'zh';

function initI18n() {
    const savedLang = localStorage.getItem('language');
    if (savedLang && translations[savedLang]) {
        currentLanguage = savedLang;
    }
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === currentLanguage) {
            btn.classList.add('active');
        }
    });
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => switchLanguage(btn.dataset.lang));
    });
    
    updatePageTranslations();
}

function switchLanguage(lang) {
    if (!translations[lang]) return;
    
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });
    
    updatePageTranslations();
    
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

function t(key) {
    const langData = translations[currentLanguage];
    return langData && langData[key] ? langData[key] : (translations['zh'][key] || key);
}

function getLocalizedField(obj, field) {
    if (obj[field] && obj[field][currentLanguage]) {
        return obj[field][currentLanguage];
    }
    return obj[field] ? (obj[field]['zh'] || obj[field]) : '';
}

function updatePageTranslations() {
    const elements = {
        heroTitle: 'heroTitle',
        heroSubtitle: 'heroSubtitle',
        productsTitle: 'productsTitle',
        allSeries: 'allSeries',
        aboutTitle: 'aboutTitle',
        aboutDesc1: 'aboutDesc1',
        aboutDesc2: 'aboutDesc2',
        aboutDesc3: 'aboutDesc3',
        contactTitle: 'contactTitle',
        contactEmailLabel: 'contactEmailLabel',
        contactPhoneLabel: 'contactPhoneLabel',
        contactAddressLabel: 'contactAddressLabel'
    };
    
    for (const [key, elementId] of Object.entries(elements)) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = t(key);
        }
    }
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === 'index.html') {
            link.textContent = t('home');
        } else if (link.getAttribute('href') === 'about.html') {
            link.textContent = t('about');
        }
    });
}
