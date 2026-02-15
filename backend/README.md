# Mango Business Management System - Backend API

A production-ready RESTful API built with Node.js, Express, and MongoDB for managing a mango business including orders, stock, customers, farmers, batches, expenses, and business reports.

## 🚀 Features

- ✅ JWT Authentication
- ✅ Clean MVC Architecture
- ✅ Mongoose with strict validation
- ✅ Transaction support for atomic operations
- ✅ Stock management with real-time validation
- ✅ Automatic customer creation/update
- ✅ Invoice generation
- ✅ Batch management with auto stock updates
- ✅ Business analytics and reports
- ✅ Global error handling
- ✅ CORS enabled
- ✅ Request logging with Morgan

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js       # Authentication
│   │   ├── orderController.js      # Orders with transactions
│   │   ├── stockController.js      # Stock management
│   │   ├── batchController.js      # Batch processing
│   │   ├── customerController.js   # Customer management
│   │   ├── farmerController.js     # Farmer management
│   │   ├── expenseController.js    # Expenses
│   │   └── reportController.js     # Business reports
│   ├── models/
│   │   ├── Admin.js                # Admin user model
│   │   ├── Customer.js             # Customer model
│   │   ├── Order.js                # Order model
│   │   ├── Stock.js                # Stock model
│   │   ├── Batch.js                # Batch model
│   │   ├── Farmer.js               # Farmer model
│   │   └── Expense.js              # Expense model
│   ├── routes/
│   │   └── *.Routes.js             # All route files
│   ├── middleware/
│   │   ├── auth.js                 # JWT authentication
│   │   └── errorHandler.js         # Error handling
│   ├── utils/
│   │   └── generateToken.js        # JWT token generator
│   ├── app.js                      # Express app setup
│   └── server.js                   # Server entry point
├── .env.example                    # Environment variables template
├── package.json
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

### Steps

1. **Clone or navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables in .env**
   ```
   PORT=5000
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   NODE_ENV=development
   ```

5. **Run the server**
   - Development mode (with nodemon):
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```

6. **Server should be running on** `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

#### Register Admin
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Returns:** JWT token to be used in Authorization header


### Orders

#### Create Order (with automatic stock & customer management)
```http
POST /api/orders
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "customerName": "John Doe",
  "mobile": "9876543210",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "variety": "Alphonso",
  "boxType": 5,
  "boxQuantity": 10,
  "ratePerBox": 500,
  "paymentStatus": "Cash"
}
```

**Business Logic:**
- Validates box type (5 or 10)
- Checks stock availability
- Creates/updates customer automatically
- Updates stock quantities
- Generates invoice number
- Uses MongoDB transactions for atomicity

#### Get All Orders
```http
GET /api/orders
Authorization: Bearer YOUR_JWT_TOKEN
```

### Stock

#### Get All Stock
```http
GET /api/stock
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Create/Update Stock
```http
POST /api/stock
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "variety": "Alphonso",
  "box5Total": 100,
  "box10Total": 50
}
```

### Batches

#### Create Batch (auto-updates stock & farmer payments)
```http
POST /api/batches
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "farmerId": "farmer_id_here",
  "variety": "Alphonso",
  "box5": 50,
  "box10": 30,
  "costPerBox5": 300,
  "costPerBox10": 500
}
```

**Business Logic:**
- Auto-generates batch ID
- Calculates total cost
- Updates stock inventory
- Updates farmer pending payments
- Uses transactions

#### Get All Batches
```http
GET /api/batches
Authorization: Bearer YOUR_JWT_TOKEN
```

### Customers

#### Get All Customers
```http
GET /api/customers
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Get Customer by Mobile
```http
GET /api/customers/mobile/:mobile
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Update Customer Balance (Payment Received)
```http
PUT /api/customers/:id/payment
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "amount": 5000
}
```

### Farmers

#### Create Farmer
```http
POST /api/farmers
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Farmer Name",
  "mobile": "9876543210",
  "village": "Village Name"
}
```

#### Make Payment to Farmer
```http
PUT /api/farmers/:id/payment
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "amount": 10000
}
```

### Expenses

#### Create Expense
```http
POST /api/expenses
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Transport Cost",
  "amount": 2000,
  "date": "2026-02-12"
}
```

#### Get All Expenses
```http
GET /api/expenses
Authorization: Bearer YOUR_JWT_TOKEN
```

### Reports

#### Get Business Summary
```http
GET /api/reports/summary
Authorization: Bearer YOUR_JWT_TOKEN
```

**Returns:**
- Total Sales
- Total Expenses
- Profit
- Pending Customer Payments
- Pending Farmer Payments
- Total Revenue
- Net Profit

#### Get Monthly Sales Report
```http
GET /api/reports/monthly-sales?year=2026
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Get Top Customers
```http
GET /api/reports/top-customers?limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT authentication
- Protected routes
- Input validation
- CORS configuration
- Request body size limits
- Error stack hiding in production

## 🧪 Testing

Use Postman or any API client to test the endpoints. Import the collection or test manually following the API documentation above.

### Quick Test Flow:

1. Register/Login to get JWT token
2. Create a farmer
3. Create a batch (stock will be auto-updated)
4. Create an order (customer & stock auto-managed)
5. Get reports to see business summary

## 🛠️ Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **dotenv** - Environment variables
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logger
- **nodemon** - Development server

## 📝 Notes

- All responses follow the format:
  ```json
  {
    "success": true/false,
    "message": "Description",
    "data": {}
  }
  ```
- All dates are stored in ISO format
- Box types are strictly 5 or 10
- Stock validation prevents negative inventory
- Transactions ensure data consistency
- Customer mobile numbers are unique

## 🤝 Integration with Frontend

This backend is designed to work with the Mango Business Management frontend. Ensure the frontend's `VITE_API_URL` points to this backend URL.

## 📧 Support

For issues or questions, please refer to the code comments or error messages returned by the API.

## 📄 License

ISC License

---

**Made with ❤️ for Mango Business Management**
