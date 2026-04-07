const stationService = require("../services/station.service");

class StationController {

  // ✅ Create single station
  async createStation(req, res) {
    try {
      // Validate required fields
      if (!req.body.station_code || !req.body.station_name) {
        return res.status(400).json({
          success: false,
          message: "station_code and station_name are required"
        });
      }
      
      const station = await stationService.createStation(req.body);
      
      return res.status(201).json({
        success: true,
        message: "Station created successfully",
        data: station
      });
      
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Station code already exists"
        });
      }
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ Bulk create stations
  async createStationsBulk(req, res) {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({
          success: false,
          message: "Request body must be an array of stations"
        });
      }
      
      if (req.body.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot insert empty array"
        });
      }
      
      const stations = await stationService.createStationsBulk(req.body);
      
      return res.status(201).json({
        success: true,
        message: `${stations.length} stations created successfully`,
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

  // ✅ Get all stations
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

  // ✅ Get station by code
  async getStationByCode(req, res) {
    try {
      const { code } = req.params;
      const station = await stationService.getStationByCode(code);
      
      if (!station) {
        return res.status(404).json({
          success: false,
          message: "Station not found"
        });
      }
      
      return res.status(200).json({
        success: true,
        data: station
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ Get stations by city
  async getStationsByCity(req, res) {
    try {
      const { city } = req.params;
      const stations = await stationService.getStationsByCity(city);
      
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

  // ✅ Get stations by state
  async getStationsByState(req, res) {
    try {
      const { state } = req.params;
      const stations = await stationService.getStationsByState(state);
      
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

  // ✅ Update station
  async updateStation(req, res) {
    try {
      const { code } = req.params;
      const station = await stationService.updateStation(code, req.body);
      
      if (!station) {
        return res.status(404).json({
          success: false,
          message: "Station not found"
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Station updated successfully",
        data: station
      });
      
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ Delete station (soft delete)
  async deleteStation(req, res) {
    try {
      const { code } = req.params;
      const station = await stationService.deleteStation(code);
      
      if (!station) {
        return res.status(404).json({
          success: false,
          message: "Station not found"
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Station deleted successfully"
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ Search stations
  async searchStations(req, res) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Search query is required"
        });
      }
      
      const stations = await stationService.searchStations(q);
      
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