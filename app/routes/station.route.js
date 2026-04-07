const express = require("express");
const router = express.Router();
const stationController = require("../controllers/station.controller");
const authMiddleware = require("../middleware/admin.authentication");
const checkProfileCompleted = require("../middleware/checkProfileCOmpleted");

// ==================== PUBLIC ROUTES ====================
// Get all stations
router.get("/", stationController.getAllStations);

// Search stations
router.get("/search", stationController.searchStations);

// Get station by code
router.get("/code/:code", stationController.getStationByCode);

// Get stations by city
router.get("/city/:city", stationController.getStationsByCity);

// Get stations by state
router.get("/state/:state", stationController.getStationsByState);

// ==================== ADMIN ONLY ROUTES ====================
// Create single station
router.post("/", checkProfileCompleted, authMiddleware("admin"), stationController.createStation);

// Bulk create stations
router.post("/bulk", checkProfileCompleted, authMiddleware("admin"), stationController.createStationsBulk);

// Update station
router.put("/:code", checkProfileCompleted, authMiddleware("admin"), stationController.updateStation);

// Delete station (soft delete)
router.delete("/:code", checkProfileCompleted, authMiddleware("admin"), stationController.deleteStation);

module.exports = router;