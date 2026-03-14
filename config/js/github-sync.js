async function fetchFile(path) {
    const token = localStorage.getItem('github_token');
    if (!token) throw new Error('No token');
    
    const response = await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/${path}`, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.status}`);
    }
    
    return response.json();
}

function isGarbled(text) {
    return text && (text.includes('Ã') || text.includes('Â') || text.includes('â'));
}

async function fetchSeriesList() {
    try {
        const contents = await fetchFile('产品图');
        return contents
            .filter(item => item.type === 'dir')
            .map(dir => ({
                id: dir.name,
                name: dir.name
            }));
    } catch (e) {
        console.log('Using default series list');
        return [
            { id: '1-PU系列', name: '1-PU系列' },
            { id: '2-真皮系列', name: '2-真皮系列' },
            { id: '3-短靴系列', name: '3-短靴系列' },
            { id: '4-乐福系列', name: '4-乐福系列' },
            { id: '5-春季', name: '5-春季' },
            { id: '6-夏季', name: '6-夏季' },
            { id: '7-秋季', name: '7-秋季' },
            { id: '8-冬季', name: '8-冬季' }
        ];
    }
}

async function fetchSeriesImages(seriesId) {
    try {
        const contents = await fetchFile(`产品图/${seriesId}`);
        return contents
            .filter(item => item.type === 'file' && item.name.match(/\.(jpg|jpeg|png|gif)$/i))
            .map(file => ({
                name: file.name,
                download_url: file.download_url
            }));
    } catch (e) {
        return [];
    }
}

async function fetchSeriesMetadata(seriesId) {
    try {
        const metadataFile = await fetchFile(`产品图/${seriesId}/products.json`);
        if (metadataFile.content) {
            const decoded = decodeURIComponent(escape(atob(metadataFile.content)));
            if (isGarbled(decoded)) {
                console.log(`Detected garbled metadata for ${seriesId}, skipping...`);
                return null;
            }
            return JSON.parse(decoded);
        }
    } catch (e) {
        console.log(`No metadata for ${seriesId}`);
    }
    return null;
}

async function deleteSeriesMetadata(seriesId) {
    const token = localStorage.getItem('github_token');
    if (!token) return;
    
    try {
        const metadataFile = await fetchFile(`产品图/${seriesId}/products.json`);
        
        await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/产品图/${seriesId}/products.json`, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Delete products.json for ${seriesId}`,
                sha: metadataFile.sha
            })
        });
        console.log(`Deleted products.json for ${seriesId}`);
    } catch (e) {
        console.log(`No products.json to delete for ${seriesId}`);
    }
}

async function pushSeriesMetadata(seriesId, data) {
    const token = localStorage.getItem('github_token');
    if (!token) return;
    
    const content = JSON.stringify(data, null, 2);
    const encoded = btoa(unescape(encodeURIComponent(content)));
    
    try {
        const existing = await fetchFile(`产品图/${seriesId}/products.json`);
        
        await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/产品图/${seriesId}/products.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Update products.json for ${seriesId}`,
                content: encoded,
                sha: existing.sha
            })
        });
        console.log(`Updated products.json for ${seriesId}`);
    } catch (e) {
        try {
            await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/产品图/${seriesId}/products.json`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Create products.json for ${seriesId}`,
                    content: encoded
                })
            });
            console.log(`Created products.json for ${seriesId}`);
        } catch (createError) {
            console.error(`Failed to create products.json for ${seriesId}:`, createError);
        }
    }
}

async function fetchAllImages() {
    const seriesList = await fetchSeriesList();
    const allImages = [];
    
    for (const series of seriesList) {
        const images = await fetchSeriesImages(series.id);
        images.forEach(img => {
            allImages.push({
                seriesId: series.id,
                name: img.name,
                download_url: img.download_url
            });
        });
    }
    
    return allImages;
}

async function commitFile(path, content, message, isBase64 = true) {
    const token = localStorage.getItem('github_token');
    if (!token) {
        throw new Error('No token');
    }
    
    const encoded = btoa(unescape(encodeURIComponent(content)));
    
    try {
        const existing = await fetchFile(path);
        
        const response = await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: message,
                content: encoded,
                sha: existing.sha
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to commit: ${response.status}`);
        }
    } catch (e) {
        const response = await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: message,
                content: encoded
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to create: ${response.status}`);
        }
    }
}

async function uploadImage(seriesId, file) {
    const token = localStorage.getItem('github_token');
    if (!token) {
        throw new Error('No token');
    }
    
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
        reader.onload = async () => {
            try {
                const base64 = reader.result.split(',')[1];
                const path = `产品图/${seriesId}/${file.name}`;
                
                try {
                    const existing = await fetchFile(path);
                    
                    const response = await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/${path}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/vnd.github.v3+json'
                        },
                        body: JSON.stringify({
                            message: `Upload ${file.name}`,
                            content: base64,
                            sha: existing.sha
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Upload failed: ${response.status}`);
                    }
                    resolve();
                } catch (e) {
                    const response = await fetch(`https://api.github.com/repos/conlinzheng/GH4/contents/${path}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/vnd.github.v3+json'
                        },
                        body: JSON.stringify({
                            message: `Upload ${file.name}`,
                            content: base64
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Upload failed: ${response.status}`);
                    }
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

async function scanForNewImages() {
    const seriesList = await fetchSeriesList();
    const allNewImages = [];
    
    for (const series of seriesList) {
        try {
            const contents = await fetchFile(`产品图/${series.id}`);
            const imageFiles = contents.filter(item => 
                item.type === 'file' && 
                item.name.match(/\.(jpg|jpeg|png|gif)$/i)
            );
            
            for (const file of imageFiles) {
                allNewImages.push({
                    seriesId: series.id,
                    name: file.name,
                    path: file.path
                });
            }
        } catch (e) {
            console.log(`Error scanning series ${series.id}:`, e);
        }
    }
    
    return allNewImages;
}

window.githubSync = {
    fetchSeriesList,
    fetchSeriesImages,
    fetchSeriesMetadata,
    deleteSeriesMetadata,
    pushSeriesMetadata,
    fetchAllImages,
    commitFile,
    uploadImage,
    scanForNewImages
};
