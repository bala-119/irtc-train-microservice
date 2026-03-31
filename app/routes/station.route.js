const express = require("express");
const router = express.Router();

const stationController = require("../controllers/station.controller");

// 🔥 Bulk insert
router.post("/bulk", stationController.createStationsBulk);

// Single insert
router.post("/", stationController.createStation);

// Get all
router.get("/", stationController.getAllStations);

module.exports = router;