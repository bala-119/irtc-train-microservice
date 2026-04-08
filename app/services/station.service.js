const Station = require("../models/station.model");

class StationService {

  // ✅ Create single station
  async createStation(data) {
    try {
      // Normalize station code to uppercase
      if (data.station_code) {
        data.station_code = data.station_code.toUpperCase();
      }
      
      const station = new Station(data);
      return await station.save();
    } catch (error) {
      throw error;
    }
  }

  // ✅ Bulk create stations (Smart: Skips duplicates)
  async createStationsBulk(data) {
    try {
      if (!Array.isArray(data)) {
        throw new Error("Data must be an array of stations");
      }

      const codes = data.map(s => s.station_code?.toUpperCase()).filter(Boolean);
      
      // Find which of these already exist
      const existingStations = await Station.find({ 
        station_code: { $in: codes } 
      }, 'station_code');
      
      const existingCodes = new Set(existingStations.map(s => s.station_code));
      
      // Filter out existing ones
      const newStationsData = data
        .map(s => ({ ...s, station_code: s.station_code?.toUpperCase() }))
        .filter(s => s.station_code && !existingCodes.has(s.station_code));

      if (newStationsData.length === 0) {
        return []; // Nothing new to add
      }

      // Insert only the unique new stations
      return await Station.insertMany(newStationsData, { ordered: false });
      
    } catch (error) {
      throw error;
    }
  }

  // ✅ Get all stations
  async getAllStations() {
    try {
      return await Station.find({ is_active: true })
        .sort({ station_code: 1 })
        .select('-__v');
    } catch (error) {
      throw error;
    }
  }

  // ✅ Get station by code
  async getStationByCode(code) {
    try {
      return await Station.findOne({ 
        station_code: code.toUpperCase(),
        is_active: true 
      }).select('-__v');
    } catch (error) {
      throw error;
    }
  }

  // ✅ Get stations by city
  async getStationsByCity(city) {
    try {
      return await Station.find({ 
        city: { $regex: new RegExp(city, 'i') },
        is_active: true 
      }).sort({ station_name: 1 });
    } catch (error) {
      throw error;
    }
  }

  // ✅ Get stations by state
  async getStationsByState(state) {
    try {
      return await Station.find({ 
        state: { $regex: new RegExp(state, 'i') },
        is_active: true 
      }).sort({ city: 1, station_name: 1 });
    } catch (error) {
      throw error;
    }
  }

  // ✅ Update station
  async updateStation(code, updateData) {
    try {
      if (updateData.station_code) {
        updateData.station_code = updateData.station_code.toUpperCase();
      }
      
      return await Station.findOneAndUpdate(
        { station_code: code.toUpperCase() },
        updateData,
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // ✅ Delete station (soft delete)
  async deleteStation(code) {
    try {
      return await Station.findOneAndUpdate(
        { station_code: code.toUpperCase() },
        { is_active: false },
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // ✅ Hard delete station (permanent)
  async hardDeleteStation(code) {
    try {
      return await Station.findOneAndDelete({
        station_code: code.toUpperCase()
      });
    } catch (error) {
      throw error;
    }
  }

  // ✅ Search stations
  async searchStations(query) {
    try {
      return await Station.find({
        $or: [
          { station_code: { $regex: new RegExp(query, 'i') } },
          { station_name: { $regex: new RegExp(query, 'i') } },
          { city: { $regex: new RegExp(query, 'i') } }
        ],
        is_active: true
      }).limit(20);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new StationService();