import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import LandingPage from "../pages/LandingPage/LandingPage";
import LoginPage from "../pages/LoginPage/LoginPage";
import DashboardPage from "../pages/DashboardPage/DashboardPage";
import AdminDashboard from "../pages/AdminPanel/AdminDashboard";
import AdminNewsManager from "../pages/AdminPanel/AdminNewsManager";
import AdminBlogsManager from "../pages/AdminPanel/AdminBlogsManager";
import AdminDocsManager from "../pages/AdminPanel/AdminDocsManager";
import AdminChallengesManager from "../pages/AdminPanel/AdminChallengesManager";
import AlgorithmPage from "../pages/AlgorithmPage/AlgorithmPage";
import BlochSphereFullScreenPage from "../pages/BlochSphereFullScreenPage/BlochSphereFullScreenPage";
import SandboxPage from "../pages/SandboxPage/SandboxPage";
import CircuitSimulatorPage from "../pages/CircuitSimulatorPage/CircuitSimulatorPage";
import CircuitChallengesPage from "../pages/CircuitChallengesPage/CircuitChallengesPage";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";
import AnimatedPage from "../components/AnimatedPage/AnimatedPage";
import AdminAddAlgorithm from "../pages/AdminPanel/AdminAddAlgorithm";
import AdminAlgorithmEditor from "../pages/AdminPanel/AdminAlgorithmEditor";
import DocsPage from "../pages/DocsPage/DocsPage";
import BlogsPage from "../pages/BlogsPage/BlogsPage";
import NewsPage from "../pages/NewsPage/NewsPage";
import NewsViewerPage from "../pages/NewsPage/NewsViewerPage";
import QuantumPlayground from "../pages/QuantumPlayground/QuantumPlayground";
import BlogViewerPage from "../pages/BlogViewerPage/BlogViewerPage";
import EntanglementLabPage from "../pages/EntanglementLabPage/EntanglementLabPage";
import AdminUserAnalytics from "../pages/AdminPanel/AdminUserAnalytics";
import AdminUsersManager from "../pages/AdminPanel/AdminUsersManager";
import AdminCoursesManager from "../pages/AdminPanel/AdminCoursesManager";
import CoursesPage from "../pages/CoursesPage/CoursesPage";
import CourseViewerPage from "../pages/CoursesPage/CourseViewerPage";
import AdminInstructorDashboard from "../pages/AdminPanel/AdminInstructorDashboard";
import VerifyCertificatePage from "../pages/VerifyCertificatePage/VerifyCertificatePage";
import MicroModulesPage from "../pages/MicroModulesPage/MicroModulesPage";
import MicroModuleViewerPage from "../pages/MicroModulesPage/MicroModuleViewerPage";
import ExplorePage from "../pages/ExplorePage/ExplorePage";
import AlgorithmsPage from "../pages/AlgorithmsPage/AlgorithmsPage";
import MyGeneratedLessonsPage from "../pages/MyGeneratedLessonsPage/MyGeneratedLessonsPage";
import GeneratedLessonViewer from "../components/GeneratedLesson/GeneratedLessonViewer";

/**
 * Application routes.
 */
export default function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes (with their own Navbar inside) */}
        <Route path="/" element={<AnimatedPage><LandingPage /></AnimatedPage>} />
        <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
        <Route path="/register" element={<AnimatedPage><LoginPage defaultRegister /></AnimatedPage>} />
        <Route path="/docs" element={<AnimatedPage><DocsPage /></AnimatedPage>} />
        <Route path="/news" element={<AnimatedPage><NewsPage /></AnimatedPage>} />
        <Route path="/news/:id" element={<AnimatedPage><NewsViewerPage /></AnimatedPage>} />
        
        <Route path="/explore" element={<AnimatedPage><ExplorePage /></AnimatedPage>} />
        <Route path="/algorithms" element={<AnimatedPage><AlgorithmsPage /></AnimatedPage>} />
        <Route path="/courses" element={<AnimatedPage><CoursesPage /></AnimatedPage>} />
        <Route path="/courses/:id" element={<AnimatedPage><CourseViewerPage /></AnimatedPage>} />
        <Route path="/micro-modules" element={<AnimatedPage><MicroModulesPage /></AnimatedPage>} />
        <Route path="/micro-modules/:id" element={<AnimatedPage><MicroModuleViewerPage /></AnimatedPage>} />
        
        {/* User-Generated Interactive Learning (Phase 7H) */}
        <Route path="/my-learning/generated-lessons" element={<ProtectedRoute><AnimatedPage><MyGeneratedLessonsPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/generated-lessons/:lessonId" element={<ProtectedRoute><AnimatedPage><GeneratedLessonViewer /></AnimatedPage></ProtectedRoute>} />
        
        <Route path="/verify" element={<AnimatedPage><VerifyCertificatePage /></AnimatedPage>} />
        <Route path="/verify/:certificateId" element={<AnimatedPage><VerifyCertificatePage /></AnimatedPage>} />
        
        <Route path="/entanglement-lab" element={<ProtectedRoute><AnimatedPage><EntanglementLabPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/blogs" element={<AnimatedPage><BlogsPage /></AnimatedPage>} />
        <Route path="/blogs/:id" element={<AnimatedPage><BlogViewerPage /></AnimatedPage>} />

        {/* Protected routes (use MainLayout with Navbar + Sidebar) */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<AnimatedPage><DashboardPage /></AnimatedPage>} />
          <Route path="/algorithm/:id" element={<AnimatedPage><AlgorithmPage /></AnimatedPage>} />
          <Route path="/sandbox" element={<AnimatedPage><SandboxPage /></AnimatedPage>} />
          <Route path="/circuit-simulator" element={<AnimatedPage><CircuitSimulatorPage /></AnimatedPage>} />
          <Route path="/circuit-challenges" element={<AnimatedPage><CircuitChallengesPage /></AnimatedPage>} />
          <Route path="/playground" element={<AnimatedPage><QuantumPlayground /></AnimatedPage>} />
          <Route path="/entanglement-lab" element={<AnimatedPage><EntanglementLabPage /></AnimatedPage>} />

          {/* ─── Admin Routes ──────────────────────────────────── */}
          <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AnimatedPage><AdminDashboard /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin/user-analytics" element={<ProtectedRoute adminOnly={true}><AnimatedPage><AdminUserAnalytics /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly={true}><AnimatedPage><AdminUsersManager /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin/news" element={<ProtectedRoute adminOnly={true}><AnimatedPage><AdminNewsManager /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin/blogs" element={<ProtectedRoute adminOnly={true}><AnimatedPage><AdminBlogsManager /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin/docs" element={<ProtectedRoute adminOnly={true}><AnimatedPage><AdminDocsManager /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute adminOnly={true}><AnimatedPage><AdminCoursesManager /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin/instructor" element={<ProtectedRoute adminOnly={true}><AnimatedPage><AdminInstructorDashboard /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin/playground" element={<ProtectedRoute adminOnly={true}><AnimatedPage><AdminChallengesManager /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin/add-algorithm" element={<ProtectedRoute adminOnly={true}><AnimatedPage><AdminAddAlgorithm /></AnimatedPage></ProtectedRoute>} />
          <Route
            path="/admin/edit-algorithm/:id"
            element={
              <ProtectedRoute adminOnly>
                <AnimatedPage><AdminAlgorithmEditor /></AnimatedPage>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Full screen routes */}
        <Route
          path="/blochsphere"
          element={
            <ProtectedRoute>
              <AnimatedPage><BlochSphereFullScreenPage /></AnimatedPage>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
