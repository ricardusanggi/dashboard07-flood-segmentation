import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import { useAuth } from "./store/useAuth";
import { Toaster } from "react-hot-toast";

import Home from "./pages/public/Home";
import PredictPublic from "./pages/public/PredictPublic";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import Dashboard from "./pages/user/DashboardUser";

import DashboardAdmin from "./pages/admin/DashboardAdmin";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminDatasetPage from "./pages/admin/AdminDatasetPage";
import TrainingPage from "./pages/admin/TrainingPage";
import ModelsPage from "./pages/admin/ModelsPage";
import SystemResetPage from "./pages/admin/SystemPage";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/layouts/AdminLayout";

export default function App() {

  const { fetchProfile, loading } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />

      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Home />} />
        <Route path="/predict" element={<PredictPublic />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* USER */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<DashboardAdmin />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="datasets" element={<AdminDatasetPage />} />
          <Route path="training" element={<TrainingPage />} />
          <Route path="models" element={<ModelsPage />} />
          <Route path="system-reset" element={<SystemResetPage />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Home />} />

      </Routes>
    </>
  );
}