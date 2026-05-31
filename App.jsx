import React, { useState } from "react";
import "./App.css";

export default function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
      setResult(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("email", email);

    try {
      const response = await fetch("http://localhost:3001/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong during upload");
      }

      setResult(data.extractedData);
    } catch (err) {
      console.error(err);
      setError(`Scanning failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header>
        <nav className="container">
          <div className="logo">
            <h1
              style={{
                color: "#fff",
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
              }}
            >
              VEHICLE SCANNER
            </h1>
          </div>
          <ul className="nav-link">
            <li>
              <a href="#home">Home</a>
            </li>
            <li>
              <a href="#history">History</a>
            </li>
          </ul>
        </nav>
      </header>

      <section className="hero-section">
        <div className="container">
          <div className="upload-card">
            <h2>Analyze Vehicle</h2>
            <p>
              Upload an image of a vehicle to identify its make, model, year,
              and accuracy variants instantly using Gemini AI.
            </p>

            <form onSubmit={handleUpload}>
              {!previewUrl ? (
                /* Drag & Drop Area styled exactly via .upload-box */
                <label className="upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  <div className="upload-icon">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                  </div>
                  <h3>Select vehicle photo</h3>
                  <p>Supports JPEG, PNG, or WEBP up to 10MB</p>
                  <span className="upload-btn">Browse Files</span>
                </label>
              ) : (
                /* Dynamic Image wrapper containing remove triggers and processing animation overlays */
                <div className="preview-container">
                  <div className="image-wrapper">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="preview-img"
                    />
                    {!loading && (
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="remove-btn"
                      >
                        ×
                      </button>
                    )}

                    {loading && (
                      <div className="loading-overlay">
                        <div className="spinner"></div>
                        <span>Processing via Gemini AI...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">
                  Notification Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="email-input"
                  disabled={loading}
                />
              </div>

              {file && !loading && (
                <button type="submit" className="analyze-btn">
                  Scan & Save Vehicle
                </button>
              )}

              {loading && (
                <button
                  type="button"
                  className="analyze-btn analyze-btn-disabled"
                  disabled
                >
                  Analyzing...
                </button>
              )}
            </form>

            {error && <div className="error-message">{error}</div>}

            {result && (
              <div className="result-box">
                <div className="result-success">
                  ✓ Analysis Complete & Saved to Database
                </div>
                <div className="result-data-grid">
                  <div>
                    <strong>Make:</strong> {result.make || "N/A"}
                  </div>
                  <div>
                    <strong>Model:</strong> {result.model || "N/A"}
                  </div>
                  <div>
                    <strong>Year:</strong> {result.year || "N/A"}
                  </div>
                  <div>
                    <div>
                      <strong>Fuel Type:</strong> {result.fuel_type || "N/A"}
                    </div>
                    <strong>Body Type</strong>
                    {result.body_type || "N/A"}
                    <strong>Confidence:</strong>{" "}
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
