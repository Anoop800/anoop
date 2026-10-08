const Category = require("../models/Category");
const Product = require("../models/Product");
const mongoose = require("mongoose");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ parent: 1, name: 1 }).lean();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load categories" });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};

    const searchTerm = search?.trim();
    if (searchTerm) {
      const searchRegex = { $regex: escapeRegex(searchTerm), $options: "i" };
      const matchingCategories = await Category.find({
        $or: [{ name: searchRegex }, { slug: searchRegex }],
      }).distinct("_id");

      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { description: searchRegex },
      ];
      if (matchingCategories.length) query.$or.push({ category: { $in: matchingCategories } });
    }

    if (category?.trim()) {
      const categoryValue = category.trim();
      const categoryQuery = mongoose.isValidObjectId(categoryValue)
        ? { _id: categoryValue }
        : { slug: categoryValue.toLowerCase() };
      const selectedCategory = await Category.findOne(categoryQuery).select("_id parent").lean();

      if (!selectedCategory) return res.json([]);

      const categoryIds = selectedCategory.parent
        ? [selectedCategory._id]
        : await Category.find({ $or: [{ _id: selectedCategory._id }, { parent: selectedCategory._id }] }).distinct("_id");
      query.category = { $in: categoryIds };
    }

    const products = await Product.find(query)
      .populate("category", "name slug")
      .populate("vendor", "businessName ownerName vendorId")
      .sort({ createdAt: -1 })
      .lean();

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load products" });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name slug")
      .populate("vendor", "businessName ownerName vendorId")
      .lean();

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load product" });
  }
};
