# PathPilot - Career Roadmap Generator

Full-stack PathPilot project with secure login/signup and private user history.

## Tech used

### Frontend
- Vite
- HTML, CSS, JavaScript
- Bright/Dark theme
- Login page
- Signup page
- JWT token stored in `localStorage`
- Calls backend using `VITE_API_URL`

### Backend
- Node.js
- Express.js
- MongoDB Atlas with Mongoose
- Groq API for roadmap generation
- JWT authentication
- bcrypt password hashing
- User-specific history

## Folder structure

```txt
pathpilot/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── main.js
│       └── styles.css
└── backend/
    ├── server.js
    ├── package.json
    ├── .env.example
    ├── config/db.js
    ├── controllers/
    ├── middleware/
    ├── models/
    └── routes/
```

## Backend setup

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_atlas_uri
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

## Frontend setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Deployment notes

Render backend environment variables:

```env
MONGO_URI=your_mongodb_atlas_uri
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-netlify-site.netlify.app
```

Netlify frontend environment variable:

```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

## Important security rules

- Do not upload `.env` to GitHub.
- Only upload `.env.example`.
- Keep Groq API key and MongoDB URI only in backend.
