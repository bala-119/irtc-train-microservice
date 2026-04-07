const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/admin.authentication");
const checkProfileCompleted = require("../middleware/checkProfileCOmpleted");
const trainController = require("../controllers/train.controller");

// Public routes (no authentication required)
router.get("/search", trainController.searchTrains);  // GET with query params
router.post("/search", trainController.searchTrainsPost);  // POST with body --------
router.get("/searchTrainsByFROMandTO", trainController.searchTrainsByFROMandTO);
router.get("/get-train-by-number/:train_number", trainController.getTrainByNumber);
router.get("/", trainController.getAllTrains);

// Protected routes (require authentication)
router.post("/create-train",  authMiddleware("admin"), checkProfileCompleted,trainController.createTrain);
router.put("/update-train/:train_number", checkProfileCompleted, authMiddleware("admin"), trainController.updateTrain);
router.delete("/delete/:train_number", checkProfileCompleted, authMiddleware("admin"), trainController.deleteTrain);

module.exports = router;