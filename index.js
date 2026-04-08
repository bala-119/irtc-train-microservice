const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./app/config/dbConnect");

dotenv.config();
connectDB("irtc_DB");

const app = express();
app.use(cors());
app.use(express.json());

//  Import router
const router = require("./app/routes/routes");

//  Use router properly
app.use("/train", router);
const stationRoutes = require("./app/routes/station.route");

app.use("/stations", stationRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});