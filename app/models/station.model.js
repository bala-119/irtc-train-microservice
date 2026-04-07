// const mongoose = require("mongoose");

// const stationSchema = new mongoose.Schema({
//   station_code: {
//     type: String,
//     required: true,
//     unique: true,
//     uppercase: true,
//     trim: true,
//     index: true
//   },
//   station_name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   city: {
//     type: String,
//     trim: true
//   },
//   state: {
//     type: String,
//     trim: true
//   }
// }, { timestamps: true });

// module.exports = mongoose.model("Station", stationSchema);
  const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema({
  station_code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  station_name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    default: "India",
    trim: true
  },
  station_type: {
    type: String,
    enum: ["Junction", "Terminal", "Central", "Railway Station", "Halt"],
    default: "Railway Station"
  },
  platforms: {
    type: Number,
    default: 0,
    min: 0
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better search performance
stationSchema.index({ station_code: 1, station_name: 1 });
stationSchema.index({ city: 1, state: 1 });

// Virtual field for full station name with code
stationSchema.virtual('display_name').get(function() {
  return `${this.station_code} - ${this.station_name}`;
});

// Virtual field for location info
stationSchema.virtual('location_info').get(function() {
  return `${this.city}, ${this.state}`;
});

module.exports = mongoose.model("Station", stationSchema);