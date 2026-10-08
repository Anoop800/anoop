const mongoose = require("mongoose");
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const customer = async (req) => User.findOne({ _id: req.user.id, role: "customer", status: "active" }).select("_id fullName email phone");
const orderNumber = () => `SS-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

exports.createOrder = async (req, res) => {
  const user = await customer(req);
  if (!user) return res.status(403).json({ message: "Customer access required" });
  const { items, shippingAddress, paymentMethod = "cod" } = req.body;
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "Your cart is empty" });
  if (!["cod", "online"].includes(paymentMethod)) return res.status(400).json({ message: "Invalid payment method" });
  const requiredAddress = ["fullName", "phone", "addressLine", "city", "state", "pincode"];
  if (!shippingAddress || requiredAddress.some(key => !String(shippingAddress[key] || "").trim())) return res.status(400).json({ message: "Complete shipping address is required" });

  const ids = items.map(item => item.productId || item._id);
  if (ids.some(id => !mongoose.isValidObjectId(id))) return res.status(400).json({ message: "Cart contains an invalid product" });
  const products = await Product.find({ _id: { $in: ids } }).populate("vendor", "businessName").lean();
  const productMap = new Map(products.map(p => [String(p._id), p]));
  const normalized = [];
  for (const raw of items) {
    const product = productMap.get(String(raw.productId || raw._id));
    const quantity = Number(raw.quantity);
    if (!product) return res.status(404).json({ message: "One or more products are no longer available" });
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: `Invalid quantity for ${product.name}` });
    if (product.stock < quantity) return res.status(409).json({ message: `Only ${product.stock} of ${product.name} are available` });
    normalized.push({ product: product._id, vendor: product.vendor._id, name: product.name, image: product.image, price: product.price, quantity });
  }

  const updated = [];
  try {
    for (const item of normalized) {
      const result = await Product.findOneAndUpdate({ _id: item.product, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }, { new: true });
      if (!result) throw Object.assign(new Error(`Stock changed for ${item.name}`), { statusCode: 409 });
      updated.push(item);
    }
    const subtotal = normalized.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = 0;
    const order = await Order.create({ orderNumber: orderNumber(), customer: user._id, items: normalized, shippingAddress: Object.fromEntries(requiredAddress.map(key => [key, String(shippingAddress[key]).trim()])), subtotal, shipping, total: subtotal + shipping, paymentMethod, paymentStatus: paymentMethod === "cod" ? "pending" : "pending" });
    const populated = await Order.findById(order._id).populate("items.vendor", "businessName vendorId").lean();
    res.status(201).json({ message: "Order placed successfully", order: populated });
  } catch (error) {
    for (const item of updated) await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Unable to place order" });
  }
};

exports.getCustomerOrders = async (req, res) => {
  const user = await customer(req);
  if (!user) return res.status(403).json({ message: "Customer access required" });
  const orders = await Order.find({ customer: user._id }).populate("items.vendor", "businessName vendorId").sort({ createdAt: -1 }).lean();
  res.json(orders);
};

exports.getCustomerOrder = async (req, res) => {
  const user = await customer(req);
  if (!user) return res.status(403).json({ message: "Customer access required" });
  const order = await Order.findOne({ _id: req.params.id, customer: user._id }).populate("items.vendor", "businessName vendorId").lean();
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
};

exports.cancelCustomerOrder = async (req, res) => {
  const user = await customer(req);
  if (!user) return res.status(403).json({ message: "Customer access required" });
  const order = await Order.findOne({ _id: req.params.id, customer: user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (!["placed", "confirmed"].includes(order.status)) return res.status(400).json({ message: "This order can no longer be cancelled" });
  order.status = "cancelled";
  await order.save();
  for (const item of order.items) await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  res.json({ message: "Order cancelled", order });
};

exports.getVendorOrders = async (req, res) => {
  const orders = await Order.find({ "items.vendor": req.user.id }).populate("customer", "fullName email phone").sort({ createdAt: -1 }).lean();
  const vendorOrders = orders.map(order => ({ ...order, items: order.items.filter(item => String(item.vendor) === String(req.user.id)) }));
  res.json(vendorOrders);
};

exports.updateVendorOrder = async (req, res) => {
  const allowed = ["confirmed", "packed", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid order status" });
  const order = await Order.findOne({ _id: req.params.id, "items.vendor": req.user.id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status === "cancelled") return res.status(400).json({ message: "Cancelled orders cannot be updated" });
  order.status = req.body.status;
  if (order.status === "delivered" && order.paymentMethod === "cod") order.paymentStatus = "paid";
  await order.save();
  res.json({ message: "Order status updated", order });
};
