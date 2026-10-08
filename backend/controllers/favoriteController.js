const mongoose = require("mongoose");
const Product = require("../models/Product");
const User = require("../models/User");
const Wishlist = require("../models/Wishlist");

const getCustomer = async (req, res) => {
  if (!mongoose.isValidObjectId(req.user?.id)) {
    res.status(401).json({ message: "Customer authentication required" });
    return null;
  }
  const user = await User.findOne({ _id: req.user.id, role: "customer" }).select("_id");
  if (!user) {
    res.status(403).json({ message: "Customer access required" });
    return null;
  }
  return user;
};

exports.getFavorites = async (req, res) => {
  try {
    const user = await getCustomer(req, res);
    if (!user) return;
    const wishlist = await Wishlist.findOne({ user: user._id })
      .populate({ path: "products", populate: [{ path: "category", select: "name slug" }, { path: "vendor", select: "businessName ownerName vendorId" }] })
      .lean();
    res.json(wishlist?.products || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load favorites" });
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const user = await getCustomer(req, res);
    if (!user) return;
    if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product" });
    const product = await Product.exists({ _id: req.params.productId });
    if (!product) return res.status(404).json({ message: "Product not found" });
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: user._id },
      { $addToSet: { products: req.params.productId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ message: "Added to favorites", favorite: true, count: wishlist.products.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to add favorite" });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const user = await getCustomer(req, res);
    if (!user) return;
    if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product" });
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: user._id },
      { $pull: { products: req.params.productId } },
      { new: true }
    );
    res.json({ message: "Removed from favorites", favorite: false, count: wishlist?.products.length || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to remove favorite" });
  }
};

exports.checkFavorite = async (req, res) => {
  try {
    const user = await getCustomer(req, res);
    if (!user) return;
    const wishlist = await Wishlist.exists({ user: user._id, products: req.params.productId });
    res.json({ favorite: Boolean(wishlist) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to check favorite" });
  }
};
