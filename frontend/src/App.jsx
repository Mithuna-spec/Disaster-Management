import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import BeneficiaryDashboard from './pages/BeneficiaryDashboard';
import DisasterEvents from './pages/DisasterEvents';
import EmergencyRequests from './pages/EmergencyRequests';
import Volunteers from './pages/Volunteers';
import Tasks from './pages/Tasks';
import Resources from './pages/Resources';
import Notifications from './pages/Notifications';
import AuditLogs from './pages/AuditLogs';
import ProfileSettings from './pages/ProfileSettings';

// Loading shimmer fallback for the boot process
function AppBooting() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg text-brand-text-primary">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-brand-violet/20 border-t-brand-violet animate-spin" />
        <span className="font-outfit text-sm font-semibold tracking-wider text-brand-text-secondary animate-pulse uppercase">
          Securing EOC Terminal Connection...
        </span>
      </div>
    </div>
  );
}

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AppBooting />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Role-Based Authorization Guard
function RoleRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppBooting />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect unauthorized users to their respective dashboards
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Dashboard Dispatcher: Dynamically mounts dashboard based on user role
function DashboardDispatcher() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'VOLUNTEER':
      return <VolunteerDashboard />;
    case 'BENEFICIARY':
      return <BeneficiaryDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Navigate to="/login?mode=register" replace />} />

      {/* Protected Layout Wrapped Pages */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard index routes to the dispatcher */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardDispatcher />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<ProfileSettings />} />

        {/* Admin-only Routes */}
        <Route
          path="disasters"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <DisasterEvents />
            </RoleRoute>
          }
        />
        <Route
          path="emergency-requests"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <EmergencyRequests />
            </RoleRoute>
          }
        />
        <Route
          path="tasks"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <Tasks />
            </RoleRoute>
          }
        />
        <Route
          path="volunteers"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <Volunteers />
            </RoleRoute>
          }
        />
        <Route
          path="resources"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <Resources />
            </RoleRoute>
          }
        />
        <Route
          path="audit-logs"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AuditLogs />
            </RoleRoute>
          }
        />
      </Route>

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
