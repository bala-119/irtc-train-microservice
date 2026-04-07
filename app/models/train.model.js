const mongoose = require("mongoose");

// 🚏 Route Schema
const routeSchema = new mongoose.Schema({
  station_code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  station_name: {
    type: String,
    required: true,
    trim: true
  },
  stop_order: {
    type: Number,
    required: true,
    min: 0
  },
  arrival_time: {
    type: String,
    default: null,
    validate: {
      validator: v => v === null || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v),
      message: "Invalid arrival time format (HH:MM)"
    }
  },
  departure_time: {
    type: String,
    default: null,
    validate: {
      validator: v => v === null || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v),
      message: "Invalid departure time format (HH:MM)"
    }
  }
}, { _id: false });

// 🚃 Coach Schema
const coachSchema = new mongoose.Schema({
  coach_id: { 
    type: String, 
    required: true 
  },
  coach_type: {
    type: String,
    enum: ["SL", "2S", "3AC", "2AC", "1AC", "CC"],
    required: true
  },
  total_seats: { 
    type: Number, 
    required: true,
    min: 1
  }
}, { _id: false });

// 🚆 Train Schema
const trainSchema = new mongoose.Schema({
  train_number: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true,
    trim: true
  },
  train_name: { 
    type: String, 
    required: true,
    trim: true
  },
  source: { 
    type: String, 
    required: true, 
    uppercase: true, 
    trim: true, 
    index: true 
  },
  destination: { 
    type: String, 
    required: true, 
    uppercase: true, 
    trim: true, 
    index: true 
  },
  route: {
    type: [routeSchema],
    required: true,
    validate: {
      validator: function (routes) {
        // Ensure stop_order is sequential starting at 0
        return routes.every((r, i) => r.stop_order === i);
      },
      message: "stop_order must be sequential starting at 0"
    }
  },
  station_map: { 
    type: Map, 
    of: Number,
    default: new Map()
  },
  coaches: { 
    type: [coachSchema], 
    required: true,
    validate: {
      validator: function(coaches) {
        return coaches && coaches.length > 0;
      },
      message: "At least one coach is required"
    }
  },
  class_pricing: {
    type: Map,
    of: Number,
    required: true,
    validate: {
      validator: function (pricing) {
        if (!this.coaches || this.coaches.length === 0) return false;
        const coachTypes = this.coaches.map(c => c.coach_type);
        return coachTypes.every(type => pricing && pricing.has(type));
      },
      message: "Pricing must exist for all coach types"
    }
  }
}, { timestamps: true });

// ⚡ AUTO BUILD station_map BEFORE SAVE - FIXED (synchronous version)
trainSchema.pre("save", function() {
  try {
    console.log("Building station_map...");
    const map = new Map();
    this.route.forEach((station, index) => {
      map.set(station.station_code, index);
    });
    this.station_map = map;
    console.log("station_map built successfully");
  } catch (error) {
    console.error("Error in pre-save middleware:", error);
    throw error;
  }
});

// 🔹 Ensure no duplicate station codes and validate times - FIXED (synchronous version)
trainSchema.pre("validate", function() {
  try {
    console.log("Validating train data...");
    const seen = new Set();
    
    this.route.forEach((station, index) => {
      // Check for duplicate station codes
      if (seen.has(station.station_code)) {
        throw new Error(`Duplicate station_code found: ${station.station_code}`);
      }
      seen.add(station.station_code);
      
      // Validate arrival and departure times for source and destination
      if (index === 0) {
        // First station (source) should have departure time but no arrival
        if (station.arrival_time !== null && station.arrival_time !== undefined) {
          throw new Error("Source station should not have arrival time");
        }
        if (!station.departure_time) {
          throw new Error("Source station must have departure time");
        }
      } else if (index === this.route.length - 1) {
        // Last station (destination) should have arrival time but no departure
        if (station.departure_time !== null && station.departure_time !== undefined) {
          throw new Error("Destination station should not have departure time");
        }
        if (!station.arrival_time) {
          throw new Error("Destination station must have arrival time");
        }
      } else {
        // Intermediate stations should have both arrival and departure
        if (!station.arrival_time || !station.departure_time) {
          throw new Error(`Intermediate station ${station.station_code} must have both arrival and departure times`);
        }
      }
      
      // Validate arrival is not after departure
      if (station.arrival_time && station.departure_time) {
        const arrivalMinutes = parseInt(station.arrival_time.split(':')[0]) * 60 + 
                              parseInt(station.arrival_time.split(':')[1]);
        const departureMinutes = parseInt(station.departure_time.split(':')[0]) * 60 + 
                                 parseInt(station.departure_time.split(':')[1]);
        
        if (arrivalMinutes > departureMinutes) {
          throw new Error(`Arrival cannot be after departure at ${station.station_code}`);
        }
      }
    });
    
    console.log("Validation passed successfully");
  } catch (error) {
    console.error("Validation error:", error.message);
    throw error;
  }
});

module.exports = mongoose.model("Train", trainSchema);