// ============================================================
// PRODUCT DETAIL PAGE
// ============================================================
const products = window.products || [];

// ============================================================
// HELPERS
// ============================================================
function $(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`Element #${id} not found`);
  return el;
}

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'), 10);
  return Number.isFinite(id) ? id : null;
}

// ============================================================
// CART (compartido en esta página)
// ============================================================
const cart = [];
let discountApplied = localStorage.getItem('ovejo_discount') === 'true';

const cartBtn = $('cartBtn');
const cartSidebar = $('cartSidebar');
const cartOverlay = $('cartOverlay');
const cartClose = $('cartClose');
const cartItems = $('cartItems');
const cartFooter = $('cartFooter');
const cartTotal = $('cartTotal');
const cartBadge = $('cartBadge');

const checkoutBtn = $('checkoutBtn');
const checkoutModal = $('checkoutModal');
const checkoutClose = $('checkoutClose');
const checkoutForm = $('checkoutForm');

const searchBtn = $('searchBtn');
const searchModal = $('searchModal');
const searchClose = $('searchClose');
const searchInput = $('searchInput');
const searchGrid = $('searchGrid');
const searchCount = $('searchCount');
const searchEmpty = $('searchEmpty');

let currentGallery = [];
let currentImageIndex = 0;

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function getCartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartTotal() {
  const sub = getCartSubtotal();
  return discountApplied ? sub * 0.95 : sub;
}

function getDiscountAmount() {
  const sub = getCartSubtotal();
  return discountApplied ? sub * 0.05 : 0;
}

function updateCartUI() {
  if (!cartBadge) return;
  const count = getCartCount();
  cartBadge.textContent = count;
  cartBadge.style.display = count > 0 ? 'flex' : 'none';

  if (!cartItems || !cartFooter || !cartTotal) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="text-center text-olive/40 py-16">
        <i class="fa-solid fa-bag-shopping text-5xl mb-4"></i>
        <p class="text-lg font-light">Tu carrito está vacío</p>
        <p class="text-sm mt-1">Agrega productos para comenzar</p>
      </div>
    `;
    cartFooter.classList.add('hidden');
  } else {
    let itemsHtml = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img ${item.catClass}">
          <span class="text-[10px] uppercase tracking-wider text-white/80">${item.category}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs text-olive/50">${item.brand}</p>
          <p class="font-serif font-bold text-sm truncate">${item.name}</p>
          <div class="flex items-center justify-between mt-1.5">
            <span class="text-sm font-bold">$${(item.price * item.qty).toFixed(2)}</span>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-olive/40">Qty: ${item.qty}</span>
              <button onclick="removeFromCart(${item.id})" class="cart-item-remove text-sm ml-2">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    if (discountApplied) {
      const discount = getDiscountAmount();
      itemsHtml += `
        <div class="bg-gold/10 border border-gold/20 rounded-xl p-3 text-sm">
          <div class="flex justify-between items-center">
            <span class="flex items-center gap-1.5 text-olive">
              <i class="fa-solid fa-tag text-gold"></i> Descuento 5% OFF
            </span>
            <span class="font-semibold text-gold">- $${discount.toFixed(2)}</span>
          </div>
        </div>
      `;
    }

    cartItems.innerHTML = itemsHtml;
    cartTotal.textContent = `$${getCartTotal().toFixed(2)}`;
    cartFooter.classList.remove('hidden');
  }
}

function addToCart(productId, btn) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartUI();
  openCart();

  if (btn) {
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Añadido';
    btn.style.background = '#4A5338';
    setTimeout(() => {
      btn.innerHTML = original;
      btn.style.background = '';
    }, 1200);
  }
}

function removeFromCart(productId) {
  const index = cart.findIndex(item => item.id === productId);
  if (index !== -1) {
    if (cart[index].qty > 1) {
      cart[index].qty--;
    } else {
      cart.splice(index, 1);
    }
  }
  updateCartUI();
}

function openCart() {
  if (!cartSidebar || !cartOverlay) return;
  cartSidebar.classList.remove('translate-x-full');
  cartOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => cartOverlay.classList.remove('opacity-0'));
}

function closeCart() {
  if (!cartSidebar || !cartOverlay) return;
  cartSidebar.classList.add('translate-x-full');
  cartOverlay.classList.add('opacity-0');
  document.body.style.overflow = '';
  setTimeout(() => cartOverlay.classList.add('hidden'), 300);
}

function openModal(overlay, content) {
  if (!overlay || !content) return;
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    overlay.classList.remove('opacity-0');
    content.classList.remove('opacity-0', 'scale-95');
  });
}

function closeModal(overlay, content) {
  if (!overlay || !content) return;
  overlay.classList.add('opacity-0');
  content.classList.add('opacity-0', 'scale-95');
  document.body.style.overflow = '';
  setTimeout(() => {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
  }, 300);
}

if (cartBtn) cartBtn.addEventListener('click', openCart);
if (cartClose) cartClose.addEventListener('click', closeCart);
if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return;
    closeCart();
    setTimeout(() => {
      const [ov, ct] = [checkoutModal, checkoutModal ? checkoutModal.querySelector('.modal-content') : null];
      openModal(ov, ct);
    }, 350);
  });
}

if (checkoutClose) {
  checkoutClose.addEventListener('click', () => {
    const [ov, ct] = [checkoutModal, checkoutModal ? checkoutModal.querySelector('.modal-content') : null];
    closeModal(ov, ct);
  });
}

if (checkoutModal) {
  checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) {
      const ct = checkoutModal.querySelector('.modal-content');
      closeModal(checkoutModal, ct);
    }
  });
}

if (checkoutForm) {
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const [ov, ct] = [checkoutModal, checkoutModal.querySelector('.modal-content')];
    closeModal(ov, ct);
    cart.length = 0;
    updateCartUI();
    checkoutForm.reset();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (searchModal && !searchModal.classList.contains('hidden')) {
    closeSearchModal();
  } else if (checkoutModal && !checkoutModal.classList.contains('hidden')) {
    const ct = checkoutModal.querySelector('.modal-content');
    closeModal(checkoutModal, ct);
  } else if (cartSidebar && !cartSidebar.classList.contains('translate-x-full')) {
    closeCart();
  }
});

// ============================================================
// SEARCH MODAL
// ============================================================
function normalizeText(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function openSearchModal() {
  if (!searchModal) return;

  if (searchInput) {
    searchInput.value = '';
    renderSearchResults('');
  }
  openModal(searchModal, searchModal.querySelector('.modal-content'));
  setTimeout(() => searchInput && searchInput.focus(), 50);
}

function closeSearchModal() {
  if (!searchModal) return;
  closeModal(searchModal, searchModal.querySelector('.modal-content'));
}

function renderSearchResults(query) {
  if (!searchGrid || !searchCount) return;
  const q = normalizeText(query);

  let filtered = products;
  if (q) {
    filtered = products.filter(p =>
      normalizeText(p.name).includes(q) ||
      normalizeText(p.brand).includes(q) ||
      normalizeText(p.category).includes(q)
    );
  }

  searchCount.textContent = q
    ? `${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'} para "${query}"`
    : '';

  if (searchEmpty) searchEmpty.classList.toggle('hidden', filtered.length > 0);

  if (filtered.length === 0) {
    searchGrid.innerHTML = '';
    return;
  }

  searchGrid.innerHTML = filtered.map(p => `
    <div class="bg-white rounded-xl overflow-hidden border border-ivory transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <a href="producto.html?id=${p.id}" class="aspect-[3/4] relative block ${p.catClass} no-underline">
        <img src="Imagenes/${p.image}" alt="${p.brand} - ${p.name}" loading="lazy" width="400" height="400" class="absolute inset-0 w-full h-full object-contain p-3">
        <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </a>
      <div class="p-3 sm:p-4">
        <div class="flex items-start justify-between gap-2">
          <p class="text-xs uppercase tracking-wider text-olive/50">${p.brand}</p>
          ${heartButtonHTML(p)}
        </div>
        <a href="producto.html?id=${p.id}" class="font-serif font-bold text-sm sm:text-base truncate block no-underline hover:text-gold transition-colors">${p.name}</a>
        <div class="flex items-center justify-between mt-2">
          <span class="text-base sm:text-lg font-bold">$${p.price.toFixed(2)}</span>
          <button onclick="addToCart(${p.id}, this)" class="bg-olive hover:bg-gold text-white text-xs font-medium px-3 py-2 rounded-xl transition-all duration-300">
            <i class="fa-solid fa-plus"></i> Añadir
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

if (searchBtn) searchBtn.addEventListener('click', openSearchModal);
if (searchClose) searchClose.addEventListener('click', closeSearchModal);

if (searchModal) {
  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) closeSearchModal();
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    renderSearchResults(e.target.value);
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault();
  });
}

// ============================================================
// RENDER DETAIL
// ============================================================
function renderDetail() {
  const productId = getProductId();
  const loading = $('loadingState');
  const notFound = $('notFound');
  const detail = $('productDetail');

  if (loading) loading.classList.add('hidden');
  if (!detail) return;

  const product = products.find(p => p.id === productId);

  if (!product) {
    if (notFound) notFound.classList.remove('hidden');
    document.title = 'OVEJO PARFUM — Perfume no encontrado';
    return;
  }

  document.title = `${product.brand} ${product.name} — OVEJO PARFUM`;

  const notes = (list) => list.map(n => `
    <span class="note-pill">${n}</span>
  `).join('');

  const galleryImages = Array.isArray(product.gallery) && product.gallery.length > 0
    ? product.gallery
    : [product.image];
  currentGallery = galleryImages;
  currentImageIndex = 0;

  const galleryArrows = galleryImages.length > 1
    ? `
      <button onclick="prevImage()" class="gallery-arrow left-3" aria-label="Imagen anterior">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
      <button onclick="nextImage()" class="gallery-arrow right-3" aria-label="Imagen siguiente">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    `
    : '';

  const galleryDots = galleryImages.length > 1
    ? `
      <div class="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
        ${galleryImages.map((_, i) => `
          <span class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
        `).join('')}
      </div>
    `
    : '';

  detail.innerHTML = `
    <div class="lg:sticky lg:top-20">
      <div class="relative overflow-hidden rounded-2xl ${product.catClass} aspect-[3/4] shadow-xl">
        <img id="galleryImg" src="Imagenes/${galleryImages[0]}" alt="${product.brand} - ${product.name}" class="absolute inset-0 w-full h-full object-contain p-8 sm:p-12">
        <span class="overlay-badge z-30" style="background:rgba(0,0,0,0.5);">${product.category}</span>
        ${galleryArrows}
        ${galleryDots}
        <span id="galleryCounter" class="gallery-counter ${galleryImages.length > 1 ? '' : 'hidden'}">${galleryImages.length > 1 ? `1 / ${galleryImages.length}` : ''}</span>
      </div>
    </div>

    <div>
      <p class="text-gold text-sm uppercase tracking-[0.25em] font-medium">${product.brand}</p>
      <h1 class="text-3xl sm:text-5xl font-serif font-bold mt-2 leading-tight">${product.name}</h1>

      <div class="flex flex-wrap items-center justify-between gap-4 mt-6 pb-6 border-b border-ivory">
        <span class="text-2xl sm:text-3xl font-bold">$${product.price.toFixed(2)}</span>
        <div class="flex items-center gap-3">
          ${heartButtonHTML(product)}
          <button onclick="addToCart(${product.id}, this)" class="bg-olive hover:bg-gold text-white font-medium px-6 sm:px-8 py-3.5 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl">
            <i class="fa-solid fa-plus"></i> Añadir al carrito
          </button>
        </div>
      </div>

      <p class="text-olive/75 leading-relaxed mt-6 font-light">${product.description}</p>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
        <div class="detail-stat">
          <i class="fa-solid fa-wine-bottle text-gold text-lg"></i>
          <span class="detail-stat-label">Tamaño</span>
          <span class="detail-stat-value">${product.size}</span>
        </div>
        <div class="detail-stat">
          <i class="fa-solid fa-snowflake text-gold text-lg"></i>
          <span class="detail-stat-label">Familia</span>
          <span class="detail-stat-value">${product.family}</span>
        </div>
        <div class="detail-stat">
          <i class="fa-solid fa-fire-flame-curved text-gold text-lg"></i>
          <span class="detail-stat-label">Intensidad</span>
          <span class="detail-stat-value">${product.intensity}</span>
        </div>
        <div class="detail-stat">
          <i class="fa-regular fa-clock text-gold text-lg"></i>
          <span class="detail-stat-label">Duración</span>
          <span class="detail-stat-value">${product.duration}</span>
        </div>
      </div>

      <div class="mt-10 space-y-6">
        <div>
          <h3 class="font-serif font-bold text-lg mb-3">Notas de Salida</h3>
          <div class="flex flex-wrap gap-2">${notes(product.top)}</div>
        </div>
        <div>
          <h3 class="font-serif font-bold text-lg mb-3">Notas de Corazón</h3>
          <div class="flex flex-wrap gap-2">${notes(product.heart)}</div>
        </div>
        <div>
          <h3 class="font-serif font-bold text-lg mb-3">Notas de Fondo</h3>
          <div class="flex flex-wrap gap-2">${notes(product.base)}</div>
        </div>
      </div>
    </div>
  `;

  detail.classList.remove('hidden');
  detail.classList.add('grid');
}

// ============================================================
// GALLERY
// ============================================================
function updateGalleryImage() {
  const img = document.getElementById('galleryImg');
  const counter = document.getElementById('galleryCounter');
  const dots = document.querySelectorAll('.gallery-dot');

  if (img) img.src = `Imagenes/${currentGallery[currentImageIndex]}`;
  if (counter && currentGallery.length > 1) {
    counter.textContent = `${currentImageIndex + 1} / ${currentGallery.length}`;
  }
  dots.forEach((dot, i) => dot.classList.toggle('active', i === currentImageIndex));
}

function nextImage() {
  if (currentGallery.length <= 1) return;
  currentImageIndex = (currentImageIndex + 1) % currentGallery.length;
  updateGalleryImage();
}

function prevImage() {
  if (currentGallery.length <= 1) return;
  currentImageIndex = (currentImageIndex - 1 + currentGallery.length) % currentGallery.length;
  updateGalleryImage();
}

// ============================================================
// INIT
// ============================================================
renderDetail();
if (cartBadge) cartBadge.style.display = 'none';
updateCartUI();