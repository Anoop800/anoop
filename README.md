# ShopSphere Multi-Vendor E-Commerce

A MERN-style multi-vendor marketplace with customer authentication, vendor accounts, product catalog, search, favorites, cart, checkout, MongoDB orders, customer order tracking, and vendor order management.

## Features

### Customers
- Register and login with JWT authentication
- Remember-me/session authentication
- Product search and category filtering
- Favorites/wishlist stored in MongoDB
- Persistent local cart with quantities and stock limits
- Checkout and shipping address
- Cash on Delivery order placement
- MongoDB order history and order details
- Eligible order cancellation with stock restoration

### Vendors
- Separate vendor database/model and authentication
- Unique Vendor ID
- Vendor dashboard
- Create/edit/delete own products
- Product stock management
- Vendor profile management
- View orders containing the vendor's products
- Update order status

### Backend
- Express + MongoDB/Mongoose
- JWT authentication
- bcrypt password hashing
- Customer/vendor access separation
- Stock validation during order creation
- Wishlist cleanup when products are deleted

## Setup

### Backend

```bash
cd backend
npm install
```

Create `.env` from `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/shopsphere
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
```

Start the API:

```bash
npm run dev
```

Optional demo catalog:

```bash
npm run seed:catalog
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Optional frontend `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Important payment note

Cash on Delivery is fully represented in the order flow. The Online Payment option is intentionally not marked as paid because a real payment gateway requires merchant credentials and gateway verification. Integrate Razorpay/Stripe/etc. before enabling real online payments.

## Security

Never commit `.env` files or production JWT secrets. The repository ignores environment files and contains `.env.example` templates instead.
