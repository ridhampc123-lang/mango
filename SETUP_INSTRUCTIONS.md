# 🚀 Mango Business Management System - Complete Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager
- **Git** (optional, for version control)

---

## 🔧 Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mango-business
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
NODE_ENV=development
```

**Important:** 
- Change `JWT_SECRET` to a strong, random string in production
- Ensure MongoDB is running before starting the server
- Adjust `MONGODB_URI` if using MongoDB Atlas or different host

### Step 4: Start MongoDB

**Option A - Local MongoDB:**
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

**Option B - MongoDB Atlas:**
- Use connection string from MongoDB Atlas dashboard
- Update `MONGODB_URI` in `.env`

### Step 5: Start Backend Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The backend will run on `http://localhost:5000`

### ✅ Verify Backend is Running

Visit: `http://localhost:5000/api/health` (if health endpoint exists)

Or check terminal output for:
```
Server running on port 5000
MongoDB connected successfully
```

---

## 🎨 Frontend Setup

### Step 1: Navigate to Frontend Directory
```bash
cd client
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

**Note:** 
- If backend runs on different port, update accordingly
- For production, use your production API URL

### Step 4: Start Frontend Development Server
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### ✅ Verify Frontend is Running

Open browser and visit: `http://localhost:5173`

You should see the login page.

---

## 🔐 First Time Login

### Default Admin Credentials

If your backend has seeded default admin:
```
Email: admin@example.com
Password: admin123
```

**⚠️ Change these credentials immediately after first login!**

If no default admin exists, create one using your backend's user creation endpoint or database directly.

---

## 📱 Building for Production

### Backend Production Build

1. Set environment to production:
```env
NODE_ENV=production
```

2. Start with PM2 (recommended):
```bash
npm install -g pm2
pm2 start server.js --name mango-backend
pm2 save
pm2 startup
```

### Frontend Production Build

1. Build the application:
```bash
cd client
npm run build
```

2. The build files will be in `client/dist/`

3. Preview production build locally:
```bash
npm run preview
```

4. Deploy `dist/` folder to your web server (Nginx, Apache, Vercel, Netlify, etc.)

---

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Failed:**
```bash
# Check if MongoDB is running
mongosh

# If not running, start it:
# Windows:
net start MongoDB

# macOS/Linux:
sudo systemctl start mongod
```

**Port Already in Use:**
```bash
# Change PORT in backend/.env to different port (e.g., 5001)
PORT=5001
```

**JWT Error:**
- Ensure `JWT_SECRET` is set in `.env`
- Must be a non-empty string

### Frontend Issues

**API Connection Error:**
1. Verify backend is running
2. Check `VITE_API_URL` in `client/.env`
3. Check browser console for CORS errors
4. Ensure backend CORS is configured to allow frontend URL

**Module Not Found:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build Fails:**
```bash
# Clear cache and rebuild
npm run clean
npm run build
```

### Common CORS Issues

If you see CORS errors, ensure backend has CORS middleware:

```javascript
// backend/server.js
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

For production:
```javascript
app.use(cors({
  origin: 'https://your-production-domain.com',
  credentials: true
}));
```

---

## 📦 Project Structure

```
mango-mangement/
├── backend/              # Node.js + Express backend
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, validation, etc.
│   ├── config/          # Configuration files
│   └── server.js        # Entry point
│
└── client/               # React frontend
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── pages/       # Page components
    │   ├── services/    # API services
    │   ├── context/     # React context
    │   └── utils/       # Utility functions
    ├── public/          # Static assets
    └── dist/            # Production build (after build)
```

---

## 🚦 Quick Start (All in One)

```bash
# Terminal 1 - Start Backend
cd backend
npm install
# Create .env file with required variables
npm run dev

# Terminal 2 - Start Frontend
cd client
npm install
# Create .env file with VITE_API_URL
npm run dev
```

Then open: `http://localhost:5173`

---

## 📊 API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (if enabled)

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/monthly-revenue` - Monthly revenue data
- `GET /api/dashboard/monthly-expenses` - Monthly expenses data

### Stock
- `GET /api/stock` - Get all stock
- `POST /api/stock` - Create stock
- `PUT /api/stock/:id` - Update stock
- `DELETE /api/stock/:id` - Delete stock

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `DELETE /api/expenses/:id` - Delete expense

### Labour
- `GET /api/labour` - Get all labour entries
- `POST /api/labour` - Create labour entry
- `PATCH /api/labour/pay?id=:id` - Mark as paid
- `DELETE /api/labour/:id` - Delete labour

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `POST /api/customers/:id/credit` - Add credit
- `POST /api/customers/:id/payment` - Add payment
- `DELETE /api/customers/:id` - Delete customer

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change default admin credentials
- [ ] Use strong JWT_SECRET (minimum 32 characters)
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set secure cookies
- [ ] Enable rate limiting
- [ ] Add input validation
- [ ] Sanitize user inputs
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB authentication
- [ ] Regular backups of database
- [ ] Update dependencies regularly

---

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Open the app in browser
2. Click install icon in address bar
3. Click "Install"

### Mobile (Android/iOS)
1. Open app in mobile browser
2. Tap browser menu (⋮ or share icon)
3. Select "Add to Home Screen"
4. App will open in fullscreen mode

---

## 🆘 Need Help?

### Check Documentation
- Frontend: `client/FRONTEND_README.md`
- Backend: Check your backend documentation

### Common Commands Reference

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for updates
npm outdated

# Update dependencies
npm update
```

---

## 🎉 You're All Set!

Your Mango Business Management System is now ready to use!

**Default URLs:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- API Base: `http://localhost:5000/api`

**Next Steps:**
1. Login with default credentials
2. Change admin password
3. Start adding your business data
4. Explore all features

---

**Happy Managing! 🥭**
