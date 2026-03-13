class Modal {
    constructor(id) {
        this.modal = document.getElementById(id);
        this.init();
    }
    
    init() {
        if (!this.modal) return;
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    }
    
    open() {
        if (this.modal) {
            this.modal.style.display = 'flex';
        }
    }
    
    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }
}

class Tabs {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
    }
    
    init() {
        if (!this.container) return;
        
        const tabs = this.container.querySelectorAll('.language-tabs button');
        const panes = this.container.querySelectorAll('.language-pane');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const lang = tab.dataset.lang;
                
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                panes.forEach(pane => {
                    pane.classList.remove('active');
                    if (pane.dataset.lang === lang) {
                        pane.classList.add('active');
                    }
                });
            });
        });
    }
}

class DataTable {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.columns = options.columns || [];
        this.data = options.data || [];
        this.onEdit = options.onEdit || null;
        this.onDelete = options.onDelete || null;
    }
    
    render() {
        if (!this.container) return;
        
        let html = '<table><thead><tr>';
        this.columns.forEach(col => {
            html += `<th>${col.title}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        this.data.forEach((row, index) => {
            html += '<tr>';
            this.columns.forEach(col => {
                html += `<td>${col.render ? col.render(row[col.key], row) : row[col.key]}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        this.container.innerHTML = html;
    }
    
    setData(data) {
        this.data = data;
        this.render();
    }
}

class ProgressBar {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.fill = this.element ? this.element.querySelector('.progress-fill') : null;
        this.text = this.element ? this.element.querySelector('#progressText') : null;
    }
    
    setProgress(percent) {
        if (this.fill) {
            this.fill.style.width = `${percent}%`;
        }
        if (this.text) {
            this.text.textContent = `${Math.round(percent)}%`;
        }
    }
    
    show() {
        if (this.element) {
            this.element.style.display = 'block';
        }
    }
    
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    }
    
    reset() {
        this.setProgress(0);
    }
}

window.Modal = Modal;
window.Tabs = Tabs;
window.DataTable = DataTable;
window.ProgressBar = ProgressBar;
