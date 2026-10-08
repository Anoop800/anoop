require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Vendor = require("./models/Vendor");
const Category = require("./models/Category");
const Product = require("./models/Product");

const slugify = (value) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const catalog = [
  { name: "Electronics", subcategories: ["Headphones", "Earbuds", "Speakers", "Smart Watches", "Cameras", "Televisions"], products: [["QuietComfort 45 Wireless Headphones", 249, "Bose", 18, 0], ["Soundcore Liberty 4 Earbuds", 129, "Anker", 42, 1], ["Marshall Emberton III Speaker", 169, "Marshall", 25, 2], ["Galaxy Watch 7 Bluetooth", 299, "Samsung", 16, 3], ["EOS R50 Mirrorless Camera", 679, "Canon", 9, 4]] },
  { name: "Fashion", subcategories: ["Men's Clothing", "Women's Clothing", "Kids Clothing", "Jeans", "T-Shirts", "Jackets"], products: [["Organic Cotton Oxford Shirt", 45, "Uniqlo", 36, 0], ["Pleated Midi Dress", 79, "Mango", 22, 1], ["Kids Fleece Hoodie", 32, "H&M", 40, 2], ["Slim Stretch Denim Jeans", 58, "Levi's", 31, 3], ["Water-Resistant Utility Jacket", 118, "The North Face", 14, 5]] },
  { name: "Mobile Phones", subcategories: ["Android Phones", "Smartphones", "Mobile Accessories", "Chargers", "Power Banks", "Phone Cases"], products: [["Pixel 9a 128GB", 499, "Google", 12, 0], ["iPhone 16 128GB", 799, "Apple", 8, 1], ["MagSafe Silicone Case", 39, "Apple", 55, 5], ["65W GaN Fast Charger", 45, "Belkin", 28, 3], ["20,000mAh Travel Power Bank", 49, "UGREEN", 37, 4]] },
  { name: "Laptops & Computers", subcategories: ["Laptops", "Desktop Computers", "Monitors", "Keyboards", "Mouse", "Computer Accessories"], products: [["MacBook Air M4 15-inch", 1299, "Apple", 7, 0], ["ThinkPad E16 Gen 2", 899, "Lenovo", 11, 0], ["ProDesk Mini G9", 749, "HP", 10, 1], ["UltraSharp 27 4K Monitor", 429, "Dell", 15, 2], ["MX Keys S Wireless Keyboard", 109, "Logitech", 33, 3]] },
  { name: "Home & Kitchen", subcategories: ["Kitchen Appliances", "Furniture", "Cookware", "Storage", "Home Decor", "Lighting"], products: [["Air Fryer Pro 5.5L", 119, "Philips", 24, 0], ["Oak Lift-Top Coffee Table", 249, "IKEA", 6, 1], ["Stainless Steel Cookware Set", 189, "Cuisinart", 13, 2], ["Bamboo Pantry Storage Set", 54, "Joseph Joseph", 29, 3], ["Linen Pendant Light", 96, "West Elm", 18, 5]] },
  { name: "Beauty & Personal Care", subcategories: ["Skincare", "Hair Care", "Personal Care", "Makeup", "Grooming"], products: [["Hydrating Daily Face Serum", 36, "CeraVe", 48, 0], ["Repairing Argan Hair Oil", 24, "Moroccanoil", 34, 1], ["Sonic Electric Toothbrush", 79, "Oral-B", 20, 2], ["Soft Matte Lip Color Set", 42, "Maybelline", 45, 3], ["Precision Beard Trimmer", 59, "Philips", 27, 4]] },
  { name: "Sports & Fitness", subcategories: ["Fitness Equipment", "Sports Shoes", "Cricket", "Football", "Gym Accessories", "Yoga"], products: [["Adjustable Kettlebell 18kg", 89, "Bowflex", 17, 0], ["Cloudswift Running Shoes", 159, "On", 21, 1], ["English Willow Cricket Bat", 139, "SG", 12, 2], ["FIFA Quality Football", 34, "Adidas", 38, 3], ["Cork Yoga Mat 5mm", 49, "Manduka", 26, 5]] },
  { name: "Books & Stationery", subcategories: ["Academic Books", "Fiction", "Non-Fiction", "Notebooks", "Pens", "School Supplies"], products: [["Calculus: Early Transcendentals", 86, "Cengage", 18, 0], ["The Midnight Library", 18, "Viking", 44, 1], ["Atomic Habits Hardcover", 27, "Avery", 39, 2], ["Hardcover Dotted Journal", 16, "Moleskine", 52, 3], ["Fineliner Colour Pen Set", 14, "Staedtler", 61, 4]] },
  { name: "Grocery", subcategories: ["Snacks", "Beverages", "Packaged Foods", "Breakfast Items", "Household Essentials"], products: [["Sea Salt Kettle Chips", 5, "Kettle Brand", 80, 0], ["Single-Origin Cold Brew Pack", 18, "Stumptown", 32, 1], ["Organic Tomato Pasta Sauce", 7, "Barilla", 65, 2], ["Maple Granola Family Bag", 11, "Nature Valley", 49, 3], ["Plant-Based Laundry Liquid", 15, "Seventh Generation", 28, 4]] },
  { name: "Footwear", subcategories: ["Men's Shoes", "Women's Shoes", "Sports Shoes", "Sandals", "Casual Shoes"], products: [["Bradley Leather Derby Shoes", 129, "Clarks", 16, 0], ["Alameda Block-Heel Pumps", 99, "Aldo", 19, 1], ["Fresh Foam 1080 Running Shoes", 165, "New Balance", 23, 2], ["Cushioned Leather Slide Sandals", 54, "Birkenstock", 34, 3], ["Classic Canvas Low Tops", 65, "Vans", 41, 4]] },
  { name: "Accessories", subcategories: ["Bags", "Wallets", "Watches", "Sunglasses", "Belts"], products: [["Recycled Nylon Daypack", 88, "Herschel", 25, 0], ["Full-Grain Leather Card Wallet", 49, "Bellroy", 37, 1], ["Minimal Steel Field Watch", 149, "Seiko", 14, 2], ["Polarized Aviator Sunglasses", 79, "Ray-Ban", 29, 3], ["Italian Leather Reversible Belt", 59, "Fossil", 33, 4]] },
];

const imageSets = {
  Electronics: ["photo-1505740420928-5e560c06d30e", "photo-1606220945770-b5b6c2c55bf1", "photo-1589003077984-894e133dabab", "photo-1523275335684-37898b6baf30", "photo-1516035069371-29a1b244cc32"],
  Fashion: ["photo-1521572163474-6864f9cf17ab", "photo-1515372039744-b8f02a3ae446", "photo-1556821840-3a63f95609a7", "photo-1542272604-787c3835535d", "photo-1551028719-00167b16eac5"],
  "Mobile Phones": ["photo-1511707171634-5f897ff02aa9", "photo-1511707171634-5f897ff02aa9", "photo-1511707171634-5f897ff02aa9", "photo-1505740420928-5e560c06d30e", "photo-1511707171634-5f897ff02aa9"],
  "Laptops & Computers": ["photo-1517336714731-489689fd1ca8", "photo-1496181133206-80ce9b88a853", "photo-1593642632823-8f785ba67e45", "photo-1527443224154-c4a3942d3acf", "photo-1587829741301-dc798b83add3"],
  "Home & Kitchen": ["photo-1585515320310-259814833e62", "photo-1538688525198-9b88f6f53126", "photo-1556911220-e15b29be8c8f", "photo-1610701596007-11502861dcfa", "photo-1540932239986-30128078f3c5"],
  "Beauty & Personal Care": ["photo-1556229010-6c3f2c9ca5f8", "photo-1522337360788-8b13dee7a37e", "photo-1556228578-8c89e6adf883", "photo-1596462502278-27bfdc403348", "photo-1621607512214-68297480165e"],
  "Sports & Fitness": ["photo-1583454110551-21f2fa2afe61", "photo-1552674605-db6ffd4facb5", "photo-1531415074968-036ba1b575da", "photo-1579952363873-27f3bade9f55", "photo-1544367567-0f2fcb009e0b"],
  "Books & Stationery": ["photo-1543002588-bfa74002ed7e", "photo-1512820790803-83ca734da794", "photo-1517842645767-c639042777db", "photo-1499750310107-5fef28a66643", "photo-1583485088034-697b5bc54ccd"],
  Grocery: ["photo-1511690743698-d9d85f2fbf38", "photo-1495474472287-4d71bcdd2085", "photo-1556760544-74068565f05c", "photo-1511690743698-d9d85f2fbf38", "photo-1511690743698-d9d85f2fbf38"],
  Footwear: ["photo-1449824913935-59a10b8d2000", "photo-1543163521-1bf539c55dd2", "photo-1495555961986-6d4c1ecb7be3", "photo-1543163521-1bf539c55dd2", "photo-1525966222134-fcfa99b8ae77"],
  Accessories: ["photo-1553062407-98eeb64c6a62", "photo-1627123424574-724758594e93", "photo-1523275335684-37898b6baf30", "photo-1511499767150-a48a237f0083", "photo-1624222247344-550fb60583dc"],
};

async function ensureVendors() {
  let vendors = await Vendor.find().sort({ createdAt: 1 }).limit(3);
  if (vendors.length) return vendors;

  const password = await bcrypt.hash("VendorDemo123!", 10);
  vendors = await Vendor.insertMany([
    { ownerName: "Northstar Goods Owner", businessName: "Northstar Goods", businessAddress: "Bengaluru", email: "vendor.northstar@example.com", phone: "9000000001", password, vendorId: "VND001" },
    { ownerName: "Harbor & Co. Owner", businessName: "Harbor & Co.", businessAddress: "Mumbai", email: "vendor.harbor@example.com", phone: "9000000002", password, vendorId: "VND002" },
    { ownerName: "Cedar Market Owner", businessName: "Cedar Market", businessAddress: "Delhi", email: "vendor.cedar@example.com", phone: "9000000003", password, vendorId: "VND003" },
  ]);
  return vendors;
}

async function seedCatalog() {
  await connectDB();
  const vendors = await ensureVendors();
  const categoryIds = new Map();
  let categoryCount = 0;
  let productCount = 0;

  for (const group of catalog) {
    const parent = await Category.findOneAndUpdate(
      { slug: slugify(group.name) },
      { $set: { name: group.name, parent: null } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoryIds.set(group.name, parent._id);
    categoryCount += 1;

    const subcategoryIds = [];
    for (const name of group.subcategories) {
      const subcategory = await Category.findOneAndUpdate(
        { slug: slugify(`${group.name}-${name}`) },
        { $set: { name, parent: parent._id } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      subcategoryIds.push(subcategory._id);
      categoryCount += 1;
    }

    for (const [index, [name, price, brand, stock, subcategoryIndex]] of group.products.entries()) {
      const slug = slugify(name);
      await Product.findOneAndUpdate(
        { slug },
        {
          $set: {
            name,
            description: `${brand} ${name}, selected for dependable everyday use and easy online ordering.`,
            price,
            category: subcategoryIds[subcategoryIndex % subcategoryIds.length],
            vendor: vendors[(productCount + index) % vendors.length]._id,
            stock,
            image: `https://images.unsplash.com/${imageSets[group.name][index % imageSets[group.name].length]}?auto=format&fit=crop&w=900&q=85`,
            brand,
            rating: Number((4.2 + ((productCount % 8) / 10)).toFixed(1)),
            reviewCount: 18 + productCount * 3,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      productCount += 1;
    }
  }

  console.log(`Catalog ready: ${categoryCount} categories and ${productCount} products across ${vendors.length} vendors.`);
  await mongoose.disconnect();
}

seedCatalog().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
