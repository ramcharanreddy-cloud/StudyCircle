
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import MyGroups from "./pages/groups/MyGroups.jsx";
import DiscoverGroups from "./pages/groups/DiscoverGroups.jsx";
import { DiscussionsPage, ResourcesPage, SessionsPage, NotificationsPage, SettingsPage, GroupDetailPage } from "./pages/workspace/WorkspacePages.jsx";
import { GroupChatPage, SharedNotesPage, CalendarPage, AdminPage } from "./pages/workspace/AdvancedPages.jsx";
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080b16]">
      <div className="flex items-center gap-3 text-violet-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
        <span className="text-sm font-medium">
          Loading StudyCircle...
        </span>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return isAuthenticated
    ? children
    : <Navigate to="/" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <MyGroups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/discover"
        element={
          <ProtectedRoute>
            <DiscoverGroups />
          </ProtectedRoute>
        }
      />
      <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetailPage /></ProtectedRoute>} />
      <Route path="/groups/:groupId/chat" element={<ProtectedRoute><GroupChatPage /></ProtectedRoute>} />
      <Route path="/groups/:groupId/notes" element={<ProtectedRoute><SharedNotesPage /></ProtectedRoute>} />
      <Route path="/groups/:groupId/discussions" element={<ProtectedRoute><DiscussionsPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><GroupChatPage /></ProtectedRoute>} />
      <Route path="/chat/:groupId" element={<ProtectedRoute><GroupChatPage /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><SharedNotesPage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="/discussions" element={<ProtectedRoute><DiscussionsPage /></ProtectedRoute>} />
      <Route path="/resources" element={<ProtectedRoute><ResourcesPage /></ProtectedRoute>} />
      <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>

  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
