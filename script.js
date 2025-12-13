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

// ===== PRODUCT DATA (shared by Home + Search + Deals) =====
const products = [
  {
    name: '2207 2400KV Brushless Motor (Set of 4)',
    price: '₹780',
    category: 'motors',
    platform: 'amazon'
  },
  {
    name: '2306 2500KV FPV Motor (Set of 4)',
    price: '₹1,150',
    category: 'motors',
    platform: 'flipkart'
  },
  {
    name: '30A BLHeli-S ESC (Set of 4)',
    price: '₹920',
    category: 'esc',
    platform: 'amazon'
  },
  {
    name: '40A BLHeli-32 ESC (Set of 4)',
    price: '₹1,450',
    category: 'esc',
    platform: 'flipkart'
  },
  {
    name: '5" Carbon Fiber Frame',
    price: '₹650',
    category: 'frames',
    platform: 'flipkart'
  },
  {
    name: '7" Long Range Frame',
    price: '₹1,250',
    category: 'frames',
    platform: 'amazon'
  },
  {
    name: '4S 1500mAh LiPo Battery',
    price: '₹1,200',
    category: 'batteries',
    platform: 'amazon'
  },
  {
    name: '6S 1300mAh LiPo Battery',
    price: '₹1,650',
    category: 'batteries',
    platform: 'flipkart'
  },
  {
    name: 'DIY 5" FPV Drone Kit (No Radio)',
    price: '₹5,800',
    category: 'drones',
    platform: 'amazon'
  },
  {
    name: 'Tiny Whoop Indoor Drone',
    price: '₹3,200',
    category: 'drones',
    platform: 'flipkart'
  }
];

// ===== SMALL HELPERS =====

// create a card element (with ❤️ Save button)
function createProductCard(p) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-category', p.category);
  card.innerHTML = `
    <div class="product-image big-card">
      <i class="fas fa-cogs"></i>
    </div>
    <div class="product-info">
      <h3>${p.name}</h3>
      <div class="price">${p.price}</div>
      <div class="buy-buttons">
        <a href="#" class="buy-btn ${p.platform}">
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
        platform: product.platform
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
        <span class="fav-item-platform ${f.platform}">
          ${f.platform}
        </span>
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

function renderHome(category = 'all') {
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
      renderHome(cat);
    });
  });
}

// initial home render
renderHome('all');

// ===== SEARCH (Search page + top bar use same data) =====
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const topSearchInput = document.getElementById('topSearchInput');

function renderSearch(query) {
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
    renderSearch(e.target.value);
  });
}

// top search under banner
if (topSearchInput) {
  topSearchInput.addEventListener('input', (e) => {
    showPage('search', true);
    renderSearch(e.target.value);
  });
}

// ===== VOICE SEARCH (Web Speech API, Chrome) =====
const voiceBtn = document.getElementById('topSearchVoice');

if (voiceBtn && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  voiceBtn.addEventListener('click', () => {
    try {
      recognition.start();
    } catch (e) {}
  });

  recognition.addEventListener('result', (event) => {
    const transcript = event.results[0][0].transcript;
    if (topSearchInput) {
      topSearchInput.value = transcript;
      showPage('search', true);
      renderSearch(transcript);
    }
  });

  recognition.addEventListener('error', (event) => {
    console.log('Speech recognition error:', event.error);
  });
}

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
        favourites: [], // important for favourites feature
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
//