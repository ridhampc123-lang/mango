# Mango Business Management System - Frontend

A production-ready, mobile-first Progressive Web App (PWA) built with React for managing mango business operations.

## 🚀 Features

### Core Functionality
- ✅ **JWT Authentication** - Secure login with token-based authentication
- 📊 **Dashboard** - Real-time business metrics and analytics
- 📦 **Stock Management** - Track inventory, sales, and profits
- 💰 **Transactions** - Manage sales, credit, and payments
- 💸 **Expense Tracking** - Categorize and analyze expenses
- 👷 **Labour Management** - Track worker wages and payments
- 👥 **Customer Credit** - Manage customer accounts and balances

### Technical Features
- 🎨 **Mobile-First Design** - Responsive layout optimized for mobile devices
- 📱 **Progressive Web App** - Install on home screen, works offline
- 📈 **Interactive Charts** - Beautiful data visualization with Recharts
- 🔔 **Toast Notifications** - Real-time feedback for user actions
- 🔐 **Protected Routes** - Secure pages with authentication
- ⚡ **Fast & Optimized** - Built with Vite for lightning-fast performance

## 🛠️ Tech Stack

- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM v6
- **HTTP Client:** Axios with interceptors
- **Charts:** Recharts
- **Notifications:** React Hot Toast
- **State Management:** React Context API
- **PWA:** Service Workers + Web Manifest

## 📁 Project Structure

```
client/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── src/
│   ├── assets/                # Images and static files
│   ├── components/            # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── Modal.jsx
│   │   ├── Loading.jsx
│   │   ├── EmptyState.jsx
│   │   ├── StatCard.jsx
│   │   ├── ConfirmDialog.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/               # React Context
│   │   └── AuthContext.jsx
│   ├── hooks/                 # Custom React hooks
│   ├── layouts/               # Layout components
│   │   └── MainLayout.jsx
│   ├── pages/                 # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Stock.jsx
│   │   ├── Transactions.jsx
│   │   ├── Expenses.jsx
│   │   ├── Labour.jsx
│   │   └── Customers.jsx
│   ├── services/              # API service layer
│   │   ├── authService.js
│   │   ├── dashboardService.js
│   │   ├── stockService.js
│   │   ├── transactionService.js
│   │   ├── expenseService.js
│   │   ├── labourService.js
│   │   └── customerService.js
│   ├── utils/                 # Utility functions
│   │   └── axios.js           # Axios configuration
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── .env                       # Environment variables
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running

### Installation

1. **Navigate to the client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Create a `.env` file in the client directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

### Tailwind CSS

Customize colors and theme in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      emerald: {
        // Custom emerald color palette
      },
    },
  },
}
```

## 📱 PWA Configuration

### Installing on Mobile

1. Open the app in your mobile browser
2. Tap the browser menu
3. Select "Add to Home Screen"
4. The app will open in fullscreen mode

### PWA Features

- **Offline Support** - Basic caching with service workers
- **Install Prompt** - Add to home screen capability
- **Fullscreen Mode** - No browser UI when installed
- **App Icons** - Custom app icons (192x192 and 512x512)

## 🔐 Authentication Flow

1. User enters credentials on login page
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates and returns JWT token
4. Token stored in localStorage
5. Axios interceptor attaches token to all requests
6. Protected routes check authentication status
7. Auto-logout on 401 responses

## 📊 Key Pages

### Dashboard
- Real-time business metrics
- Summary cards for key statistics
- Monthly revenue/expense charts
- Profit trend visualization

### Stock Management
- Add/edit/delete stock entries
- Track remaining boxes
- Calculate costs and profits
- Low stock warnings

### Transactions
- Record sales, credit, payments
- Filter by type and date
- Summary totals
- Customer details

### Expenses
- Track business expenses
- Category-based filtering
- Pie chart visualization
- Monthly summaries

### Labour Management
- Track worker hours and wages
- Mark wages as paid
- Pending wages calculation
- Worker contact information

### Customer Credit
- Add customers
- Track credit balances
- Record payments
- Highlight pending balances

## 🎨 UI Components

### Reusable Components
- **Button** - Multiple variants (primary, secondary, danger, outline)
- **Input** - Form input with validation
- **Select** - Dropdown select component
- **Card** - Container component with title/subtitle
- **Modal** - Dialog for forms and confirmations
- **Loading** - Spinner with fullscreen option
- **EmptyState** - Placeholder for empty data
- **StatCard** - Dashboard statistics card
- **ConfirmDialog** - Confirmation prompt

## 🔄 API Integration

All API calls use the centralized Axios instance with:
- Automatic JWT token injection
- Global error handling
- Toast notifications
- 401 auto-logout
- Network error handling

Example service:
```javascript
import axiosInstance from '../utils/axios';

export const stockService = {
  getAll: async () => {
    const response = await axiosInstance.get('/stock');
    return response.data;
  },
  // ... more methods
};
```

## 🎯 Best Practices

✅ Component-based architecture  
✅ Separation of concerns (services, components, pages)  
✅ Centralized API configuration  
✅ Consistent error handling  
✅ Loading states for all async operations  
✅ Form validation  
✅ Responsive design  
✅ Accessibility considerations  
✅ Clean and maintainable code  

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if backend server is running
   - Verify `VITE_API_URL` in `.env` file
   - Check CORS configuration on backend

2. **Login Not Working**
   - Verify credentials
   - Check browser console for errors
   - Ensure token is being stored in localStorage

3. **Charts Not Loading**
   - Check if data is being fetched from API
   - Verify Recharts is installed
   - Check browser console for errors

4. **PWA Not Installing**
   - Ensure HTTPS or localhost
   - Check manifest.json is accessible
   - Verify service worker registration

## 📄 License

This project is private and proprietary.

## 👨‍💻 Development

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use Tailwind for styling
- Keep components small and focused
- Use meaningful variable names

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature
```

## 🆘 Support

For issues or questions, contact the development team.

---

**Built with ❤️ for Mango Business Management**
