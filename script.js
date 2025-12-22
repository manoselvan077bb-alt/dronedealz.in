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

  if (pageId === 'account') {
    onAccountPageShown();
  }
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
  const hash = location.hash.replace("#", "");
  const startPage = hash && document.getElementById(hash) ? hash : 'home';
  showPage(startPage, false);

  // loadWallet(); ❌ DISABLED (wallet backend not ready)
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


// ==== ADD TO CART WITH IMAGE ====
function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);

  const image =
    Array.isArray(product.images) && product.images.length
      ? product.images[0]
      : (product.image || null);

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
      image: image,
      qty: 1
    });
  }
  saveCartToStorage();
  updateCartBadge();
  renderCartPage();
  renderHomeCartPreview();
}


function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCartToStorage();
  updateCartBadge();
  renderCartPage();
  renderHomeCartPreview();
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

  const mainImage = Array.isArray(p.images) && p.images.length
    ? p.images[0]
    : (p.image || null);
  const hasImage = !!mainImage;

  card.innerHTML = `
    <div class="product-image big-card">
  ${hasImage
    ? `
      <img
  src="${mainImage}"
  alt="${p.name}"
  class="product-img-real"
  loading="lazy"
>

    `
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


// ===== PRODUCT DETAIL (SCROLLABLE GALLERY) =====
function renderProductDetail() {
  if (!currentProduct) return;

  const p = currentProduct;
  const { price, mrp, hasMrp, discount } = calcPriceMeta(p);

  const images = Array.isArray(p.images) && p.images.length
    ? p.images
    : (p.image ? String(p.image).split(',').map(s => s.trim()).filter(Boolean) : []);

  const titleEl = document.getElementById('detailTitle');
  const priceEl = document.getElementById('detailPrice');
  const metaEl  = document.getElementById('detailMeta');
  const btnBox  = document.getElementById('detailBuyButtons');
  const box     = document.getElementById('detailImageBox');

  if (!titleEl || !priceEl || !metaEl || !btnBox || !box) return;

  let currentIndex = 0;

  box.innerHTML = `
    <button class="gallery-nav gallery-prev" id="detailPrevBtn">&lt;</button>
    <img id="detailImage" class="product-img-real" alt="">
    <button class="gallery-nav gallery-next" id="detailNextBtn">&gt;</button>
  `;

  const mainImg = document.getElementById('detailImage');
  const prevBtn = document.getElementById('detailPrevBtn');
  const nextBtn = document.getElementById('detailNextBtn');

  function showImage(idx) {
    if (!images.length || !mainImg) return;
    currentIndex = (idx + images.length) % images.length;
    mainImg.src = images[currentIndex];
  }

  if (images.length) {
    showImage(0);
  } else if (mainImg) {
    mainImg.removeAttribute('src');
  }
  if (mainImg) mainImg.alt = p.name || '';

  if (prevBtn && nextBtn && images.length > 1) {
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      showImage(currentIndex - 1);
    };
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      showImage(currentIndex + 1);
    };
  }

  box.onclick = (e) => {
    const clickedButton = e.target.closest('.gallery-nav');
    if (clickedButton) return;
    if (!images.length) return;
    const url = images[currentIndex];
    const win = window.open('', '_blank');
    if (win && url) {
      win.document.write(
        `<img src="${url}" style="width:100%;height:100%;object-fit:contain;margin:0;">`
      );
      win.document.title = p.name || 'Image';
    }
  };

  titleEl.textContent = p.name || '';
  priceEl.innerHTML = `
    ₹${price}
    ${hasMrp ? `<span class="old-price">₹${mrp}</span>` : ''}
    ${discount ? `<span class="discount">${discount}% off</span>` : ''}
  `;
  metaEl.textContent = `${p.category || '-'} • ${p.platform || '-'}`;

  // Affiliate sentence just for product details
  const affiliateNote = document.createElement('p');
  affiliateNote.className = 'product-detail-meta';
  affiliateNote.style.fontSize = '0.8rem';
  affiliateNote.style.color = '#6b7280';
  affiliateNote.style.marginTop = '4px';
  affiliateNote.textContent =
    'As an Amazon & Flipkart affiliate, Dealz may earn a commission from qualifying purchases.';
  const detailRight = document.querySelector('#productDetail .product-detail-right');
  if (detailRight) detailRight.appendChild(affiliateNote);

  btnBox.innerHTML = `
    <a href="${p.url || '#'}" target="_blank" rel="noopener"
       class="buy-btn ${p.platform}">
      Buy on ${p.platform
        ? p.platform.charAt(0).toUpperCase() + p.platform.slice(1)
        : 'site'}
    </a>
    <button class="cart-btn" id="detailAddToCart">
      <i class="fas fa-shopping-cart"></i> Add to cart
    </button>
  `;

  const addBtn = document.getElementById('detailAddToCart');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addToCart(p);
      addBtn.textContent = 'Added';
      setTimeout(
        () => (addBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to cart'),
        800
      );
    });
  }

  renderMoreProducts();
}


// ===== MORE PRODUCTS UNDER DETAIL =====
function renderMoreProducts() {
  const listEl = document.getElementById('moreProductsList');
  const card   = document.getElementById('moreProductsCard');
  if (!listEl || !card) return;

  listEl.innerHTML = '';

  if (!products.length) {
    card.style.display = 'none';
    return;
  }

  const base = currentProduct;

  let related = products.filter(p =>
    base && p.id !== base.id &&
    (p.category || '').toLowerCase() === (base.category || '').toLowerCase()
  );

  if (!related.length) {
    related = products.filter(p => !base || p.id !== base.id);
  }

  related = related.slice(0, 8);

  if (!related.length) {
    card.style.display = 'none';
    return;
  }

  card.style.display = 'block';

  related.forEach(p => {
    const cardEl = createProductCard(p);
    listEl.appendChild(cardEl);
  });
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
const resultCount = document.getElementById('resultCount');


function renderHomeProducts(category = 'all') {
  if (!homeProductsContainer) return;
  homeProductsContainer.innerHTML = '';

  const filtered =
    category === 'all'
      ? [...products]
      : products.filter(p => p.category === category);

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


// ===== SEARCH =====
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const topSearchInput = document.getElementById('topSearchInput');
const topSearchVoice = document.getElementById('topSearchVoice');


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


// ===== VOICE SEARCH (MIC) FOR TOP SEARCH =====
if (topSearchVoice && topSearchInput) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    topSearchVoice.addEventListener('click', () => {
      alert('Voice search is not supported on this browser. Please type your search.');
    });
  } else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    topSearchVoice.addEventListener('click', () => {
      recognition.start();
    });

    recognition.addEventListener('result', (event) => {
      const transcript = event.results[0][0].transcript || '';
      topSearchInput.value = transcript;
      showPage('search', true);
      renderSearchResults(transcript);
    });

    recognition.addEventListener('error', (event) => {
      console.error('Voice search error:', event.error);
      alert('Could not use voice search. Please try again or type your query.');
    });
  }
}


// ===== DEALZ (high-discount products) =====
const dealsProductsContainer = document.getElementById('dealsProducts');


function renderDealsProducts() {
  if (!dealsProductsContainer) return;
  dealsProductsContainer.innerHTML = '';

  const HIGH_DISCOUNT = 40;

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
        <div class="cart-item-thumb">
          ${item.image
            ? `<img src="${item.image}" alt="${item.name}">`
            : `<i class="fas fa-cogs"></i>`}
        </div>
        <div class="cart-item-text">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-meta">${item.category} • ₹${item.price} × ${item.qty}</span>
        </div>
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


// ===== UPI ID SAVE + LOAD =====
async function onAccountPageShown() {
  const upiInput = document.getElementById('upiIdInput');
  const upiStatus = document.getElementById('upiStatus');
  const user = auth.currentUser;
  if (!upiInput || !upiStatus || !user) return;

  try {
    const snap = await db.collection('users').doc(user.uid).get();
    if (snap.exists && snap.data().upiId) {
      upiInput.value = snap.data().upiId;
      upiStatus.textContent = 'Saved UPI ID loaded.';
      upiStatus.style.color = '#6b7280';
    } else {
      upiStatus.textContent = '';
    }
  } catch (err) {
    console.error('Error loading UPI ID', err);
  }
}


const upiForm = document.getElementById('upiForm');
if (upiForm) {
  upiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const upiInput = document.getElementById('upiIdInput');
    const upiStatus = document.getElementById('upiStatus');
    const upiId = upiInput.value.trim();
    const user = auth.currentUser;

    if (!upiId.includes('@')) {
      upiStatus.textContent = 'Please enter a valid UPI ID like name@oksbi.';
      upiStatus.style.color = '#dc2626';
      return;
    }

    if (!user) {
      upiStatus.textContent = 'Log in first to save your UPI ID.';
      upiStatus.style.color = '#dc2626';
      return;
    }

    try {
      await db.collection('users').doc(user.uid).set(
        { upiId },
        { merge: true }
      );
      upiStatus.textContent = 'UPI ID saved for cashback.';
      upiStatus.style.color = '#16a34a';

      // refresh spin eligibility when UPI is saved
      //getTodaySpendInfo().then(updateSpinProgress);
    } catch (err) {
      console.error('Error saving UPI ID', err);
      upiStatus.textContent = 'Could not save now. Please try again.';
      upiStatus.style.color = '#dc2626';
    }
  });
}


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


// ===== SPIN PAGE LOGIC =====
const SPIN_SEGMENTS = [10, 20, 30, 40, 50];


// Sum today's confirmed orders + check UPI
 /*async function getTodaySpendInfo() {
  const user = auth.currentUser;

  if (!user) {
    return { count: 0, total: 0, hasUpi: false };
  }

  // ✅ Check UPI (THIS LINE IS CORRECT)
  let hasUpi = false;
  try {
    const userSnap = await db.collection('users').doc(user.uid).get();
    const data = userSnap.exists ? userSnap.data() : {};
    hasUpi = !!(data.upiId && String(data.upiId).includes('@'));
  } catch (e) {
    console.error('Error checking UPI ID for spin:', e);
  }

  // ✅ Today time range
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const startTs = firebase.firestore.Timestamp.fromDate(startOfDay);
  const endTs = firebase.firestore.Timestamp.fromDate(endOfDay);

  // ✅ FIXED QUERY (timestamp-safe)
  const snap = await db.collection('orders')
  .where('userId', '==', user.uid)
  .where('status', '==', 'confirmed')
  .where('createdAt', '>=', startTs)
  .where('createdAt', '<', endTs)
  .orderBy('createdAt', 'desc') // ✅ MUST MATCH INDEX
  .get();

  let total = 0;
  snap.forEach(doc => {
    total += Number(doc.data().amount || 0);
  });

  return {
    count: snap.size,
    total,
    hasUpi
  };
}
  */



// Decide prize tier from total
  /*function pickPrizeFromTotal(totalAmount) {
  if (totalAmount >= 5000) return 50;
  if (totalAmount >= 4000) return 40;
  if (totalAmount >= 3000) return 30;
  if (totalAmount >= 2000) return 20;
  if (totalAmount >= 999) return 10; // was 1000
  return 0;
}


function updateSpinProgress(info) {
  const { count, total, hasUpi } = info;
  const textEl = document.getElementById('spinProgressText');
  const fillEl = document.getElementById('spinProgressFill');
  const btn = document.getElementById('spinButton');
  if (!textEl || !fillEl || !btn) return;

  const max = 2;
const c = Math.min(count, max);

textEl.textContent = `Today you bought ${c}/${max} products • ₹${total} total.`;
fillEl.style.width = (c / max) * 100 + '%';

const eligibleByOrders = c >= 2 && total >= 999;

if (!eligibleByOrders) {
  btn.disabled = true;
  btn.textContent = 'Buy 2 items to unlock';
  return;
}


  if (!hasUpi) {
    btn.disabled = true;
    btn.textContent = 'Add UPI ID in Account to unlock';
    return;
  }

  btn.disabled = false;
  btn.textContent = 'Tap to spin';
} */


// Wheel drawing with separators and centre arrow + top marker
function drawWheel(ctx, segments, angleOffset) {
  const cx = ctx.canvas.width / 2;
  const cy = ctx.canvas.height / 2;
  const outerR = Math.min(cx, cy) - 4;
  const innerR = outerR * 0.78;
  const slice = (2 * Math.PI) / segments.length;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // outer rim
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
  ctx.fillStyle = '#facc15';
  ctx.fill();

  // segments + separators
  segments.forEach((value, i) => {
    const start = i * slice + angleOffset;
    const end = start + slice;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, innerR, start, end);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? '#f97373' : '#ef4444';
    ctx.fill();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(start) * innerR,
      cy + Math.sin(start) * innerR
    );
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const mid = start + slice / 2;
    const tx = cx + Math.cos(mid) * (innerR * 0.6);
    const ty = cy + Math.sin(mid) * (innerR * 0.6);
    ctx.fillText(`₹${value}`, tx, ty);
  });

  // center hub outer circle
  ctx.beginPath();
  ctx.arc(cx, cy, innerR * 0.35, 0, 2 * Math.PI);
  ctx.fillStyle = '#facc15';
  ctx.fill();

  // inner center circle
  ctx.beginPath();
  ctx.arc(cx, cy, innerR * 0.28, 0, 2 * Math.PI);
  ctx.fillStyle = '#f97316';
  ctx.fill();

  // big centre arrow
  const arrowLen = innerR * 0.5;
  const arrowWidth = innerR * 0.18;
  const tipX = cx;
  const tipY = cy - arrowLen;

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(cx - arrowWidth / 2, cy - innerR * 0.15);
  ctx.lineTo(cx + arrowWidth / 2, cy - innerR * 0.15);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // screw
  ctx.beginPath();
  ctx.arc(cx, cy, innerR * 0.1, 0, 2 * Math.PI);
  ctx.fillStyle = '#fefce8';
  ctx.fill();

  // top pointer marker
  const pointerWidth = 22;
  const pointerHeight = 26;
  const pointerY = cy - outerR - 4;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, pointerY);
  ctx.lineTo(cx - pointerWidth / 2, pointerY - pointerHeight);
  ctx.lineTo(cx + pointerWidth / 2, pointerY - pointerHeight);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(cx, pointerY - 2);
  ctx.lineTo(cx - (pointerWidth * 0.4), pointerY - pointerHeight + 4);
  ctx.lineTo(cx + (pointerWidth * 0.4), pointerY - pointerHeight + 4);
  ctx.closePath();
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2;
  ctx.stroke();
}
  /*async function getTodaySpinCount(userId) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const snap = await db.collection('spinWins')
    .where('userId', '==', userId)
    .where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(start))
    .where('createdAt', '<', firebase.firestore.Timestamp.fromDate(end))
    .get();

  return snap.size;
}
*/

function initSpinPage() {
  const canvas = document.getElementById('spinCanvas');
  const btn = document.getElementById('spinButton');
  if (!canvas || !btn) return;

  const ctx = canvas.getContext('2d');
  let currentAngle = 0;
  let spinning = false;

  drawWheel(ctx, SPIN_SEGMENTS, currentAngle);

  // 🔒 lock check (REAL MODE)
  const uid = auth.currentUser?.uid;
  if (uid && localStorage.getItem(`spin_used_${uid}`)) {
    btn.disabled = true;
    btn.textContent = 'Spin Used 🎉';
  } else {
    btn.disabled = false;
    btn.textContent = 'Tap to spin';
  }

  btn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Log in to use the spin wheel.');
      return;
    }

    if (spinning) return;

    if (localStorage.getItem(`spin_used_${user.uid}`)) {
      btn.disabled = true;
      btn.textContent = 'Spin Used 🎉';
      return;
    }

    spinning = true;
    btn.disabled = true;
    btn.textContent = 'Spinning...';

    const slice = (2 * Math.PI) / SPIN_SEGMENTS.length;
    const randomSegment = Math.floor(Math.random() * SPIN_SEGMENTS.length);

    const pointerOffset = -Math.PI / 2;
    const targetAngle =
      pointerOffset - (randomSegment * slice + slice / 2);

    const extraTurns = 5 * 2 * Math.PI;
    const finalAngle = targetAngle + extraTurns;
    const duration = 3000;
    const start = performance.now();

    function animate(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const angle = currentAngle + (finalAngle - currentAngle) * ease;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawWheel(ctx, SPIN_SEGMENTS, angle);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        currentAngle = angle;
        spinning = false;
        finishSpin(user.uid, randomSegment);
      }
    }

    requestAnimationFrame(animate);
  });

  function finishSpin(uid, index) {
    const prize = SPIN_SEGMENTS[index];

    alert(`🎉 You won ₹${prize}\n(credited after verification)`);

    // 🔐 REAL MODE LOCK
    localStorage.setItem(`spin_used_${uid}`, 'true');
    localStorage.setItem(`spin_time_${uid}`, Date.now());

    btn.disabled = true;
    btn.textContent = 'Spin Used 🎉';
  }
}



// ===== LOAD PRODUCTS FROM FIRESTORE & INIT =====
async function loadProductsFromFirestore() {
  try {
    const snap = await db.collection('products')
      .orderBy('createdAt', 'desc')
      .get();

    products = snap.docs.map(doc => {
      const data = doc.data();
      let images = [];

      if (Array.isArray(data.images)) {
        images = data.images;
      } else if (typeof data.image === 'string' && data.image.trim()) {
        images = data.image.split(',').map(s => s.trim()).filter(Boolean);
      }

      return {
        id: doc.id,
        ...data,
        images
      };
    });

    renderHomeProducts('all');
    renderDealsProducts();
    renderHomeCartPreview();
  } catch (err) {
    console.error('Error loading products from Firestore:', err);
  }
}


// Initialisation
loadCartFromStorage();
updateCartBadge();
loadProductsFromFirestore();
renderCartPage();
renderHomeCartPreview();
initSpinPage();

auth.onAuthStateChanged(user => {
  if (!user) return;

 // getTodaySpendInfo().then(updateSpinProgress);
});
