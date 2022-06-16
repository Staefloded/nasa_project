const mongoose = require("mongoose");

require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL;

mongoose.connection.once("connected", () => {
  console.log("Connected to MongoDB");
});

mongoose.connection.on("reconnected", () => {
  console.log("Reconnected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error({ err });
});

function mongoConnect() {
  mongoose.connect(MONGO_URL);
}

async function mongoDisconnect() {
  await mongoose.disconnect();
}

module.exports = {
  mongoConnect,
  mongoDisconnect,
};
