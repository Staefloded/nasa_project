const mongoose = require("mongoose");

const LaunchesSchema = new mongoose.Schema({
  flightNumber: { type: Number, required: true },
  mission: String,
  launchDate: { type: Date, required: true },
  rocket: { type: String, required: true },
  target: {
    type: String,
  },
  upcoming: { type: Boolean, required: true },
  success: { type: Boolean, required: true, default: true },
  customers: [String],
});

module.exports = mongoose.model("Launch", LaunchesSchema);
