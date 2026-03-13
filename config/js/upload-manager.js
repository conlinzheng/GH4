let selectedFiles = [];

async function initUpload() {
    const select = document.getElementById('uploadSeriesSelect');
    select.innerHTML = '<option value="">请选择系列</option>';
    
    try {
        const seriesList = await githubSync.fetchSeriesList();
        seriesList.forEach(series => {
            const option = document.createElement('option');
            option.value = series.id;
            option.textContent = series.id;
            select.appendChild(option);
        });
    } catch (error) {
        showNotification('加载系列失败: ' + error.message, 'error');
    }
    
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    document.getElementById('uploadBtn').addEventListener('click', uploadFiles);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    selectedFiles = [...selectedFiles, ...files];
    renderFilePreview();
}

function renderFilePreview() {
    const preview = document.getElementById('filePreview');
    preview.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-preview-item">
            <img src="${URL.createObjectURL(file)}" alt="${file.name}">
            <button class="remove-btn" data-index="${index}">&times;</button>
        </div>
    `).join('');
    
    preview.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            selectedFiles.splice(index, 1);
            renderFilePreview();
        });
    });
}

async function uploadFiles() {
    const seriesSelect = document.getElementById('uploadSeriesSelect');
    const seriesId = seriesSelect.value;
    
    if (!seriesId) {
        showNotification('请选择系列', 'warning');
        return;
    }
    
    if (selectedFiles.length === 0) {
        showNotification('请选择图片', 'warning');
        return;
    }
    
    const progress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progress.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    
    let successCount = 0;
    
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
            await githubSync.uploadImage(seriesId, file);
            successCount++;
            const percent = ((i + 1) / selectedFiles.length) * 100;
            progressFill.style.width = `${percent}%`;
            progressText.textContent = `${Math.round(percent)}%`;
        } catch (error) {
            showNotification(`上传 ${file.name} 失败: ${error.message}`, 'error');
        }
    }
    
    progress.style.display = 'none';
    selectedFiles = [];
    renderFilePreview();
    
    if (successCount > 0) {
        showNotification(`成功上传 ${successCount} 个文件`, 'success');
    }
}

window.initUpload = initUpload;
