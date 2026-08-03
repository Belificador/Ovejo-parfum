// ============================================================
// DATA (definida en js/products.js)
// ============================================================
const products = window.products || [];

// ============================================================
// STATE
// ============================================================
const cart = [];
let carouselIndex = 0;
let discountApplied = localStorage.getItem('ovejo_discount') === 'true';

// ============================================================
// SAFE DOM REFS
// ============================================================
function $(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`Element #${id} not found`);
  return el;
}

const track = $('carouselTrack');
const prevBtns = [$('carouselPrev'), $('carouselPrevMobile')].filter(Boolean);
const nextBtns = [$('carouselNext'), $('carouselNextMobile')].filter(Boolean);

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
const checkoutSummary = $('checkoutSummary');

const thankYouModal = $('thankYouModal');
const thankYouClose = $('thankYouClose');
const thankYouOrder = $('thankYouOrder');

const categoryModal = $('categoryModal');
const categoryModalTitle = $('categoryModalTitle');
const categoryModalClose = $('categoryModalClose');
const categoryGrid = $('categoryGrid');
const categoryEmpty = $('categoryEmpty');
const menuClose = $('menuClose');
const menuToggle = $('menuToggle');
const mobileMenu = $('mobileMenu');

const searchBtn = $('searchBtn');
const searchModal = $('searchModal');
const searchClose = $('searchClose');
const searchInput = $('searchInput');
const searchGrid = $('searchGrid');
const searchCount = $('searchCount');
const searchEmpty = $('searchEmpty');

// ============================================================
// RENDER PRODUCTS
// ============================================================
function renderProducts() {
  if (!track) return;
  track.innerHTML = products.map(p => `
    <div class="product-card">
      <a href="producto.html?id=${p.id}" class="product-img ${p.catClass} no-underline">
        <img src="Imagenes/${p.image}" alt="${p.brand} - ${p.name}" loading="lazy" width="400" height="400" class="absolute inset-0 w-full h-full object-contain">
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <span class="overlay-badge z-10" style="background:rgba(0,0,0,0.5);">${p.category}</span>
        <div class="relative text-white text-center px-4 z-10 mt-auto mb-4">
          <p class="text-xs uppercase tracking-widest opacity-80 drop-shadow-md">${p.brand}</p>
          <p class="text-lg font-serif font-bold mt-0.5 drop-shadow-lg">${p.name}</p>
        </div>
      </a>
      <div class="p-5">
        <div class="flex items-start justify-between gap-2 mb-0.5">
          <p class="text-xs uppercase tracking-wider text-olive/50">${p.brand}</p>
          ${heartButtonHTML(p)}
        </div>
        <a href="producto.html?id=${p.id}" class="font-serif font-bold text-base no-underline hover:text-gold transition-colors">${p.name}</a>
        <div class="flex items-center justify-between mt-3">
          <span class="text-lg font-bold">$${p.price.toFixed(2)}</span>
          <button onclick="addToCart(${p.id}, this)" class="bg-olive hover:bg-gold text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-1.5">
            <i class="fa-solid fa-plus"></i> Añadir
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// CAROUSEL
// ============================================================
function getVisibleCards() {
  if (window.innerWidth < 640) return 1;
  if (window.innerWidth < 1024) return 2;
  return 4;
}

function getComputedGap() {
  if (!track) return 24;
  const style = window.getComputedStyle(track);
  const gap = style.gap || style.columnGap || '24px';
  return parseInt(gap, 10) || 24;
}

function maxIndex() {
  return Math.max(0, products.length - getVisibleCards());
}

function updateCarousel() {
  if (!track || !track.children.length) return;
  const gap = getComputedGap();
  const cardWidth = track.children[0].getBoundingClientRect().width;
  const offset = carouselIndex * (cardWidth + gap);
  track.style.transform = `translateX(-${offset}px)`;
}

function carouselNext() {
  if (carouselIndex < maxIndex()) {
    carouselIndex++;
  } else {
    carouselIndex = 0;
  }
  updateCarousel();
}

function carouselPrev() {
  if (carouselIndex > 0) {
    carouselIndex--;
  } else {
    carouselIndex = maxIndex();
  }
  updateCarousel();
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (carouselIndex > maxIndex()) carouselIndex = maxIndex();
    updateCarousel();
  }, 150);
});

// ============================================================
// CART
// ============================================================
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

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
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
          <p class="text-[11px] text-olive/50 mt-1">Bienvenido a la familia Parfum 🐑</p>
        </div>
      `;
    }

    cartItems.innerHTML = itemsHtml;
    cartTotal.textContent = `$${getCartTotal().toFixed(2)}`;
    cartFooter.classList.remove('hidden');
  }
}

// ============================================================
// CART SIDEBAR
// ============================================================
function openCart() {
  if (!cartSidebar || !cartOverlay) return;
  cartSidebar.classList.remove('translate-x-full');
  cartOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    cartOverlay.classList.remove('opacity-0');
  });
}

function closeCart() {
  if (!cartSidebar || !cartOverlay) return;
  cartSidebar.classList.add('translate-x-full');
  cartOverlay.classList.add('opacity-0');
  document.body.style.overflow = '';
  setTimeout(() => cartOverlay.classList.add('hidden'), 300);
}

if (cartBtn) cartBtn.addEventListener('click', openCart);
if (cartClose) cartClose.addEventListener('click', closeCart);
if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

// ============================================================
// MODAL HELPERS
// ============================================================
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

function getModalChildren(overlay) {
  if (!overlay) return [null, null];
  const content = overlay.querySelector('.modal-content');
  return [overlay, content];
}

// ============================================================
// CATEGORY MODAL
// ============================================================
function openCategoryModal(category) {
  const filtered = products.filter(p => p.category === category);
  const [ov, ct] = getModalChildren(categoryModal);
  if (!ov || !ct) return;

  if (categoryModalTitle) categoryModalTitle.textContent = `Perfumes ${category}`;

  if (categoryEmpty) categoryEmpty.classList.toggle('hidden', filtered.length > 0);

  if (categoryGrid) {
    if (filtered.length === 0) {
      categoryGrid.innerHTML = '';
    } else {
      categoryGrid.innerHTML = filtered.map(p => `
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
  }

  openModal(ov, ct);
}

function closeCategoryModal() {
  const [ov, ct] = getModalChildren(categoryModal);
  closeModal(ov, ct);
}

if (categoryModalClose) categoryModalClose.addEventListener('click', closeCategoryModal);

if (categoryModal) {
  categoryModal.addEventListener('click', (e) => {
    if (e.target === categoryModal) closeCategoryModal();
  });
}

// ============================================================
// SEARCH MODAL
// ============================================================
function normalizeText(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function openSearchModal() {
  const [ov, ct] = getModalChildren(searchModal);
  if (!ov || !ct) return;

  if (searchInput) {
    searchInput.value = '';
    renderSearchResults('');
  }
  openModal(ov, ct);
  setTimeout(() => searchInput && searchInput.focus(), 50);
}

function closeSearchModal() {
  const [ov, ct] = getModalChildren(searchModal);
  closeModal(ov, ct);
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

// Nav link listeners
function setupNavLinks() {
  const linkConfig = [
    { selector: '.nav-link', text: 'Árabes', category: 'Árabe' },
    { selector: '.nav-link', text: 'Nicho', category: 'Nicho' },
    { selector: '.nav-link', text: 'Diseñador', category: 'Diseñador' },
    { selector: '.nav-link', text: 'Decants', category: 'Decants' },
    { selector: '.mobile-link', text: 'Perfumes Árabes', category: 'Árabe' },
    { selector: '.mobile-link', text: 'Perfumes Nicho', category: 'Nicho' },
    { selector: '.mobile-link', text: 'Perfumes Diseñador', category: 'Diseñador' },
    { selector: '.mobile-link', text: 'Decants / Muestras', category: 'Decants' },
  ];

  linkConfig.forEach(({ selector, text, category }) => {
    document.querySelectorAll(selector).forEach(link => {
      if (link.textContent.trim() === text) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          // Close mobile menu if open
          if (mobileMenu && !mobileMenu.classList.contains('translate-x-full')) {
            mobileMenu.classList.add('translate-x-full');
            document.body.style.overflow = '';
          }
          openCategoryModal(category);
        });
      }
    });
  });
}
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return;
    closeCart();

    setTimeout(() => {
      if (checkoutSummary) {
        let summaryHtml = cart.map(item => `
          <div class="flex justify-between text-sm">
            <span>${item.brand} - ${item.name} <span class="text-olive/50">x${item.qty}</span></span>
            <span>$${(item.price * item.qty).toFixed(2)}</span>
          </div>
        `).join('');

        if (discountApplied) {
          const discount = getDiscountAmount();
          summaryHtml += `
            <div class="flex justify-between text-sm text-gold border-t border-olive/10 pt-2">
              <span><i class="fa-solid fa-tag mr-1"></i> Descuento 5% OFF</span>
              <span>- $${discount.toFixed(2)}</span>
            </div>
          `;
        }

        summaryHtml += `
          <div class="border-t border-olive/10 pt-2 flex justify-between font-bold text-base">
            <span>Total</span>
            <span>$${getCartTotal().toFixed(2)}</span>
          </div>
        `;

        checkoutSummary.innerHTML = summaryHtml;
      }

      const [ov, ct] = getModalChildren(checkoutModal);
      openModal(ov, ct);
    }, 350);
  });
}

if (checkoutClose) {
  checkoutClose.addEventListener('click', () => {
    const [ov, ct] = getModalChildren(checkoutModal);
    closeModal(ov, ct);
  });
}

if (checkoutModal) {
  checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) {
      const [ov, ct] = getModalChildren(checkoutModal);
      closeModal(ov, ct);
    }
  });
}

if (checkoutForm) {
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = $('checkoutName')?.value || '';
    const email = $('checkoutEmail')?.value || '';
    const phone = $('checkoutPhone')?.value || '';
    const address = $('checkoutAddress')?.value || '';
    const total = getCartTotal();

    const [co, cc] = getModalChildren(checkoutModal);
    closeModal(co, cc);

    setTimeout(() => {
      const orderItems = cart.map(item =>
        `${item.brand} - ${item.name} x${item.qty}: $${(item.price * item.qty).toFixed(2)}`
      ).join('<br>');

      if (thankYouOrder) {
        const discountLine = discountApplied
          ? `<p class="text-gold text-xs mt-1"><i class="fa-solid fa-tag mr-1"></i>Descuento 5% OFF aplicado (-$${getDiscountAmount().toFixed(2)})</p>`
          : '';
        thankYouOrder.innerHTML = `
          <p><strong>Cliente:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Pedido:</strong><br>${orderItems}</p>
          ${discountLine}
          <p><strong>Total pagado:</strong> $${total.toFixed(2)}</p>
        `;
      }

      const [to, tc] = getModalChildren(thankYouModal);
      openModal(to, tc);

      cart.length = 0;
      updateCartUI();
      checkoutForm.reset();
    }, 350);
  });
}

if (thankYouClose) {
  thankYouClose.addEventListener('click', () => {
    const [ov, ct] = getModalChildren(thankYouModal);
    closeModal(ov, ct);
  });
}

if (thankYouModal) {
  thankYouModal.addEventListener('click', (e) => {
    if (e.target === thankYouModal) {
      const [ov, ct] = getModalChildren(thankYouModal);
      closeModal(ov, ct);
    }
  });
}

// ============================================================
// MOBILE MENU
// ============================================================
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
  });
}

if (menuClose) {
  menuClose.addEventListener('click', () => {
    if (!mobileMenu) return;
    mobileMenu.classList.add('translate-x-full');
    document.body.style.overflow = '';
  });
}

if (mobileMenu) {
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) {
      mobileMenu.classList.add('translate-x-full');
      document.body.style.overflow = '';
    }
  });
}

// ============================================================
// NAV FILTER LISTENERS
// ============================================================
document.querySelectorAll('.nav-link, .mobile-link').forEach(link => {
  const category = link.getAttribute('data-category');
  if (!category) return;
  link.addEventListener('click', () => {
    // Close mobile menu if open
    if (mobileMenu && !mobileMenu.classList.contains('translate-x-full')) {
      mobileMenu.classList.add('translate-x-full');
      document.body.style.overflow = '';
    }
    filterProducts(category);
  });
});

// ============================================================
// NEWSLETTER
// ============================================================
const newsletterForm = $('newsletterForm');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    if (input) input.value = '';
    activateDiscount();
    setTimeout(() => {
      alert('🐑 ¡Bienvenido a la familia Parfum! Tu 5% OFF ya está activo en tu carrito.');
    }, 300);
  });
}

// ============================================================
// CAROUSEL EVENT BINDING
// ============================================================
prevBtns.forEach(btn => { if (btn) btn.addEventListener('click', carouselPrev); });
nextBtns.forEach(btn => { if (btn) btn.addEventListener('click', carouselNext); });

// Handle touch swipe for mobile carousel
let touchStartX = 0;
let touchEndX = 0;
if (track) {
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) carouselNext();
      else carouselPrev();
    }
  }, { passive: true });
}

// ============================================================
// WELCOME POPUP
// ============================================================
const welcomePopup = $('welcomePopup');
const popupClose = $('popupClose');
const popupSkip = $('popupSkip');
const popupForm = $('popupForm');

function showWelcomePopup() {
  if (!welcomePopup) return;
  const hasSeen = localStorage.getItem('ovejo_popup_seen');
  if (hasSeen) return;

  const [ov, ct] = getModalChildren(welcomePopup);
  openModal(ov, ct);
  localStorage.setItem('ovejo_popup_seen', 'true');
}

function closeWelcomePopup() {
  const [ov, ct] = getModalChildren(welcomePopup);
  closeModal(ov, ct);
}

if (popupClose) popupClose.addEventListener('click', closeWelcomePopup);
if (popupSkip) popupSkip.addEventListener('click', closeWelcomePopup);

if (welcomePopup) {
  welcomePopup.addEventListener('click', (e) => {
    if (e.target === welcomePopup) closeWelcomePopup();
  });
}

function activateDiscount() {
  discountApplied = true;
  localStorage.setItem('ovejo_discount', 'true');
  updateCartUI();
}

if (popupForm) {
  popupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('popupEmail')?.value || '';
    activateDiscount();
    closeWelcomePopup();
    setTimeout(() => {
      alert('🐑 ¡Bienvenido a la familia Parfum! Tu 5% OFF ya está activo en tu carrito.');
    }, 350);
  });
}

// ============================================================
// KEYBOARD SUPPORT
// ============================================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const [to, tc] = getModalChildren(thankYouModal);
    const [co, cc] = getModalChildren(checkoutModal);

    if (thankYouModal && !thankYouModal.classList.contains('hidden')) {
      closeModal(to, tc);
    } else if (checkoutModal && !checkoutModal.classList.contains('hidden')) {
      closeModal(co, cc);
    } else if (categoryModal && !categoryModal.classList.contains('hidden')) {
      closeCategoryModal();
    } else if (searchModal && !searchModal.classList.contains('hidden')) {
      closeSearchModal();
    } else if (welcomePopup && !welcomePopup.classList.contains('hidden')) {
      closeWelcomePopup();
    } else if (cartSidebar && !cartSidebar.classList.contains('translate-x-full')) {
      closeCart();
    } else if (mobileMenu && !mobileMenu.classList.contains('translate-x-full')) {
      mobileMenu.classList.add('translate-x-full');
      document.body.style.overflow = '';
    }
  }
});

// ============================================================
// POLICIES (desplegable en el footer)
// ============================================================
const policies = {
  privacidad: {
    title: 'Privacidad',
    sections: [
      {
        heading: 'Datos que recopilamos',
        body: 'En Ovejo Parfum únicamente recopilamos la información necesaria para procesar tu pedido y ofrecerte un mejor servicio: nombre, correo electrónico, teléfono y dirección de envío. Al registrarte o suscribirte, también guardamos tu preferencia de contacto.'
      },
      {
        heading: 'Uso de la información',
        body: 'Tus datos se utilizan exclusivamente para gestionar compras, enviar notificaciones de tus pedidos, y si lo autorizaste, enviarte promociones y novedades. Nunca vendemos ni compartimos tu información con terceros con fines comerciales.'
      },
      {
        heading: 'Cookies',
        body: 'Utilizamos cookies para recordar tu carrito y preferencias, así como para medir el rendimiento del sitio. Puedes desactivarlas desde tu navegador en cualquier momento; el sitio seguirá funcionando.'
      },
      {
        heading: 'Protección de datos',
        body: 'Tus datos se almacenan de forma segura y se protegen con medidas técnicas adecuadas. Solo los utiliza el personal autorizado para procesar tu pedido.'
      },
      {
        heading: 'Tus derechos',
        body: 'Puedes solicitar en cualquier momento el acceso, corrección o eliminación de tus datos personales escribiéndonos a hola@ovejoparfum.com. Responderemos a la brevedad.'
      }
    ]
  },
  terminos: {
    title: 'Términos y Condiciones',
    sections: [
      {
        heading: 'Uso del sitio',
        body: 'Al navegar y comprar en Ovejo Parfum aceptas los presentes términos. El contenido, imágenes y marcas son propiedad de Ovejo Parfum y no pueden reproducirse sin autorización.'
      },
      {
        heading: 'Precios y pagos',
        body: 'Los precios están expresados en dólares (USD) y pueden cambiar sin previo aviso. El precio aplicable es el publicado al momento de confirmar tu pedido. Aceptamos los métodos de pago disponibles en la tienda.'
      },
      {
        heading: 'Autenticidad 100%',
        body: 'Todos nuestros productos son 100% originales y adquiridos directamente de distribuidor autorizado. Cada perfume incluye su empaque y código de verificación cuando aplica.'
      },
      {
        heading: 'Devoluciones y cambios',
        body: 'Aceptamos cambios y devoluciones dentro de los 14 días posteriores a la entrega, siempre que el producto no haya sido abierto ni usado y conserve su empaque original. Para iniciar el proceso escríbenos a hola@ovejoparfum.com.'
      },
      {
        heading: 'Limitación de responsabilidad',
        body: 'Ovejo Parfum no se hace responsable por el uso indebido de los productos ni por reacciones alérgicas que puedan presentarse al no ser testeados previamente sobre la piel.'
      }
    ]
  },
  envios: {
    title: 'Guía de Envíos',
    sections: [
      {
        heading: 'Tiempos de entrega',
        body: 'Procesamos tu pedido en un máximo de 24 horas hábiles. Los envíos nacionales llegan en un promedio de 3 a 7 días hábiles, dependiendo de tu ubicación.'
      },
      {
        heading: 'Costo de envío',
        body: 'Ofrecemos envío gratis en compras seleccionadas y promociones vigentes. Para el resto de los pedidos, el costo se calcula al finalizar la compra según tu código postal.'
      },
      {
        heading: 'Empaque seguro',
        body: 'Cada perfume se envía en empaque hermético y protector para garantizar que llegue en perfectas condiciones. Incluimos muestras gratis en cada pedido.'
      },
      {
        heading: 'Rastreo',
        body: 'Una vez enviado tu pedido, recibirás un número de guía por correo para dar seguimiento a tu paquete en tiempo real.'
      },
      {
        heading: 'Cobertura',
        body: 'Realizamos envíos a todo el país. Para envíos internacionales o dudas sobre tu zona, contáctanos por WhatsApp al +52 55 1234 5678.'
      }
    ]
  },
  faq: {
    title: 'Preguntas Frecuentes',
    sections: [
      {
        heading: '¿Cómo sé que los productos son originales?',
        body: 'Trabajamos directamente con distribuidores autorizados y garantizamos la autenticidad del 100% de nuestros productos. En caso de dudas, podemos mostrarte el código de verificación del perfume.'
      },
      {
        heading: '¿Cuáles son los métodos de pago?',
        body: 'Aceptamos las tarjetas de crédito y débito disponibles al finalizar la compra. Para pagos por transferencia o métodos especiales, escríbenos por WhatsApp.'
      },
      {
        heading: '¿Cuánto tarda mi pedido en llegar?',
        body: 'Los envíos nacionales tardan en promedio de 3 a 7 días hábiles después de procesado tu pedido. Recibirás tu número de guía para rastrearlo.'
      },
      {
        heading: '¿Vienen muestras gratis?',
        body: 'Sí, incluimos muestras gratis en cada pedido para que descubras nuevos aromas sin costo adicional.'
      },
      {
        heading: '¿Cómo hago una devolución?',
        body: 'Tienes 14 días desde la entrega para solicitar un cambio o devolución, siempre que el producto esté sin abrir y en su empaque original. Escríbenos a hola@ovejoparfum.com para iniciar el proceso.'
      }
    ]
  }
};

let activePolicyKey = null;

function openPolicy(key) {
  const container = document.getElementById('policyContent');
  if (!container || !policies[key]) return;

  if (activePolicyKey === key) {
    container.innerHTML = '';
    activePolicyKey = null;
    document.querySelectorAll('[data-policy]').forEach(l => l.classList.remove('policy-active'));
    return;
  }

  const data = policies[key];
  activePolicyKey = key;

  container.innerHTML = `
    <div class="bg-white/5 border border-white/10 rounded-xl p-4 animate-fadeIn">
      <h6 class="font-serif font-bold text-gold mb-3">${data.title}</h6>
      ${data.sections.map(s => `
        <div class="mb-3">
          <p class="text-white/90 font-medium text-sm mb-1">${s.heading}</p>
          <p class="text-white/60 text-xs leading-relaxed">${s.body}</p>
        </div>
      `).join('')}
    </div>
  `;

  document.querySelectorAll('[data-policy]').forEach(l => l.classList.remove('policy-active'));
  const activeLink = document.querySelector(`[data-policy="${key}"]`);
  if (activeLink) activeLink.classList.add('policy-active');
}

document.querySelectorAll('[data-policy]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    openPolicy(link.dataset.policy);
  });
});

// ============================================================
// INIT
// ============================================================
renderProducts();
if (cartBadge) cartBadge.style.display = 'none';
updateCartUI();
updateCarousel();
setupNavLinks();

// Show welcome popup after a brief delay to let page render
setTimeout(showWelcomePopup, 800);
