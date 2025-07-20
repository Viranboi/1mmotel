# CinemaHub - Movie Website with Admin Panel

A comprehensive movie website with a powerful admin panel built with Node.js, Express, and modern web technologies.

## 🎬 Features

### User Website
- **Modern Design**: Clean, responsive design with dark theme
- **Movie Catalog**: Browse extensive movie collection with posters, ratings, and details
- **Featured Movies**: Slider showcasing hand-picked movies
- **Advanced Search**: Search by title, director, cast, or genre
- **Filtering & Sorting**: Filter by genre, year, and sort by rating, title, or year
- **Movie Details**: Detailed movie information with trailers
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

### Admin Panel
- **Secure Authentication**: JWT-based admin authentication
- **Dashboard**: Overview statistics and recent movies
- **Movie Management**: Full CRUD operations for movies
- **File Upload**: Upload movie posters with preview
- **Search & Filter**: Advanced search functionality for managing movies
- **Data Export**: Export movie database as JSON
- **Modern UI**: Clean, professional admin interface

## 🚀 Technologies Used

### Backend
- Node.js
- Express.js
- JWT (JSON Web Tokens)
- Bcrypt.js for password hashing
- Multer for file uploads
- CORS for cross-origin requests
- Express Rate Limit for API protection

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Font Awesome icons
- Google Fonts (Inter)
- Modern CSS with Grid and Flexbox
- Responsive design with media queries

### Database
- JSON file-based storage (easily replaceable with SQL/NoSQL databases)

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone or navigate to the movie-website directory**
   ```bash
   cd movie-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Access the website**
   - Main website: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## 🔐 Default Admin Credentials

- **Username**: admin
- **Password**: admin123

⚠️ **Important**: Change these credentials in production!

## 📁 Project Structure

```
movie-website/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── database/              # JSON database files
│   ├── movies.json        # Movie data
│   └── users.json         # Admin users
├── uploads/               # Uploaded movie posters
├── frontend/              # Frontend files
│   ├── index.html         # Main website
│   ├── admin.html         # Admin panel
│   ├── css/
│   │   ├── style.css      # Main website styles
│   │   └── admin.css      # Admin panel styles
│   └── js/
│       ├── script.js      # Main website JavaScript
│       └── admin.js       # Admin panel JavaScript
└── README.md              # This file
```

## 🎯 API Endpoints

### Public Endpoints
- `GET /api/movies` - Get all movies (with optional filters)
- `GET /api/movies/:id` - Get specific movie
- `POST /api/auth/login` - Admin login

### Admin Endpoints (Require Authentication)
- `POST /api/admin/movies` - Create new movie
- `PUT /api/admin/movies/:id` - Update movie
- `DELETE /api/admin/movies/:id` - Delete movie

## 🎨 Customization

### Adding New Movies
1. Access the admin panel at `/admin`
2. Login with admin credentials
3. Navigate to "Add Movie" section
4. Fill in movie details and upload poster
5. Save the movie

### Styling
- Main website styles: `frontend/css/style.css`
- Admin panel styles: `frontend/css/admin.css`
- Color scheme can be easily modified by changing CSS variables

### Database
The current setup uses JSON files for simplicity. To use a real database:
1. Install your preferred database driver (MongoDB, PostgreSQL, MySQL)
2. Modify the database functions in `server.js`
3. Update the initialization and CRUD operations

## 🔧 Configuration

### Environment Variables
Create a `.env` file for production:
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

### Security Features
- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- File upload restrictions
- Input validation and sanitization

## 📱 Responsive Design

The website is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🎬 Sample Movies Included

The database comes pre-loaded with popular movies including:
- The Shawshank Redemption
- The Godfather
- The Dark Knight
- Pulp Fiction
- Inception

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
Create a `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the PORT in server.js or use environment variable

2. **File upload not working**
   - Check if uploads directory exists and has write permissions

3. **Admin login fails**
   - Verify credentials and check if users.json exists

4. **Styles not loading**
   - Ensure frontend directory structure is correct
   - Check browser console for errors

### Support
For issues and questions, please check the troubleshooting guide above or create an issue in the repository.

## ✨ Future Enhancements

- User registration and reviews
- Movie ratings and comments
- Advanced analytics dashboard
- Email notifications
- Social media integration
- Video streaming integration
- Multi-language support
- Dark/Light theme toggle

---

**Enjoy your movie website! 🎬🍿**