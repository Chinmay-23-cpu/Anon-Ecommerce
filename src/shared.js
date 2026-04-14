// global state and functions
window.addEventListener('DOMContentLoaded', () => {
    // Inject products script if it's not present (just in case)
    if (typeof ALL_PRODUCTS === 'undefined') {
        const prodScript = document.createElement('script');
        prodScript.src = './products.js';
        prodScript.onload = initApp;
        document.head.appendChild(prodScript);
    } else {
        initApp();
    }
});

function initApp() {
    updateBadges();
    setupProductRenderers();
    fixNavigationLinks();
    bindStaticProducts();
}

function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateBadges();
}

function getFavourites() {
    return JSON.parse(localStorage.getItem('favourites') || '[]');
}
function saveFavourites(favs) {
    localStorage.setItem('favourites', JSON.stringify(favs));
    updateBadges();
}

function addToCart(productId) {
    const cart = getCart();
    const existing = cart.find(i => i.id === productId);
    if(existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }
    saveCart(cart);
    alert('Added to Cart!');
}

function addToFavourites(productId) {
    const favs = getFavourites();
    if(!favs.includes(productId)) {
        favs.push(productId);
        saveFavourites(favs);
        alert('Added to Favourites!');
    } else {
        alert('Already in Favourites!');
    }
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(i => i.id !== productId);
    saveCart(cart);
    renderCart(); // re-render if on cart page
}

function removeFromFavourites(productId) {
    let favs = getFavourites();
    favs = favs.filter(id => id !== productId);
    saveFavourites(favs);
    renderFavourites(); // re-render if on fav page
}

function updateBadges() {
    const actionBtns = document.querySelectorAll('.header-user-actions .action-btn .count');
    if(actionBtns.length >= 2) {
        // [0] is usually favs, [1] is cart (based on original index.html)
        actionBtns[0].textContent = getFavourites().length;
        actionBtns[1].textContent = getCart().reduce((acc, item) => acc + item.quantity, 0);
    }
}

function fixNavigationLinks() {
    // Hardcode simplistic routing based on classes or text
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        const text = link.textContent.trim().toLowerCase();
        if(text === "home") link.href = "index.html";
        else if(text === "men's") link.href = "mens.html";
        else if(text === "women's") link.href = "womens.html";
        else if(text === "jewelyr" || text === "jewelry") link.href = "jewelry.html";
        else if(text === "blog") link.href = "blog.html";
        else if(text === "hot offers") link.href = "offers.html";
    });
    
    // User profile link (first action btn)
    const actionBtns = document.querySelectorAll('.header-user-actions .action-btn');
    if(actionBtns.length >= 3) {
        actionBtns[0].onclick = () => window.location.href = "profile.html";
        actionBtns[1].onclick = () => window.location.href = "favourites.html";
        actionBtns[2].onclick = () => window.location.href = "cart.html";
    }
}

function bindStaticProducts() {
    if(!window.location.pathname.includes('index.html') && window.location.pathname !== '/' && window.location.pathname !== '') {
        return; // Only bind static products heavily on index.html
    }
    
    const showcases = document.querySelectorAll('.showcase');
    showcases.forEach(showcase => {
        const titleEl = showcase.querySelector('.showcase-title');
        if(!titleEl) return;
        
        const titleText = titleEl.textContent.trim();
        const prod = ALL_PRODUCTS.find(p => p.title === titleText);
        if(!prod) return;
        
        // Bind image click
        const imgBox = showcase.querySelector('.showcase-img-box, .showcase-banner, .product-img');
        if(imgBox) {
            imgBox.style.cursor = 'pointer';
            imgBox.onclick = (e) => {
                e.preventDefault();
                window.location.href = 'product.html?id=' + prod.id;
            };
        }
        
        // Bind Title Click
        const aTitle = titleEl.closest('a');
        if (aTitle) {
            aTitle.href = 'product.html?id=' + prod.id;
        }

        // Bind Buttons
        const heartBtn = showcase.querySelector('.btn-action ion-icon[name="heart-outline"]');
        if(heartBtn) {
            const btn = heartBtn.closest('button');
            if(btn) btn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                addToFavourites(prod.id);
            };
        }
        
        const eyeBtn = showcase.querySelector('.btn-action ion-icon[name="eye-outline"]');
        if(eyeBtn) {
            const btn = eyeBtn.closest('button');
            if(btn) btn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                window.location.href = 'product.html?id=' + prod.id;
            };
        }
        
        const cartBtn = showcase.querySelector('.btn-action ion-icon[name="bag-add-outline"]');
        if(cartBtn) {
            const btn = cartBtn.closest('button');
            if(btn) btn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                addToCart(prod.id);
            };
        }
        
        const bigCartBtn = showcase.querySelector('.add-cart-btn');
        if(bigCartBtn) {
             bigCartBtn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                addToCart(prod.id);
            };
        }
    });
}

function renderProductGrid(containerId, productsToRender) {
    const container = document.getElementById(containerId);
    if(!container) return;
    
    container.innerHTML = '';
    if(productsToRender.length === 0) {
        container.innerHTML = '<p>No products found.</p>';
        return;
    }
    
    productsToRender.forEach(prod => {
        const item = document.createElement('div');
        item.className = 'showcase';
        item.innerHTML = `
            <div class="showcase-banner">
                <a href="product.html?id=${prod.id}">
                    <img src="${prod.image}" alt="${prod.title}" class="product-img default" width="300" style="object-fit:cover; height: 300px;">
                </a>
                <div class="showcase-actions">
                    <button class="btn-action" onclick="addToFavourites('${prod.id}')"><ion-icon name="heart-outline"></ion-icon></button>
                    <button class="btn-action" onclick="window.location.href='product.html?id=${prod.id}'"><ion-icon name="eye-outline"></ion-icon></button>
                    <button class="btn-action" onclick="addToCart('${prod.id}')"><ion-icon name="bag-add-outline"></ion-icon></button>
                </div>
            </div>
            <div class="showcase-content">
                <a href="#" class="showcase-category">${prod.category}</a>
                <a href="product.html?id=${prod.id}">
                    <h3 class="showcase-title" style="margin-top: 10px;">${prod.title}</h3>
                </a>
                <div class="price-box" style="margin-top: 10px;">
                    <p class="price">$${prod.price.toFixed(2)}</p>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

function setupProductRenderers() {
    const isMensPage = window.location.pathname.includes('mens.html');
    const isWomensPage = window.location.pathname.includes('womens.html');
    const isJewelryPage = window.location.pathname.includes('jewelry.html');
    const isFavouritesPage = window.location.pathname.includes('favourites.html');
    const isCartPage = window.location.pathname.includes('cart.html');
    const isProductPage = window.location.pathname.includes('product.html');

    if(isMensPage) {
        renderProductGrid('category-grid', ALL_PRODUCTS.filter(p => ['mens', 'mens fashion', 'shirt', 'shorts', 'casual', 'formal'].includes(p.category.toLowerCase()) || p.category.includes("men")));
    } else if(isWomensPage) {
        renderProductGrid('category-grid', ALL_PRODUCTS.filter(p => ['womens', 'skirt', 'clothes', 'dress'].includes(p.category.toLowerCase()) || p.category.includes("women") || p.title.toLowerCase().includes("girl")));
    } else if(isJewelryPage) {
        renderProductGrid('category-grid', ALL_PRODUCTS.filter(p => p.category.toLowerCase().includes('jewel') || ['watch', 'watches'].includes(p.category.toLowerCase())));
    } else if(isFavouritesPage) {
        renderFavourites();
    } else if(isCartPage) {
        renderCart();
    } else if (isProductPage) {
        renderProductDetail();
    }
}

function renderFavourites() {
    const favIds = getFavourites();
    const favProducts = ALL_PRODUCTS.filter(p => favIds.includes(p.id));
    renderProductGrid('favourites-items', favProducts);
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const totalContainer = document.getElementById('cart-total');
    if(!container) return;
    
    const cart = getCart();
    let total = 0;
    
    container.innerHTML = '';
    
    if(cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        totalContainer.innerHTML = '';
        return;
    }
    
    cart.forEach(item => {
        const prod = ALL_PRODUCTS.find(p => p.id === item.id);
        if(!prod) return;
        total += (prod.price * item.quantity);
        
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.padding = '15px';
        row.style.marginBottom = '15px';
        row.style.background = '#fcfcfc';
        row.style.border = '1px solid #eee';
        row.style.borderRadius = '10px';
        
        row.innerHTML = `
            <div style="display:flex; align-items:center; gap: 20px;">
                <img src="${prod.image}" width="80" style="object-fit:cover; border-radius: 10px;">
                <div>
                    <h4 style="font-size: 18px; margin-bottom: 5px;">${prod.title}</h4>
                    <p style="color: #666;">$${prod.price.toFixed(2)}</p>
                    <div style="margin-top: 10px; font-weight: bold;">Qty: ${item.quantity}</div>
                </div>
            </div>
            <button style="padding: 10px 20px; background: #ff6347; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;" onclick="removeFromCart('${prod.id}')">Remove</button>
        `;
        container.appendChild(row);
    });
    
    totalContainer.innerHTML = 'Total: $' + total.toFixed(2) + '<br><button style="margin-top:20px; padding: 15px 30px; font-size: 18px; background:#ff8f9c; color:#fff; border:none; border-radius:5px; cursor:pointer;" onclick="alert(\\\'Proceeding to checkout\\\')">Checkout</button>';
}

function renderProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const prod = ALL_PRODUCTS.find(p => p.id === id);
    const container = document.getElementById('product-detail');
    if(!container) return;
    
    if(!prod) {
        container.innerHTML = '<h2>Product not found</h2>';
        return;
    }
    
    container.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 40px; align-items: flex-start; padding: 40px; background: #fff; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
            <div style="flex: 1; min-width: 300px;">
                <img src="${prod.image}" width="100%" style="border-radius: 10px; border: 1px solid #eee;">
            </div>
            <div style="flex: 1; min-width: 300px;">
                <p style="color: #ff8f9c; font-weight: bold; text-transform: uppercase;">${prod.category}</p>
                <h1 style="font-size: 32px; margin: 10px 0;">${prod.title}</h1>
                <h2 style="color: #000; font-size: 28px; margin: 20px 0;">$${prod.price.toFixed(2)}</h2>
                <p style="color: #666; margin-bottom: 30px; line-height: 1.6;">
                    Premium quality ${prod.title.toLowerCase()} crafted for maximum comfort and style. Buy yours today and enjoy worldwide delivery within days!
                </p>
                <div style="display: flex; gap: 15px;">
                    <button onclick="addToCart('${prod.id}')" style="background:#ff8f9c; color:white; border:none; padding: 15px 30px; font-size: 16px; border-radius: 5px; font-weight: bold; cursor: pointer; transition: 0.2s;">Add to Cart</button>
                    <button onclick="addToFavourites('${prod.id}')" style="background:none; border:2px solid #ddd; color:#333; padding: 15px 30px; font-size: 16px; border-radius: 5px; font-weight: bold; cursor: pointer; transition: 0.2s;"><ion-icon name="heart-outline"></ion-icon> Favorite</button>
                </div>
            </div>
        </div>
    `;
}
