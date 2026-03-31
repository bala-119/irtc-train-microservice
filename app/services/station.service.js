const Station = require("../models/station.model");

class StationService {

  // ✅ Create single station
  async createStation(data) {
    try {
      if (data.station_code) {
        data.station_code = data.station_code.toUpperCase();
      }
      return await Station.create(data);
    } catch (error) {
      throw error;
    }
  }

  // ✅ Bulk insert
  async createStationsBulk(data) {
    try {
      // Normalize codes
      data = data.map(station => ({
        ...station,
        station_code: station.station_code?.toUpperCase()
      }));
      return await Station.insertMany(data, { ordered: false });
    } catch (error) {
      throw error;
    }
  }

  // ✅ Get all stations
  async getAllStations() {
    try {
      return await Station.find().sort({ station_code: 1 });
    } catch (error) {
      throw error;
    }
  }

  // ✅ Get by code
  async getStationByCode(code) {
    try {
      return await Station.findOne({ station_code: code.toUpperCase() });
    } catch (error) {
      throw error;
    }
  }

  // ✅ Delete
  async deleteStation(code) {
    try {
      return await Station.findOneAndDelete({
        station_code: code.toUpperCase()
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new StationService();
