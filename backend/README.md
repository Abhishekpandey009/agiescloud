# Backend for authentication (login/signup)

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create a `.env` file in the backend directory with the following content:
   ```
   MONGO_URI=mongodb://localhost:27017/yourdbname
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```
   Replace `yourdbname` and `your_jwt_secret` as needed.

3. Start the server:
   ```
   npm run dev
   ```
   or
   ```
   npm start
   ```

## API Endpoints

- `POST /api/auth/signup` — Register a new user
- `POST /api/auth/login` — Login and receive JWT

## Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT for authentication
- bcryptjs for password hashing
