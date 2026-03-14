const ImageUploader = {
    seriesList: [
        { id: '1-PU系列', name: 'PU系列' },
        { id: '2-真皮系列', name: '真皮系列' },
        { id: '3-短靴系列', name: '短靴系列' },
        { id: '4-乐福系列', name: '乐福系列' },
        { id: '5-春季', name: '春季新款' },
        { id: '6-夏季', name: '夏季清凉' },
        { id: '7-秋季', name: '秋季时尚' },
        { id: '8-冬季', name: '冬季保暖' }
    ],
    
    getSeriesList() {
        return this.seriesList;
    },
    
    async upload(seriesId, file, onProgress) {
        const token = localStorage.getItem('github_token');
        if (!token) {
            throw new Error('No token');
        }
        
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {
                    const base64 = reader.result.split(',')[1];
                    const content = btoa(unescape(encodeURIComponent(file.name)));
                    
                    const path = `产品图/${seriesId}/${file.name}`;
                    const url = `https://api.github.com/repos/conlinzheng/GH4/contents/${encodeURIComponent(path)}`;
                    
                    let sha = null;
                    try {
                        const checkRes = await fetch(url, {
                            headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
                        });
                        if (checkRes.ok) {
                            const data = await checkRes.json();
                            sha = data.sha;
                        }
                    } catch (e) {}
                    
                    const body = {
                        message: `Upload image: ${file.name}`,
                        content: base64,
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
                        throw new Error('Upload failed');
                    }
                    
                    resolve(await res.json());
                } catch (e) {
                    reject(e);
                }
            };
            
            reader.onerror = () => reject(new Error('Read file failed'));
            reader.readAsDataURL(file);
        });
    },
    
    async uploadMultiple(seriesId, files, onProgress) {
        const results = [];
        const total = files.length;
        
        for (let i = 0; i < files.length; i++) {
            try {
                const result = await this.upload(seriesId, files[i]);
                results.push({ success: true, file: files[i].name, result });
                
                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total: total,
                        percent: Math.round(((i + 1) / total) * 100),
                        fileName: files[i].name
                    });
                }
            } catch (e) {
                results.push({ success: false, file: files[i].name, error: e.message });
            }
        }
        
        return results;
    },
    
    async delete(seriesId, fileName) {
        const token = localStorage.getItem('github_token');
        if (!token) {
            throw new Error('No token');
        }
        
        const path = `产品图/${seriesId}/${fileName}`;
        const url = `https://api.github.com/repos/conlinzheng/GH4/contents/${encodeURIComponent(path)}`;
        
        const res = await fetch(url, {
            headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        
        if (!res.ok) {
            throw new Error('File not found');
        }
        
        const data = await res.json();
        
        const deleteRes = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Delete image: ${fileName}`,
                sha: data.sha
            })
        });
        
        if (!deleteRes.ok) {
            throw new Error('Delete failed');
        }
        
        return await deleteRes.json();
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageUploader;
}
