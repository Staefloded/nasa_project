const axios = require("axios").default;

const launches = require("./launches.mongo");
const planets = require("./planets.mongo");

const DEFAULT_FLIGHT_NUMBER = 100;
const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";

async function populateLaunches() {
  console.log("load launch data");

  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("error loading launch data");
    throw new Error("Launch Data failed");
  }

  const launchDocs = await response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc.payloads;
    const customers = payloads.flatMap((payload) => payload.customers);

    const launch = {
      flightNumber: launchDoc.flight_number,
      mission: launchDoc.name,
      rocket: launchDoc.rocket.name,
      launchDate: new Date(launchDoc.date_local),
      upcoming: launchDoc.upcoming,
      success: launchDoc.success,
      customers,
    };

    console.log({ flightNumber: launch.flightNumber, rocket: launch.customers });

    await saveLaunch(launch);
  }
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });

  if (firstLaunch) {
    console.log("Was already loaded!!");
  } else {
    await populateLaunches();
  }
}

async function findLaunch(filter) {
  return await launches.findOne(filter);
}

async function existsLaunchId(launchId) {
  return await findLaunch({ flightNumber: launchId });
}

async function getLatestFlightNumber() {
  const latestLaunch = await launches.findOne().sort("-flightNumber");

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }

  return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
  // pagination for frontend
  // return {
  //   docs: await launches
  //     .find({}, { _id: 0, __v: 0 })
  //     .sort({ flightNumber: 1 })
  //     .skip(skip)
  //     .limit(limit),
  //   page,
  //   limit,
  //   hasPrevious: skip > 0,
  //   hasNext: (await launches.countDocuments()) > skip + limit,
  //   size: await launches.countDocuments(),
  // };

  return await launches
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function saveLaunch(launch) {
  await launches.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    { upsert: true }
  );
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({
    kepler_name: launch.target,
  });

  if (!planet) {
    throw new Error("No matching Planet not found");
  }

  const newflightNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customer: ["ZTM", "NASA"],
    flightNumber: newflightNumber,
  });

  await saveLaunch(newLaunch);
}

async function abortLaunchById(launchId) {
  const aborted = await launches.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );

  return aborted.acknowledged === true && aborted.modifiedCount === 1;
}

module.exports = {
  getAllLaunches,
  abortLaunchById,
  existsLaunchId,
  scheduleNewLaunch,
  loadLaunchData,
};
