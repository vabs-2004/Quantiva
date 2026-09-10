import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6b7280"];

export default function AdminUserAnalytics() {
  const { token } = useAuth();
  const [data, setData] = useState({ os: [], gender: [], age: [] });
  const [pageViews, setPageViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const [demoRes, pageRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/analytics/users?filter=${timeFilter}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/analytics/page-views?filter=${timeFilter}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setData(demoRes.data);
        setPageViews(pageRes.data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, timeFilter]);

  if (loading) {
    return <div className="p-8 text-[var(--color-app-text-muted)] animate-pulse">Loading Analytics...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-[var(--color-app-text-main)]">User Demographics & Analytics</h1>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="rounded-lg px-4 py-2 text-sm outline-none transition-all cursor-pointer shadow-sm"
          style={{
            border: "1px solid var(--color-app-border)",
            background: "var(--color-app-surface)",
            color: "var(--color-app-text-main)",
          }}
        >
          <option value="all">All Time</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="5months">Last 5 Months</option>
          <option value="year">Last Year</option>
          <option value="10years">Last 10 Years</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* OS Distribution */}
        <div className="app-glass p-6 rounded-xl border border-[var(--color-app-border)]">
          <h2 className="text-lg font-bold mb-4 text-[var(--color-app-primary)]">Operating System Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.os}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.os.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-app-base)', borderColor: 'var(--color-app-border)', color: 'var(--color-app-text-main)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="app-glass p-6 rounded-xl border border-[var(--color-app-border)]">
          <h2 className="text-lg font-bold mb-4 text-[var(--color-app-primary)]">Gender Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.gender}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.gender.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-app-base)', borderColor: 'var(--color-app-border)', color: 'var(--color-app-text-main)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Group Distribution */}
        <div className="app-glass p-6 rounded-xl border border-[var(--color-app-border)] lg:col-span-2">
          <h2 className="text-lg font-bold mb-4 text-[var(--color-app-primary)]">Age Group Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.age} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="var(--color-app-text-muted)" />
                <YAxis stroke="var(--color-app-text-muted)" />
                <Tooltip cursor={{ fill: 'rgba(139,92,246,0.1)' }} contentStyle={{ backgroundColor: 'var(--color-app-base)', borderColor: 'var(--color-app-border)', color: 'var(--color-app-text-main)' }} />
                <Bar dataKey="value" fill="var(--color-app-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Page Popularity */}
        <div className="app-glass p-6 rounded-xl border border-[var(--color-app-border)] lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[var(--color-app-primary)]">Page Popularity</h2>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm border border-[var(--color-app-border)] outline-none bg-[var(--color-app-base)] text-[var(--color-app-text-main)]"
            >
              <option value="all">All Time</option>
              <option value="year">Last 1 Year</option>
              <option value="month">Last 1 Month</option>
              <option value="week">Last 7 Days</option>
            </select>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pageViews} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <XAxis type="number" stroke="var(--color-app-text-muted)" />
                <YAxis dataKey="name" type="category" stroke="var(--color-app-text-muted)" tick={{ fontSize: 12 }} width={150} />
                <Tooltip cursor={{ fill: 'rgba(139,92,246,0.1)' }} contentStyle={{ backgroundColor: 'var(--color-app-base)', borderColor: 'var(--color-app-border)', color: 'var(--color-app-text-main)' }} />
                <Bar dataKey="visits" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
