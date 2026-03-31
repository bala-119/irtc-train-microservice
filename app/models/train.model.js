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
    required: true
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
  coach_id: { type: String, required: true },
  coach_type: {
    type: String,
    enum: ["SL", "2S", "3AC", "2AC", "1AC", "CC"],
    required: true
  },
  total_seats: { type: Number, required: true }
}, { _id: false });

// 🚆 Train Schema
const trainSchema = new mongoose.Schema({
  train_number: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  train_name: { type: String, required: true },
  source: { type: String, required: true, uppercase: true, index: true },
  destination: { type: String, required: true, uppercase: true, index: true },
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
  station_map: { type: Map, of: Number },
  coaches: { type: [coachSchema], required: true },
  class_pricing: {
    type: Map,
    of: Number,
    required: true,
    validate: {
      validator: function (pricing) {
        if (!this.coaches || this.coaches.length === 0) return false;
        const coachTypes = this.coaches.map(c => c.coach_type);
        return coachTypes.every(type => pricing.has(type));
      },
      message: "Pricing must exist for all coach types"
    }
  }
}, { timestamps: true });

// ⚡ AUTO BUILD station_map BEFORE SAVE
trainSchema.pre("save", function () {
  const map = {};
  this.route.forEach((station, index) => {
    map[station.station_code] = index;
  });
  this.station_map = map;
});

// 🔹 Ensure no duplicate station codes
trainSchema.pre("validate", function () {
  const seen = new Set();
  this.route.forEach(station => {
    if (seen.has(station.station_code)) {
      throw new Error(`Duplicate station_code found: ${station.station_code}`);
    }
    seen.add(station.station_code);
  });
});

module.exports = mongoose.model("Train", trainSchema);
