const lazyLoadConfig = {
    rootMargin: '50px 0px',
    threshold: 0.1
};

function initLazyLoad() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                }
            });
        }, lazyLoadConfig);
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
        
        return imageObserver;
    } else {
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

function lazyLoadImage(img) {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    const src = image.dataset.src;
                    if (src) {
                        image.src = src;
                        image.removeAttribute('data-src');
                        observer.unobserve(image);
                    }
                }
            });
        }, lazyLoadConfig);
        
        observer.observe(img);
    } else {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
    }
}