const express = require("express");
const vendorAuth = require("../middleware/vendorMiddleware");
const controller = require("../controllers/vendorController");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.use(vendorAuth);
router.get("/profile", controller.getProfile);
router.put("/profile", controller.updateProfile);
router.get("/dashboard", controller.getDashboard);
router.get("/products", controller.getProducts);
router.post("/products", controller.createProduct);
router.put("/products/:id", controller.updateProduct);
router.delete("/products/:id", controller.deleteProduct);
router.get("/orders", orderController.getVendorOrders);
router.patch("/orders/:id", orderController.updateVendorOrder);

module.exports = router;
