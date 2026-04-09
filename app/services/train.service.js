const Train = require("../models/train.model");
const Station = require("../models/station.model");

// 🔥 Utility
const getMinutes = (time) => {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

class TrainService {

  // ✅ CREATE TRAIN
// Add this temporary debug code in your train.service.js createTrain method
async createTrain(trainData) {
  try {
    console.log("1. Received train data:", JSON.stringify(trainData, null, 2));
    
    // Auto-set stop_order
    trainData.route = trainData.route.map((station, index) => ({
      ...station,
      stop_order: index
    }));
    
    console.log("2. After adding stop_order:", JSON.stringify(trainData.route, null, 2));
    
    // Create train instance
    const train = new Train(trainData);
    
    console.log("3. Train instance created");
    
    // Save to database
    const savedTrain = await train.save();
    
    console.log("4. Train saved successfully");
    return savedTrain;
    
  } catch (error) {
    console.error("Error details:");
    console.error("Name:", error.name);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    throw error;
  }
}

  // ✅ GET TRAIN
  async getTrainByNumber(train_number) {
    try {
      return await Train.findOne({ train_number: train_number.toUpperCase() });
    } catch (error) {
      console.error("Error getting train:", error);
      throw error;
    }
  }

  // ✅ GET ALL
  async getAllTrains() {
    try {
      return await Train.find().sort({ train_number: 1 });
    } catch (error) {
      console.error("Error getting all trains:", error);
      throw error;
    }
  }

  // ✅ Convert station name to code
  async getStationCode(stationName) {
    try {
      const station = await Station.findOne({ 
        $or: [
          { station_code: stationName.toUpperCase() },
          { station_name: { $regex: new RegExp(`^${stationName}$`, 'i') } }
        ]
      });
      return station ? station.station_code : null;
    } catch (error) {
      console.error("Error getting station code:", error);
      throw error;
    }
  }

  // ✅ BASIC SEARCH (by station names or codes)
  async searchTrainsByFROMandTO(from, to, sortBy, sortOn = "early") {
    try {
      // Convert station names to codes
      const fromCode = await this.getStationCode(from);
      const toCode = await this.getStationCode(to);
      
      if (!fromCode) {
        throw new Error(`Station "${from}" not found`);
      }
      if (!toCode) {
        throw new Error(`Station "${to}" not found`);
      }
      
      console.log(`Searching trains from ${fromCode} to ${toCode}`);
      
      // Find trains that have both stations
      let trains = await Train.find({
        [`station_map.${fromCode}`]: { $exists: true },
        [`station_map.${toCode}`]: { $exists: true }
      });
      
      // Filter by direction (from should come before to)
      const validTrains = trains.filter(train => {
        const fromIndex = train.station_map.get ? 
          train.station_map.get(fromCode) : train.station_map[fromCode];
        const toIndex = train.station_map.get ? 
          train.station_map.get(toCode) : train.station_map[toCode];
        
        return fromIndex !== undefined && toIndex !== undefined && fromIndex < toIndex;
      });
      
      console.log(`Found ${validTrains.length} valid trains`);
      
      // Build response
      let result = validTrains.map(train => {
        const routeData = train.route;
        const fromData = routeData.find(r => r.station_code === fromCode);
        const toData = routeData.find(r => r.station_code === toCode);
        
        const depTime = fromData?.departure_time;
        const arrTime = toData?.arrival_time;
        
        let duration = null;
        if (depTime && arrTime) {
          const depMinutes = getMinutes(depTime);
          const arrMinutes = getMinutes(arrTime);
          if (depMinutes !== null && arrMinutes !== null) {
            duration = arrMinutes >= depMinutes ? 
              arrMinutes - depMinutes : 
              (1440 - depMinutes + arrMinutes);
          }
        }
        
        return {
          train_id: train._id,
          train_number: train.train_number,
          train_name: train.train_name,
          from_code: fromCode,
          to_code: toCode,
          from_name: fromData?.station_name,
          to_name: toData?.station_name,
          departure_time: depTime,
          arrival_time: arrTime,
          duration: duration,
          duration_hours: duration ? Math.floor(duration / 60) : null,
          duration_minutes: duration ? duration % 60 : null,
          classes: train.coaches.map(c => c.coach_type),
          class_pricing: Object.fromEntries(train.class_pricing || new Map()),
          stop_gaps: (toData?.stop_order ?? 0) - (fromData?.stop_order ?? 0),
          total_stops: train.route.length - 1
        };
      });
      
      // Sorting
      if (sortBy) {
        result.sort((a, b) => {
          let valA, valB;
          
          if (sortBy === "duration") {
            valA = a.duration;
            valB = b.duration;
          } else if (sortBy === "departure") {
            valA = getMinutes(a.departure_time);
            valB = getMinutes(b.departure_time);
          } else if (sortBy === "arrival") {
            valA = getMinutes(a.arrival_time);
            valB = getMinutes(b.arrival_time);
          } else {
            return 0;
          }
          
          if (valA === null) return 1;
          if (valB === null) return -1;
          
          return sortOn === "late" ? valB - valA : valA - valB;
        });
      }
      
      return result;
      
    } catch (error) {
      console.error("Error in searchTrainsByFROMandTO:", error);
      throw error;
    }
  }
  
  // 🚀 ADVANCED SEARCH with date
  async searchTrains(from, to, sortBy, sortOn = "early", classType) {
    try {
      // Validate date format
      // if (!date || isNaN(new Date(date))) {
      //   throw new Error("Invalid date format. Use YYYY-MM-DD");
      // }
      
      // First get basic search results
      let trains = await this.searchTrainsByFROMandTO(from, to, sortBy, sortOn);
      
      // Filter by class type if specified
      if (classType && trains.length > 0) {
        classType = classType.toUpperCase();
        trains = trains.filter(train => 
          train.classes.includes(classType)
        );
      }
      
      // Add date information (Availability is handled by Booking Service)
      trains = trains.map(train => ({
        ...train,
        status: "AVAILABLE",
        availability: {} // Empty, as Booking Service manages real-time counts
      }));
      
      return trains;
      
    } catch (error) {
      console.error("Error in searchTrains:", error);
      throw error;
    }
  }
  
  // ✅ UPDATE TRAIN
  async updateTrain(train_number, updateData) {
    try {
      // If route is being updated, rebuild station_map
      if (updateData.route) {
        // Auto-set stop_order
        updateData.route = updateData.route.map((station, index) => ({
          ...station,
          stop_order: index
        }));
        
        const station_map = new Map();
        updateData.route.forEach((station, index) => {
          station_map.set(station.station_code, index);
        });
        updateData.station_map = station_map;
        
        // Update source and destination
        updateData.source = updateData.route[0].station_code;
        updateData.destination = updateData.route[updateData.route.length - 1].station_code;
      }
      
      return await Train.findOneAndUpdate(
        { train_number: train_number.toUpperCase() },
        updateData,
        { new: true, runValidators: true }
      );
    } catch (error) {
      console.error("Error updating train:", error);
      throw error;
    }
  }
  
  // ✅ DELETE TRAIN
  async deleteTrain(train_number) {
    try {
      return await Train.findOneAndDelete({ 
        train_number: train_number.toUpperCase() 
      });
    } catch (error) {
      console.error("Error deleting train:", error);
      throw error;
    }
  }
}

module.exports = new TrainService();