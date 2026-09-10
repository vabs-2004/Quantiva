import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { verifyCertificate } from "../../services/api";

const NAVY = "#0f172a";
const GOLD = "#c9a44c";

export default function VerifyCertificatePage() {
  const { certificateId: paramId } = useParams();
  const navigate = useNavigate();
  const [inputId, setInputId] = useState(paramId || "");
  const [result, setResult] = useState(null); // { valid, certificate } | { valid: false, error }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paramId) runVerify(paramId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId]);

  async function runVerify(id) {
    const trimmed = (id || "").trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await verifyCertificate(trimmed);
      setResult(data);
    } catch (err) {
      setResult({ valid: false, error: err?.response?.data?.error || "Could not verify this certificate." });
    }
    setLoading(false);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputId.trim() !== paramId) {
      navigate(`/verify/${inputId.trim()}`);
    } else {
      runVerify(inputId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-app-base)" }}>
      <Navbar />

      <main className="flex-1 flex items-start justify-center px-4 pt-28 pb-20">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div
              className="inline-flex h-14 w-14 items-center justify-center rounded-full mb-4"
              style={{ border: `2px solid ${GOLD}`, color: NAVY, background: "var(--color-app-surface)" }}
            >
              <span className="text-2xl">🎓</span>
            </div>
            <h1 className="text-2xl font-extrabold mb-2" style={{ color: "var(--color-app-text-main)" }}>
              Certificate Verification
            </h1>
            <p className="text-sm" style={{ color: "var(--color-app-text-muted)" }}>
              Confirm the authenticity of a Quantiva Certificate of Completion.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value.toUpperCase())}
              placeholder="e.g. QSL-A1B2C3D4E5"
              className="flex-1 px-4 py-3 rounded-lg text-sm font-mono outline-none"
              style={{
                background: "var(--color-app-surface)",
                border: "1px solid var(--color-app-border)",
                color: "var(--color-app-text-main)",
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputId.trim()}
              className="px-5 py-3 rounded-lg text-sm font-bold disabled:opacity-50"
              style={{ background: "var(--color-app-primary)", color: "#fff" }}
            >
              {loading ? "Checking..." : "Verify"}
            </button>
          </form>

          {result?.valid && (
            <div
              className="rounded-2xl p-6 border-2"
              style={{ borderColor: GOLD, background: "linear-gradient(135deg, rgba(201,164,76,0.08), rgba(201,164,76,0.02))" }}
            >
              <div className="flex items-center gap-2 mb-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-white text-sm" style={{ background: "#16a34a" }}>
                  ✓
                </span>
                <span className="font-bold" style={{ color: "#16a34a" }}>Valid Certificate</span>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt style={{ color: "var(--color-app-text-muted)" }}>Awarded to</dt>
                  <dd className="font-bold text-right" style={{ color: "var(--color-app-text-main)" }}>{result.certificate.userName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt style={{ color: "var(--color-app-text-muted)" }}>Course</dt>
                  <dd className="font-bold text-right" style={{ color: "var(--color-app-text-main)" }}>{result.certificate.courseTitle}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt style={{ color: "var(--color-app-text-muted)" }}>Instructor</dt>
                  <dd className="text-right" style={{ color: "var(--color-app-text-main)" }}>{result.certificate.instructor}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt style={{ color: "var(--color-app-text-muted)" }}>Issued</dt>
                  <dd className="text-right" style={{ color: "var(--color-app-text-main)" }}>
                    {new Date(result.certificate.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 pt-3" style={{ borderTop: "1px solid var(--color-app-border)" }}>
                  <dt style={{ color: "var(--color-app-text-muted)" }}>Certificate ID</dt>
                  <dd className="font-mono text-right" style={{ color: "var(--color-app-text-main)" }}>{result.certificate.certificateId}</dd>
                </div>
              </dl>
            </div>
          )}

          {result && !result.valid && (
            <div
              className="rounded-2xl p-6 border text-center"
              style={{ borderColor: "rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.06)" }}
            >
              <span className="flex h-10 w-10 mx-auto items-center justify-center rounded-full text-white text-lg mb-3" style={{ background: "#ef4444" }}>
                ✕
              </span>
              <div className="font-bold mb-1" style={{ color: "#ef4444" }}>Not a Valid Certificate</div>
              <p className="text-sm" style={{ color: "var(--color-app-text-muted)" }}>{result.error}</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
