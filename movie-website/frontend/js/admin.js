// Admin Panel JavaScript

// Global variables
let authToken = localStorage.getItem('adminToken');
let currentUser = null;
let allMovies = [];
let isEditing = false;
let editingMovieId = null;

// DOM elements
const loginContainer = document.getElementById('loginContainer');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const movieForm = document.getElementById('movieForm');
const loading = document.getElementById('loading');
const notification = document.getElementById('notification');
const confirmModal = document.getElementById('confirmModal');

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    if (authToken) {
        validateToken();
    } else {
        showLogin();
    }
    
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Movie form
    if (movieForm) {
        movieForm.addEventListener('submit', handleMovieSubmit);
        
        // Poster preview
        const posterInput = document.getElementById('moviePoster');
        if (posterInput) {
            posterInput.addEventListener('change', handlePosterPreview);
        }
    }
    
    // Search functionality
    const movieSearch = document.getElementById('movieSearch');
    if (movieSearch) {
        movieSearch.addEventListener('input', debounce(searchMovies, 300));
    }
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    showLoading();
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('adminToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showDashboard();
            showNotification('Login successful!', 'success');
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
    }
    
    hideLoading();
}

async function validateToken() {
    try {
        // Try to fetch movies to validate token
        const response = await fetchWithAuth('/api/movies');
        
        if (response.ok) {
            currentUser = JSON.parse(localStorage.getItem('currentUser'));
            showDashboard();
        } else {
            logout();
        }
    } catch (error) {
        logout();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('currentUser');
    showLogin();
    showNotification('Logged out successfully', 'info');
}

// UI functions
function showLogin() {
    if (loginContainer) loginContainer.style.display = 'flex';
    if (adminDashboard) adminDashboard.style.display = 'none';
}

function showDashboard() {
    if (loginContainer) loginContainer.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'flex';
    
    // Update user info
    const currentUserEl = document.getElementById('currentUser');
    if (currentUserEl && currentUser) {
        currentUserEl.textContent = currentUser.username;
    }
    
    // Load dashboard data
    loadDashboardData();
}

// Section navigation
function showSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[onclick="showSection('${sectionName}')"]`).classList.add('active');
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // Load section-specific data
    switch (sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'movies':
            loadMoviesForAdmin();
            break;
        case 'add-movie':
            resetForm();
            break;
    }
}

// Dashboard functions
async function loadDashboardData() {
    showLoading();
    
    try {
        await loadMoviesData();
        updateDashboardStats();
        loadRecentMovies();
    } catch (error) {
        showNotification('Failed to load dashboard data', 'error');
    }
    
    hideLoading();
}

async function loadMoviesData() {
    try {
        const response = await fetchWithAuth('/api/movies');
        if (response.ok) {
            allMovies = await response.json();
        }
    } catch (error) {
        console.error('Failed to load movies:', error);
    }
}

function updateDashboardStats() {
    const totalMoviesEl = document.getElementById('totalMoviesCount');
    const featuredMoviesEl = document.getElementById('featuredMoviesCount');
    const totalGenresEl = document.getElementById('totalGenresCount');
    const averageRatingEl = document.getElementById('averageRating');
    
    if (totalMoviesEl) totalMoviesEl.textContent = allMovies.length;
    
    if (featuredMoviesEl) {
        const featuredCount = allMovies.filter(movie => movie.featured).length;
        featuredMoviesEl.textContent = featuredCount;
    }
    
    if (totalGenresEl) {
        const genres = [...new Set(allMovies.map(movie => movie.genre))];
        totalGenresEl.textContent = genres.length;
    }
    
    if (averageRatingEl) {
        const avgRating = allMovies.length > 0 
            ? (allMovies.reduce((sum, movie) => sum + movie.rating, 0) / allMovies.length).toFixed(1)
            : '0.0';
        averageRatingEl.textContent = avgRating;
    }
}

function loadRecentMovies() {
    const recentMoviesTable = document.getElementById('recentMoviesTable');
    if (!recentMoviesTable) return;
    
    const recentMovies = [...allMovies]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    let html = `
        <div class="table-header">
            <div>Title</div>
            <div>Director</div>
            <div>Year</div>
            <div>Rating</div>
            <div>Actions</div>
        </div>
    `;
    
    recentMovies.forEach(movie => {
        html += `
            <div class="table-row">
                <div>${movie.title}</div>
                <div>${movie.director}</div>
                <div>${movie.year}</div>
                <div>⭐ ${movie.rating}</div>
                <div>
                    <button class="btn btn-outline btn-sm" onclick="editMovie('${movie.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    recentMoviesTable.innerHTML = html;
}

// Movies management
async function loadMoviesForAdmin() {
    showLoading();
    
    try {
        await loadMoviesData();
        displayAdminMovies(allMovies);
    } catch (error) {
        showNotification('Failed to load movies', 'error');
    }
    
    hideLoading();
}

function displayAdminMovies(movies) {
    const moviesGrid = document.getElementById('adminMoviesGrid');
    if (!moviesGrid) return;
    
    if (movies.length === 0) {
        moviesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-film" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>No movies found. Add your first movie!</p>
            </div>
        `;
        return;
    }
    
    moviesGrid.innerHTML = movies.map(movie => `
        <div class="admin-movie-card">
            <div class="admin-movie-poster" style="background-image: url('${movie.poster || '/images/placeholder.jpg'}')">
                ${movie.featured ? '<div class="featured-badge">Featured</div>' : ''}
            </div>
            <div class="admin-movie-info">
                <h3 class="admin-movie-title">${movie.title}</h3>
                <div class="admin-movie-details">
                    <span>${movie.year} • ${movie.genre}</span>
                    <span>⭐ ${movie.rating}</span>
                </div>
                <div class="admin-movie-actions">
                    <button class="btn btn-outline btn-sm" onclick="editMovie('${movie.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteMovie('${movie.id}', '${movie.title}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function searchMovies() {
    const searchTerm = document.getElementById('movieSearch').value.toLowerCase();
    
    if (!searchTerm) {
        displayAdminMovies(allMovies);
        return;
    }
    
    const filteredMovies = allMovies.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm) ||
        movie.director.toLowerCase().includes(searchTerm) ||
        movie.genre.toLowerCase().includes(searchTerm) ||
        movie.cast.some(actor => actor.toLowerCase().includes(searchTerm))
    );
    
    displayAdminMovies(filteredMovies);
}

// Movie form functions
async function handleMovieSubmit(e) {
    e.preventDefault();
    
    showLoading();
    
    try {
        const formData = new FormData(movieForm);
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `/api/admin/movies/${editingMovieId}` : '/api/admin/movies';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const action = isEditing ? 'updated' : 'added';
            showNotification(`Movie ${action} successfully!`, 'success');
            resetForm();
            loadMoviesData();
            showSection('movies');
        } else {
            showNotification(data.error || `Failed to ${isEditing ? 'update' : 'add'} movie`, 'error');
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
    }
    
    hideLoading();
}

function editMovie(movieId) {
    const movie = allMovies.find(m => m.id === movieId);
    if (!movie) return;
    
    isEditing = true;
    editingMovieId = movieId;
    
    // Populate form
    document.getElementById('movieId').value = movie.id;
    document.getElementById('movieTitle').value = movie.title;
    document.getElementById('movieDirector').value = movie.director;
    document.getElementById('movieYear').value = movie.year;
    document.getElementById('movieGenre').value = movie.genre;
    document.getElementById('movieRating').value = movie.rating;
    document.getElementById('movieDuration').value = movie.duration;
    document.getElementById('movieDescription').value = movie.description;
    document.getElementById('movieCast').value = movie.cast.join(', ');
    document.getElementById('movieTrailer').value = movie.trailer;
    document.getElementById('movieFeatured').checked = movie.featured;
    
    // Update form title
    document.getElementById('movieFormTitle').textContent = 'Edit Movie';
    
    // Show poster preview if exists
    if (movie.poster) {
        const posterPreview = document.getElementById('posterPreview');
        posterPreview.innerHTML = `<img src="${movie.poster}" alt="Current poster">`;
    }
    
    showSection('add-movie');
}

function resetForm() {
    if (movieForm) {
        movieForm.reset();
        isEditing = false;
        editingMovieId = null;
        document.getElementById('movieFormTitle').textContent = 'Add New Movie';
        document.getElementById('posterPreview').innerHTML = '';
    }
}

function handlePosterPreview() {
    const file = document.getElementById('moviePoster').files[0];
    const preview = document.getElementById('posterPreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Poster preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

// Delete movie
function confirmDeleteMovie(movieId, movieTitle) {
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmButton = document.getElementById('confirmButton');
    
    confirmMessage.textContent = `Are you sure you want to delete "${movieTitle}"? This action cannot be undone.`;
    
    confirmButton.onclick = () => deleteMovie(movieId);
    
    confirmModal.style.display = 'block';
}

async function deleteMovie(movieId) {
    closeConfirmModal();
    showLoading();
    
    try {
        const response = await fetchWithAuth(`/api/admin/movies/${movieId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Movie deleted successfully!', 'success');
            loadMoviesData();
            loadMoviesForAdmin();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Failed to delete movie', 'error');
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
    }
    
    hideLoading();
}

// Settings functions
function exportData() {
    const dataStr = JSON.stringify(allMovies, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `movies-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Data exported successfully!', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                // Here you would typically send this data to the server
                // For now, just show a success message
                showNotification('Data import feature coming soon!', 'info');
            } catch (error) {
                showNotification('Invalid JSON file', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function clearCache() {
    // Clear localStorage
    const keysToKeep = ['adminToken', 'currentUser'];
    Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
        }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    showNotification('Cache cleared successfully!', 'success');
}

// Utility functions
async function fetchWithAuth(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${authToken}`
        }
    });
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

function showNotification(message, type = 'info') {
    const notificationMessage = document.getElementById('notificationMessage');
    
    if (notificationMessage) {
        notificationMessage.textContent = message;
    }
    
    if (notification) {
        notification.className = `notification ${type}`;
        notification.style.display = 'flex';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            closeNotification();
        }, 5000);
    }
}

function closeNotification() {
    if (notification) {
        notification.style.display = 'none';
    }
}

function closeConfirmModal() {
    if (confirmModal) {
        confirmModal.style.display = 'none';
    }
}

// Debounce function
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

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === confirmModal) {
        closeConfirmModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeConfirmModal();
        closeNotification();
    }
});