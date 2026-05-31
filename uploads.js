const express = require("express");
const multer = require("multer");
const mysql = require("mysql2/promise");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const router = express.Router();
const ai = new GoogleGenAI({});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// FIXED: Changed fallback default port from 3301 to 3306 (Standard MySQL Port)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

const vehicleSchema = {
  type: "OBJECT",
  properties: {
    make: { type: "STRING" },
    model: { type: "STRING" },
    year: { type: "INTEGER" },
    fuel_type: { type: "STRING" },
    body_type: { type: "STRING" },
    confidence: { type: "NUMBER" },
  },
};

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const { originalname, mimetype, buffer, size } = req.file;
    const { email } = req.body;

    let make = null;
    let model = null;
    let year = null;
    let fuel_type = null;
    let body_type = null;
    let confidence = 0.0;

    try {
      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimetype,
              data: buffer.toString("base64"),
            },
          },
          "Identify the make, model,body_type,fuel_type, and year of the vehicle in this image.",
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: vehicleSchema,
        },
      });

      const vehicleData = JSON.parse(aiResponse.text);
      make = vehicleData.make || null;
      model = vehicleData.model || null;
      year = vehicleData.year || null;
      fuel_type = vehicleData.fuel_type || null;
      body_type = vehicleData.body_type || null;
      confidence = vehicleData.confidence || 0.0;
    } catch (aiError) {
      console.error(
        "Gemini AI processing failed. Using fallbacks:",
        aiError.message,
      );
    }

    // Database execution block
    const [result] = await pool.execute(
      `INSERT INTO vehicle 
          (file_name, mime_type, file_size, image_data, make, model, year, confidence, fuel_type, body_type, email, uploaded_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,

      // 2. Pass exactly 11 elements inside this array to match the 11 '?' marks above
      [
        originalname, // 1  -> matches file_name
        mimetype, // 2  -> matches mime_type
        size, // 3  -> matches file_size
        buffer, // 4  -> matches image_data
        make, // 5  -> matches make
        model, // 6  -> matches model
        year, // 7  -> matches year
        confidence, // 8  -> matches confidence
        fuel_type, // 9  -> matches fuel_type
        body_type, // 10 -> matches body_type
        email || null, // 11 -> matches email
      ],
    );

    return res.status(201).json({
      success: true,
      id: result.insertId,
      message: "Image processed by Gemini and saved successfully",
      extractedData: { make, model, year, fuel_type, body_type, confidence },
    });
  } catch (err) {
    // ENHANCED ERROR LOGGING: This ensures you see the exact SQL problem in your terminal
    console.error("\n❌ ====== DATABASE UPLOAD CRASH ======");
    console.error("Message:", err.message);
    console.error("Code:", err.code);
    console.error("=====================================\n");

    return res.status(500).json({
      error: `Database processing failed: ${err.message || "Unknown error"}`,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT mime_type, image_data FROM team.vehicle WHERE id = ?",
      [req.params.id],
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Image not found" });
    }

    const { mime_type, image_data } = rows[0];
    res.setHeader("Content-Type", mime_type);
    res.send(image_data);
  } catch (err) {
    console.error("Retrieve error:", err);
    res.status(500).json({ error: "Failed to retrieve image" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.execute("DELETE FROM vehicle WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

module.exports = router;
