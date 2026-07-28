// ============================================================
// DATA
// ============================================================
const products = [
  { id: 1, brand: 'Lattafa', name: 'Oud for Glory', category: 'Árabe', catClass: 'bg-arabe', price: 49.99, image: 'Oud for Glory.avif' },
  { id: 2, brand: 'Amouage', name: 'Interlude Black Iris', category: 'Nicho', catClass: 'bg-nicho', price: 195.00, image: 'Interlude Black Iris.avif' },
  { id: 3, brand: 'Tom Ford', name: 'Oud Wood', category: 'Diseñador', catClass: 'bg-disenador', price: 245.00, image: 'Oud Wood.avif' },
  { id: 4, brand: 'Maison Alhambra', name: 'Tobacco Touch', category: 'Árabe', catClass: 'bg-arabe', price: 29.99, image: 'Tobacco Touch.avif' },
  { id: 5, brand: 'Creed', name: 'Aventus', category: 'Diseñador', catClass: 'bg-disenador', price: 335.00, image: 'Creed Aventus.avif' },
  { id: 6, brand: 'Byredo', name: 'Gypsy Water', category: 'Nicho', catClass: 'bg-nicho', price: 220.00, image: 'Gypsy watter.avif' },
  { id: 7, brand: 'Rasasi', name: 'La Yuqawam', category: 'Árabe', catClass: 'bg-arabe', price: 59.99, image: 'La Yuqawam.avif' },
  { id: 8, brand: 'Kilian', name: 'Angels Share', category: 'Nicho', catClass: 'bg-nicho', price: 275.00, image: 'Angels Share.avif' },
];

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
const mobileMenu = $('mobileMenu');

// ============================================================
// RENDER PRODUCTS
// ============================================================
function renderProducts() {
  if (!track) return;
  track.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-img ${p.catClass}">
        <img src="Imagenes/${p.image}" alt="${p.brand} - ${p.name}" loading="lazy" width="400" height="400" class="absolute inset-0 w-full h-full object-contain">
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <span class="overlay-badge z-10" style="background:rgba(0,0,0,0.5);">${p.category}</span>
        <div class="relative text-white text-center px-4 z-10 mt-auto mb-4">
          <p class="text-xs uppercase tracking-widest opacity-80 drop-shadow-md">${p.brand}</p>
          <p class="text-lg font-serif font-bold mt-0.5 drop-shadow-lg">${p.name}</p>
        </div>
      </div>
      <div class="p-5">
        <p class="text-xs uppercase tracking-wider text-olive/50 mb-0.5">${p.brand}</p>
        <h4 class="font-serif font-bold text-base">${p.name}</h4>
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
          <span class="text-[8px] uppercase tracking-wider text-white/80">${item.category}</span>
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
          <div class="aspect-[3/4] relative ${p.catClass}">
            <img src="Imagenes/${p.image}" alt="${p.brand} - ${p.name}" loading="lazy" width="400" height="400" class="absolute inset-0 w-full h-full object-contain p-3">
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
          <div class="p-3 sm:p-4">
            <p class="text-[10px] uppercase tracking-wider text-olive/50">${p.brand}</p>
            <h4 class="font-serif font-bold text-sm sm:text-base truncate">${p.name}</h4>
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
// INIT
// ============================================================
renderProducts();
if (cartBadge) cartBadge.style.display = 'none';
updateCartUI();
updateCarousel();
setupNavLinks();

// Show welcome popup after a brief delay to let page render
setTimeout(showWelcomePopup, 800);
