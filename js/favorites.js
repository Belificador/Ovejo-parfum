// ============================================================
// FAVORITES (compartido por index.html y producto.html)
// ============================================================
const FAV_KEY = 'ovejo_favorites';

let favorites = [];
try {
  favorites = JSON.parse(localStorage.getItem(FAV_KEY)) || [];
} catch (e) {
  favorites = [];
}

function saveFavorites() {
  localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
}

function isFavorite(id) {
  return favorites.includes(id);
}

function heartButtonHTML(p) {
  const active = isFavorite(p.id);
  return `
    <button
      id="favBtn-${p.id}"
      onclick="toggleFavorite(${p.id}, this)"
      class="fav-btn ${active ? 'active' : ''}"
      aria-label="${active ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
      title="${active ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
    >
      <i class="${active ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
    </button>
  `;
}

function updateFavBadge() {
  const badge = document.getElementById('favBadge');
  if (!badge) return;
  badge.textContent = favorites.length;
  badge.style.display = favorites.length > 0 ? 'flex' : 'none';
}

function toggleFavorite(id, btn) {
  const index = favorites.indexOf(id);
  if (index !== -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(id);
  }
  saveFavorites();

  syncHeartButtons(id);
  updateFavBadge();
  if (document.getElementById('favoritesModal') &&
      !document.getElementById('favoritesModal').classList.contains('hidden')) {
    renderFavoritesGrid();
  }

  if (btn) pulseHeart(btn);
}

function syncHeartButtons(id) {
  const active = isFavorite(id);
  const btn = document.getElementById(`favBtn-${id}`);
  if (btn) {
    btn.classList.toggle('active', active);
    const icon = btn.querySelector('i');
    if (icon) icon.className = active ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    btn.setAttribute('aria-label', active ? 'Quitar de favoritos' : 'Agregar a favoritos');
    btn.setAttribute('title', active ? 'Quitar de favoritos' : 'Agregar a favoritos');
  }
}

function pulseHeart(btn) {
  if (!btn) return;
  btn.classList.remove('animate-fav');
  void btn.offsetWidth;
  btn.classList.add('animate-fav');
}

// ============================================================
// FAVORITES MODAL
// ============================================================
const favModal = document.getElementById('favoritesModal');
const favBtn = document.getElementById('favBtn');
const favClose = document.getElementById('favClose');
const favGrid = document.getElementById('favGrid');
const favEmpty = document.getElementById('favEmpty');

function openFavoritesModal() {
  if (!favModal) return;
  const content = favModal.querySelector('.modal-content');
  favModal.classList.remove('hidden');
  favModal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  renderFavoritesGrid();
  requestAnimationFrame(() => {
    favModal.classList.remove('opacity-0');
    if (content) content.classList.remove('opacity-0', 'scale-95');
  });
}

function closeFavoritesModal() {
  if (!favModal) return;
  const content = favModal.querySelector('.modal-content');
  favModal.classList.add('opacity-0');
  if (content) content.classList.add('opacity-0', 'scale-95');
  document.body.style.overflow = '';
  setTimeout(() => {
    favModal.classList.add('hidden');
    favModal.classList.remove('flex');
  }, 300);
}

function renderFavoritesGrid() {
  if (!favGrid || !favEmpty) return;
  const favProducts = (window.products || []).filter(p => favorites.includes(p.id));

  favEmpty.classList.toggle('hidden', favProducts.length > 0);

  if (favProducts.length === 0) {
    favGrid.innerHTML = '';
    return;
  }

  favGrid.innerHTML = favProducts.map(p => `
    <div class="bg-white rounded-xl overflow-hidden border border-ivory transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div class="relative">
        <a href="producto.html?id=${p.id}" class="aspect-[3/4] relative block ${p.catClass} no-underline">
          <img src="Imagenes/${p.image}" alt="${p.brand} - ${p.name}" loading="lazy" width="400" height="400" class="absolute inset-0 w-full h-full object-contain p-3">
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </a>
        <button onclick="toggleFavorite(${p.id}, this)" class="fav-btn fav-btn-absolute ${isFavorite(p.id) ? 'active' : ''}" aria-label="Quitar de favoritos" title="Quitar de favoritos">
          <i class="fa-solid fa-heart"></i>
        </button>
      </div>
      <div class="p-3 sm:p-4">
        <p class="text-xs uppercase tracking-wider text-olive/50">${p.brand}</p>
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

if (favBtn) favBtn.addEventListener('click', openFavoritesModal);
if (favClose) favClose.addEventListener('click', closeFavoritesModal);

if (favModal) {
  favModal.addEventListener('click', (e) => {
    if (e.target === favModal) closeFavoritesModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && favModal && !favModal.classList.contains('hidden')) {
    closeFavoritesModal();
  }
});

// ============================================================
// INIT
// ============================================================
updateFavBadge();