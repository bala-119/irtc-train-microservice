const Train = require("../models/train.model");
const axios = require("axios")

class TrainService {


  // create train
async createTrain(trainData) {
    const getMinutes = (time) => {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
  try {

    const station_map = {};

    trainData.route.forEach((station, index) => {

      if (!station.station_code || station.stop_order === undefined) {
        throw new Error("Each route must have station_code and stop_order");
      }

      //  Prevent duplicate station_code
      if (station_map[station.station_code] !== undefined) {
        throw new Error(`Duplicate station_code: ${station.station_code}`);
      }

       const arrival = getMinutes(station.arrival_time);
  const departure = getMinutes(station.departure_time);

  // 🚫 Arrival should be before departure (if both exist)
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
    throw error;
  }
}


 
  async getTrainByNumber(train_number) {
    try {
      return await Train.findOne({ train_number });
    } catch (error) {
      throw error;
    }
  }


  
  async getAllTrains() {
    try {
      return await Train.find();
    } catch (error) {
      throw error;
    }
  }


async searchTrainsByFROMandTO(from, to) {
  try {
    from = from.toUpperCase();
    to = to.toUpperCase();

    // 🔹 Step 1: Find trains containing both stations
    const trains = await Train.find({
      [`station_map.${from}`]: { $exists: true },
      [`station_map.${to}`]: { $exists: true }
    });

    // 🔹 Step 2: Filter correct direction
    const validTrains = trains.filter(train => {
      const fromIndex = train.station_map.get(from);
      const toIndex = train.station_map.get(to);

      return fromIndex < toIndex;
    });

    return validTrains;

  } catch (error) {
    throw error;
  }
}




 
async searchTrains(from, to, date, sortBy, sortOn = "early", classType) {
  try {
    from = from.toUpperCase();
    to = to.toUpperCase();

    // 🔹 Step 1: Find trains containing both stations
    const trains = await Train.find({
      [`station_map.${from}`]: { $exists: true },
      [`station_map.${to}`]: { $exists: true }
    });

    // 🔹 Step 2: Filter correct direction
    let validTrains = trains.filter((train) => {
      const fromIndex = train.station_map.get(from);
      const toIndex = train.station_map.get(to);
      return fromIndex < toIndex;
    });

    if (!validTrains.length) return [];

    // 🔹 Step 3: Filter by classType
    if (classType) {
      classType = classType.toUpperCase();

      validTrains = validTrains.filter(train =>
        train.coaches.some(c => c.coach_type === classType)
      );
    }

    // 🔥 Step 4: Call Schedule Microservice
    const scheduleRes = await axios.get(
      "http://localhost:3004/v1/booking/schedule/search-trains",
      {
        from,
        to,
        date
      }
    );

    let result = scheduleRes.data?.data || [];

    // 🔹 Step 5: Sorting (optional safety if schedule doesn't sort)
    const getMinutes = (time) => {
      if (!time) return null;
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

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

        return sortOn === "late" ? valB - valA : valA - valB;
      });
    }

    return result;

  } catch (error) {
    throw error;
  }
}



  async updateTrain(train_number, updateData) {
    try {
      
      if (updateData.route) {
        const station_map = {};

        updateData.route.forEach((station) => {
          station_map[station.station_code] = station.stop_order;
        });

        updateData.station_map = station_map;
      }

      const updatedTrain = await Train.findOneAndUpdate(
        { train_number },
        updateData,
        { new: true }
      );

      return updatedTrain;

    } catch (error) {
      throw error;
    }
  }


  async deleteTrain(train_number) {
    try {
      return await Train.findOneAndDelete({ train_number });
    } catch (error) {
      throw error;
    }
  }

}

module.exports = new TrainService();