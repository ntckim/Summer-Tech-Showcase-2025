import { useCallback, useState } from "react";
import Layout from "../../layouts/Layout";
import InterviewForm from "./InterviewForm";
import InterviewSession from "./InterviewSession";
import { generateInterviewQuestions } from "./openRouterService";
import jsPDF from "jspdf";

export default function MockInterview() {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [finalConversation, setFinalConversation] = useState([]);

  // ---------------- FORM SUBMIT ----------------
  const handleFormSubmit = useCallback(async (formData) => {
    try {
      setLoading(true);
      setErr("");
      setQuestions([]);
      setCurrentIdx(0);
      setShowAllQuestions(false);

      const generatedQuestions = await generateInterviewQuestions(formData);

      if (
        !Array.isArray(generatedQuestions) ||
        generatedQuestions.length === 0
      ) {
        throw new Error("No questions generated. Please try again.");
      }

      setQuestions(generatedQuestions);
      setFormData(formData);
      setIsInterviewStarted(true);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Failed to generate interview questions.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------- RESET ----------------
  const handleReset = useCallback(() => {
    setQuestions([]);
    setCurrentIdx(0);
    setErr("");
    setShowAllQuestions(false);
    setFormData(null);
    setIsInterviewStarted(false);
    setFinalConversation([]);
  }, []);

  // ---------------- END INTERVIEW ----------------
  const handleEndInterview = (conversation) => {
    setFinalConversation(conversation); // store final conversation
    setIsInterviewStarted(false);
  };

  // ---------------- PDF TRANSCRIPT ----------------
  // ---------------- PDF TRANSCRIPT ----------------
  const viewTranscript = () => {
    if (!finalConversation.length) {
      alert("No conversation available yet!");
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Layout
    const M = 56; // page margin
    const headerH = 54;
    const footerH = 40;
    const contentW = pageW - M * 2;
    let y = M + headerH;

    const title = "Mock Interview Transcript";
    const sub = new Date().toLocaleString();

    // Colors
    const text = [20, 20, 20];
    const muted = [110, 110, 110];
    const bg = [248, 248, 248];
    const interviewerFill = [232, 240, 255];
    const candidateFill = [240, 240, 240];
    const pillInterviewer = [37, 99, 235];
    const pillCandidate = [75, 85, 99];

    const TOTAL_PLACEHOLDER = "{total_pages}";

    const drawHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...text);
      doc.text(title, M, M + 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...muted);
      doc.text(sub, M, M + 36);

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(M, M + headerH - 10, pageW - M, M + headerH - 10);
    };

    const drawFooter = (pageNum) => {
      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(
        M,
        pageH - M - footerH + 10,
        pageW - M,
        pageH - M - footerH + 10
      );

      // Page numbers
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...muted);
      const txt = `Page ${pageNum} of ${TOTAL_PLACEHOLDER}`;
      doc.text(txt, pageW - M, pageH - M - 14, { align: "right" });
    };

    // Draw background FIRST so it doesn't cover header/footer
    const paintBackground = () => {
      doc.setFillColor(...bg);
      doc.rect(0, 0, pageW, pageH, "F");
    };

    let pageNum = 1;
    paintBackground();
    drawHeader();
    drawFooter(pageNum);

    const addPage = () => {
      doc.addPage();
      pageNum += 1;
      paintBackground();
      drawHeader();
      drawFooter(pageNum);
      y = M + headerH;
    };

    const ensureSpace = (neededHeight) => {
      if (y + neededHeight > pageH - M - footerH) addPage();
    };

    const drawMessage = (role, timestamp, content) => {
      const isInterviewer = role === "interviewer";
      const roleLabel = isInterviewer ? "Interviewer" : "You";
      const pillColor = isInterviewer ? pillInterviewer : pillCandidate;
      const bubbleFill = isInterviewer ? interviewerFill : candidateFill;

      // Role pill sizing
      const pillH = 20;
      const pillPadX = 8;
      const pillPadY = 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const pillTextW = doc.getTextWidth(roleLabel);
      const pillW = pillTextW + pillPadX * 2;

      // Body wrap
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(...text);
      const bodyLines = doc.splitTextToSize(
        String(content || ""),
        contentW - 20
      );
      const bodyHeight = bodyLines.length * 14;
      const blockH = pillH + 8 + bodyHeight + 16;

      ensureSpace(blockH);

      // Top line: role pill + timestamp
      const x = M;
      const pillY = y;

      // Pill
      doc.setFillColor(...pillColor);
      doc.roundedRect(x, pillY, pillW, pillH, 6, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(roleLabel, x + pillPadX, pillY + pillH - pillPadY - 3);

      // Timestamp
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...muted);
      const tsText = ` (${timestamp})`;
      doc.text(tsText, x + pillW + 6, pillY + pillH - pillPadY - 3);

      // Bubble
      const bubbleY = pillY + pillH + 8;
      const bubbleH = bodyHeight + 16;
      doc.setFillColor(...bubbleFill);
      doc.setDrawColor(230, 230, 230);
      doc.roundedRect(x, bubbleY, contentW, bubbleH, 8, 8, "FD");

      // Body
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(...text);
      doc.text(bodyLines, x + 10, bubbleY + 14);

      y = bubbleY + bubbleH + 12;
    };

    finalConversation.forEach((msg) => {
      const role = msg.type === "interviewer" ? "interviewer" : "candidate";
      const stamp =
        typeof msg.timestamp === "string"
          ? msg.timestamp
          : new Date(msg.timestamp).toLocaleTimeString();
      drawMessage(role, stamp, msg.content);
    });

    if (typeof doc.putTotalPages === "function") {
      doc.putTotalPages(TOTAL_PLACEHOLDER);
    }

    const dateSlug = new Date().toISOString().slice(0, 10);
    doc.save(`Interview_Transcript_${dateSlug}.pdf`);
  };

  const hasPlan = questions.length > 0;

  return (
    <Layout title="Mock Interview – Summer Tech Showcase">
      {!isInterviewStarted ? (
        // Form + setup card
        <div
          style={{
            maxWidth: "42rem",
            margin: "2.5rem auto",
            borderRadius: "16px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--muted-bg)", // theme-aware
            padding: "2rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            color: "var(--text)", // ensure readable text
          }}
        >
          <h1
            style={{
              textAlign: "center",
              fontSize: "30px",
              lineHeight: "36px",
              fontWeight: 600,
              marginBottom: "24px",
              color: "var(--text)",
            }}
          >
            Mock Interview
          </h1>

          {!hasPlan && (
            <>
              <InterviewForm onSubmit={handleFormSubmit} />
              {loading && (
                <div style={{ marginTop: "16px", textAlign: "center" }}>
                  <div
                    style={{
                      display: "inline-block",
                      width: "40px",
                      height: "40px",
                      border: "4px solid var(--border)", // base ring
                      borderTop: "4px solid #2563eb", // brand ring
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <p style={{ marginTop: "12px", color: "var(--text)" }}>
                    Generating personalized interview questions with AI…
                  </p>
                  <p
                    style={{
                      marginTop: "8px",
                      color: "var(--muted-text)",
                      fontSize: "14px",
                    }}
                  >
                    This may take a few moments
                  </p>
                </div>
              )}

              {err && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    backgroundColor: "rgba(220,38,38,0.12)",
                    border: "1px solid #dc2626",
                    borderRadius: "8px",
                  }}
                >
                  <p style={{ color: "#dc2626", margin: "0 0 8px 0" }}>
                    Error: {err}
                  </p>
                  <p
                    style={{
                      color: "var(--muted-text)",
                      fontSize: "14px",
                      margin: 0,
                    }}
                  >
                    Please check your OpenAI API key configuration and try
                    again.
                  </p>
                </div>
              )}
            </>
          )}

          {hasPlan && (
            <div
              style={{
                marginTop: "12px",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "16px",
                background: "var(--bg)",
                color: "var(--text)",
              }}
            >
              <h3
                style={{
                  marginBottom: "16px",
                  color: "var(--text)",
                  fontSize: "18px",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                Thanks for taking the interview!
              </h3>

              <p
                style={{
                  marginBottom: "20px",
                  color: "var(--muted-text)",
                  fontSize: "16px",
                  textAlign: "center",
                }}
              >
                You can download a copy of your interview transcript through the
                button below as well!
              </p>

              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => setIsInterviewStarted(true)}
                  style={{
                    padding: "12px 24px",
                    fontSize: "16px",
                    fontWeight: 600,
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  Start Interview Session
                </button>
              </div>

              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--muted-bg)",
                    color: "var(--text)",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Start New Interview
                </button>
              </div>

              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={viewTranscript}
                  style={{
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--muted-bg)",
                    color: "var(--text)",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Transcript PDF
                </button>
              </div>
            </div>
          )}

          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        // Interview session
        <InterviewSession
          questions={questions}
          improvementAreas={formData?.improvementAreas || []}
          onEndInterview={handleEndInterview}
          onReset={handleReset}
        />
      )}
    </Layout>
  );
}
