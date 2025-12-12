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
    name: '30A BLHeli-S ESC (Set of 4)',
    price: '₹920',
    category: 'esc',
    platform: 'amazon'
  },
  {
    name: '5" Carbon Fiber Frame',
    price: '₹650',
    category: 'frames',
    platform: 'flipkart'
  },
  {
    name: '4S 1500mAh LiPo Battery',
    price: '₹1,200',
    category: 'batteries',
    platform: 'amazon'
  }
];

// small helper to create a card element
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
      </div>
    </div>
  `;
  return card;
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
