const request = require("supertest");
const app = require("../../app");
const { loadPlanetsData } = require("../../models/planets.model");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");

describe("Launch API", () => {
  beforeAll(async () => {
    mongoConnect();
    await loadPlanetsData();
  });

  afterAll(async () => {
    await mongoDisconnect();
  });

  describe("Test GET /launches", () => {
    test("It should respond with 200 success", async () => {
      await request(app).get("/v1/launches").expect("Content-type", /json/).expect(200);
    });
  });

  describe("Test POST /launches", () => {
    const data = {
      mission: "USS Enterprise",
      rocket: "Falcon 9",
      launchDate: "2024-01-01",
      target: "Kepler-62 f",
    };

    const dataWithoutDate = {
      mission: "USS Enterprise",
      rocket: "Falcon 9",
      target: "Kepler-62 f",
    };

    const dataWithInvalidDate = {
      mission: "USS Enterprise",
      rocket: "Falcon 9",
      launchDate: "asfdsaf",
      target: "Kepler-62 f",
    };
    test("It should respond with 201 success", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(data)
        .expect("Content-type", /json/)
        .expect(201);

      const requestDate = new Date(data.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();

      expect(responseDate).toBe(requestDate);

      expect(response.body).toMatchObject(dataWithoutDate);
    });

    test("It should catch required properties", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(dataWithoutDate)
        .expect("Content-type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Missing required launch property",
      });
    });

    test("It should catch invalid dates", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(dataWithInvalidDate)
        .expect("Content-type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Invalid launch date",
      });
    });
  });

  describe("Delete launch from launches with launchId", () => {
    test("It should respond with 200 success", async () => {
      const response = await request(app)
        .delete("/v1/launches/1")
        .expect("Content-type", /json/)
        .expect(200);
    });

    test("It should respond with 404 not found", async () => {
      const response = await request(app)
        .delete("/v1/launches/100")
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual({
        error: "Launch id not found",
      });
    });
  });
});
