import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export default function AdminUsersManager() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/users?page=${page}&limit=${limit}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle both old and new API format gracefully
      if (res.data.data) {
        setUsers(res.data.data);
        setTotalPages(res.data.totalPages);
      } else {
        setUsers(res.data);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRole(userId, currentRole) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (userId === currentUser.id) {
      alert("You cannot change your own role!");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to make this user an ${newRole}?`)) return;

    try {
      await axios.put(
        `${API_BASE_URL}/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Failed to update role", error);
      alert("Failed to update role");
    }
  }

  if (loading) {
    return <div className="p-8 text-[var(--color-app-text-muted)] animate-pulse">Loading Users...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-[var(--color-app-text-main)]">User Management</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
            className="w-full md:w-64 rounded-lg px-4 py-2 pl-10 text-sm outline-none transition-all"
            style={{
              border: "1px solid var(--color-app-border)",
              background: "var(--color-app-base)",
              color: "var(--color-app-text-main)",
            }}
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-app-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      <div className="overflow-x-auto app-glass rounded-xl border border-[var(--color-app-border)] shadow-lg mb-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-[rgba(139,92,246,0.1)] text-[var(--color-app-text-main)] uppercase border-b border-[var(--color-app-border)]">
            <tr>
              <th className="px-6 py-4 font-bold">Name</th>
              <th className="px-6 py-4 font-bold">Username</th>
              <th className="px-6 py-4 font-bold">Email</th>
              <th className="px-6 py-4 font-bold">Role</th>
              <th className="px-6 py-4 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-app-border)] text-[var(--color-app-text-muted)]">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <td className="px-6 py-4">{u.name || "-"}</td>
                <td className="px-6 py-4 font-medium" style={{ color: "var(--color-app-primary)" }}>{u.username}</td>
                <td className="px-6 py-4">{u.email || "-"}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    u.role === "admin" 
                      ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  }`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleRole(u._id, u.role)}
                    disabled={u._id === currentUser?.id}
                    className="px-3 py-1 rounded border border-[var(--color-app-border)] bg-[var(--color-app-base)] text-[var(--color-app-text-main)] hover:bg-[var(--color-app-primary)] hover:border-[var(--color-app-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-base)] text-[var(--color-app-text-main)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            Previous
          </button>
          <span className="text-sm font-medium" style={{ color: "var(--color-app-text-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-base)] text-[var(--color-app-text-main)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
