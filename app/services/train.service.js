const Train = require("../models/train.model");
const axios = require("axios");

// 🔥 Utility
const getMinutes = (time) => {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

class TrainService {

  // ✅ CREATE TRAIN
  async createTrain(trainData) {
    try {
      const station_map = {};

      trainData.route.forEach((station) => {
        if (!station.station_code || station.stop_order === undefined) {
          throw new Error("Each route must have station_code and stop_order");
        }

        if (station_map[station.station_code] !== undefined) {
          throw new Error(`Duplicate station_code: ${station.station_code}`);
        }

        const arrival = getMinutes(station.arrival_time);
        const departure = getMinutes(station.departure_time);

        if (arrival !== null && departure !== null && arrival > departure) {
          throw new Error(
            `Arrival cannot be after departure at ${station.station_code}`
          );
        }

        station_map[station.station_code] = station.stop_order;
      });

      trainData.station_map = station_map;
      const train = await Train.create(trainData);
      return train;

    } catch (error) {
      console.error("❌ Error in TrainService.createTrain:", error.message);
      throw error;
    }
  }

  // ✅ GET TRAIN
  async getTrainByNumber(train_number) {
    return await Train.findOne({ train_number: train_number.toUpperCase() });
  }

  // ✅ GET ALL
  async getAllTrains() {
    return await Train.find();
  }

  // ✅ BASIC SEARCH (USED BY SCHEDULE SERVICE)
  async searchTrainsByFROMandTO(from, to) {
    try {
      from = from.toUpperCase();
      to = to.toUpperCase();

      const trains = await Train.find({
        [`station_map.${from}`]: { $exists: true },
        [`station_map.${to}`]: { $exists: true }
      });

      const validTrains = trains.filter(train => {
        const fromIndex = train.station_map[from];
        const toIndex = train.station_map[to];
        return fromIndex < toIndex;
      });

      return validTrains;

    } catch (error) {
      throw error;
    }
  }

  // 🚀 ADVANCED SEARCH
  // async searchTrains(from, to, date, sortBy, sortOn = "early", classType) {
  //   try {
  //     from = from.toUpperCase();
  //     to = to.toUpperCase();

  //     // Step 1: Find trains containing both stations
  //     const trains = await Train.find({
  //       [`station_map.${from}`]: { $exists: true },
  //       [`station_map.${to}`]: { $exists: true }
  //     });

  //     // Step 2: Filter correct direction
  //     let validTrains = trains.filter(train => {
  //       const fromIndex = train.station_map[from];
  //       const toIndex = train.station_map[to];
  //       return fromIndex < toIndex;
  //     });

  //     if (!validTrains.length) return [];

  //     // Step 3: Filter by classType
  //     if (classType) {
  //       classType = classType.toUpperCase();
  //       validTrains = validTrains.filter(train =>
  //         train.coaches.some(c => c.coach_type === classType)
  //       );
  //     }

  //     if (!validTrains.length) return [];

  //     // Step 4: Call Schedule Microservice
  //     const scheduleRes = await axios.get(
  //       "http://localhost:3004/v1/booking/schedule/search-trains",
  //       { params: { from, to, date } }
  //     );

  //     let result = scheduleRes.data?.data || [];

  //     // Step 5: Filter schedules using valid trains
  //     const validTrainNumbers = new Set(validTrains.map(t => t.train_number));
  //     result = result.filter(schedule =>
  //       validTrainNumbers.has(schedule.train_number)
  //     );

  //     // Step 6: Merge Train Data
  //     const trainMap = new Map();
  //     validTrains.forEach(t => trainMap.set(t.train_number, t));

  //     result = result.map(schedule => {
  //       const train = trainMap.get(schedule.train_number);
  //       return {
  //         ...schedule,
  //         class_pricing: train?.class_pricing || {}
  //       };
  //     });

  //     // Step 7: Calculate Duration
  //     result = result.map(r => {
  //       const dep = getMinutes(r.departure_time);
  //       const arr = getMinutes(r.arrival_time);
  //       let duration = null;
  //       if (dep !== null && arr !== null) {
  //         duration = arr >= dep ? arr - dep : (24 * 60 - dep + arr);
  //       }
  //       return { ...r, duration };
  //     });

  //     // Step 8: Add Availability (placeholder)
  //     result = result.map(r => ({
  //       ...r,
  //       availability: {
  //         SL: "AVAILABLE",
  //         "3AC": "WL 5"
  //       }
  //     }));

  //     // Step 9: Sorting
  //     if (sortBy) {
  //       result.sort((a, b) => {
  //         let valA, valB;
  //         if (sortBy === "duration") {
  //           valA = a.duration;
  //           valB = b.duration;
  //         } else if (sortBy === "departure") {
  //           valA = getMinutes(a.departure_time);
  //           valB = getMinutes(b.departure_time);
  //         } else if (sortBy === "arrival") {
  //           valA = getMinutes(a.arrival_time);
  //           valB = getMinutes(b.arrival_time);
  //         }
  //         if (valA === null) return 1;
  //         if (valB === null) return -1;
  //         return sortOn === "late" ? valB - valA : valA - valB;
  //       });
  //     }

  //     return result;

  //   } catch (error) {
  //     throw error;
  //   }
  // }

// async searchTrains(from, to, date, sortBy, sortOn = "early", classType) {
//   try {
//     const normalize = (str) => str?.toUpperCase().trim();

//     from = normalize(from);
//     to = normalize(to);

//     console.log("🔍 Search Params:", { from, to, date });

//     // ✅ Step 1: Find trains
//     const trains = await Train.find({
//       [`station_map.${from}`]: { $exists: true },
//       [`station_map.${to}`]: { $exists: true }
//     });

//     console.log("🚆 Total trains found:", trains.length);

//     // ✅ Step 2: Direction filter
//     let validTrains = trains.filter(train => {
//       const stationMap = train.station_map;

//       const fromIndex = stationMap?.get
//         ? stationMap.get(from)
//         : stationMap[from];

//       const toIndex = stationMap?.get
//         ? stationMap.get(to)
//         : stationMap[to];

//       console.log(`🚆 Train ${train.train_number}`);
//       console.log("   FROM:", from, "->", fromIndex);
//       console.log("   TO  :", to, "->", toIndex);

//       if (fromIndex === undefined || toIndex === undefined) {
//         return false;
//       }

//       return Number(fromIndex) < Number(toIndex);
//     });

//     console.log("➡️ After direction filter:", validTrains.length);

//     if (!validTrains.length) return [];

//     // ✅ Step 3: Class filter (optional)
//     if (classType) {
//       classType = normalize(classType);

//       validTrains = validTrains.filter(train =>
//         train.coaches?.some(c => normalize(c.coach_type) === classType)
//       );

//       console.log("🎟️ After class filter:", validTrains.length);
//     }

//     if (!validTrains.length) return [];

//     // ✅ Helpers
//     const getRouteData = (train, station) => {
//       return train.route.find(r => r.station_code === station);
//     };

//     const getMinutes = (time) => {
//       if (!time) return null;
//       const [h, m] = time.split(":").map(Number);
//       return h * 60 + m;
//     };

//     const getDuration = (train) => {
//       const fromData = getRouteData(train, from);
//       const toData = getRouteData(train, to);

//       if (!fromData || !toData) return null;

//       const dep = getMinutes(fromData.departure_time);
//       const arr = getMinutes(toData.arrival_time);

//       if (dep === null || arr === null) return null;

//       return arr >= dep
//         ? arr - dep
//         : (1440 - dep + arr);
//     };

//     // ✅ Step 4: Build response (NO schedule)
//     let result = validTrains.map(train => {
//       return {
//         train_id: train._id,
//         train_number: train.train_number,
//         train_name: train.train_name,
//         from,
//         to,
//         departure_time: getRouteData(train, from)?.departure_time,
//         arrival_time: getRouteData(train, to)?.arrival_time,
//         duration: getDuration(train),
//         classes: train.coaches?.map(c => c.coach_type) || [],
//         class_pricing: train.class_pricing || {}
//       };
//     });

//     // ✅ Step 5: Sorting
//     if (sortBy) {
//       result.sort((a, b) => {
//         let valA, valB;

//         if (sortBy === "duration") {
//           valA = a.duration;
//           valB = b.duration;
//         } else if (sortBy === "departure") {
//           valA = getMinutes(a.departure_time);
//           valB = getMinutes(b.departure_time);
//         } else if (sortBy === "arrival") {
//           valA = getMinutes(a.arrival_time);
//           valB = getMinutes(b.arrival_time);
//         }

//         if (valA === null) return 1;
//         if (valB === null) return -1;

//         return sortOn === "late"
//           ? valB - valA
//           : valA - valB;
//       });
//     }

//     console.log("✅ Final result:", result.length);

//     return result;

//   } catch (error) {
//     console.error("❌ ERROR:", error.message);
//     throw error;
//   }
// }

// services/trainService.js

async searchTrains(from, to, date, sortBy, sortOn = "early", classType) {
  try {
    const normalize = (str) => str?.toLowerCase().trim();

    console.log("🔍 Raw Input:", { from, to });

    // ✅ Step 1: Load all trains (temporary approach)
    const trains = await Train.find({});
    if (!trains.length) return [];

    // ✅ Step 2: Convert station name → code
    const getStationCode = (stationName) => {
      for (let train of trains) {
        const found = train.route.find(
          r => normalize(r.station_name) === normalize(stationName)
        );
        if (found) return found.station_code;
      }
      return null;
    };

    const fromCode = getStationCode(from);
    const toCode = getStationCode(to);

    if (!fromCode || !toCode) {
      throw new Error("Invalid station name");
    }

    console.log("🔁 Converted:", from, "→", fromCode);
    console.log("🔁 Converted:", to, "→", toCode);

    from = fromCode;
    to = toCode;

    // ✅ Step 3: Filter trains
    let validTrains = trains.filter(train => {
      const stationMap = train.station_map;

      const fromIdx = stationMap?.get
        ? stationMap.get(from)
        : stationMap[from];

      const toIdx = stationMap?.get
        ? stationMap.get(to)
        : stationMap[to];

      if (fromIdx === undefined || toIdx === undefined) return false;

      return Number(fromIdx) < Number(toIdx);
    });

    console.log("➡️ After direction filter:", validTrains.length);

    if (!validTrains.length) return [];

    // ✅ Step 4: Class filter
    if (classType) {
      classType = classType.toUpperCase();

      validTrains = validTrains.filter(train =>
        train.coaches?.some(c => c.coach_type === classType)
      );

      console.log("🎟️ After class filter:", validTrains.length);
    }

    if (!validTrains.length) return [];

    // ✅ Helpers
    const getRouteData = (train, station) =>
      train.route.find(r => r.station_code === station);

    const getMinutes = (time) => {
      if (!time) return null;
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const getDuration = (train) => {
      const fromData = getRouteData(train, from);
      const toData = getRouteData(train, to);

      if (!fromData || !toData) return null;

      const dep = getMinutes(fromData.departure_time);
      const arr = getMinutes(toData.arrival_time);

      if (dep === null || arr === null) return null;

      return arr >= dep
        ? arr - dep
        : (1440 - dep + arr);
    };

    // ✅ Step 5: Build response
    let result = validTrains.map(train => ({
      train_id: train._id,
      train_number: train.train_number,
      train_name: train.train_name,

      // 🔥 Return BOTH name + code
      from_code: from,
      to_code: to,
      from_name: getRouteData(train, from)?.station_name,
      to_name: getRouteData(train, to)?.station_name,

      departure_time: getRouteData(train, from)?.departure_time,
      arrival_time: getRouteData(train, to)?.arrival_time,

      duration: getDuration(train),

      classes: train.coaches?.map(c => c.coach_type) || [],
      class_pricing: train.class_pricing || {}
    }));

    // ✅ Step 6: Sorting
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
        }

        if (valA === null) return 1;
        if (valB === null) return -1;

        return sortOn === "late"
          ? valB - valA
          : valA - valB;
      });
    }

    console.log("✅ Final result:", result.length);

    return result;

  } catch (error) {
    console.error("❌ Service ERROR:", error.message);
    throw error;
  }
}
  // ✅ UPDATE TRAIN
  async updateTrain(train_number, updateData) {
    try {
      if (updateData.route) {
        const station_map = {};
        updateData.route.forEach(station => {
          station_map[station.station_code] = station.stop_order;
        });
        updateData.station_map = station_map;
      }
      return await Train.findOneAndUpdate(
        { train_number: train_number.toUpperCase() },
        updateData,
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // ✅ DELETE TRAIN
  async deleteTrain(train_number) {
    return await Train.findOneAndDelete({ train_number: train_number.toUpperCase() });
  }
}

module.exports = new TrainService();
