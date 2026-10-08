const express = require("express");
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/favoriteController");

const router = express.Router();

router.use(auth);
router.get("/", controller.getFavorites);
router.post("/:productId", controller.addFavorite);
router.delete("/:productId", controller.removeFavorite);
router.get("/check/:productId", controller.checkFavorite);

module.exports = router;
