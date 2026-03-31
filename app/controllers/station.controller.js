const stationService = require("../services/station.service");

class StationController {

  // ✅ Create one
  async createStation(req, res) {
    try {
      const station = await stationService.createStation(req.body);
      return res.status(201).json({
        success: true,
        message: "Station created",
        data: station
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Station already exists"
        });
      }
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // 🔥 Bulk insert
  async createStationsBulk(req, res) {
    try {
      const stations = await stationService.createStationsBulk(req.body);
      return res.status(201).json({
        success: true,
        count: stations.length,
        data: stations
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ Get all
  async getAllStations(req, res) {
    try {
      const stations = await stationService.getAllStations();
      return res.status(200).json({
        success: true,
        count: stations.length,
        data: stations
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new StationController();
