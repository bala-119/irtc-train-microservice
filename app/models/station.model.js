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
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Station", stationSchema);
  