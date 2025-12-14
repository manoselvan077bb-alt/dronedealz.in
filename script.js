// ===== SIMPLE NAVIGATION (with phone back support) =====
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const bottomItems = document.querySelectorAll('.bottom-item');

const ADMIN_EMAIL = 'testweb123@gmail.com';

function showPage(pageId, push = true) {
  navLinks.forEach(l => {
    const target = l.getAttribute('data-page');
    l.classList.toggle('active', target === pageId);
  });

  pages.forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById(pageId);
  if (pageEl) pageEl.classList.add('active');

  if (push) {
    history.pushState({ page: pageId }, '', '#' + pageId);
  }

  if (window.innerWidth <= 768 && navMenu) {
    navMenu.style.display = 'none';
  }

  bottomItems.forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-page') === pageId);
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetPage = link.getAttribute('data-page');
    if (targetPage) showPage(targetPage, true);
  });
});

bottomItems.forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.getAttribute('data-page');
    if (page) showPage(page, true);
  });
});

const goLoginBtn = document.querySelector('#account .primary-btn[data-page="login"]');
if (goLoginBtn) {
  goLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('login', true);
  });
}

window.addEventListener('popstate', (event) => {
  const pageId = event.state && event.state.page ? event.state.page : 'home';
  showPage(pageId, false);
});

window.addEventListener('load', () => {
  const hash = location.hash.replace('#', '');
  const startPage = hash && document.getElementById(hash) ? hash : 'home';
  showPage(startPage, false);
});

// mobile nav toggle
if (hamburger && navMenu) {
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    const current = getComputedStyle(navMenu).display;
    navMenu.style.display = current === 'flex' ? 'none' : 'flex';
  });

  document.addEventListener('click', (e) => {
    if (window.innerWidth > 768) return;
    const target = e.target;
    const clickedInsideMenu = navMenu.contains(target);
    const clickedHamburger = hamburger.contains(target);
    if (!clickedInsideMenu && !clickedHamburger) {
      navMenu.style.display = 'none';
    }
  });
}

// ===== PRODUCT DATA =====
let products = [];
let currentProduct = null;

// ===== CART (localStorage) =====
let cart = [];

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem('dd_cart');
    cart = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading cart from localStorage', e);
    cart = [];
  }
}

function saveCartToStorage() {
  try {
    localStorage.setItem('dd_cart', JSON.stringify(cart));
  } catch (e) {
    console.error('Error saving cart to localStorage', e);
  }
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + (item.qty || 1), 0);
}

function updateCartBadge() {
  const cartBtn = document.querySelector('.bottom-item[data-page="cart"]');
  if (!cartBtn) return;

  let badge = cartBtn.querySelector('.cart-badge');
  const count = getCartCount();

  if (count === 0) {
    if (badge) badge.remove();
    return;
  }

  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'cart-badge';
    cartBtn.appendChild(badge);
  }
  badge.textContent = count;
}

function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      platform: product.platform,
      url: product.url || null,
      category: product.category,
      qty: 1
    });
  }
  saveCartToStorage();
  updateCartBadge();
  renderCartPage();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCartToStorage();
  updateCartBadge();
  renderCartPage();
}

function calcCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
}

// ===== HELPERS =====
function calcPriceMeta(p) {
  const price = Number(p.price || 0);
  const mrp = Number(p.mrp || 0);
  const hasMrp = mrp > price && mrp > 0;
  const discount = hasMrp ? Math.round((mrp - price) / mrp * 100) : null;
  return { price, mrp, hasMrp, discount };
}

// ===== PRODUCT CARD COMPONENT =====
function createProductCard(p) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-category', p.category || '');

  const { price, mrp, hasMrp, discount } = calcPriceMeta(p);
  const hasImage = p.image && typeof p.image === 'string';

  card.innerHTML = `
    <div class="product-image big-card">
      ${hasImage
        ? `<img src="${p.image}" alt="${p.name}" class="product-img-real">`
        : `<i class="fas fa-cogs"></i>`}
    </div>
    <div class="product-info">
      <h3>${p.name}</h3>
      <div class="price">
        ₹${price}
        ${hasMrp ? `<span class="old-price">₹${mrp}</span>` : ''}
        ${discount ? `<span class="discount">${discount}% off</span>` : ''}
      </div>
      <div class="buy-buttons">
        <a href="${p.url || '#'}" target="_blank" rel="noopener" class="buy-btn ${p.platform}">
          Buy on ${p.platform ? p.platform.charAt(0).toUpperCase() + p.platform.slice(1) : 'site'}
          <i class="fab fa-${p.platform}"></i>
        </a>
        <button class="fav-btn">❤️ Save</button>
        <button class="cart-btn"><i class="fas fa-shopping-cart"></i> Cart</button>
      </div>
    </div>
  `;

  const favBtn = card.querySelector('.fav-btn');
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleFavouriteClick(p, favBtn);
  });

  const cartBtn = card.querySelector('.cart-btn');
  cartBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    addToCart(p);
    cartBtn.textContent = 'Added';
    setTimeout(() => (cartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Cart'), 800);
  });

  card.addEventListener('click', (e) => {
    const isBuyBtn = e.target.closest('.buy-btn');
    const isFavBtn = e.target.closest('.fav-btn');
    const isCartBtn = e.target.closest('.cart-btn');
    if (isBuyBtn || isFavBtn || isCartBtn) return;

    currentProduct = p;
    renderProductDetail();
    showPage('productDetail', true);
  });

  return card;
}

// ===== PRODUCT DETAIL + RELATED =====
function renderProductDetail() {
  const container = document.getElementById('productDetailContent');
  if (!container || !currentProduct) return;

  const p = currentProduct;
  const { price, mrp, hasMrp, discount } = calcPriceMeta(p);

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div class="product-image big-card" style="height:120px;">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" class="product-img-real">`
          : `<i class="fas fa-cogs"></i>`}
      </div>

      <div>
        <h2 style="font-size:1.1rem;margin-bottom:4px;">${p.name}</h2>
        <p style="font-size:0.85rem;color:#6b7280;">Category: ${p.category || '-'}</p>
        <p style="font-size:0.85rem;color:#6b7280;">Platform: ${p.platform || '-'}</p>
      </div>

      <div style="font-size:1rem;font-weight:600;">
        ₹${price}
        ${hasMrp ? `<span class="old-price">₹${mrp}</span>` : ''}
        ${discount ? `<span class="discount">${discount}% off</span>` : ''}
      </div>

      <a href="${p.url || '#'}" target="_blank" rel="noopener"
         class="primary-btn" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
        Go to ${p.platform ? p.platform.charAt(0).toUpperCase() + p.platform.slice(1) : 'seller'}
        <i class="fas fa-external-link-alt"></i>
      </a>

      <p style="font-size:0.75rem;color:#9ca3af;">
        Price, stock and delivery details are shown on the seller page.
      </p>
      <p style="font-size:0.75rem;color:#6b7280;">
        Some links on DroneDealz.in are affiliate links, which means DroneDealz may earn a small commission if you buy through them at no extra cost to you.
      </p>

      <button class="primary-btn" style="background:#22c55e;color:#ffffff;" id="addDetailToCart">
        + Add to cart
      </button>

      <button class="primary-btn" style="background:#e5e7eb;color:#111827;" id="backToHomeBtn">
        ← Back to Home
      </button>
    </div>
  `;

  const backBtn = container.querySelector('#backToHomeBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      showPage('home', true);
    });
  }

  const addDetailBtn = container.querySelector('#addDetailToCart');
  if (addDetailBtn) {
    addDetailBtn.addEventListener('click', () => {
      addToCart(p);
      addDetailBtn.textContent = 'Added';
      setTimeout(() => (addDetailBtn.textContent = '+ Add to cart'), 800);
    });
  }

  // related products
  const relatedWrap = document.createElement('div');
  relatedWrap.style.marginTop = '16px';

  const sameCategory = products
    .filter(x => x.id !== p.id && x.category === p.category)
    .slice(0, 8);

  if (sameCategory.length) {
    relatedWrap.innerHTML = `
      <h3 style="font-size:0.95rem;margin:8px 0;">More in ${p.category}</h3>
      <div class="products-grid" id="detailRelatedGrid"></div>
    `;
    container.appendChild(relatedWrap);

    const grid = relatedWrap.querySelector('#detailRelatedGrid');
    sameCategory.forEach(prod => {
      const card = createProductCard(prod);
      grid.appendChild(card);
    });
  }
}

// ===== FAVOURITES (Firestore) =====
async function handleFavouriteClick(product, buttonEl) {
  const user = auth.currentUser;
  if (!user) {
    alert('Please log in to save favourites.');
    return;
  }

  try {
    const userRef = db.collection('users').doc(user.uid);
    await userRef.update({
      favourites: firebase.firestore.FieldValue.arrayUnion({
        name: product.name,
        price: product.price,
        category: product.category,
        platform: product.platform,
        url: product.url || null
      })
    });
    buttonEl.textContent = '✅ Saved';
    buttonEl.classList.add('saved');
    renderFavourites(user.uid);
  } catch (error) {
    console.error('Error saving favourite:', error);
    alert('Could not save. Try again.');
  }
}

async function renderFavourites(userId) {
  const listEl = document.getElementById('favouritesList');
  if (!listEl) return;

  listEl.innerHTML = '<p class="empty-msg">Loading favourites...</p>';

  try {
    const snap = await db.collection('users').doc(userId).get();
    const data = snap.exists ? snap.data() : {};
    const favs = data.favourites || [];

    if (!favs.length) {
      listEl.innerHTML = '<p class="empty-msg">No favourites yet. Save parts from Home or Search.</p>';
      return;
    }

    listEl.innerHTML = '';
    favs.forEach(f => {
      const item = document.createElement('div');
      item.className = 'fav-item';
      item.innerHTML = `
        <div class="fav-item-main">
          <span class="fav-item-name">${f.name}</span>
          <span class="fav-item-meta">${f.category} • ₹${f.price}</span>
        </div>
        <a class="fav-item-platform ${f.platform}" href="${f.url || '#'}" target="_blank" rel="noopener">
          ${f.platform}
        </a>
      `;
      listEl.appendChild(item);
    });
  } catch (e) {
    console.error(e);
    listEl.innerHTML = '<p class="empty-msg">Could not load favourites.</p>';
  }
}

// ===== HOME =====
const catButtons = document.querySelectorAll('.cat-btn');
const homeProductsContainer = document.getElementById('homeProducts');
const sortSelect = document.getElementById('sortSelect');
const resultCount = document.getElementById('resultCount');

function renderHomeProducts(category = 'all') {
  if (!homeProductsContainer) return;
  homeProductsContainer.innerHTML = '';

  let filtered =
    category === 'all'
      ? [...products]
      : products.filter(p => p.category === category);

  const sortValue = sortSelect ? sortSelect.value : 'default';
  const toNumber = x => Number(x || 0);

  if (sortValue === 'price-asc') {
    filtered.sort((a, b) => toNumber(a.price) - toNumber(b.price));
  } else if (sortValue === 'price-desc') {
    filtered.sort((a, b) => toNumber(b.price) - toNumber(a.price));
  }

  if (resultCount) {
    const badgeNumber = resultCount.querySelector('.result-count-badge span');
    const count = filtered.length;
    if (badgeNumber) badgeNumber.textContent = count;
    resultCount.style.display = count > 0 ? 'block' : 'none';
  }

  filtered.forEach(p => {
    const card = createProductCard(p);
    homeProductsContainer.appendChild(card);
  });
}

if (catButtons && homeProductsContainer) {
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-category') || 'all';
      renderHomeProducts(cat);
    });
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    const activeBtn = document.querySelector('.cat-btn.active');
    const cat = activeBtn ? activeBtn.getAttribute('data-category') || 'all' : 'all';
    renderHomeProducts(cat);
  });
}

// ===== SEARCH =====
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const topSearchInput = document.getElementById('topSearchInput');

function renderSearchResults(query) {
  if (!searchResults) return;
  searchResults.innerHTML = '';

  const q = query.trim().toLowerCase();
  if (!q) return;

  const filtered = products.filter(p => {
    const name = (p.name || '').toLowerCase();
    const category = (p.category || '').toLowerCase();
    const platform = (p.platform || '').toLowerCase();
    return (
      name.includes(q) ||
      category.includes(q) ||
      platform.includes(q)
    );
  });

  if (filtered.length === 0) {
    searchResults.innerHTML =
      '<p style="text-align:center;color:#9ca3af;">No parts found. Try "motor" or "ESC".</p>';
    return;
  }

  filtered.forEach(product => {
    const card = createProductCard(product);
    searchResults.appendChild(card);
  });
}

if (searchInput && searchResults) {
  searchInput.addEventListener('input', (e) => {
    renderSearchResults(e.target.value);
  });
}

if (topSearchInput) {
  topSearchInput.addEventListener('input', (e) => {
    showPage('search', true);
    renderSearchResults(e.target.value);
  });
}

// ===== DEALZ (high-discount products) =====
const dealsProductsContainer = document.getElementById('dealsProducts');

function renderDealsProducts() {
  if (!dealsProductsContainer) return;
  dealsProductsContainer.innerHTML = '';

  const HIGH_DISCOUNT = 40; // % threshold

  const highDealz = products.filter(p => {
    const { hasMrp, discount } = calcPriceMeta(p);
    return hasMrp && discount >= HIGH_DISCOUNT;
  });

  if (!highDealz.length) {
    dealsProductsContainer.innerHTML =
      '<p style="text-align:center;color:#9ca3af;font-size:0.85rem;">No big dealz right now. New high-discount parts will appear here.</p>';
    return;
  }

  highDealz.forEach(p => {
    const card = createProductCard(p);
    dealsProductsContainer.appendChild(card);
  });
}

// ===== GUIDES (AUTO FROM PRODUCTS) =====
function renderGuideMotors() {
  const body = document.getElementById('guideMotorsBody');
  if (!body) return;
  body.innerHTML = '';

  const items = products.filter(p => Array.isArray(p.tags) && p.tags.includes('5inch-motor'));
  items.forEach(p => {
    const { price } = calcPriceMeta(p);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${p.name}</td>
      <td>${p.kv || '-'}</td>
      <td>₹${price}</td>
      <td><a href="${p.url || '#'}" target="_blank" rel="noopener">
        ${p.platform}
      </a></td>
    `;
    body.appendChild(row);
  });
}

function renderGuideBuild5000() {
  const body = document.getElementById('guideBuild5000Body');
  if (!body) return;
  body.innerHTML = '';

  const items = products.filter(p => Array.isArray(p.tags) && p.tags.includes('build5000'));
  items.forEach(p => {
    const { price } = calcPriceMeta(p);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${p.category}</td>
      <td>${p.name}</td>
      <td>₹${price}</td>
      <td><a href="${p.url || '#'}" target="_blank" rel="noopener">
        ${p.platform}
      </a></td>
    `;
    body.appendChild(row);
  });
}

// ===== MINI CART PREVIEW ON HOME =====
function renderHomeCartPreview() {
  const box = document.getElementById('homeCartPreview');
  if (!box) return;

  if (!cart.length) {
    box.innerHTML = '';
    box.style.display = 'none';
    return;
  }

  const totalItems = getCartCount();
  const totalAmount = calcCartTotal();
  const previewItems = cart.slice(0, 2);

  box.style.display = 'block';
  box.innerHTML = `
    <div class="home-cart-header">
      <span class="home-cart-title">Cart</span>
      <span class="home-cart-meta">${totalItems} item(s) • ₹${totalAmount}</span>
    </div>
    <div class="home-cart-items">
      ${previewItems
        .map(
          it => `
        <div class="home-cart-item">
          <span class="home-cart-item-name">${it.name}</span>
          <span class="home-cart-item-meta">₹${it.price} × ${it.qty}</span>
        </div>
      `
        )
        .join('')}
    </div>
    <button class="primary-btn home-cart-btn" onclick="showPage('cart', true)">
      View cart
    </button>
  `;
}

// ===== CART PAGE RENDER =====
function renderCartPage() {
  const cartPage = document.getElementById('cart');
  if (!cartPage) return;

  let container = cartPage.querySelector('.cart-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'cart-container';
    cartPage.appendChild(container);
  }

  if (!cart.length) {
    container.innerHTML = `
      <p class="cart-empty">Your cart is empty. Add parts from Home or Search.</p>
    `;
    return;
  }

  const total = calcCartTotal();
  container.innerHTML = `
    <div class="cart-summary">
      <span class="cart-summary-title">Cart total</span>
      <span class="cart-summary-amount">₹${total}</span>
    </div>
    <div class="cart-items"></div>
    <p class="cart-note">
      Cart is only a helper list. Checkout, payment and delivery happen on Amazon / Flipkart.
    </p>
  `;

  const listEl = container.querySelector('.cart-items');

  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-item-main">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-meta">${item.category} • ₹${item.price} × ${item.qty}</span>
      </div>
      <div class="cart-item-actions">
        <button class="cart-remove" data-id="${item.id}">Remove</button>
        ${item.url ? `<a href="${item.url}" target="_blank" rel="noopener" class="cart-buy-link">Buy</a>` : ''}
      </div>
    `;
    listEl.appendChild(row);
  });

  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.cart-remove');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    if (!id) return;
    removeFromCart(id);
  });
}

// ===== AUTH =====
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');

function showMessage(msg) {
  alert(msg);
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;

    if (password !== confirm) {
      showMessage('Passwords do not match');
      return;
    }

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await db.collection('users').doc(cred.user.uid).set({
        name,
        email,
        favourites: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showMessage('Account created. You are logged in.');
      showPage('account', true);
    } catch (err) {
      console.error(err);
      showMessage(err.message);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      await auth.signInWithEmailAndPassword(email, password);
      showMessage('Logged in successfully');
      showPage('account', true);
    } catch (err) {
      console.error(err);
      showMessage(err.message);
    }
  });
}

const accountPage = document.getElementById('account');
const adminSection = document.getElementById('admin');

auth.onAuthStateChanged(async (user) => {
  if (!accountPage) return;
  const infoCard = accountPage.querySelector('.info-card');

  if (user) {
    let displayName = user.email;
    try {
      const snap = await db.collection('users').doc(user.uid).get();
      if (snap.exists && snap.data().name) {
        displayName = snap.data().name;
      }
    } catch (e) {
      console.error(e);
    }

    if (infoCard) {
      infoCard.innerHTML = `
        <p class="info-highlight">Welcome, ${displayName}</p>
        <p>You are signed in with <strong>${user.email}</strong>.</p>
      `;
    }

    if (adminSection) {
      adminSection.style.display = user.email === ADMIN_EMAIL ? 'block' : 'none';
    }

    await renderFavourites(user.uid);
  } else {
    if (infoCard) {
      infoCard.innerHTML = `
        <p>Sign in to manage your profile and saved builds.</p>
      `;
    }
    if (adminSection) {
      adminSection.style.display = 'none';
    }
  }
});

window.droneLogout = async function () {
  try {
    await auth.signOut();
    showMessage('Logged out');
    showPage('home', true);
  } catch (e) {
    console.error(e);
  }
};

// ===== ADMIN: ADD PRODUCT =====
window.addEventListener('load', () => {
  const adminProductForm = document.getElementById('adminProductForm');
  const adminStatus = document.getElementById('adminStatus');

  if (!adminProductForm) return;

  adminProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('adminProdName').value.trim();
    const price = Number(document.getElementById('adminProdPrice').value.trim());
    const mrp   = Number(document.getElementById('adminProdMrp').value.trim() || 0);
    const category = document.getElementById('adminProdCategory').value.trim().toLowerCase();
    const platform = document.getElementById('adminProdPlatform').value.trim().toLowerCase();
    const url = document.getElementById('adminProdUrl').value.trim();
    const image = document.getElementById('adminProdImage')?.value.trim() || '';
    const tagsRaw = document.getElementById('adminProdTags')?.value.trim() || '';
    const tags = tagsRaw
      ? tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      : [];

    if (!name || !price || !category || !platform || !url) {
      alert('Please fill all fields.');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      alert('Admin access only.');
      return;
    }

    try {
      const docRef = await db.collection('products').add({
        name,
        price,
        mrp,
        category,
        platform,
        url,
        image,
        tags,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('Saved product with id:', docRef.id);
      adminProductForm.reset();
      if (adminStatus) {
        adminStatus.innerHTML = '<p>Saved to Firestore collection <strong>products</strong>.</p>';
      }

      await loadProductsFromFirestore();
    } catch (err) {
      console.error('Error saving product:', err);
      if (adminStatus) {
        adminStatus.innerHTML = '<p>Could not save product. Check console.</p>';
      }
      alert('Could not save product: ' + err.message);
    }
  });
});

// ===== LOAD PRODUCTS FROM FIRESTORE & INIT =====
async function loadProductsFromFirestore() {
  try {
    const snap = await db.collection('products')
      .orderBy('createdAt', 'desc')
      .get();

    products = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    renderHomeProducts('all');
    renderDealsProducts();
    renderGuideMotors();
    renderGuideBuild5000();
  } catch (err) {
    console.error('Error loading products from Firestore:', err);
  }
}

loadCartFromStorage();
updateCartBadge();
loadProductsFromFirestore();
renderCartPage();
renderHomeCartPreview();
