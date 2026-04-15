// global state and functions
window.addEventListener('DOMContentLoaded', () => {
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
    initTheme();
    initCurrency();
    updateBadges();
    setupProductRenderers();
    fixNavigationLinks();
    bindStaticProducts();
    setupSearch();
}

// --- Theme & Currency Engine ---
let currentTheme = localStorage.getItem('theme') || 'light';
let currentCurrency = localStorage.getItem('currency') || 'usd';

function initTheme() {
    if(currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }
}

window.toggleTheme = function() {
    const isDark = document.body.classList.toggle('dark-theme');
    currentTheme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.textContent = isDark ? '☀️' : '🌙';
    }
};

function initCurrency() {
    const selects = document.querySelectorAll('select[name="currency"]');
    selects.forEach(select => {
        select.value = currentCurrency;
        select.addEventListener('change', (e) => {
            currentCurrency = e.target.value;
            localStorage.setItem('currency', currentCurrency);
            // Sync all selects
            document.querySelectorAll('select[name="currency"]').forEach(s => s.value = currentCurrency);
            // Re-render
            setupProductRenderers();
        });
    });
}

function formatPrice(priceUsd) {
    if (currentCurrency === 'inr') {
        // approximate conversion $1 = 83 INR
        const priceInr = priceUsd * 83;
        // Make it look natural, e.g., end with 99 if > 500
        const rounded = priceInr > 500 ? Math.ceil(priceInr / 100) * 100 - 1 : Math.round(priceInr);
        return `₹${rounded.toLocaleString('en-IN')}`;
    }
    return `$${priceUsd.toFixed(2)}`;
}

// --- Search Engine ---
function setupSearch() {
    const searchBtn = document.querySelector('.search-btn');
    const searchField = document.querySelector('.search-field');
    if (searchBtn && searchField) {
        searchBtn.onclick = () => {
            if(searchField.value.trim()) {
                window.location.href = 'search.html?q=' + encodeURIComponent(searchField.value.trim());
            }
        };
        searchField.addEventListener('keypress', (e) => {
            if(e.key === 'Enter' && searchField.value.trim()) {
                window.location.href = 'search.html?q=' + encodeURIComponent(searchField.value.trim());
            }
        });
    }
}

// --- Cart & Favourites ---
function getCart() { return JSON.parse(localStorage.getItem('cart') || '[]'); }
function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); updateBadges(); }

function getFavourites() { return JSON.parse(localStorage.getItem('favourites') || '[]'); }
function saveFavourites(favs) { localStorage.setItem('favourites', JSON.stringify(favs)); updateBadges(); }

window.addToCart = function(productId) {
    const cart = getCart();
    const existing = cart.find(i => i.id === productId);
    if(existing) { existing.quantity += 1; } 
    else { cart.push({ id: productId, quantity: 1 }); }
    saveCart(cart);
    alert('Added to Cart!');
};

window.addToFavourites = function(productId) {
    const favs = getFavourites();
    if(!favs.includes(productId)) {
        favs.push(productId);
        saveFavourites(favs);
        alert('Added to Favourites!');
    } else {
        alert('Already in Favourites!');
    }
};

window.removeFromCart = function(productId) {
    let cart = getCart();
    cart = cart.filter(i => i.id !== productId);
    saveCart(cart);
    renderCart(); // re-render if on cart page
};

window.removeFromFavourites = function(productId) {
    let favs = getFavourites();
    favs = favs.filter(id => id !== productId);
    saveFavourites(favs);
    renderFavourites(); // re-render if on fav page
};

function updateBadges() {
    const actionBtns = document.querySelectorAll('.header-user-actions .action-btn .count');
    if(actionBtns.length >= 2) {
        actionBtns[0].textContent = getFavourites().length;
        actionBtns[1].textContent = getCart().reduce((acc, item) => acc + item.quantity, 0);
    }
}

function fixNavigationLinks() {
    const links = document.querySelectorAll('.desktop-menu-category-list .menu-title, .mobile-menu-category-list > .menu-category > .menu-title');
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
        // Avoid overriding the theme toggle which might be [0] now
        // Let's rely on querying the icons instead
        const profileBtn = document.querySelector('.header-user-actions ion-icon[name="person-outline"]');
        if(profileBtn) {
            profileBtn.closest('button').onclick = () => {
                if(localStorage.getItem('user_logged_in') === 'true') window.location.href = "profile.html";
                else window.location.href = "login.html";
            };
        }
        const favBtn = document.querySelector('.header-user-actions ion-icon[name="heart-outline"]');
        if(favBtn) {
            favBtn.closest('button').onclick = () => window.location.href = "favourites.html";
        }
        const cartBtn = document.querySelector('.header-user-actions ion-icon[name="bag-handle-outline"]');
        if(cartBtn) {
            cartBtn.closest('button').onclick = () => window.location.href = "cart.html";
        }
    }
}

function bindStaticProducts() {
    if(!window.location.pathname.includes('index.html') && window.location.pathname !== '/' && window.location.pathname !== '') {
        return; 
    }
    const showcases = document.querySelectorAll('.showcase');
    showcases.forEach(showcase => {
        const titleEl = showcase.querySelector('.showcase-title');
        if(!titleEl) return;
        const titleText = titleEl.textContent.trim();
        const prod = ALL_PRODUCTS.find(p => p.title === titleText);
        if(!prod) return;
        
        const imgBox = showcase.querySelector('.showcase-img-box, .showcase-banner, .product-img');
        if(imgBox) {
            imgBox.style.cursor = 'pointer';
            imgBox.onclick = (e) => { e.preventDefault(); window.location.href = 'product.html?id=' + prod.id; };
        }
        
        const aTitle = titleEl.closest('a');
        if (aTitle) aTitle.href = 'product.html?id=' + prod.id;

        const heartBtn = showcase.querySelector('.btn-action ion-icon[name="heart-outline"]');
        if(heartBtn) {
            const btn = heartBtn.closest('button');
            if(btn) btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); addToFavourites(prod.id); };
        }
        
        const eyeBtn = showcase.querySelector('.btn-action ion-icon[name="eye-outline"]');
        if(eyeBtn) {
            const btn = eyeBtn.closest('button');
            if(btn) btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); window.location.href = 'product.html?id=' + prod.id; };
        }
        
        const cartBtn = showcase.querySelector('.btn-action ion-icon[name="bag-add-outline"]');
        if(cartBtn) {
            const btn = cartBtn.closest('button');
            if(btn) btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); addToCart(prod.id); };
        }
        
        const bigCartBtn = showcase.querySelector('.add-cart-btn');
        if(bigCartBtn) {
             bigCartBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); addToCart(prod.id); };
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
                    <p class="price">${formatPrice(prod.price)}</p>
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
    const isSearchPage = window.location.pathname.includes('search.html');
    const isProfilePage = window.location.pathname.includes('profile.html');
    const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');

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
    } else if (isSearchPage) {
        const query = new URLSearchParams(window.location.search).get('q');
        if (query) {
            const titleEl = document.getElementById('search-title');
            if(titleEl) titleEl.innerText = 'Search Results for: "' + query + '"';
            const matches = ALL_PRODUCTS.filter(p => p.title.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()));
            renderProductGrid('search-grid', matches);
        } else {
            renderProductGrid('search-grid', []);
        }
    } else if (isProfilePage) {
        renderProfile();
    } else if (isIndexPage) {
        // Rebind static products so prices are updated if currency changes
        document.querySelectorAll('.showcase .price').forEach(el => {
            const titleEl = el.closest('.showcase').querySelector('.showcase-title');
            if(titleEl) {
                const titleText = titleEl.textContent.trim();
                const prod = ALL_PRODUCTS.find(p => p.title === titleText);
                if(prod) {
                    el.textContent = formatPrice(prod.price);
                }
            }
        });
    }
}

window.handleLogin = function() {
    localStorage.setItem('user_logged_in', 'true');
    window.location.href = 'profile.html';
};

window.handleLogout = function() {
    localStorage.removeItem('user_logged_in');
    window.location.href = 'login.html';
};

function renderProfile() {
    const container = document.querySelector('main .container');
    if(!container) return;
    if (localStorage.getItem('user_logged_in') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
    
    // Simple hash-routing for tabs
    const hash = window.location.hash || '#dashboard';

    // Renders the main content based on hash
    let mainContent = '';
    let dbActive = hash === '#dashboard' ? 'color: #ff8f9c; font-weight: bold;' : 'color: #666;';
    let orderActive = hash === '#orders' ? 'color: #ff8f9c; font-weight: bold;' : 'color: #666;';
    let addrActive = hash === '#addresses' ? 'color: #ff8f9c; font-weight: bold;' : 'color: #666;';
    let payActive = hash === '#payments' ? 'color: #ff8f9c; font-weight: bold;' : 'color: #666;';

    if (hash === '#orders') {
        mainContent = `
            <h2 style="font-size: 28px; margin-bottom: 20px;">Order History</h2>
            <div style="border: 1px solid #eee; border-radius: 10px; padding: 20px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                    <strong>Order #8923F</strong>
                    <span style="color: green;">Delivered</span>
                </div>
                <p style="color: #666;">Placed on April 12, 2026</p>
                <div style="margin-top: 10px; font-weight: bold;">Total: ${formatPrice(120)}</div>
            </div>
            <div style="border: 1px solid #eee; border-radius: 10px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                    <strong>Order #8012A</strong>
                    <span style="color: orange;">En Route</span>
                </div>
                <p style="color: #666;">Placed on April 08, 2026</p>
                <div style="margin-top: 10px; font-weight: bold;">Total: ${formatPrice(45)}</div>
            </div>
        `;
    } else if (hash === '#addresses') {
        mainContent = `
            <h2 style="font-size: 28px; margin-bottom: 20px;">Saved Addresses</h2>
            <div style="border: 1px solid #eee; border-radius: 10px; padding: 20px; margin-bottom: 15px;">
                <h4 style="margin-bottom: 10px;">Home Address <span style="font-size: 12px; background: #eee; padding: 2px 6px; border-radius: 4px; margin-left: 10px;">Default</span></h4>
                <p style="color: #666; line-height: 1.5;">John Doe<br>Flat No. 302, Sai Residency, 5th Cross Road,<br>Indiranagar, Bengaluru, Karnataka 560038<br>India.</p>
                <button style="margin-top: 15px; color: #ff8f9c; border: none; background: transparent; cursor: pointer; font-weight: bold;">Edit Address</button>
            </div>
            <button style="padding: 10px 20px; background: #ff8f9c; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">+ Add New Address</button>
        `;
    } else if (hash === '#payments') {
        mainContent = `
            <h2 style="font-size: 28px; margin-bottom: 20px;">Payment Methods</h2>
            <div style="border: 1px solid #eee; border-radius: 10px; padding: 20px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin-bottom: 5px;">Visa ending in 4242</h4>
                    <p style="color: #666; font-size: 14px;">Expires 12/28</p>
                </div>
                <span style="font-size: 12px; background: #eee; padding: 2px 6px; border-radius: 4px;">Default</span>
            </div>
            <button style="padding: 10px 20px; background: #ff8f9c; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">+ Add Payment Method</button>
        `;
    } else {
        // Default Dashboard
        mainContent = `
            <h2 style="font-size: 28px; margin-bottom: 20px;">Welcome back, John!</h2>
            <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                <div style="background: #fdfdfd; padding: 20px; border-radius: 10px; border: 1px solid #eee; flex: 1;">
                    <h4 style="margin-bottom: 10px; color: #666;">Total Orders</h4>
                    <p style="font-size: 24px; font-weight: bold;">12</p>
                </div>
                <div style="background: #fdfdfd; padding: 20px; border-radius: 10px; border: 1px solid #eee; flex: 1;">
                    <h4 style="margin-bottom: 10px; color: #666;">Pending Delivery</h4>
                    <p style="font-size: 24px; font-weight: bold;">1</p>
                </div>
            </div>
            <h3>Recent Activity</h3>
            <p style="color: #666; margin-top: 10px;">Your recent package for Order #8923F was delivered successfully.</p>
        `;
    }

    container.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 40px; align-items: flex-start; padding: 40px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);" class="dashboard-wrapper">
            <div style="width: 250px; padding: 20px; border-radius: 10px; border: 1px solid #eee;" class="dashboard-sidebar">
                <h3 style="margin-bottom: 20px;">My Account</h3>
                <ul style="list-style: none; padding: 0;">
                    <li style="margin-bottom: 15px;"><a href="#dashboard" onclick="setTimeout(renderProfile, 10)" style="${dbActive}">Dashboard</a></li>
                    <li style="margin-bottom: 15px;"><a href="#orders" onclick="setTimeout(renderProfile, 10)" style="${orderActive}">Order History</a></li>
                    <li style="margin-bottom: 15px;"><a href="#addresses" onclick="setTimeout(renderProfile, 10)" style="${addrActive}">Addresses</a></li>
                    <li style="margin-bottom: 15px;"><a href="#payments" onclick="setTimeout(renderProfile, 10)" style="${payActive}">Payment Methods</a></li>
                    <li><button onclick="handleLogout()" style="background: #eee; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; width: 100%; text-align: left; color: #333; font-weight: bold;">Logout</button></li>
                </ul>
            </div>
            <div style="flex: 1; min-width: 300px;">
                ${mainContent}
            </div>
        </div>
    `;
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
    let totalUsd = 0;
    
    container.innerHTML = '';
    
    if(cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        totalContainer.innerHTML = '';
        return;
    }
    
    cart.forEach(item => {
        const prod = ALL_PRODUCTS.find(p => p.id === item.id);
        if(!prod) return;
        totalUsd += (prod.price * item.quantity);
        
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.padding = '15px';
        row.style.marginBottom = '15px';
        row.style.border = '1px solid #eee';
        row.style.borderRadius = '10px';
        row.className = 'cart-row'; // custom class for dark mode if needed
        
        row.innerHTML = `
            <div style="display:flex; align-items:center; gap: 20px;">
                <img src="${prod.image}" width="80" style="object-fit:cover; border-radius: 10px;">
                <div>
                    <h4 style="font-size: 18px; margin-bottom: 5px;">${prod.title}</h4>
                    <p style="color: #666;">${formatPrice(prod.price)}</p>
                    <div style="margin-top: 10px; font-weight: bold;">Qty: ${item.quantity}</div>
                </div>
            </div>
            <button style="padding: 10px 20px; background: #ff6347; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;" onclick="removeFromCart('${prod.id}')">Remove</button>
        `;
        container.appendChild(row);
    });
    
    totalContainer.innerHTML = 'Total: ' + formatPrice(totalUsd) + '<br><button style="margin-top:20px; padding: 15px 30px; font-size: 18px; background:#ff8f9c; color:#fff; border:none; border-radius:5px; cursor:pointer;" onclick="alert(\\\'Proceeding to checkout\\\')">Checkout</button>';
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
    
    const qtyOptions = `
        <option value="1">Quantity: 1</option>
        <option value="2">Quantity: 2</option>
        <option value="3">Quantity: 3</option>
    `;
    
    container.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 30px; align-items: flex-start; padding: 20px;">
            <div style="flex: 1; min-width: 300px; max-width: 400px; position: sticky; top: 20px;">
                <img src="${prod.image}" width="100%" style="border-radius: 10px; border: 1px solid #e0e0e0; cursor: zoom-in;">
            </div>
            
            <div style="flex: 2; min-width: 300px;">
                <p style="color: #666; font-size: 14px; margin-bottom: 5px; text-transform: uppercase;">${prod.category}</p>
                <h1 style="font-size: 24px; line-height: 1.3; margin-bottom: 5px;">${prod.title}</h1>
                <div style="display: flex; gap: 5px; align-items: center; margin-bottom: 15px; color: #ff9900; font-size: 18px;">
                    <ion-icon name="star"></ion-icon><ion-icon name="star"></ion-icon><ion-icon name="star"></ion-icon><ion-icon name="star"></ion-icon><ion-icon name="star-half"></ion-icon>
                    <span style="color: #007185; font-size: 14px; margin-left: 5px; cursor: pointer;">1,248 ratings</span>
                </div>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin-bottom: 15px;">
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Premium quality. Crafted for maximum comfort and style. Ideal for daily usage or special occasions.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <h2 style="font-size: 20px; margin-bottom: 15px;">Customer Reviews</h2>
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">Write a review</h4>
                    <div style="display: flex; gap: 10px; font-size: 24px; color: #ccc; margin-bottom: 10px; cursor: pointer;" id="star-rating-container">
                        <ion-icon name="star-outline" onclick="Array.from(this.parentElement.children).forEach((el,i)=>el.name=(i<=0)?'star':'star-outline'); this.parentElement.style.color='#ff9900'"></ion-icon>
                        <ion-icon name="star-outline" onclick="Array.from(this.parentElement.children).forEach((el,i)=>el.name=(i<=1)?'star':'star-outline'); this.parentElement.style.color='#ff9900'"></ion-icon>
                        <ion-icon name="star-outline" onclick="Array.from(this.parentElement.children).forEach((el,i)=>el.name=(i<=2)?'star':'star-outline'); this.parentElement.style.color='#ff9900'"></ion-icon>
                        <ion-icon name="star-outline" onclick="Array.from(this.parentElement.children).forEach((el,i)=>el.name=(i<=3)?'star':'star-outline'); this.parentElement.style.color='#ff9900'"></ion-icon>
                        <ion-icon name="star-outline" onclick="Array.from(this.parentElement.children).forEach((el,i)=>el.name=(i<=4)?'star':'star-outline'); this.parentElement.style.color='#ff9900'"></ion-icon>
                    </div>
                    <textarea placeholder="Write your review here..." style="width: 100%; max-width: 500px; height: 80px; padding: 10px; border-radius: 5px; border: 1px solid #ccc; margin-bottom: 10px; font-family: inherit; font-size: 14px; background: transparent; color: inherit;"></textarea>
                    <br>
                    <button onclick="alert('Review submitted!')" style="background: #f7ca00; color: #111; border: 1px solid #f2c200; padding: 8px 15px; border-radius: 8px; cursor: pointer;">Submit Review</button>
                </div>
                
                <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; margin-top: 15px;">
                    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 5px;">
                        <div style="width: 30px; height: 30px; border-radius: 50%; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #555; font-size: 12px;">JD</div>
                        <span style="font-weight: bold; font-size: 14px;">Jane Doe</span>
                    </div>
                    <div style="color: #ff9900; font-size: 14px; margin-bottom: 5px; display: flex; align-items: center;"><ion-icon name="star"></ion-icon><ion-icon name="star"></ion-icon><ion-icon name="star"></ion-icon><ion-icon name="star"></ion-icon><ion-icon name="star"></ion-icon> <span style="font-weight: bold; margin-left: 5px;">Excellent product!</span></div>
                    <p style="font-size: 12px; color: #565959;">Reviewed on ${new Date().toLocaleDateString()}</p>
                    <p style="font-size: 14px; margin-top: 10px;">This exceeded my expectations. Delivery was fast and the quality is amazing for the price.</p>
                </div>
            </div>
            
            <div style="flex: 1; min-width: 250px; max-width: 300px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 18px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); align-self: flex-start; background: var(--bg, #fff);" class="buy-box">
                <div style="font-size: 28px; font-weight: normal; margin-bottom: 10px; display: flex; align-items: flex-start;" class="price-big">
                    ${formatPrice(prod.price)}
                </div>
                <p style="font-size: 14px; margin-bottom: 15px;">
                    FREE delivery <strong>${new Date(new Date().setDate(new Date().getDate() + 4)).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day:'numeric'})}</strong>. <a href="#" style="color: #007185; text-decoration: none;">Details</a>
                </p>
                
                <div style="font-size: 14px; margin-bottom: 15px; cursor: pointer;" onclick="const loc = prompt('Enter zip code or type \\'current\\' to use Current Location:', 'Current Location'); if(loc) document.getElementById('del-loc-text').innerText = loc;">
                    <ion-icon name="location-outline" style="vertical-align: middle; font-size: 16px;"></ion-icon>
                    <a href="#" style="color: #007185; text-decoration: none;" id="del-loc">Delivering to <span id="del-loc-text">Mangaluru 575013</span> - Update location</a>
                </div>
                
                <h3 style="color: #007600; font-size: 18px; font-weight: normal; margin-bottom: 15px;">In stock</h3>
                
                <div style="font-size: 12px; color: #565959; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Ships from</span> <span style="color: inherit;">TrendWave</span></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Sold by</span> <span style="color: #007185; cursor: pointer;">Spooky®</span></div>
                    <div style="display: flex; justify-content: space-between;"><span>Payment</span> <span style="color: #007185; cursor: pointer;">Secure transaction</span></div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <select style="padding: 5px 10px; width: auto; border: 1px solid #d5d9d9; border-radius: 8px; background: transparent; color: inherit; cursor: pointer; outline: none;">
                        ${qtyOptions}
                    </select>
                </div>
                
                <button onclick="addToCart('${prod.id}')" style="width: 100%; background: #ffd814; color: #0f1111; border: none; padding: 12px; border-radius: 20px; font-size: 14px; cursor: pointer; margin-bottom: 10px;">Add to cart</button>
                <button onclick="alert('Processed Buy Now')" style="width: 100%; background: #ffa41c; color: #0f1111; border: none; padding: 12px; border-radius: 20px; font-size: 14px; cursor: pointer; margin-bottom: 15px;">Buy Now</button>
                
                <div style="border-top: 1px solid #d5d9d9; margin: 15px 0;"></div>
                <button onclick="addToFavourites('${prod.id}')" style="width: 100%; background: transparent; color: inherit; border: 1px solid #d5d9d9; padding: 8px; border-radius: 8px; font-size: 13px; cursor: pointer; text-align: left;">Add to Wish List</button>
            </div>
        </div>
    `;
}
