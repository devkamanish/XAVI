import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";
import { OrgProvider } from "./context/OrgContext";
import { SocketProvider } from "./context/SocketContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import IncidentListPage from "./pages/IncidentListPage";
import IncidentDetailPage from "./pages/IncidentDetailPage";
import IncidentFormPage from "./pages/IncidentFormPage";
import SettingsPage from "./pages/SettingsPage";
import ActivityPage from "./pages/ActivityPage";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrgProvider>
          <SocketProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "#1e293b",
                  color: "#e2e8f0",
                  border: "1px solid #334155",
                  fontSize: "14px",
                },
                success: {
                  iconTheme: { primary: "#22c55e", secondary: "#fff" },
                },
                error: {
                  iconTheme: { primary: "#ef4444", secondary: "#fff" },
                },
              }}
            />

            <Routes>
              {}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="incidents" element={<IncidentListPage />} />
                <Route path="incidents/new" element={<IncidentFormPage />} />
                <Route path="incidents/:id" element={<IncidentDetailPage />} />
                <Route path="incidents/:id/edit" element={<IncidentFormPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </SocketProvider>
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
