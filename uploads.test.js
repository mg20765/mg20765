const request = require("supertest");
const express = require("express");

// Mock our database and Gemini BEFORE importing the router
jest.mock("mysql2/promise", () => ({
  createPool: () => ({
    execute: jest.fn().mockResolvedValue([{ insertId: 999 }]),
  }),
}));

jest.mock("@google/genai", () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: jest.fn().mockResolvedValue({
          text: JSON.stringify({
            make: "Toyota",
            model: "Corolla",
            year: 2015,
            confidence: 0.92,
          }),
        }),
      },
    })),
  };
});

const uploadRoute = require("./uploads");

const app = express();
app.use(express.json());
app.use("/api/upload", uploadRoute);

describe("POST /api/upload", () => {
  // ─── Test case 1: Successful upload and processing ─────────────────────────────────────────────

  it("should successfully process an uploaded image and return vehicle data", async () => {
    // Create a dummy text buffer pretending to be an image file
    const fakeImageBuffer = Buffer.from("fake-image-bytes");

    const response = await request(app)
      .post("/api/upload")
      .attach("image", fakeImageBuffer, "test_car.png") // Simulates Multer upload
      .field("email", "test@example.com");

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.extractedData.make).toBe("Toyota");
    expect(response.body.id).toBe(999);
  });
});
//TEST CASE 2 : Successful SENARIO
describe("POST /api/upload", () => {
  // Your first successful test stays right here...
  it("should successfully process an uploaded image and return vehicle data", async () => {
    const fakeImageBuffer = Buffer.from("fake-image-bytes");
    const response = await request(app)
      .post("/api/upload")
      .attach("image", fakeImageBuffer, "test_car.png")
      .field("email", "test@example.com");

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.extractedData.make).toBe("Toyota");
    expect(response.body.id).toBe(999);
  });
});
// ─── Test case 2: Missing image file ───────────────────────────────────────────────────────────────
it("should return a 400 error if no image file is attached", async () => {
  const response = await request(app)
    .post("/api/upload")
    .field("email", "test@example.com"); // Notice we did NOT .attach() an image

  // Assertions for the error state
  expect(response.status).toBe(400);
  expect(response.body.error).toBe("No image file provided");
});
