const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Vendor = require("../models/Vendor");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const Wishlist = require("../models/Wishlist");

const slugify = (value) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const publicVendor = (vendor) => ({
  id: vendor._id,
  vendorId: vendor.vendorId,
  businessName: vendor.businessName,
  ownerName: vendor.ownerName,
  email: vendor.email,
  phone: vendor.phone,
  businessAddress: vendor.businessAddress,
  role: "vendor",
  status: vendor.status,
});

const nextVendorId = async () => {
  const vendors = await Vendor.find({ vendorId: { $exists: true } }).select("vendorId").lean();
  const highest = vendors.reduce((max, vendor) => {
    const number = Number.parseInt(vendor.vendorId?.replace("VND", ""), 10) || 0;
    return Math.max(max, number);
  }, 0);
  return `VND${String(highest + 1).padStart(3, "0")}`;
};

const signVendor = (vendor) => jwt.sign(
  { id: vendor._id, role: "vendor", vendorId: vendor.vendorId },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

exports.register = async (req, res) => {
  try {
    const { businessName, ownerName, email, phone, businessAddress, password, confirmPassword } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    if (!businessName?.trim() || !ownerName?.trim() || !normalizedEmail || !phone?.trim() || !businessAddress?.trim() || !password) {
      return res.status(400).json({ message: "All vendor fields are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ message: "Enter a valid email address" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });
    if (await Vendor.findOne({ email: normalizedEmail })) return res.status(409).json({ message: "Email already registered" });

    const vendorData = {
      ownerName: ownerName.trim(), businessName: businessName.trim(), email: normalizedEmail,
      phone: phone.trim(), businessAddress: businessAddress.trim(), password: await bcrypt.hash(password, 10),
    };
    let vendor;
    for (let attempt = 0; attempt < 3 && !vendor; attempt += 1) {
      try {
        vendor = await Vendor.create({ ...vendorData, vendorId: await nextVendorId() });
      } catch (error) {
        if (error.code !== 11000 || error.keyPattern?.email) throw error;
      }
    }
    if (!vendor) return res.status(409).json({ message: "Unable to allocate a unique Vendor ID. Please try again." });
    res.status(201).json({ message: "Vendor registration successful", vendor: publicVendor(vendor) });
  } catch (error) {
    console.error(error);
    res.status(error.code === 11000 ? 409 : 500).json({ message: error.code === 11000 ? "Vendor email or ID already exists" : "Server Error" });
  }
};

exports.login = async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.trim().toLowerCase();
    const vendor = normalizedEmail ? await Vendor.findOne({ email: normalizedEmail }).select("+password") : null;
    if (!vendor || !(await bcrypt.compare(req.body.password || "", vendor.password))) return res.status(401).json({ message: "Invalid vendor email or password" });
    if (vendor.status !== "active") return res.status(403).json({ message: "This vendor account is inactive" });
    res.json({ message: "Vendor login successful", token: signVendor(vendor), vendor: publicVendor(vendor) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getProfile = async (req, res) => {
  res.json(publicVendor(req.vendor));
};

exports.updateProfile = async (req, res) => {
  const allowed = ["businessName", "ownerName", "phone", "businessAddress"];
  const updates = Object.fromEntries(allowed.filter((field) => req.body[field] !== undefined).map((field) => [field, String(req.body[field]).trim()]));
  if (!Object.keys(updates).length) return res.status(400).json({ message: "No profile changes supplied" });
  const vendor = await Vendor.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true });
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  res.json({ message: "Profile updated", vendor: publicVendor(vendor) });
};

const validateProduct = async (body) => {
  const required = ["name", "description", "category", "price", "stock", "brand", "image"];
  if (required.some((field) => body[field] === undefined || body[field] === "")) return "All product fields are required";
  if (Number(body.price) < 0 || Number(body.stock) < 0) return "Price and stock cannot be negative";
  if (!(await Category.exists({ _id: body.category }))) return "Selected category does not exist";
  return null;
};

exports.getProducts = async (req, res) => {
  const products = await Product.find({ vendor: req.user.id }).populate("category", "name slug").sort({ createdAt: -1 }).lean();
  res.json(products);
};

exports.createProduct = async (req, res) => {
  try {
    const validationError = await validateProduct(req.body);
    if (validationError) return res.status(400).json({ message: validationError });
    const baseSlug = slugify(req.body.name);
    const slug = `${baseSlug}-${Date.now()}`;
    const product = await Product.create({
      name: req.body.name.trim(), slug, description: req.body.description.trim(), price: Number(req.body.price),
      category: req.body.category, vendor: req.user.id, stock: Number(req.body.stock), image: req.body.image.trim(),
      brand: req.body.brand.trim(), rating: 0, reviewCount: 0,
    });
    res.status(201).json({ message: "Product created", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to create product" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!product) return res.status(404).json({ message: "Product not found or not owned by this vendor" });
    const validationError = await validateProduct(req.body);
    if (validationError) return res.status(400).json({ message: validationError });
    ["name", "description", "brand", "image"].forEach((field) => { product[field] = req.body[field].trim(); });
    product.category = req.body.category;
    product.price = Number(req.body.price);
    product.stock = Number(req.body.stock);
    await product.save();
    res.json({ message: "Product updated", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to update product" });
  }
};

exports.deleteProduct = async (req, res) => {
  const deleted = await Product.findOneAndDelete({ _id: req.params.id, vendor: req.user.id });
  if (!deleted) return res.status(404).json({ message: "Product not found or not owned by this vendor" });
  await Wishlist.updateMany({ products: deleted._id }, { $pull: { products: deleted._id } });
  res.json({ message: "Product deleted" });
};


exports.getDashboard = async (req, res) => {
  const [totalProducts, outOfStock, totalOrders] = await Promise.all([
    Product.countDocuments({ vendor: req.user.id }),
    Product.countDocuments({ vendor: req.user.id, stock: 0 }),
    Order.countDocuments({ "items.vendor": req.user.id }),
  ]);
  res.json({ totalProducts, activeProducts: totalProducts - outOfStock, outOfStockProducts: outOfStock, totalOrders });
};
