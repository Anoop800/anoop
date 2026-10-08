const jwt = require("jsonwebtoken");
const Vendor = require("../models/Vendor");

const vendorAuth = async (req, res, next) => {
  try {
    const authorization = req.header("Authorization");
    if (!authorization) return res.status(401).json({ message: "No Token" });

    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "vendor") return res.status(403).json({ message: "Vendor access required" });

    const vendor = await Vendor.findById(decoded.id);
    if (!vendor || vendor.status !== "active") return res.status(401).json({ message: "Invalid vendor account" });
    req.user = { id: vendor._id, role: "vendor", vendorId: vendor.vendorId };
    req.vendor = vendor;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Invalid Token" });
  }
};

module.exports = vendorAuth;
