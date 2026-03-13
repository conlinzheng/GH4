const CACHE_PREFIX = 'shoe_store_';
const DEFAULT_TTL = 3600000;

function get(key, ttl = DEFAULT_TTL) {
    const cacheKey = CACHE_PREFIX + key;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > ttl) {
            localStorage.removeItem(cacheKey);
            return null;
        }
        return data;
    } catch (e) {
        return null;
    }
}

function set(key, data) {
    const cacheKey = CACHE_PREFIX + key;
    const cacheData = {
        data: data,
        timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
}

function clear(key) {
    if (key) {
        localStorage.removeItem(CACHE_PREFIX + key);
    } else {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }
}

function isValid(key) {
    return get(key) !== null;
}
