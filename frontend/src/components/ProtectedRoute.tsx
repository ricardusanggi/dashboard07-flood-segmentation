// frontend/src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/useAuth";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, role, loading } = useAuth();

  // ⬇ Tunggu sampai fetchProfile selesai
  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  // ⬇ Jika belum login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ⬇ Jika role masih "public" → belum diverifikasi admin
  if (role === "public") {
    return (
      <div className="w-full h-screen flex justify-center items-center text-center p-4">
        <div>
          <h2 className="text-xl font-bold mb-3">Your account is not verified</h2>
          <p className="text-gray-600 mb-4">
            Please wait until admin approves your account.
          </p>

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => (window.location.href = "/")}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // ⬇ Registered / Admin → akses OK
  return children;
}
