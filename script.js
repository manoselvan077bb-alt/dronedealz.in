// ===== SIMPLE NAVIGATION (with phone back support) =====
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const bottomItems = document.querySelectorAll('.bottom-item');

function showPage(pageId, push = true) {
  // top nav
  navLinks.forEach(l => {
    const target = l.getAttribute('data-page');
    l.classList.toggle('active', target === pageId);
  });

  // sections
  pages.forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById(pageId);
  if (pageEl) pageEl.classList.add('active');

  // history for phone back
  if (push) {
    history.pushState({ page: pageId }, '', '#' + pageId);
  }

  // close mobile menu
  if (window.innerWidth <= 768 && navMenu) {
    navMenu.style.display = 'none';
  }

  // bottom nav
  bottomItems.forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-page') === pageId);
  });
}

// top nav clicks
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetPage = link.getAttribute('data-page');
    if (targetPage) showPage(targetPage, true);
  });
});

// bottom nav clicks
bottomItems.forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.getAttribute('data-page');
    if (page) showPage(page, true);
  });
});

// "Go to Log in" button inside Account page
const goLoginBtn = document.querySelector('#account .primary-btn[data-page="login"]');
if (goLoginBtn) {
  goLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('login', true);
  });
}

// phone / browser back
window.addEventListener('popstate', (event) => {
  const pageId = event.state && event.state.page ? event.state.page : 'home';
  showPage(pageId, false);
});

// initial load
window.addEventListener('load', () => {
  const hash = location.hash.replace('#', '');
  const startPage = hash && document.getElementById(hash) ? hash : 'home';
  showPage(startPage, false);
});

// hamburger toggle + click outside to close
if (hamburger && navMenu) {
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    const current = getComputedStyle(navMenu).display;
    navMenu.style.display = current === 'flex' ? 'none' : 'flex';
  });

  document.addEventListener('click', (e) => {
    // Only auto-close the dropdown on small screens (mobile)
    if (window.innerWidth > 768) return;

    const target = e.target;
    const clickedInsideMenu = navMenu.contains(target);
    const clickedHamburger = hamburger.contains(target);
    if (!clickedInsideMenu && !clickedHamburger) {
      navMenu.style.display = 'none';
    }
  });
}

// ===== PRODUCT DATA (now loaded from Firestore) =====
let products = [];

// ===== SMALL HELPERS =====

// create a card element (with ❤️ Save button)
function createProductCard(p) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-category', p.category);

  const price = Number(p.price || 0);
  const mrp = Number(p.mrp || 0);
  const hasMrp = mrp > price && mrp > 0;
  const discount = hasMrp ? Math.round((mrp - price) / mrp * 100) : null;

  card.innerHTML = `
    <div class="product-image big-card">
      <i class="fas fa-cogs"></i>
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
          Buy on ${p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}
          <i class="fab fa-${p.platform}"></i>
        </a>
        <button class="fav-btn">❤️ Save</button>
      </div>
    </div>
  `;

  const favBtn = card.querySelector('.fav-btn');
  favBtn.addEventListener('click', () => handleFavouriteClick(p, favBtn));

  return card;
}

// save favourite to Firestore (array field)
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

// render favourites list in Account page
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
          <span class="fav-item-meta">${f.category} • ${f.price}</span>
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

// ===== HOME: render + category filter =====
const catButtons = document.querySelectorAll('.cat-btn');
const homeProductsContainer = document.getElementById('homeProducts');

function renderHomeProducts(category = 'all') {
  if (!homeProductsContainer) return;
  homeProductsContainer.innerHTML = '';

  const filtered =
    category === 'all'
      ? products
      : products.filter(p => p.category === category);

  filtered.forEach(p => {
    const card = createProductCard(p);
    homeProductsContainer.appendChild(card);
  });
}

// set up category buttons
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

// ===== SEARCH (Search page + top bar use same data) =====
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const topSearchInput = document.getElementById('topSearchInput');

function renderSearchResults(query) {
  if (!searchResults) return;
  searchResults.innerHTML = '';

  const q = query.trim().toLowerCase();
  if (!q) return;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(q)
  );

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

// search input on Search page
if (searchInput && searchResults) {
  searchInput.addEventListener('input', (e) => {
    renderSearchResults(e.target.value);
  });
}

// top search under banner
if (topSearchInput) {
  topSearchInput.addEventListener('input', (e) => {
    showPage('search', true);
    renderSearchResults(e.target.value);
  });
}

// ===== LOAD PRODUCTS FROM FIRESTORE ON STARTUP =====
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
  } catch (err) {
    console.error('Error loading products from Firestore:', err);
  }
}

// call once after script loads
loadProductsFromFirestore();

// ===== AUTH: SIGNUP & LOGIN WITH FIREBASE (namespaced v8 style) =====
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');

function showMessage(msg) {
  alert(msg);
}

// SIGN UP
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

// LOGIN
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

// UPDATE ACCOUNT PAGE WHEN LOGIN STATE CHANGES
const accountPage = document.getElementById('account');

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

    await renderFavourites(user.uid);
  } else {
    if (infoCard) {
      infoCard.innerHTML = `
        <p>Sign in to manage your profile and saved builds.</p>
      `;
    }
  }
});

// LOG OUT helper (called from Account page button)
window.droneLogout = async function () {
  try {
    await auth.signOut();
    showMessage('Logged out');
    showPage('home', true);
  } catch (e) {
    console.error(e);
  }
};

// ===== SIMPLE ADMIN: ADD PRODUCT TO FIRESTORE =====
window.addEventListener('load', () => {
  const adminProductForm = document.getElementById('adminProductForm');
  const adminStatus = document.getElementById('adminStatus');

  console.log('adminProductForm is', adminProductForm);

  if (!adminProductForm) return;

  adminProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('adminProdName').value.trim();
    const price = Number(document.getElementById('adminProdPrice').value.trim());
    const mrp = Number(document.getElementById('adminProdMrp').value.trim() || 0);
    const category = document.getElementById('adminProdCategory').value.trim().toLowerCase();
    const platform = document.getElementById('adminProdPlatform').value.trim().toLowerCase();
    const url = document.getElementById('adminProdUrl').value.trim();

    if (!name || !price || !category || !platform || !url) {
      alert('Please fill all fields.');
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
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('Saved product with id:', docRef.id);
      adminProductForm.reset();
      if (adminStatus) {
        adminStatus.innerHTML = '<p>Saved to Firestore collection <strong>products</strong>.</p>';
      }
    } catch (err) {
      console.error('Error saving product:', err);
      if (adminStatus) {
        adminStatus.innerHTML = '<p>Could not save product. Check console.</p>';
      }
      alert('Could not save product: ' + err.message);
    }
  });
});
