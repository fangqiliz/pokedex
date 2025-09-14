// Variables DOM principales
const pokemonGrid = document.getElementById('pokemonGrid');
const searchInput = document.getElementById('searchInput');
const pokemonModal = document.getElementById('pokemonModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const loader = document.getElementById('loader');
const typeFilter = document.getElementById("typeFilter");
const generationFilter = document.getElementById("generationFilter");

// Variables para favoritos
const menuFavoritos = document.getElementById('menuFavoritos');
const favoritosSection = document.getElementById('favoritosSection');
const favoritesGrid = document.getElementById('favoritesGrid');
const emptyFavorites = document.getElementById('emptyFavorites');
const favoritesCounter = document.getElementById('favoritesCounter');
const clearFavoritesBtn = document.getElementById('clearFavoritesBtn');

// Variables para historial
const searchHistoryContainer = document.getElementById('searchHistoryContainer');
const historyItems = document.getElementById('historyItems');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Variables para comparación
const pokemonCompare1 = document.getElementById('pokemonCompare1');
const pokemonCompare2 = document.getElementById('pokemonCompare2');
const compareBtn = document.getElementById('compareBtn');
const comparisonResult = document.getElementById('comparisonResult');
const compareModalBody = document.getElementById('compareModalBody');
const closeCompareModal = document.getElementById('closeCompareModal');

// Variables para menú y secciones
const menuPokedex = document.getElementById('menuPokedex');
const menuComparar = document.getElementById('menuComparar');
const pokedexSection = document.getElementById('pokedexSection');
const compararSection = document.getElementById('compararSection');

// Variables para paginación
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const currentPageDisplay = document.getElementById('currentPageDisplay');

// Configuración
const POKEMON_PER_PAGE = 50;
const MAX_SEARCH_HISTORY = 10; // Aunque el backend lo maneja, mantenemos la constante

let allPokemon = [];
let filteredPokemon = [];

// Estas variables ahora son globales a través de `window` para que AuthSystem pueda interceptarlas
window.favorites = new Set();
window.searchHistory = [];
let currentPage = 1;
let totalPages = 1;

// Variables para batch loading
let offset = 0;
const limit = 1025; // Cargar todos los Pokémon hasta la generación 9
const maxInitial = 1025;

// Usuario actual (será establecido por el sistema de autenticación)
let currentUser = null; // Se inicializará con los datos del backend

// URL base del backend
const BACKEND_URL = 'http://localhost:5000/api';

// Colores por tipo
const typeColors = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
  grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
  ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
  steel: '#B7B7CE', fairy: '#D685AD'
};

// ========== UTILIDADES ==========
function getGeneration(id) {
  if (id >= 1 && id <= 151) return 1;
  if (id >= 152 && id <= 251) return 2;
  if (id >= 252 && id <= 386) return 3;
  if (id >= 387 && id <= 494) return 4;
  if (id >= 495 && id <= 649) return 5;
  if (id >= 650 && id <= 721) return 6;
  if (id >= 722 && id <= 809) return 7;
  if (id >= 810 && id <= 905) return 8;
  if (id >= 906 && id <= 1025) return 9;
  return 0;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ========== SISTEMA DE USUARIOS (Adaptado para usar sessionStorage y backend) ==========
function getCurrentUser() {
  const userData = sessionStorage.getItem('currentUser');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error al parsear usuario actual desde sessionStorage:', error);
      return null;
    }
  }
  return null;
}

// No necesitamos updateCurrentUser aquí directamente, ya que AuthSystem lo maneja
// y las funciones de favoritos/historial llamarán a la API para actualizar el backend.

// ========== FETCH CON AUTENTICACIÓN ==========
async function authenticatedFetch(url, options = {}) {
  const authToken = sessionStorage.getItem('authToken');
  if (!authToken) {
    // Si no hay token, redirigir al login
    alert('Sesión expirada o no iniciada. Por favor, inicia sesión.');
    window.location.href = 'login.html';
    throw new Error('No authentication token found.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token inválido o expirado, forzar logout
    alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
    throw new Error('Authentication failed: Token invalid or expired.');
  }

  return response;
}

// ========== FAVORITOS (Modificado para usar la API) ==========
window.loadFavorites = async function() {
  currentUser = getCurrentUser(); // Asegurarse de tener el usuario más reciente
  if (!currentUser) {
    window.favorites = new Set();
    window.updateFavoritesCounter();
    return;
  }

  try {
    const response = await authenticatedFetch(`${BACKEND_URL}/user/favoritos`);
    const data = await response.json();

    if (response.ok) {
      window.favorites = new Set(data.favoritos);
      window.updateFavoritesCounter();
      // Actualizar currentUser en sessionStorage con los favoritos más recientes
      currentUser.favoritos = data.favoritos;
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      console.error('Error al cargar favoritos:', data.error);
      window.favorites = new Set(); // Limpiar favoritos si hay error
      window.updateFavoritesCounter();
    }
  } catch (error) {
    console.error('Error de red al cargar favoritos:', error);
    window.favorites = new Set(); // Limpiar favoritos si hay error de red
    window.updateFavoritesCounter();
  }
};

async function toggleFavorite(pokemonId) {
  currentUser = getCurrentUser();
  if (!currentUser) {
    alert('   ⚠   Debes iniciar sesión para guardar favoritos');
    return;
  }

  pokemonId = parseInt(pokemonId);
  const isFavorited = window.favorites.has(pokemonId);
  let success = false;

  try {
    let response;
    if (isFavorited) {
      response = await authenticatedFetch(`${BACKEND_URL}/user/favoritos/${pokemonId}`, {
        method: 'DELETE',
      });
    } else {
      response = await authenticatedFetch(`${BACKEND_URL}/user/favoritos`, {
        method: 'POST',
        body: JSON.stringify({ pokemonId }),
      });
    }

    const data = await response.json();

    if (response.ok) {
      if (isFavorited) {
        window.favorites.delete(pokemonId);
      } else {
        window.favorites.add(pokemonId);
      }
      success = true;
      // Actualizar currentUser en sessionStorage con los favoritos más recientes
      currentUser.favoritos = data.favoritos;
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      alert(`Error al ${isFavorited ? 'eliminar' : 'agregar'} favorito: ${data.error}`);
      console.error(`Error al ${isFavorited ? 'eliminar' : 'agregar'} favorito:`, data.error);
    }
  } catch (error) {
    console.error('Error de red al gestionar favorito:', error);
    alert('Error de conexión al gestionar favoritos. Inténtalo de nuevo.');
  }

  if (success) {
    window.updateFavoritesCounter();
    updateFavoriteButtons();
    if (favoritosSection.classList.contains('active')) {
      window.renderFavorites();
    }
    const card = document.querySelector(`[data-pokemon-id="${pokemonId}"]`);
    if (card) {
      card.classList.add('favorite-animation');
      setTimeout(() => card.classList.remove('favorite-animation'), 300);
    }
  }
}

window.updateFavoritesCounter = function() {
  const count = window.favorites.size;
  favoritesCounter.textContent = count;
  if (count > 0) {
    favoritesCounter.classList.add('show');
    clearFavoritesBtn.style.display = 'block';
  } else {
    favoritesCounter.classList.remove('show');
    clearFavoritesBtn.style.display = 'none';
  }
};

function updateFavoriteButtons() {
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    const pokemonId = parseInt(btn.dataset.pokemonId);
    if (window.favorites.has(pokemonId)) {
      btn.classList.add('favorited');
      btn.innerHTML = '   ⭐   ';
    } else {
      btn.classList.remove('favorited');
      btn.innerHTML = '   ☆   ';
    }
  });
  const modalFavoriteBtn = document.querySelector('.modal-favorite-btn');
  if (modalFavoriteBtn) {
    const pokemonId = parseInt(modalFavoriteBtn.dataset.pokemonId);
    if (window.favorites.has(pokemonId)) {
      modalFavoriteBtn.classList.add('favorited');
      modalFavoriteBtn.innerHTML = '   ⭐   ';
    } else {
      modalFavoriteBtn.classList.remove('favorited');
      modalFavoriteBtn.innerHTML = '   ☆   ';
    }
  }
}

window.renderFavorites = function() {
  currentUser = getCurrentUser();
  if (!currentUser) {
    document.getElementById('loginRequiredFavorites').style.display = 'block';
    favoritesGrid.style.display = 'none';
    emptyFavorites.style.display = 'none';
    return;
  }
  document.getElementById('loginRequiredFavorites').style.display = 'none';
  favoritesGrid.style.display = 'grid';

  if (window.favorites.size === 0) {
    favoritesGrid.innerHTML = '';
    emptyFavorites.style.display = 'block';
    return;
  }
  emptyFavorites.style.display = 'none';
  const favoritePokemon = allPokemon.filter(p => window.favorites.has(p.id));
  favoritesGrid.innerHTML = '';
  favoritePokemon.forEach(pokemon => {
    const card = createPokemonCard(pokemon, true);
    favoritesGrid.appendChild(card);
  });
};

async function clearAllFavorites() {
  currentUser = getCurrentUser();
  if (!currentUser) {
    alert('   ⚠   Debes iniciar sesión para administrar favoritos');
    return;
  }
  if (confirm('¿Estás seguro de que quieres eliminar todos los favoritos?')) {
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/user/favoritos`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (response.ok) {
        window.favorites.clear();
        // Actualizar currentUser en sessionStorage
        currentUser.favoritos = [];
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

        window.updateFavoritesCounter();
        updateFavoriteButtons();
        window.renderFavorites();
      } else {
        alert(`Error al limpiar favoritos: ${data.error}`);
        console.error('Error al limpiar favoritos:', data.error);
      }
    } catch (error) {
      console.error('Error de red al limpiar favoritos:', error);
      alert('Error de conexión al limpiar favoritos. Inténtalo de nuevo.');
    }
  }
}

// ========== HISTORIAL DE BÚSQUEDAS (Modificado para usar la API) ==========
async function addToSearchHistory(pokemon) {
  currentUser = getCurrentUser();
  if (!currentUser) {
    return; // No guardar historial si no hay usuario logueado
  }

  try {
    const response = await authenticatedFetch(`${BACKEND_URL}/user/historial`, {
      method: 'POST',
      body: JSON.stringify({
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprites.front_default,
      }),
    });
    const data = await response.json();

    if (response.ok) {
      window.searchHistory = data.historial;
      // Actualizar currentUser en sessionStorage
      currentUser.historial = data.historial;
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      window.updateSearchHistoryDisplay();
    } else {
      console.error('Error al agregar al historial:', data.error);
    }
  } catch (error) {
    console.error('Error de red al agregar al historial:', error);
  }
}

window.updateSearchHistoryDisplay = function() {
  currentUser = getCurrentUser();
  if (!currentUser || !currentUser.historial || currentUser.historial.length === 0) {
    searchHistoryContainer.style.display = 'none';
    return;
  }
  searchHistoryContainer.style.display = 'block';
  historyItems.innerHTML = '';
  currentUser.historial.forEach(item => { // Usar currentUser.historial directamente
    const historyItem = document.createElement('button');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <img src="${item.sprite}" alt="${item.name}" style="width: 20px; height: 20px; margin-right: 0.5rem;">
      ${item.name} (#${item.id.toString().padStart(3, '0')})
    `;
    historyItem.addEventListener('click', () => {
      const pokemon = allPokemon.find(p => p.id === item.id);
      if (pokemon) {
        showPokemonDetail(pokemon);
      }
    });
    historyItems.appendChild(historyItem);
  });
};

async function clearSearchHistory() {
  currentUser = getCurrentUser();
  if (!currentUser) {
    alert('   ⚠   Debes iniciar sesión para administrar el historial');
    return;
  }
  if (confirm('¿Estás seguro de que quieres limpiar el historial de búsquedas?')) {
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/user/historial`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (response.ok) {
        window.searchHistory = [];
        // Actualizar currentUser en sessionStorage
        currentUser.historial = [];
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        window.updateSearchHistoryDisplay();
      } else {
        alert(`Error al limpiar historial: ${data.error}`);
        console.error('Error al limpiar historial:', data.error);
      }
    } catch (error) {
      console.error('Error de red al limpiar historial:', error);
      alert('Error de conexión al limpiar historial. Inténtalo de nuevo.');
    }
  }
}

// ========== FETCH Y CARGA DE DATOS ==========
async function fetchPokemonList(offset, limit) {
  loader.classList.remove('hidden');
  const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;
  const res = await fetch(url);
  const data = await res.json();
  loader.classList.add('hidden');
  return data.results;
}

async function fetchPokemonData(url) {
  const res = await fetch(url);
  return await res.json();
}

async function loadPokemonBatch() {
  if (offset >= maxInitial) return;
  const list = await fetchPokemonList(offset, limit);
  const detailedPromises = list.map(p => fetchPokemonData(p.url));
  const batch = await Promise.all(detailedPromises);
  allPokemon = allPokemon.concat(batch);
  filteredPokemon = [...allPokemon];
  updatePagination();
  populateCompareSelects();
  // Asegurarse de que los favoritos se rendericen si la sección está activa
  if (favoritosSection.classList.contains('active')) {
    window.renderFavorites();
  }
  offset += limit;
}

// ========== UI Y RENDERIZADO ==========
function createPokemonCard(pokemon) {
  const card = document.createElement('div');
  card.classList.add('pokemon-card');
  card.dataset.pokemonId = pokemon.id;
  const mainType = pokemon.types[0].type.name;
  card.style.background = `linear-gradient(135deg, ${typeColors[mainType]}CC, ${typeColors[mainType]}88)`;
  card.style.color = 'white';
  card.innerHTML = `
    <button class="favorite-btn" data-pokemon-id="${pokemon.id}">
      ${window.favorites.has(pokemon.id) ? '   ⭐   ' : '   ☆   '}
    </button>
    ${window.favorites.has(pokemon.id) ? '<div class="favorite-indicator">   ⭐   </div>' : ''}
    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" />
    <div class="pokemon-info">
      <div class="pokemon-number">#${pokemon.id.toString().padStart(3, '0')}</div>
      <div class="pokemon-name">${pokemon.name}</div>
      <div class="pokemon-types">
        ${pokemon.types.map(t => `<span class="type" style="background-color: ${typeColors[t.type.name]}">${t.type.name}</span>`).join('')}
      </div>
    </div>
  `;
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.favorite-btn')) {
      showPokemonDetail(pokemon);
    }
  });
  const favoriteBtn = card.querySelector('.favorite-btn');
  favoriteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(pokemon.id);
  });
  if (window.favorites.has(pokemon.id)) {
    favoriteBtn.classList.add('favorited');
  }
  return card;
}

function renderPokemonGrid(pokemonList) {
  pokemonGrid.innerHTML = '';
  pokemonList.forEach(pokemon => {
    const card = createPokemonCard(pokemon);
    pokemonGrid.appendChild(card);
  });
}

function showPokemonDetail(pokemon) {
  currentUser = getCurrentUser(); // Obtener el usuario más reciente
  if (currentUser) {
    addToSearchHistory(pokemon);
  }
  modalBody.innerHTML = `
    <div class="modal-header">
      <h2>${pokemon.name} (#${pokemon.id.toString().padStart(3, '0')})</h2>
      <button class="modal-favorite-btn ${window.favorites.has(pokemon.id) ? 'favorited' : ''}"
        data-pokemon-id="${pokemon.id}">
        ${window.favorites.has(pokemon.id) ? '   ⭐   ' : '   ☆   '}
      </button>
    </div>
    <div class="modal-body">
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" />
      <div class="types" style="display: flex; justify-content: center; gap: 0.5rem; margin: 1rem 0;">
        ${pokemon.types.map(t => `<span class="type" style="background-color: ${typeColors[t.type.name]}">${t.type.name}</span>`).join('')}
      </div>
      <div class="stats" style="margin: 2rem 0;">
        <h3 style="margin-bottom: 1rem; text-align: center;">Estadísticas</h3>
        ${pokemon.stats.map(stat => `
          <div class="stat" style="margin-bottom: 1rem;">
            <div class="stat-name" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="text-transform: capitalize;">${stat.stat.name.replace('-', ' ')}</span>
              <span style="font-weight: bold;">${stat.base_stat}</span>
            </div>
            <div class="stat-bar" style="background-color: #ddd; border-radius: 10px; overflow: hidden; height: 12px;">
              <div class="stat-bar-fill" style="width: ${Math.min((stat.base_stat / 200) * 100, 100)}%; background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; transition: width 0.5s ease;"></div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="abilities" style="text-align: center; margin-top: 2rem;">
        <h3>Habilidades</h3>
        <p>${pokemon.abilities.map(a => a.ability.name).join(', ')}</p>
      </div>
      <div class="details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem; text-align: center;">
        <div>
          <h4>Altura</h4>
          <p>${pokemon.height / 10} m</p>
        </div>
        <div>
          <h4>Peso</h4>
          <p>${pokemon.weight / 10} kg</p>
        </div>
      </div>
    </div>
  `;
  const modalFavoriteBtn = modalBody.querySelector('.modal-favorite-btn');
  modalFavoriteBtn.addEventListener('click', () => {
    toggleFavorite(pokemon.id);
  });
  pokemonModal.classList.add('show');
}

// ========== FILTROS Y BÚSQUEDA ==========
function applyFilters() {
  const type = typeFilter.value;
  const gen = parseInt(generationFilter.value);
  const query = searchInput.value.toLowerCase().trim();
  filteredPokemon = allPokemon.filter(p => {
    const matchesType = type === "" || p.types.some(t => t.type.name === type);
    const matchesGen = isNaN(gen) || getGeneration(p.id) === gen;
    const matchesSearch = !query || p.name.toLowerCase().includes(query) || p.id.toString() === query;
    return matchesType && matchesGen && matchesSearch;
  });
  currentPage = 1;
  updatePagination();
}

const debouncedApplyFilters = debounce(applyFilters, 300);

// ========== PAGINACIÓN ==========
function updatePagination() {
  totalPages = Math.ceil(filteredPokemon.length / POKEMON_PER_PAGE);
  if (currentPage > totalPages) {
    currentPage = Math.max(1, totalPages);
  }
  renderCurrentPage();
  updatePaginationControls();
}

function renderCurrentPage() {
  if (filteredPokemon.length === 0) {
    pokemonGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #666;"><h3>No se encontraron Pokémon</h3><p>Intenta con otros filtros</p></div>';
    currentPageDisplay.textContent = 'Página 0 de 0';
    return;
  }
  const startIndex = (currentPage - 1) * POKEMON_PER_PAGE;
  const endIndex = startIndex + POKEMON_PER_PAGE;
  const pagePokemon = filteredPokemon.slice(startIndex, endIndex);
  renderPokemonGrid(pagePokemon);
  currentPageDisplay.textContent = `Página ${currentPage} de ${totalPages}`;
}

function updatePaginationControls() {
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
}

// ========== NAVEGACIÓN ==========
window.showSection = function(section) { // Hacerla global para que AuthSystem la pueda interceptar
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
  switch(section) {
    case 'pokedex':
      pokedexSection.classList.add('active');
      menuPokedex.classList.add('active');
      break;
    case 'favoritos':
      favoritosSection.classList.add('active');
      menuFavoritos.classList.add('active');
      window.renderFavorites(); // Usar la función global
      break;
    case 'comparar':
      compararSection.classList.add('active');
      menuComparar.classList.add('active');
      break;
  }
};

// ========== COMPARACIÓN ==========
function populateCompareSelects() {
  if (allPokemon.length === 0) return;
  const optionsHtml = allPokemon.map(p =>
    `<option value="${p.id}">${p.name} (#${p.id.toString().padStart(3, '0')})</option>`
  ).join('');
  pokemonCompare1.innerHTML = '<option value="">Seleccionar Pokémon 1</option>' + optionsHtml;
  pokemonCompare2.innerHTML = '<option value="">Seleccionar Pokémon 2</option>' + optionsHtml;
}

function renderPokemonComparison(pokemon1, pokemon2) {
  if (!pokemon1 || !pokemon2) {
    compareModalBody.innerHTML = '<p style="text-align: center; padding: 2rem;">Selecciona dos Pokémon para comparar.</p>';
    return;
  }
  const getPokemonDetailHtml = (pokemon) => `
    <div style="flex:1; margin: 0 1rem; text-align: center; background: white; border-radius: 15px; padding: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" style="width:120px; height:120px; margin:0 auto 1rem;" />
      <h3 style="margin-bottom: 1rem;">${pokemon.name} (#${pokemon.id.toString().padStart(3, '0')})</h3>
      <div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 2rem;">
        ${pokemon.types.map(t => `<span class="type" style="background-color: ${typeColors[t.type.name]}">${t.type.name}</span>`).join('')}
      </div>
      <div class="stats">
        ${pokemon.stats.map(stat => `
          <div style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="text-transform: capitalize; font-weight: 500;">${stat.stat.name.replace('-', ' ')}</span>
              <span style="font-weight: bold; color: #667eea;">${stat.base_stat}</span>
            </div>
            <div style="background-color: #f0f0f0; border-radius: 10px; overflow: hidden; height: 8px;">
              <div style="width: ${Math.min((stat.base_stat / 200) * 100, 100)}%; background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; transition: width 0.5s ease;"></div>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee;">
        <h4>Habilidades</h4>
        <p style="font-size: 0.9rem;">${pokemon.abilities.map(a => a.ability.name).join(', ')}</p>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; font-size: 0.9rem;">
        <div><strong>Altura:</strong><br>${pokemon.height / 10} m</div>
        <div><strong>Peso:</strong><br>${pokemon.weight / 10} kg</div>
      </div>
    </div>
  `;
  compareModalBody.innerHTML = `
    <h2 style="text-align: center; margin-bottom: 2rem; color: #333;">Comparación de Pokémon</h2>
    <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
      ${getPokemonDetailHtml(pokemon1)}
      ${getPokemonDetailHtml(pokemon2)}
    </div>
  `;
  comparisonResult.classList.add('show');
}

// ========== EVENT LISTENERS ==========
// Menú de navegación
menuPokedex.addEventListener('click', () => window.showSection('pokedex'));
menuFavoritos.addEventListener('click', () => window.showSection('favoritos'));
menuComparar.addEventListener('click', () => window.showSection('comparar'));

// Filtros y búsqueda
typeFilter.addEventListener("change", applyFilters);
generationFilter.addEventListener("change", applyFilters);
searchInput.addEventListener("input", debouncedApplyFilters);

// Paginación
prevPageBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderCurrentPage();
    updatePaginationControls();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});
nextPageBtn.addEventListener('click', () => {
  if (currentPage < totalPages) {
    currentPage++;
    renderCurrentPage();
    updatePaginationControls();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// Modales
closeModal.addEventListener('click', () => {
  pokemonModal.classList.remove('show');
});
closeCompareModal.addEventListener('click', () => {
  comparisonResult.classList.remove('show');
});
[pokemonModal, comparisonResult].forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
});

// Favoritos
clearFavoritesBtn.addEventListener('click', clearAllFavorites);

// Historial
clearHistoryBtn.addEventListener('click', clearSearchHistory);

// Comparación
compareBtn.addEventListener('click', () => {
  const id1 = pokemonCompare1.value;
  const id2 = pokemonCompare2.value;
  if (!id1 || !id2 || id1 === id2) {
    alert('Selecciona dos Pokémon distintos.');
    return;
  }
  const poke1 = allPokemon.find(p => p.id.toString() === id1);
  const poke2 = allPokemon.find(p => p.id.toString() === id2);
  renderPokemonComparison(poke1, poke2);
});

// ========== INICIALIZACIÓN ==========
function init() {
  currentUser = getCurrentUser(); // Cargar usuario actual desde sessionStorage
  // Las funciones loadFavorites y loadSearchHistory ahora se llaman desde AuthSystem.init()
  // después de que el usuario es autenticado y sus datos son cargados.
  loadPokemonBatch(); // Cargar Pokémon (independiente de la autenticación)
  favoritesGrid.style.display = 'grid'; // Asegurar que el grid de favoritos tenga el estilo correcto
  favoritesGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
  favoritesGrid.style.gap = '1.5rem';
}

// Iniciar la aplicación
init();