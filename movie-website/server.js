const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Database files
const MOVIES_DB = './database/movies.json';
const USERS_DB = './database/users.json';

// Initialize database files
function initializeDB() {
  if (!fs.existsSync('./database')) {
    fs.mkdirSync('./database');
  }
  
  if (!fs.existsSync(MOVIES_DB)) {
    const initialMovies = [
      {
        id: uuidv4(),
        title: "The Shawshank Redemption",
        director: "Frank Darabont",
        year: 1994,
        genre: "Drama",
        rating: 9.3,
        description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
        poster: "/uploads/shawshank.jpg",
        trailer: "https://www.youtube.com/embed/6hB3S9bIaco",
        duration: "142 min",
        cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton"],
        featured: true,
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: "The Godfather",
        director: "Francis Ford Coppola",
        year: 1972,
        genre: "Crime",
        rating: 9.2,
        description: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
        poster: "/uploads/godfather.jpg",
        trailer: "https://www.youtube.com/embed/sY1S34973zA",
        duration: "175 min",
        cast: ["Marlon Brando", "Al Pacino", "James Caan"],
        featured: true,
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: "The Dark Knight",
        director: "Christopher Nolan",
        year: 2008,
        genre: "Action",
        rating: 9.0,
        description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        poster: "/uploads/dark-knight.jpg",
        trailer: "https://www.youtube.com/embed/EXeTwQWrcwY",
        duration: "152 min",
        cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
        featured: false,
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: "Pulp Fiction",
        director: "Quentin Tarantino",
        year: 1994,
        genre: "Crime",
        rating: 8.9,
        description: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
        poster: "/uploads/pulp-fiction.jpg",
        trailer: "https://www.youtube.com/embed/s7EdQ4FqbhY",
        duration: "154 min",
        cast: ["John Travolta", "Uma Thurman", "Samuel L. Jackson"],
        featured: false,
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: "Inception",
        director: "Christopher Nolan",
        year: 2010,
        genre: "Sci-Fi",
        rating: 8.8,
        description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        poster: "/uploads/inception.jpg",
        trailer: "https://www.youtube.com/embed/YoHD9XEInc0",
        duration: "148 min",
        cast: ["Leonardo DiCaprio", "Marion Cotillard", "Tom Hardy"],
        featured: true,
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(MOVIES_DB, JSON.stringify(initialMovies, null, 2));
  }
  
  if (!fs.existsSync(USERS_DB)) {
    const defaultAdmin = {
      id: uuidv4(),
      username: 'admin',
      email: 'admin@moviesite.com',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(USERS_DB, JSON.stringify([defaultAdmin], null, 2));
  }
}

// Helper functions
function readMovies() {
  return JSON.parse(fs.readFileSync(MOVIES_DB, 'utf8'));
}

function writeMovies(movies) {
  fs.writeFileSync(MOVIES_DB, JSON.stringify(movies, null, 2));
}

function readUsers() {
  return JSON.parse(fs.readFileSync(USERS_DB, 'utf8'));
}

function writeUsers(users) {
  fs.writeFileSync(USERS_DB, JSON.stringify(users, null, 2));
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Public API Routes
app.get('/api/movies', (req, res) => {
  try {
    const movies = readMovies();
    const { genre, year, search, featured, limit } = req.query;
    
    let filteredMovies = movies;
    
    if (genre) {
      filteredMovies = filteredMovies.filter(movie => 
        movie.genre.toLowerCase().includes(genre.toLowerCase())
      );
    }
    
    if (year) {
      filteredMovies = filteredMovies.filter(movie => movie.year == year);
    }
    
    if (search) {
      filteredMovies = filteredMovies.filter(movie =>
        movie.title.toLowerCase().includes(search.toLowerCase()) ||
        movie.director.toLowerCase().includes(search.toLowerCase()) ||
        movie.cast.some(actor => actor.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    if (featured === 'true') {
      filteredMovies = filteredMovies.filter(movie => movie.featured);
    }
    
    if (limit) {
      filteredMovies = filteredMovies.slice(0, parseInt(limit));
    }
    
    res.json(filteredMovies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

app.get('/api/movies/:id', (req, res) => {
  try {
    const movies = readMovies();
    const movie = movies.find(m => m.id === req.params.id);
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin API Routes
app.post('/api/admin/movies', authenticateToken, upload.single('poster'), (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const movies = readMovies();
    const newMovie = {
      id: uuidv4(),
      title: req.body.title,
      director: req.body.director,
      year: parseInt(req.body.year),
      genre: req.body.genre,
      rating: parseFloat(req.body.rating),
      description: req.body.description,
      poster: req.file ? `/uploads/${req.file.filename}` : '',
      trailer: req.body.trailer || '',
      duration: req.body.duration,
      cast: req.body.cast ? req.body.cast.split(',').map(actor => actor.trim()) : [],
      featured: req.body.featured === 'true',
      createdAt: new Date().toISOString()
    };
    
    movies.push(newMovie);
    writeMovies(movies);
    
    res.status(201).json(newMovie);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create movie' });
  }
});

app.put('/api/admin/movies/:id', authenticateToken, upload.single('poster'), (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const movies = readMovies();
    const movieIndex = movies.findIndex(m => m.id === req.params.id);
    
    if (movieIndex === -1) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    const updatedMovie = {
      ...movies[movieIndex],
      title: req.body.title || movies[movieIndex].title,
      director: req.body.director || movies[movieIndex].director,
      year: req.body.year ? parseInt(req.body.year) : movies[movieIndex].year,
      genre: req.body.genre || movies[movieIndex].genre,
      rating: req.body.rating ? parseFloat(req.body.rating) : movies[movieIndex].rating,
      description: req.body.description || movies[movieIndex].description,
      poster: req.file ? `/uploads/${req.file.filename}` : movies[movieIndex].poster,
      trailer: req.body.trailer || movies[movieIndex].trailer,
      duration: req.body.duration || movies[movieIndex].duration,
      cast: req.body.cast ? req.body.cast.split(',').map(actor => actor.trim()) : movies[movieIndex].cast,
      featured: req.body.featured !== undefined ? req.body.featured === 'true' : movies[movieIndex].featured,
      updatedAt: new Date().toISOString()
    };
    
    movies[movieIndex] = updatedMovie;
    writeMovies(movies);
    
    res.json(updatedMovie);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update movie' });
  }
});

app.delete('/api/admin/movies/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const movies = readMovies();
    const movieIndex = movies.findIndex(m => m.id === req.params.id);
    
    if (movieIndex === -1) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    movies.splice(movieIndex, 1);
    writeMovies(movies);
    
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete movie' });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'admin.html'));
});

// Initialize database and start server
initializeDB();

app.listen(PORT, () => {
  console.log(`🎬 Movie website server running on http://localhost:${PORT}`);
  console.log(`📱 Admin panel available at http://localhost:${PORT}/admin`);
  console.log(`🔐 Default admin credentials: admin / admin123`);
});