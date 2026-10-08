require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB=require("./config/db");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));

app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/catalog", require("./routes/catalogRoutes"));
app.use("/api/favorites", require("./routes/favoriteRoutes"));
app.use("/api/vendors", require("./routes/vendorRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));

const startServer = async () => {
    await connectDB();

    app.listen(process.env.PORT || 5000, () => {
        console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
};

startServer();