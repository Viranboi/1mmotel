// Global variables
let allMovies = [];
let filteredMovies = [];
let currentPage = 1;
const moviesPerPage = 12;
let featuredMovies = [];
let currentFeaturedIndex = 0;

// DOM elements
const searchInput = document.getElementById('searchInput');
const genreFilter = document.getElementById('genreFilter');
const yearFilter = document.getElementById('yearFilter');
const sortFilter = document.getElementById('sortFilter');
const moviesGrid = document.getElementById('moviesGrid');
const featuredMoviesContainer = document.getElementById('featuredMovies');
const genresGrid = document.getElementById('genresGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loading = document.getElementById('loading');
const modal = document.getElementById('movieModal');
const modalBody = document.getElementById('modalBody');

// Initialize the website
document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
    setupEventListeners();
    setupNavigation();
});

// Initialize website data
async function initializeWebsite() {
    showLoading();
    try {
        await Promise.all([
            loadMovies(),
            loadFeaturedMovies(),
            loadGenres()
        ]);
        updateStats();
    } catch (error) {
        console.error('Error initializing website:', error);
        showError('Failed to load website data. Please refresh the page.');
    }
    hideLoading();
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Filter functionality
    genreFilter.addEventListener('change', applyFilters);
    yearFilter.addEventListener('change', applyFilters);
    sortFilter.addEventListener('change', applyFilters);
    
    // Modal functionality
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
    
    // Auto-slide featured movies
    setInterval(autoSlideFeatured, 8000);
}

// Setup navigation
function setupNavigation() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // Update active navigation on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', function() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// API functions
async function fetchAPI(endpoint) {
    const response = await fetch(`/api${endpoint}`);
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }
    return response.json();
}

// Load all movies
async function loadMovies() {
    try {
        allMovies = await fetchAPI('/movies');
        filteredMovies = [...allMovies];
        populateFilters();
        displayMovies();
    } catch (error) {
        console.error('Error loading movies:', error);
        showError('Failed to load movies');
    }
}

// Load featured movies
async function loadFeaturedMovies() {
    try {
        featuredMovies = await fetchAPI('/movies?featured=true');
        displayFeaturedMovies();
    } catch (error) {
        console.error('Error loading featured movies:', error);
    }
}

// Load genres
async function loadGenres() {
    try {
        const genres = [...new Set(allMovies.map(movie => movie.genre))];
        displayGenres(genres);
    } catch (error) {
        console.error('Error loading genres:', error);
    }
}

// Display functions
function displayMovies() {
    if (!moviesGrid) return;
    
    const startIndex = (currentPage - 1) * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    const moviesToShow = filteredMovies.slice(0, endIndex);
    
    if (currentPage === 1) {
        moviesGrid.innerHTML = '';
    }
    
    moviesToShow.slice(startIndex).forEach(movie => {
        const movieCard = createMovieCard(movie);
        moviesGrid.appendChild(movieCard);
    });
    
    // Update load more button
    if (loadMoreBtn) {
        if (endIndex >= filteredMovies.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.onclick = () => openMovieModal(movie);
    
    card.innerHTML = `
        <div class="movie-poster" style="background-image: url('${movie.poster || '/images/placeholder.jpg'}')"></div>
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-details">
                <span>${movie.year}</span>
                <span class="rating">
                    <i class="fas fa-star"></i>
                    ${movie.rating}
                </span>
            </div>
            <div class="movie-genre">${movie.genre}</div>
            <p class="movie-description">${movie.description}</p>
        </div>
    `;
    
    return card;
}

function displayFeaturedMovies() {
    if (!featuredMoviesContainer || featuredMovies.length === 0) return;
    
    featuredMoviesContainer.innerHTML = '';
    
    featuredMovies.forEach((movie, index) => {
        const featuredMovie = document.createElement('div');
        featuredMovie.className = 'featured-movie';
        featuredMovie.onclick = () => openMovieModal(movie);
        
        featuredMovie.innerHTML = `
            <div class="featured-movie-bg" style="background-image: url('${movie.poster || '/images/placeholder.jpg'}')"></div>
            <div class="featured-movie-overlay"></div>
            <div class="featured-movie-content">
                <h3>${movie.title}</h3>
                <div class="featured-movie-info">
                    <span>${movie.year}</span>
                    <span>${movie.duration}</span>
                    <span class="rating">
                        <i class="fas fa-star"></i>
                        ${movie.rating}
                    </span>
                </div>
                <p>${movie.description}</p>
                <div class="featured-movie-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); openMovieModal(${JSON.stringify(movie).replace(/"/g, '&quot;')})">
                        <i class="fas fa-play"></i>
                        Watch Trailer
                    </button>
                </div>
            </div>
        `;
        
        featuredMoviesContainer.appendChild(featuredMovie);
    });
    
    // Set initial position
    updateFeaturedSlider();
}

function displayGenres(genres) {
    if (!genresGrid) return;
    
    const genreIcons = {
        'Action': 'fas fa-fist-raised',
        'Drama': 'fas fa-theater-masks',
        'Comedy': 'fas fa-laugh',
        'Horror': 'fas fa-ghost',
        'Sci-Fi': 'fas fa-rocket',
        'Romance': 'fas fa-heart',
        'Thriller': 'fas fa-eye',
        'Crime': 'fas fa-user-secret',
        'Adventure': 'fas fa-mountain',
        'Animation': 'fas fa-palette'
    };
    
    genresGrid.innerHTML = '';
    
    genres.forEach(genre => {
        const count = allMovies.filter(movie => movie.genre === genre).length;
        const genreCard = document.createElement('div');
        genreCard.className = 'genre-card';
        genreCard.onclick = () => filterByGenre(genre);
        
        genreCard.innerHTML = `
            <div class="genre-icon">
                <i class="${genreIcons[genre] || 'fas fa-film'}"></i>
            </div>
            <div class="genre-name">${genre}</div>
            <div class="genre-count">${count} movies</div>
        `;
        
        genresGrid.appendChild(genreCard);
    });
}

// Featured movies slider
function slideFeatured(direction) {
    if (featuredMovies.length === 0) return;
    
    currentFeaturedIndex += direction;
    
    if (currentFeaturedIndex >= featuredMovies.length) {
        currentFeaturedIndex = 0;
    } else if (currentFeaturedIndex < 0) {
        currentFeaturedIndex = featuredMovies.length - 1;
    }
    
    updateFeaturedSlider();
}

function autoSlideFeatured() {
    slideFeatured(1);
}

function updateFeaturedSlider() {
    if (!featuredMoviesContainer) return;
    
    const translateX = -currentFeaturedIndex * 100;
    featuredMoviesContainer.style.transform = `translateX(${translateX}%)`;
}

// Filter and search functions
function populateFilters() {
    // Populate genre filter
    if (genreFilter) {
        const genres = [...new Set(allMovies.map(movie => movie.genre))];
        genreFilter.innerHTML = '<option value="">All Genres</option>';
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreFilter.appendChild(option);
        });
    }
    
    // Populate year filter
    if (yearFilter) {
        const years = [...new Set(allMovies.map(movie => movie.year))].sort((a, b) => b - a);
        yearFilter.innerHTML = '<option value="">All Years</option>';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });
    }
}

function handleSearch() {
    applyFilters();
}

function applyFilters() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedGenre = genreFilter ? genreFilter.value : '';
    const selectedYear = yearFilter ? yearFilter.value : '';
    const sortBy = sortFilter ? sortFilter.value : 'rating';
    
    // Filter movies
    filteredMovies = allMovies.filter(movie => {
        const matchesSearch = !searchTerm || 
            movie.title.toLowerCase().includes(searchTerm) ||
            movie.director.toLowerCase().includes(searchTerm) ||
            movie.cast.some(actor => actor.toLowerCase().includes(searchTerm));
        
        const matchesGenre = !selectedGenre || movie.genre === selectedGenre;
        const matchesYear = !selectedYear || movie.year.toString() === selectedYear;
        
        return matchesSearch && matchesGenre && matchesYear;
    });
    
    // Sort movies
    filteredMovies.sort((a, b) => {
        switch (sortBy) {
            case 'year':
                return b.year - a.year;
            case 'title':
                return a.title.localeCompare(b.title);
            case 'rating':
            default:
                return b.rating - a.rating;
        }
    });
    
    // Reset pagination and display
    currentPage = 1;
    displayMovies();
}

function filterByGenre(genre) {
    if (genreFilter) {
        genreFilter.value = genre;
        applyFilters();
        scrollToSection('movies');
    }
}

// Modal functions
function openMovieModal(movie) {
    if (!modal || !modalBody) return;
    
    modalBody.innerHTML = `
        <div class="modal-header">
            <div>
                <h2 class="modal-title">${movie.title}</h2>
                <div class="modal-info">
                    <span>${movie.year}</span>
                    <span>${movie.duration}</span>
                    <span>${movie.genre}</span>
                    <span>
                        <i class="fas fa-star"></i>
                        ${movie.rating}
                    </span>
                </div>
            </div>
        </div>
        <p class="modal-description">${movie.description}</p>
        <div class="modal-cast">
            <h4>Cast</h4>
            <p class="cast-list">${movie.cast.join(', ')}</p>
        </div>
        <div class="modal-cast">
            <h4>Director</h4>
            <p class="cast-list">${movie.director}</p>
        </div>
        ${movie.trailer ? `
            <div class="trailer-container">
                <iframe src="${movie.trailer}" allowfullscreen></iframe>
            </div>
        ` : ''}
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Utility functions
function loadMoreMovies() {
    currentPage++;
    displayMovies();
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function showLoading() {
    if (loading) {
        loading.style.display = 'flex';
    }
}

function hideLoading() {
    if (loading) {
        loading.style.display = 'none';
    }
}

function showError(message) {
    // Create a simple error notification
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e50914;
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        z-index: 10000;
        font-weight: 500;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        document.body.removeChild(errorDiv);
    }, 5000);
}

function updateStats() {
    const totalMoviesEl = document.getElementById('totalMovies');
    const totalGenresEl = document.getElementById('totalGenres');
    
    if (totalMoviesEl) {
        totalMoviesEl.textContent = allMovies.length;
    }
    
    if (totalGenresEl) {
        const genres = [...new Set(allMovies.map(movie => movie.genre))];
        totalGenresEl.textContent = genres.length;
    }
}

// Debounce function for search
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

// Smooth scrolling for buttons
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Animation on scroll
function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    // Observe elements that should animate
    document.querySelectorAll('.movie-card, .genre-card, .feature').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// Initialize animations after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(animateOnScroll, 1000);
});