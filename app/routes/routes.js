const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/admin.authentication")

const trainController = require("../controllers/train.controller");
const checkProfileCompleted = require("../middleware/checkProfileCOmpleted")
// router.use(authMiddleware);

router.post("/create-train",checkProfileCompleted, authMiddleware("admin"), trainController.createTrain);

router.get("/",checkProfileCompleted, trainController.getAllTrains);


router.get("/search",checkProfileCompleted, trainController.searchTrains);

router.get("/searchTrainsByFROMandTO", trainController.searchTrainsByFROMandTO);
router.get("/get-train-by-number/:train_number", trainController.getTrainByNumber);


router.put("/update-train/:train_number",checkProfileCompleted,authMiddleware("admin"), trainController.updateTrain);

router.delete("/delete/:train_number",checkProfileCompleted,authMiddleware("admin"), trainController.deleteTrain);

module.exports = router; 