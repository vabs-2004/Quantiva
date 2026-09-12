import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import AITutorPanel from "../components/AITutor/AITutorPanel";

export default function MainLayout() {
  const location = useLocation();
  const hideFooter = location.pathname === "/circuit-challenges";
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobile) {
        setIsMobile(mobile);
        setIsSidebarOpen(!mobile); // Auto close on mobile, open on desktop
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--color-app-base)", color: "var(--color-app-text-main)" }}>
      <Navbar />
      <div className="flex flex-1 relative overflow-hidden">
        {/* Mobile Overlay Backdrop */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        <Sidebar 
          isOpen={isSidebarOpen} 
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
          isMobile={isMobile} 
        />
        
        <main className="flex flex-1 flex-col w-full relative h-full">
          <div className="flex-1 overflow-y-auto w-full relative flex flex-col" data-lenis-prevent="true">
            <div className="flex-1">
              <Outlet />
            </div>
              {!hideFooter && <Footer />}
          </div>
        </main>

        {/* Mobile Sidebar Toggle Button */}
        {isMobile && !isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="fixed bottom-6 right-6 z-40 p-4 rounded-full text-white shadow-2xl transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
            style={{ 
              background: "linear-gradient(135deg, var(--color-app-primary), var(--color-app-primary-hover))",
              boxShadow: "0 8px 30px var(--color-app-primary-glow)"
            }}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>
      <AITutorPanel />
    </div>
  );
}
