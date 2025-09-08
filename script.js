// Variables DOM principales
const pokemonGrid = document.getElementById('pokemonGrid');
const searchInput = document.getElementById('searchInput');
const pokemonModal = document.getElementById('pokemonModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const loader = document.getElementById('loader');

const typeFilter = document.getElementById("typeFilter");
const generationFilter = document.getElementById("generationFilter");

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

const POKEMON_PER_PAGE = 20; // Pokémon por página
let allPokemon = [];
let filteredPokemon = [];
let currentPage = 1;
let totalPages = 1;

// Colores por tipo
const typeColors = {
  normal: 'var(--color-normal)',
  fire: 'var(--color-fire)',
  water: 'var(--color-water)',
  electric: 'var(--color-electric)',
  grass: 'var(--color-grass)',
  ice: 'var(--color-ice)',
  fighting: 'var(--color-fighting)',
  poison: 'var(--color-poison)',
  ground: 'var(--color-ground)',
  flying: 'var(--color-flying)',
  psychic: 'var(--color-psychic)',
  bug: 'var(--color-bug)',
  rock: 'var(--color-rock)',
  ghost: 'var(--color-ghost)',
  dragon: 'var(--color-dragon)',
  dark: 'var(--color-dark)',
  steel: 'var(--color-steel)',
  fairy: 'var(--color-fairy)',
};

// Función para determinar generación según ID
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

// Fetch datos detallados de un Pokémon
async function fetchPokemonData(url) {
  const res = await fetch(url);
  return await res.json();
}

// Cargar todos los Pokémon al inicio
async function fetchAllPokemon() {
  loader.style.display = 'block';
  const url = `https://pokeapi.co/api/v2/pokemon?offset=0&limit=1025`;
  const res = await fetch(url);
  const data = await res.json();
  const detailedPromises = data.results.map(p => fetchPokemonData(p.url));
  allPokemon = await Promise.all(detailedPromises);
  filteredPokemon = allPokemon;
  totalPages = Math.ceil(filteredPokemon.length / POKEMON_PER_PAGE);
  loader.style.display = 'none';
  populateCompareSelects();
  renderCurrentPage();
  updatePaginationControls();
}

// Crear tarjeta de Pokémon
function createPokemonCard(pokemon) {
  const card = document.createElement('div');
  card.classList.add('pokemon-card');
  const mainType = pokemon.types[0].type.name;
  card.style.backgroundColor = typeColors[mainType] || '#777';
  card.innerHTML = `
    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" />
    <div class="pokemon-info">
      <div class="pokemon-number">#${pokemon.id.toString().padStart(3, '0')}</div>
      <div class="pokemon-name">${pokemon.name}</div>
    </div>
  `;
  card.addEventListener('click', () => showPokemonDetail(pokemon));
  return card;
}

// Renderizar grid
function renderPokemonGrid(pokemonList) {
  pokemonGrid.innerHTML = '';
  pokemonList.forEach(pokemon => {
    const card = createPokemonCard(pokemon);
    pokemonGrid.appendChild(card);
  });
}

// Mostrar detalle Pokémon en modal
function showPokemonDetail(pokemon) {
  modalBody.innerHTML = `
    <div class="modal-body">
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" />
      <h2>${pokemon.name} (#${pokemon.id.toString().padStart(3, '0')})</h2>
      <div class="types">
        ${pokemon.types.map(t => `<span class="type" style="background-color: ${typeColors[t.type.name]}">${t.type.name}</span>`).join('')}
      </div>
      <div class="stats">
        ${pokemon.stats.map(stat => `
          <div class="stat">
            <div class="stat-name">${stat.stat.name}: ${stat.base_stat}</div>
            <div class="stat-bar">
              <div class="stat-bar-fill" style="width: ${stat.base_stat > 100 ? 100 : stat.base_stat}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="abilities"><strong>Habilidades:</strong> ${pokemon.abilities.map(a => a.ability.name).join(', ')}</div>
    </div>
  `;
  pokemonModal.classList.remove('hidden');
}

// Cerrar modales
closeModal.addEventListener('click', () => {
  pokemonModal.classList.add('hidden');
});
window.addEventListener('click', (e) => {
  if (e.target === pokemonModal) {
    pokemonModal.classList.add('hidden');
  }
});

// Aplicar filtros y búsqueda
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

  totalPages = Math.ceil(filteredPokemon.length / POKEMON_PER_PAGE);
  currentPage = 1;
  renderCurrentPage();
  updatePaginationControls();
}

// Eventos filtros y búsqueda
typeFilter.addEventListener("change", applyFilters);
generationFilter.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);

// Renderizar página actual
function renderCurrentPage() {
  const startIndex = (currentPage - 1) * POKEMON_PER_PAGE;
  const endIndex = startIndex + POKEMON_PER_PAGE;
  const pagePokemon = filteredPokemon.slice(startIndex, endIndex);
  renderPokemonGrid(pagePokemon);
  currentPageDisplay.textContent = `Página ${currentPage} de ${totalPages || 1}`;
}

// Actualizar botones paginación
function updatePaginationControls() {
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

// Eventos paginación
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

// Control del menú
function showSection(section) {
  if (section === 'pokedex') {
    pokedexSection.classList.add('active');
    compararSection.classList.remove('active');
    menuPokedex.classList.add('active');
    menuComparar.classList.remove('active');
  } else if (section === 'comparar') {
    pokedexSection.classList.remove('active');
    compararSection.classList.add('active');
    menuPokedex.classList.remove('active');
    menuComparar.classList.add('active');
  }
}

menuPokedex.addEventListener('click', () => showSection('pokedex'));
menuComparar.addEventListener('click', () => showSection('comparar'));

// Funciones comparación
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
    compareModalBody.innerHTML = '<p>Por favor, selecciona dos Pokémon para comparar.</p>';
    return;
  }

  const getPokemonDetailHtml = (pokemon) => `
    <div style="flex:1; margin: 0 1rem;">
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" style="width:100px; display:block; margin:0 auto 1rem;" />
      <h3>${pokemon.name} (#${pokemon.id.toString().padStart(3, '0')})</h3>
      <div class="types" style="justify-content:center; margin-bottom: 1rem;">
        ${pokemon.types.map(t => `<span class="type" style="background-color: ${typeColors[t.type.name]}">${t.type.name}</span>`).join('')}
      </div>
      <div class="stats">
        ${pokemon.stats.map(stat => `
          <div class="stat" style="margin-bottom: 0.5rem;">
            <div class="stat-name">${stat.stat.name}: ${stat.base_stat}</div>
            <div class="stat-bar" style="background-color: #ddd; border-radius: 10px; overflow: hidden; height: 12px;">
              <div class="stat-bar-fill" style="width: ${stat.base_stat > 100 ? 100 : stat.base_stat}%; background-color: #ef5350; height: 100%;"></div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="abilities" style="margin-top: 1rem;"><strong>Habilidades:</strong> ${pokemon.abilities.map(a => a.ability.name).join(', ')}</div>
    </div>
  `;

  compareModalBody.innerHTML = getPokemonDetailHtml(pokemon1) + getPokemonDetailHtml(pokemon2);
  comparisonResult.classList.remove('hidden');
}

compareBtn.addEventListener('click', () => {
  const id1 = pokemonCompare1.value;
  const id2 = pokemonCompare2.value;

  if (!id1 || !id2) {
    alert('Por favor, selecciona dos Pokémon para comparar.');
    return;
  }
  if (id1 === id2) {
    alert('Por favor, selecciona dos Pokémon diferentes.');
    return;
  }

  const poke1 = allPokemon.find(p => p.id.toString() === id1);
  const poke2 = allPokemon.find(p => p.id.toString() === id2);

  if (!poke1 || !poke2) {
    alert('No se encontraron los Pokémon seleccionados.');
    return;
  }

  renderPokemonComparison(poke1, poke2);
});

closeCompareModal.addEventListener('click', () => {
  comparisonResult.classList.add('hidden');
});
comparisonResult.addEventListener('click', (e) => {
  if (e.target === comparisonResult) {
    comparisonResult.classList.add('hidden');
  }
});

// Carga inicial
fetchAllPokemon();
