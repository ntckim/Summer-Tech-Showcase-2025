import { useState } from "react";
export default function MockInterview() {
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [resume, setResume] = useState(null);

  const handleResumeUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) setResume(file);
  };

  const startInterview = () => {
    if (!resume || selectedCompanies.length === 0) return;
    alert(`Starting interview with: ${selectedCompanies.join(", ")}`);
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "24px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        background: "#fff",
      }}
    >
      <h1
        style={{ textAlign: "center", fontSize: "24px", marginBottom: "20px" }}
      >
        Mock Interview
      </h1>

      <div style={{ marginBottom: "20px" }}>
        <label>Upload your Resume (PDF)</label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleResumeUpload}
          style={{ display: "block", marginTop: "8px" }}
        />
        {resume && (
          <p style={{ marginTop: "8px", color: "green" }}>
            Uploaded: {resume.name}
          </p>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label>Select Target Companies (comma separated)</label>
        <input
          type="text"
          value={selectedCompanies.join(", ")}
          onChange={(e) =>
            setSelectedCompanies(e.target.value.split(",").map((c) => c.trim()))
          }
          placeholder="Google, Apple, Amazon..."
          style={{ display: "block", marginTop: "8px", width: "100%" }}
        />
      </div>

      <button
        onClick={startInterview}
        disabled={!resume || selectedCompanies.length === 0}
        className="button"
      >
        Start Interview
      </button>
    </div>
  );
}
