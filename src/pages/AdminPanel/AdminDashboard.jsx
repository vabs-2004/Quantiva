import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AdminUserAnalytics from "./AdminUserAnalytics";
import AdminUsersManager from "./AdminUsersManager";
import AdminCoursesManager from "./AdminCoursesManager";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const adminCards = [
    {
      title: "Algorithms Manager",
      desc: "Add, edit, or delete quantum algorithms and parameters",
      icon: "⚛️",
      path: "/admin/add-algorithm",
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "News Manager",
      desc: "Manage global quantum news articles and featured items",
      icon: "📰",
      path: "/admin/news",
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Blogs Manager",
      desc: "Manage quantum computing blog posts and tutorials",
      icon: "✍️",
      path: "/admin/blogs",
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "Docs Manager",
      desc: "Manage W3Schools-style documentation content",
      icon: "📚",
      path: "/admin/docs",
      color: "from-orange-500 to-red-600",
    },
    {
      title: "Quantum Challenges",
      desc: "Manage challenges for the Quantum Circuit builder",
      icon: "🎮",
      path: "/admin/playground",
      color: "from-yellow-500 to-orange-600",
    },
    {
      title: "User Analytics",
      desc: "View user demographics, OS, and age distributions",
      icon: "📊",
      path: "/admin/user-analytics",
      color: "from-cyan-500 to-blue-600",
    },
    {
      title: "User Management",
      desc: "View all users, promote to Admin, or demote to User",
      icon: "👥",
      path: "/admin/users",
      color: "from-rose-500 to-red-600",
    },
    {
      title: "Courses Manager",
      desc: "Manage free video lectures and courses",
      icon: "🎓",
      path: "/admin/courses",
      color: "from-green-500 to-emerald-600",
    },
    {
      title: "Instructor Dashboard",
      desc: "Track student progress, completion rates, and struggling topics",
      icon: "📈",
      path: "/admin/instructor",
      color: "from-indigo-500 to-violet-600",
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10" style={{ background: "var(--color-app-base)" }} data-lenis-prevent="true">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-3" style={{ borderColor: "var(--color-app-error)", background: "rgba(239,68,68,0.1)" }}>
            <span className="app-pulse-dot" style={{ background: "var(--color-app-error)", boxShadow: "0 0 8px rgba(239,68,68,0.6)" }} />
            <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "var(--color-app-error)" }}>
              Admin Access Only
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-app-text-main)] mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm" style={{ color: "var(--color-app-text-muted)" }}>
            Manage platform content, documentation, algorithms, and news.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {adminCards.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => navigate(card.path)}
              className="cursor-pointer rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface)] p-6 transition-all hover:border-[var(--color-app-border)] shadow-lg"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${card.color} text-2xl shadow-lg`}>
                {card.icon}
              </div>
              <h3 className="text-lg font-bold text-[var(--color-app-text-main)] mb-2">{card.title}</h3>
              <p className="text-sm" style={{ color: "var(--color-app-text-muted)" }}>
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
