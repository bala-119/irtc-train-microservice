// const mongoose = require("mongoose");

// const routeSchema = new mongoose.Schema({
//   station_code: { type: String, required: true, uppercase: true },
//   station_name: { type: String },
//   stop_order: { type: Number, required: true },

//   arrival_time: {
//     type: String,
//     validate: {
//       validator: function (v) {
//         return v === null || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
//       },
//       message: "Invalid arrival time format (HH:MM)"
//     }
//   },

//   departure_time: {
//     type: String,
//     validate: {
//       validator: function (v) {
//         return v === null || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
//       },
//       message: "Invalid departure time format (HH:MM)"
//     }
//   }
// }, { _id: false });


// const coachSchema = new mongoose.Schema({
//   coach_id: { type: String, required: true },
//   coach_type: {
//     type: String,
//     enum: ["SL", "2S", "3AC", "2AC", "1AC", "CC"],
//     required: true
//   },
//   total_seats: { type: Number, required: true }
// }, { _id: false });


// const trainSchema = new mongoose.Schema({
//   train_number: {
//     type: String,
//     required: true,
//     unique: true,
//     index: true
//   },

//   train_name: { type: String, required: true },

//   source: { type: String, required: true, uppercase: true, index: true },
//   destination: { type: String, required: true, uppercase: true, index: true },

//   // 🔥 Ordered Route
//   route: {
//     type: [routeSchema],
//     validate: {
//       validator: function (routes) {
//         return routes.every((r, i) => r.stop_order === i);
//       },
//       message: "stop_order must be sequential starting from 0"
//     }
//   },

//   // 🔥 FAST LOOKUP MAP
//   station_map: {
//     type: Map,
//     of: Number
//   },

//   // 🚆 Coaches
//   coaches: [coachSchema]

// }, {
//   timestamps: true
// });

// module.exports = mongoose.model("Train", trainSchema);

const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
  station_code: { type: String, required: true, uppercase: true },
  station_name: { type: String },
  stop_order: { type: Number, required: true },

  arrival_time: {
    type: String,
    validate: {
      validator: function (v) {
        return v === null || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: "Invalid arrival time format (HH:MM)"
    }
  },

  departure_time: {
    type: String,
    validate: {
      validator: function (v) {
        return v === null || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: "Invalid departure time format (HH:MM)"
    }
  }
}, { _id: false });


const coachSchema = new mongoose.Schema({
  coach_id: { type: String, required: true },

  coach_type: {
    type: String,
    enum: ["SL", "2S", "3AC", "2AC", "1AC", "CC"],
    required: true
  },

  total_seats: { type: Number, required: true }

}, { _id: false });


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

  //  Ordered Route
  route: {
    type: [routeSchema],
    validate: {
      validator: function (routes) {
        return routes.every((r, i) => r.stop_order === i);
      },
      message: "stop_order must be sequential starting from 0"
    }
  },

  //  FAST LOOKUP MAP
  station_map: {
    type: Map,
    of: Number
  },

  //  Coaches
  coaches: [coachSchema],

  // NEW: Pricing per class
  // Dynamic Pricing per class
class_pricing: {
  type: Map,
  of: Number,
  required: true,
  validate: {
    validator: function (pricing) {

      // No coaches
      if (!this.coaches || this.coaches.length === 0) return false;

      const coachTypes = this.coaches.map(c => c.coach_type);

      //  Ensure pricing exists for each coach type
      return coachTypes.every(type => pricing.has(type));
    },
    message: "Pricing must exist for all coach types"
  }
}

}, {
  timestamps: true
});

module.exports = mongoose.model("Train", trainSchema);