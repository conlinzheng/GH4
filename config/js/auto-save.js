const AUTO_SAVE_KEY = 'shoe_store_autosave';
const AUTO_SAVE_INTERVAL = 30000;

let autoSaveTimer = null;

function initAutoSave() {
    loadDraft();
    
    autoSaveTimer = setInterval(() => {
        saveDraft();
    }, AUTO_SAVE_INTERVAL);
}

function saveDraft() {
    const draftData = {
        productsData: window.dataManager ? window.dataManager.productsData : {},
        configData: window.dataManager ? window.dataManager.configData : {},
        timestamp: Date.now()
    };
    
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(draftData));
}

function loadDraft() {
    const draft = localStorage.getItem(AUTO_SAVE_KEY);
    if (!draft) return;
    
    try {
        const data = JSON.parse(draft);
        const age = Date.now() - data.timestamp;
        
        if (age < 24 * 60 * 60 * 1000) {
            if (window.dataManager) {
                window.dataManager.productsData = data.productsData || {};
                window.dataManager.configData = data.configData || {};
            }
        } else {
            clearDraft();
        }
    } catch (e) {
        console.error('Failed to load draft:', e);
    }
}

function clearDraft() {
    localStorage.removeItem(AUTO_SAVE_KEY);
}

window.initAutoSave = initAutoSave;
window.saveDraft = saveDraft;
window.clearDraft = clearDraft;
