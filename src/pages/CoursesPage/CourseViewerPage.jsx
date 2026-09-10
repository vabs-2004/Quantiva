import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getCourseById, getMyProgress, markLectureComplete, getCertificateForCourse, downloadCertificate } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// Simple helper to extract YouTube embed URL from various YT link formats
function getEmbedUrl(url) {
  if (!url) return "";
  let videoId = "";
  if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0];
  } else if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("watch?v=")[1]?.split("&")[0];
  } else if (url.includes("youtube.com/embed/")) {
    return url;
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

export default function CourseViewerPage() {
  const { id } = useParams();
  const { isLoggedIn } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLectureIndex, setCurrentLectureIndex] = useState(0);
  const [completedLectures, setCompletedLectures] = useState(new Set());
  const [marking, setMarking] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadCourse() {
      try {
        const data = await getCourseById(id);
        setCourse(data);
      } catch (err) {
        console.error("Failed to load course:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourse();

    if (isLoggedIn) {
      getMyProgress()
        .then((data) => {
          const entry = data.progress.courseProgress.find((c) => (c.course?._id || c.course) === id);
          if (entry) setCompletedLectures(new Set(entry.completedLectures));
        })
        .catch(() => {});

      getCertificateForCourse(id)
        .then((cert) => setCertificate(cert))
        .catch(() => {}); // 404 — not completed yet, that's fine
    }
  }, [id, isLoggedIn]);

  const handleMarkComplete = async () => {
    if (!isLoggedIn || marking) return;
    setMarking(true);
    try {
      const res = await markLectureComplete(id, currentLectureIndex);
      setCompletedLectures((prev) => new Set(prev).add(currentLectureIndex));
      if (res.certificate) setCertificate(res.certificate);
    } catch (err) {
      console.error("Failed to mark lecture complete:", err);
    }
    setMarking(false);
  };

  const handleDownloadCertificate = async () => {
    if (!certificate || downloading) return;
    setDownloading(true);
    try {
      await downloadCertificate(certificate.certificateId, `QSL-Certificate-${course.title}.pdf`);
    } catch (err) {
      console.error("Failed to download certificate:", err);
    }
    setDownloading(false);
  };

  if (loading) {
    return <div className="min-h-screen pt-24 text-center text-[var(--color-app-text-muted)] animate-pulse">Loading course details...</div>;
  }

  if (!course) {
    return <div className="min-h-screen pt-24 text-center text-[var(--color-app-text-muted)]">Course not found.</div>;
  }

  const currentLecture = course.lectures?.[currentLectureIndex];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8 max-w-7xl mx-auto">
      
      {/* Video Player Section */}
      <div className="flex-1">
        <Link to="/courses" className="text-sm font-semibold text-[var(--color-app-primary)] hover:underline mb-4 inline-block">
          &larr; Back to Courses
        </Link>
        <h1 className="text-3xl font-extrabold text-[var(--color-app-text-main)] mb-2">{course.title}</h1>
        <p className="text-[var(--color-app-text-muted)] mb-6">{course.description}</p>

        {certificate && (
          <div className="mb-8 rounded-2xl p-5 border flex items-center justify-between gap-4 flex-wrap" style={{ background: "linear-gradient(135deg, rgba(201,164,76,0.1), rgba(201,164,76,0.03))", borderColor: "rgba(201,164,76,0.4)" }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎓</span>
              <div>
                <div className="font-bold text-[var(--color-app-text-main)]">Course Completed!</div>
                <div className="text-xs text-[var(--color-app-text-muted)]">Certificate ID: {certificate.certificateId}</div>
              </div>
            </div>
            <button
              onClick={handleDownloadCertificate}
              disabled={downloading}
              className="px-4 py-2.5 rounded-lg text-sm font-bold shrink-0 disabled:opacity-50 flex items-center gap-2"
              style={{ background: "#c9a44c", color: "#0f172a" }}
            >
              {downloading ? "Generating..." : "⬇ Download Certificate"}
            </button>
          </div>
        )}

        {currentLecture ? (
          <div className="app-glass p-2 rounded-2xl border border-[var(--color-app-border)] shadow-xl overflow-hidden">
            <div className="relative w-full pb-[56.25%] bg-black rounded-xl overflow-hidden">
              <iframe 
                className="absolute top-0 left-0 w-full h-full"
                src={getEmbedUrl(currentLecture.videoUrl)} 
                title={currentLecture.title} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
                  {currentLectureIndex + 1}. {currentLecture.title}
                </h2>
                {isLoggedIn && (
                  completedLectures.has(currentLectureIndex) ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/15 text-green-500 border border-green-500/30 shrink-0">
                      ✓ Completed
                    </span>
                  ) : (
                    <button
                      onClick={handleMarkComplete}
                      disabled={marking}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 disabled:opacity-50"
                      style={{ background: "var(--color-app-primary)", color: "#fff" }}
                    >
                      {marking ? "Saving..." : "Mark as Complete"}
                    </button>
                  )
                )}
              </div>
              <div className="text-sm font-semibold text-[var(--color-app-text-muted)]">
                Duration: {currentLecture.duration || "N/A"}
              </div>
            </div>
          </div>
        ) : (
          <div className="app-glass p-12 text-center rounded-2xl border border-[var(--color-app-border)] text-[var(--color-app-text-muted)]">
            No lectures available for this course yet.
          </div>
        )}
      </div>

      {/* Lectures Sidebar */}
      <div className="w-full md:w-80 shrink-0">
        <div className="app-glass p-6 rounded-2xl border border-[var(--color-app-border)] sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col">
          <h3 className="text-lg font-bold text-[var(--color-app-text-main)] mb-4">Course Content</h3>
          <div className="text-sm font-semibold text-[var(--color-app-primary)] mb-2">
            {course.lectures?.length || 0} Lectures
            {isLoggedIn && ` · ${completedLectures.size}/${course.lectures?.length || 0} completed`}
          </div>
          {isLoggedIn && (
            <div className="w-full h-1.5 rounded-full bg-[var(--color-app-surface-hover)] mb-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${course.lectures?.length ? (completedLectures.size / course.lectures.length) * 100 : 0}%`,
                  background: "linear-gradient(90deg, var(--color-app-primary), var(--color-app-accent))",
                }}
              />
            </div>
          )}
          <div className="pb-4 border-b border-[var(--color-app-border)]" />
          
          <div className="overflow-y-auto flex-1 pr-2 space-y-2 custom-scrollbar">
            {course.lectures?.map((lec, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentLectureIndex(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-1 ${
                  idx === currentLectureIndex 
                    ? "bg-[var(--color-app-primary)]/10 border-[var(--color-app-primary)]" 
                    : "bg-[var(--color-app-base)] border-transparent hover:border-[var(--color-app-border)] hover:bg-[var(--color-app-surface)]"
                }`}
              >
                <span className={`text-sm font-bold flex items-center gap-1.5 ${idx === currentLectureIndex ? "text-[var(--color-app-primary)]" : "text-[var(--color-app-text-main)]"}`}>
                  {completedLectures.has(idx) && <span className="text-green-500">✓</span>}
                  {idx + 1}. {lec.title}
                </span>
                <span className="text-xs font-semibold text-[var(--color-app-text-muted)]">
                  {lec.duration || "Video"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
