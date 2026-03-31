const trainService = require("../services/train.service");
const Station = require("../models/station.model");

class TrainController {

  async createTrain(req, res) {
    try {
      const trainData = req.body;
      const requiredFields = ["train_number", "train_name", "source", "destination", "route"];
      const missingFields = requiredFields.filter(field => !trainData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(", ")}`
        });
      }

      if (!Array.isArray(trainData.route) || trainData.route.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Route must be a non-empty array"
        });
      }

      // 🔥 Station validation
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

      // ✅ Enrich route
      trainData.route = trainData.route.map(r => ({
        ...r,
        station_name: stationMap[r.station_code]
      }));

      const train = await trainService.createTrain(trainData);
      return res.status(201).json({
        success: true,
        message: "Train created successfully",
        data: train
      });

    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists`
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
        return res.status(404).json({ success: false, message: "Train not found" });
      }
      return res.status(200).json({ success: true, data: train });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAllTrains(req, res) {
    try {
      const trains = await trainService.getAllTrains();
      return res.status(200).json({ success: true, count: trains.length, data: trains });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

async searchTrains(req, res) {
  try {
    const { from, to, date } = req.body; // ✅ POST → body
    const { sortBy, sortOn, classType } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        message: "from, to and date are required"
      });
    }

    const trains = await trainService.searchTrains(
      from.toUpperCase(),
      to.toUpperCase(),
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

  async updateTrain(req, res) {
    try {
      const { train_number } = req.params;
      const updatedTrain = await trainService.updateTrain(train_number, req.body);
      if (!updatedTrain) {
        return res.status(404).json({ success: false, message: "Train not found" });
      }
      return res.status(200).json({
        success: true,
        message: "Train updated successfully",
        data: updatedTrain
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteTrain(req, res) {
    try {
      const { train_number } = req.params;
      const deletedTrain = await trainService.deleteTrain(train_number);
      if (!deletedTrain) {
        return res.status(404).json({ success: false, message: "Train not found" });
      }
      return res.status(200).json({ success: true, message: "Train deleted successfully" });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async searchTrainsByFROMandTO(req, res) {
    try {
      let { from, to, sortBy, sortOn } = req.query;
      if (!from || !to) {
        return res.status(400).json({ success: false, message: "from and to are required" });
      }

      from = from.toUpperCase();
      to = to.toUpperCase();

      let trains = await trainService.searchTrainsByFROMandTO(from, to);

      const getMinutes = (time) => {
        if (!time) return null;
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
      };

      if (sortBy) {
        sortOn = sortOn || "early";
        trains.sort((a, b) => {
          let valA, valB;
          if (sortBy === "departure") {
            valA = getMinutes(a.route.find(r => r.station_code === from)?.departure_time);
            valB = getMinutes(b.route.find(r => r.station_code === from)?.departure_time);
          } else if (sortBy === "arrival") {
            valA = getMinutes(a.route.find(r => r.station_code === to)?.arrival_time);
            valB = getMinutes(b.route.find(r => r.station_code === to)?.arrival_time);
          } else {
            return 0;
          }
          if (valA === null) return 1;
          if (valB === null) return -1;
          return sortOn === "late" ? valB - valA : valA - valB;
        });
      }

      return res.status(200).json({ success: true, count: trains.length, data: trains });
    } catch (error) {
      console.error("❌ Error in searchTrainsByFROMandTO:", error.stack || error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new TrainController();
