const trainService = require("../services/train.service");
const axios = require("axios");

class TrainController {

  
async createTrain(req, res) {
  try {
    const trainData = req.body;

    //  Required fields check
    const requiredFields = ["train_number", "train_name", "source", "destination", "route"];

    const missingFields = requiredFields.filter(field => !trainData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`
      });
    }

    // Route validation
    if (!Array.isArray(trainData.route) || trainData.route.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Route must be a non-empty array"
      });
    }

    const train = await trainService.createTrain(trainData);

    return res.status(201).json({
      success: true,
      message: "Train created successfully",
      data: train
    });

  } catch (error) {

    //  Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];

      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
}


  // get train number
  async getTrainByNumber(req, res) {
    try {
      const { train_number } = req.params;

      const train = await trainService.getTrainByNumber(train_number);

      if (!train) {
        return res.status(404).json({
          success: false,
          message: "Train not found"
        });
      }

      return res.status(200).json({
        success: true,
        data: train
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }


  //  get all trains
  async getAllTrains(req, res) {
    try {
      const trains = await trainService.getAllTrains();

      return res.status(200).json({
        success: true,
        count: trains.length,
        data: trains
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }


  // search train
async searchTrains(req, res) {
  try {
    const { from, to, date } = req.body;
    const { sortBy, sortOn, classType } = req.query;

    // ✅ Validation
    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        message: "from, to and date are required"
      });
    }

    const trains = await trainService.searchTrains(
      from,
      to,
      date,
      sortBy,
      sortOn,
      classType
    );

    return res.status(200).json({
      success: true,
      count: trains.length,
      data: trains
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

  // update train
  async updateTrain(req, res) {
    try {
      const { train_number } = req.params;
      const updateData = req.body;

      const updatedTrain = await trainService.updateTrain(train_number, updateData);

      if (!updatedTrain) {
        return res.status(404).json({
          success: false,
          message: "Train not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Train updated successfully",
        data: updatedTrain
      });

    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }


  // delete train
  async deleteTrain(req, res) {
    try {
      const { train_number } = req.params;

      const deletedTrain = await trainService.deleteTrain(train_number);

      if (!deletedTrain) {
        return res.status(404).json({
          success: false,
          message: "Train not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Train deleted successfully"
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  async searchTrainsByFROMandTO(req, res) {
  try {
    const { from, to } = req.query; // ✅ change from body → query

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "from and to are required"
      });
    }
    console.log("data got from schedule");

    const trains = await trainService.searchTrainsByFROMandTO(from, to);
    console.log("here from train a response to schedule");
    console.log(trains)

    return res.status(200).json({
      success: true,
      count: trains.length,
      data: trains
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

}

module.exports = new TrainController();