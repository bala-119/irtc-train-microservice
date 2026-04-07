const trainService = require("../services/train.service");
const Station = require("../models/station.model");

class TrainController {

  async createTrain(req, res) {
    try {
      const trainData = req.body;
      console.log("this is create train controller")
      
      // Required fields validation
      const requiredFields = ["train_number", "train_name", "route", "coaches", "class_pricing"];
      const missingFields = requiredFields.filter(field => !trainData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(", ")}`
        });
      }

      if (!Array.isArray(trainData.route) || trainData.route.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Route must be a non-empty array with at least 2 stations"
        });
      }

      // 🔥 Station validation - get station names from codes
      const stationCodes = trainData.route.map(r => r.station_code);
      const stations = await Station.find({ station_code: { $in: stationCodes } });

      const stationMap = {};
      stations.forEach(s => { stationMap[s.station_code] = s.station_name; });

      const missingStations = stationCodes.filter(code => !stationMap[code]);
      if (missingStations.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid station codes: ${missingStations.join(", ")}`
        });
      }

      // ✅ Enrich route with station names
      trainData.route = trainData.route.map((r, index) => ({
        ...r,
        station_name: stationMap[r.station_code],
        stop_order: index
      }));

      // Set source and destination from first and last stations
      trainData.source = trainData.route[0].station_code;
      trainData.destination = trainData.route[trainData.route.length - 1].station_code;

      const train = await trainService.createTrain(trainData);
      
      return res.status(201).json({
        success: true,
        message: "Train created successfully",
        data: train
      });

    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Train number already exists"
        });
      }
      return res.status(400).json({
        success: false,
        message: error.message || "Something went wrong"
      });
    }
  }

  async getTrainByNumber(req, res) {
    try {
      const { train_number } = req.params;
      const train = await trainService.getTrainByNumber(train_number);
      
      if (!train) {
        return res.status(404).json({ 
          success: false, 
          message: "Train not found" 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        data: train 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  async getAllTrains(req, res) {
    try {
      const trains = await trainService.getAllTrains();
      return res.status(200).json({ 
        success: true, 
        count: trains.length, 
        data: trains 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  // ✅ GET search - using query parameters (RESTful)
  async searchTrains(req, res) {
    try {
      const { from, to, date, sortBy, sortOn, classType } = req.query;

      if (!from || !to ) {
        return res.status(400).json({
          success: false,
          message: "from, to and date are required as query parameters"
        });
      }

      const trains = await trainService.searchTrains(
        from,
        to,
        date,
        sortBy,
        sortOn,
        classType
      );

      return res.status(200).json({
        success: true,
        count: trains.length,
        data: trains
      });

    } catch (error) {
      console.error("❌ Train Controller ERROR:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ Alternative search using POST with body
  async searchTrainsPost(req, res) {
    try {
      const { from, to} = req.body;
      const { sortBy, sortOn, classType } = req.query;

      if (!from || !to ) {
        return res.status(400).json({
          success: false,
          message: "from, to and date are required"
        });
      }

      const trains = await trainService.searchTrains(
        from,
        to,
        sortBy,
        sortOn,
        classType
      );

      return res.status(200).json({
        success: true,
        count: trains.length,
        data: trains
      });

    } catch (error) {
      console.error("❌ Train Controller ERROR:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateTrain(req, res) {
    try {
      const { train_number } = req.params;
      
      // If route is being updated, validate stations
      if (req.body.route) {
        const stationCodes = req.body.route.map(r => r.station_code);
        const stations = await Station.find({ station_code: { $in: stationCodes } });
        
        const stationMap = {};
        stations.forEach(s => { stationMap[s.station_code] = s.station_name; });
        
        const missingStations = stationCodes.filter(code => !stationMap[code]);
        if (missingStations.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid station codes: ${missingStations.join(", ")}`
          });
        }
        
        // Enrich route with station names
        req.body.route = req.body.route.map((r, index) => ({
          ...r,
          station_name: stationMap[r.station_code],
          stop_order: index
        }));
      }
      
      const updatedTrain = await trainService.updateTrain(train_number, req.body);
      
      if (!updatedTrain) {
        return res.status(404).json({ 
          success: false, 
          message: "Train not found" 
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Train updated successfully",
        data: updatedTrain
      });
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  async deleteTrain(req, res) {
    try {
      const { train_number } = req.params;
      const deletedTrain = await trainService.deleteTrain(train_number);
      
      if (!deletedTrain) {
        return res.status(404).json({ 
          success: false, 
          message: "Train not found" 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: "Train deleted successfully" 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  async searchTrainsByFROMandTO(req, res) {
    try {
      let { from, to, sortBy, sortOn } = req.query;
      
      if (!from || !to) {
        return res.status(400).json({ 
          success: false, 
          message: "from and to are required" 
        });
      }

      const trains = await trainService.searchTrainsByFROMandTO(from, to, sortBy, sortOn);

      return res.status(200).json({ 
        success: true, 
        count: trains.length, 
        data: trains 
      });
    } catch (error) {
      console.error("❌ Error in searchTrainsByFROMandTO:", error);
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
}

module.exports = new TrainController();