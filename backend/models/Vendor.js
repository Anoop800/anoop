const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true, unique: true, trim: true },
    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    businessAddress: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", VendorSchema);
