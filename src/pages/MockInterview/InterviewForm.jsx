import { useEffect, useRef, useState } from "react";

const topTechCompanies = [
  "Google",
  "Apple",
  "Amazon",
  "Microsoft",
  "Meta",
  "Netflix",
  "Tesla",
  "Adobe",
  "Salesforce",
  "Oracle",
  "Intel",
  "IBM",
  "Nvidia",
  "Uber",
  "Lyft",
  "Airbnb",
  "Stripe",
  "Shopify",
  "Zoom",
  "Spotify",
  "X (Twitter)",
  "Snap",
  "Square",
  "Coinbase",
  "Dropbox",
  "Atlassian",
  "Slack",
  "Pinterest",
  "PayPal",
  "Reddit",
  "ByteDance",
  "TikTok",
  "Robinhood",
  "DoorDash",
  "Instacart",
  "Palantir",
  "LinkedIn",
  "Cloudflare",
  "Twilio",
  "Asana",
  "GitHub",
  "MongoDB",
  "Datadog",
  "Okta",
  "Snowflake",
  "HubSpot",
  "Figma",
  "Notion",
  "OpenAI",
  "Hugging Face",
];

const improvementAreas = [
  "Answer structure (STAR method)",
  "Clarity & communication",
  "Confidence",
  "Handling tough questions",
  "Storytelling",
  "Highlighting achievements",
  "Teamwork & leadership examples",
  "Conflict resolution",
  "Explaining failures & lessons learned",
  "General interview etiquette",
];

export default function InterviewForm({ onSubmit }) {
  const [resume, setResume] = useState(null);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  // dropdown state
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleResumeUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) setResume(file);
  };

  const toggleCompany = (company) => {
    setSelectedCompanies((prev) =>
      prev.includes(company)
        ? prev.filter((c) => c !== company)
        : [...prev, company]
    );
  };

  const handleAreaChange = (area) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!resume || selectedCompanies.length === 0) return;
    onSubmit({
      resume,
      companies: selectedCompanies,
      improvementAreas: selectedAreas,
      notes,
    });
  };

  const hasResumeError = touched && !resume;
  const hasCompanyError = touched && selectedCompanies.length === 0;

  // close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "block",
        color: "var(--text)",
      }}
    >
      {/* Resume Upload */}
      <div style={{ marginBottom: "24px" }}>
        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text)",
            marginBottom: "8px",
          }}
        >
          Upload your Resume (PDF)
        </label>
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleResumeUpload}
          style={{
            display: "block",
            width: "100%",
            borderRadius: "12px",
            border: `1px solid ${hasResumeError ? "#f87171" : "var(--border)"}`,
            padding: "8px 12px",
            fontSize: "14px",
            outline: "none",
            background: "var(--input-bg)",
            color: "var(--input-text)",
          }}
        />
        {resume && (
          <p style={{ marginTop: "4px", fontSize: "12px", color: "#16a34a" }}>
            Uploaded: {resume.name}
          </p>
        )}
        {hasResumeError && (
          <p style={{ marginTop: "4px", fontSize: "12px", color: "#dc2626" }}>
            Please upload your resume.
          </p>
        )}
      </div>

      {/* Company Selection */}
      <div style={{ marginBottom: "24px" }}>
        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text)",
            marginBottom: "8px",
          }}
        >
          Companies you want to prepare for
        </label>

        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
            style={{
              width: "100%",
              borderRadius: "12px",
              border: `1px solid ${hasCompanyError ? "#f87171" : "var(--border)"}`,
              padding: "8px 12px",
              fontSize: "14px",
              textAlign: "left",
              background: "var(--input-bg)",
              color: "var(--input-text)",
              cursor: "pointer",
            }}
          >
            {selectedCompanies.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                }}
              >
                {selectedCompanies.map((c) => (
                  <span
                    key={c}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      borderRadius: "999px",
                      border: `1px solid var(--border)`,
                      background: "var(--muted-bg)",
                      color: "var(--text)",
                      padding: "2px 8px",
                      fontSize: "12px",
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ color: "var(--muted-text)" }}>
                Select companies…
              </span>
            )}
          </button>

          {open && (
            <div
              role="listbox"
              tabIndex={-1}
              style={{
                position: "absolute",
                zIndex: 20,
                marginTop: "8px",
                width: "100%",
                maxHeight: "256px",
                overflowY: "auto",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                background: "var(--input-bg)",
                padding: "4px",
                boxShadow:
                  "0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.05)",
              }}
            >
              {topTechCompanies.map((company) => {
                const selected = selectedCompanies.includes(company);
                return (
                  <div
                    key={company}
                    onClick={() => toggleCompany(company)}
                    role="option"
                    aria-selected={selected}
                    style={{
                      cursor: "pointer",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      fontSize: "14px",
                      background: selected
                        ? "rgba(96, 165, 250, 0.2)" // brand tint
                        : "transparent",
                      color: "var(--text)",
                      userSelect: "none",
                    }}
                  >
                    {company}
                  </div>
                );
              })}

              <div
                style={{
                  position: "sticky",
                  bottom: 0,
                  background: "var(--input-bg)",
                  paddingTop: "6px",
                  marginTop: "6px",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--muted-bg)",
                    color: "var(--text)",
                    padding: "8px 12px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {hasCompanyError && (
          <p style={{ marginTop: "4px", fontSize: "12px", color: "#dc2626" }}>
            Pick at least one company.
          </p>
        )}
      </div>

      {/* Improvement Areas */}
      <div style={{ marginBottom: "24px" }}>
        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text)",
            marginBottom: "8px",
          }}
        >
          What do you want to improve on?
        </label>

        <div
          style={{
            display: "grid",
            gap: "8px",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {improvementAreas.map((area) => {
            const checked = selectedAreas.includes(area);
            return (
              <label
                key={area}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  borderRadius: "12px",
                  border: `1px solid ${
                    checked ? "var(--brand-color)" : "var(--border)"
                  }`,
                  background: checked ? "rgba(96, 165, 250, 0.15)" : "var(--input-bg)",
                  color: "var(--text)",
                  padding: "8px 12px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleAreaChange(area)}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "var(--brand-color)",
                  }}
                />
                <span>{area}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Additional Notes */}
      <div style={{ marginBottom: "24px" }}>
        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text)",
            marginBottom: "8px",
          }}
        >
          Additional context / notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="E.g. I struggle with behavioral questions about leadership…"
          style={{
            width: "100%",
            minHeight: "112px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            padding: "8px 12px",
            fontSize: "14px",
            outline: "none",
            background: "var(--input-bg)",
            color: "var(--input-text)",
          }}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!resume || selectedCompanies.length === 0}
        style={{
          width: "100%",
          borderRadius: "16px",
          background:
            !resume || selectedCompanies.length === 0 ? "#2563eb99" : "#2563eb",
          color: "#ffffff",
          fontWeight: 600,
          padding: "10px 16px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          cursor:
            !resume || selectedCompanies.length === 0
              ? "not-allowed"
              : "pointer",
          border: "none",
        }}
      >
        Start Interview
      </button>
    </form>
  );
}
