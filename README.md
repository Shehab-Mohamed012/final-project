# Back-end-Graduation-Project-2025
Travel App Backend for Graduation Project 2025 using Node.js and MongoDB


# 🌍 Travel App - Back-end Graduation Project 2025

This is the back-end part of our **Graduation Project 2025**, a full-featured **Travel App** built using **Node.js** and **MongoDB**.  
It powers features like managing destinations, user profiles, image uploads, and more.

---

## 📁 Project Structure

```
travel_app/
├── controllers/       # Business logic
├── models/            # Mongoose schemas
├── routes/            # API routes
├── middlewares/       # Custom middleware
├── uploads/           # Image storage (GridFS)
├── config/            # Database connection, environment setup
├── .env               # Environment variables (NOT included in repo)
├── .gitignore
├── package.json
└── server.js          # Entry point
```

---

## 🚀 Features

- ✅ User registration with profile picture (stored via GridFS)
- 📍 Add and manage places to visit
- 📸 Image upload for places and users
- 🔐 Secure authentication using JWT
- 🧠 RESTful API architecture
- 🌐 CORS-enabled, ready for frontend integration
- 📦 MongoDB with GridFS for storing large files

---

## 🛠️ Tech Stack

| Tech         | Description                        |
|--------------|------------------------------------|
| Node.js      | JavaScript runtime                 |
| Express.js   | Web framework for Node             |
| MongoDB      | NoSQL Database                     |
| Mongoose     | ODM for MongoDB                    |
| GridFS       | File storage for images            |
| Multer       | Middleware for file uploads        |
| dotenv       | Manage environment variables       |
| bcrypt / JWT | Password hashing & Auth tokens     |

---

## 🔧 Setup Instructions

1. **Clone the repository**  
   ```bash
   git clone https://github.com/YOUR_USERNAME/backend-graduation-project-2025.git
   cd backend-graduation-project-2025
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Create `.env` file**  
   Copy the `.env.example` and fill in your values:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/travel_app
   JWT_SECRET=your_jwt_secret
   ```

4. **Run the server**  
   ```bash
   npm run dev
   ```

---

## 📬 API Endpoints Overview

| Method | Endpoint             | Description              |
|--------|----------------------|--------------------------|
| POST   | /api/users/register  | Register new user        |
| POST   | /api/users/login     | Login and get token      |
| GET    | /api/places/         | List all places          |
| POST   | /api/places/         | Add a new place          |
| PUT    | /api/places/:id      | Update a place           |
| DELETE | /api/places/:id      | Delete a place           |

> Full API docs coming soon...

---

## 📦 Deployment

You can deploy this app on platforms like:
- [Render](https://render.com/)
- [Railway](https://railway.app/)
- [Vercel (Backend)](https://vercel.com/)

---

## 🙌 Team

- 👤 **Shihab El-Din Mohamed** – Back-end Developer  
- 📚 Graduation Project, Faculty of Computer Science and Artificial Intelligence, Matrouh University, Class of 2025

---

## 📄 License

This project is licensed under the MIT License.
