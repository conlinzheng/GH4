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
    } catch (error) {
        showNotification('加载配置失败: ' + error.message, 'error');
    }
    
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
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
        }
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