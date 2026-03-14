async function initConfig() {
    const form = document.querySelector('.config-form');
    
    try {
        await dataManager.loadFromGitHub();
        const config = dataManager.getConfigData();
        
        document.getElementById('siteName').value = config.siteName || '';
        document.getElementById('contactEmail').value = config.contact?.email || '';
        document.getElementById('contactPhone').value = config.contact?.phone || '';
        document.getElementById('contactAddress').value = config.contact?.address || '';
        document.getElementById('footerText').value = config.footer?.text || '';
        
        document.getElementById('heroTitleZh').value = config.heroTitle?.zh || '';
        document.getElementById('heroTitleEn').value = config.heroTitle?.en || '';
        document.getElementById('heroTitleKo').value = config.heroTitle?.ko || '';
        document.getElementById('heroSubtitleZh').value = config.heroSubtitle?.zh || '';
        document.getElementById('heroSubtitleEn').value = config.heroSubtitle?.en || '';
        document.getElementById('heroSubtitleKo').value = config.heroSubtitle?.ko || '';
        
        renderHeroSlides(config.heroSlides || []);
    } catch (error) {
        showNotification('加载配置失败: ' + error.message, 'error');
        renderHeroSlides([]);
    }
    
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
    document.getElementById('addSlideBtn').addEventListener('click', addHeroSlide);
}

function renderHeroSlides(slides) {
    const container = document.getElementById('heroSlidesContainer');
    container.innerHTML = slides.map((slide, index) => `
        <div class="slide-config-item">
            <div class="form-group">
                <label>图片路径 ${index + 1}</label>
                <input type="text" class="slide-image form-control" value="${slide.image || ''}" placeholder="如: img1-50/1.png">
            </div>
            <button type="button" class="btn btn-danger remove-slide-btn" data-index="${index}">删除</button>
        </div>
    `).join('');
    
    container.querySelectorAll('.remove-slide-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            removeHeroSlide(index);
        });
    });
}

function addHeroSlide() {
    const container = document.getElementById('heroSlidesContainer');
    const index = container.querySelectorAll('.slide-config-item').length;
    const div = document.createElement('div');
    div.className = 'slide-config-item';
    div.innerHTML = `
        <div class="form-group">
            <label>图片路径 ${index + 1}</label>
            <input type="text" class="slide-image form-control" value="" placeholder="如: img1-50/1.png">
        </div>
        <button type="button" class="btn btn-danger remove-slide-btn" data-index="${index}">删除</button>
    `;
    container.appendChild(div);
    div.querySelector('.remove-slide-btn').addEventListener('click', () => removeHeroSlide(index));
}

function removeHeroSlide(index) {
    const container = document.getElementById('heroSlidesContainer');
    container.querySelectorAll('.slide-config-item')[index]?.remove();
    renderHeroSlides(getHeroSlidesFromForm());
}

function getHeroSlidesFromForm() {
    const container = document.getElementById('heroSlidesContainer');
    const slides = [];
    container.querySelectorAll('.slide-config-item').forEach(item => {
        const image = item.querySelector('.slide-image').value.trim();
        if (image) {
            slides.push({ image, title: '', subtitle: '' });
        }
    });
    return slides;
}

async function saveConfig() {
    const configData = {
        siteName: document.getElementById('siteName').value,
        contact: {
            email: document.getElementById('contactEmail').value,
            phone: document.getElementById('contactPhone').value,
            address: document.getElementById('contactAddress').value
        },
        footer: {
            text: document.getElementById('footerText').value
        },
        heroTitle: {
            zh: document.getElementById('heroTitleZh').value,
            en: document.getElementById('heroTitleEn').value,
            ko: document.getElementById('heroTitleKo').value
        },
        heroSubtitle: {
            zh: document.getElementById('heroSubtitleZh').value,
            en: document.getElementById('heroSubtitleEn').value,
            ko: document.getElementById('heroSubtitleKo').value
        },
        heroSlides: getHeroSlidesFromForm()
    };
    
    dataManager.setConfigData(configData);
    
    try {
        await dataManager.saveToGitHub();
        showNotification('配置已保存并同步到GitHub', 'success');
    } catch (error) {
        showNotification('保存失败: ' + error.message, 'error');
    }
}

window.initConfig = initConfig;
