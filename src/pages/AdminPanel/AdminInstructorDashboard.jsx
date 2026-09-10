import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getCohortProgress } from "../../services/api";

export default function AdminInstructorDashboard() {
  const [cohort, setCohort] = useState([]);
  const [aggregate, setAggregate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState("completionRate");

  useEffect(() => {
    getCohortProgress()
      .then((data) => {
        setCohort(data.cohort);
        setAggregate(data.aggregate);
      })
      .catch((err) => setError(err?.response?.data?.error || "Failed to load cohort data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-[var(--color-app-text-muted)] animate-pulse">Loading student progress...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-400">{error}</div>;
  }

  const sorted = [...cohort].sort((a, b) => b[sortKey] - a[sortKey]);
  const chartData = sorted.slice(0, 10).map((c) => ({ name: c.username, rate: c.completionRate }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--color-app-text-main)]">Instructor Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-app-text-muted)" }}>
          Cohort-wide progress across courses, challenges, and algorithm runs.
        </p>
      </div>

      {/* Aggregate Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: "Total Students", value: aggregate.totalStudents, color: "var(--color-app-primary)" },
          { label: "Avg. Completion Rate", value: `${aggregate.avgCompletionRate}%`, color: "var(--color-app-accent)" },
          { label: "Total Challenges", value: aggregate.totalChallenges, color: "#f59e0b" },
          { label: "Total Courses", value: aggregate.totalCourses, color: "#10b981" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-5 app-glass border border-[var(--color-app-border)]">
            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-1 font-semibold" style={{ color: "var(--color-app-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Top Performers Chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl app-glass border border-[var(--color-app-border)] p-6 mb-8">
          <h2 className="text-sm font-bold mb-4" style={{ color: "var(--color-app-text-main)" }}>
            Challenge Completion Rate — Top 10 Students
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-app-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-app-text-muted)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--color-app-text-muted)" unit="%" />
              <Tooltip
                contentStyle={{ background: "var(--color-app-surface)", border: "1px solid var(--color-app-border)", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="rate" fill="var(--color-app-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cohort Table */}
      <div className="rounded-xl app-glass border border-[var(--color-app-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-app-border)" }}>
                {[
                  { key: "username", label: "Student" },
                  { key: "coursesCompleted", label: "Courses" },
                  { key: "challengesCompleted", label: "Challenges" },
                  { key: "totalAttempts", label: "Attempts" },
                  { key: "algorithmsRun", label: "Algo Runs" },
                  { key: "completionRate", label: "Completion" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => setSortKey(col.key)}
                    className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer select-none"
                    style={{ color: sortKey === col.key ? "var(--color-app-primary)" : "var(--color-app-text-muted)" }}
                  >
                    {col.label} {sortKey === col.key && "↓"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.userId} className="hover:bg-[var(--color-app-surface-hover)] transition-colors" style={{ borderBottom: "1px solid var(--color-app-border)" }}>
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: "var(--color-app-text-main)" }}>{s.name}</div>
                    <div className="text-xs" style={{ color: "var(--color-app-text-muted)" }}>@{s.username}</div>
                  </td>
                  <td className="px-4 py-3 font-mono">{s.coursesCompleted}/{s.totalCourses}</td>
                  <td className="px-4 py-3 font-mono">{s.challengesCompleted}/{s.totalChallenges}</td>
                  <td className="px-4 py-3 font-mono">{s.totalAttempts}</td>
                  <td className="px-4 py-3 font-mono">{s.algorithmsRun}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-app-surface-hover)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${s.completionRate}%`,
                            background: s.completionRate >= 70 ? "#10b981" : s.completionRate >= 30 ? "#f59e0b" : "#ef4444",
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold">{s.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center" style={{ color: "var(--color-app-text-muted)" }}>
                    No students yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
