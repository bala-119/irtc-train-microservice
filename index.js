const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./app/config/dbConnect");

dotenv.config();
connectDB("irtc_DB");

const app = express();
app.use(cors({
  origin: 'https://bala-119.github.io',
  credentials: true
}));
app.use(express.json());

//  Import router
const router = require("./app/routes/routes");

//  Use router properly
app.use("/train", router);
const stationRoutes = require("./app/routes/station.route");

app.use("/stations", stationRoutes);

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});