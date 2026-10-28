// frontend/src/components/AdminRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/useAuth";

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, role, loading } = useAuth();

  // ⏳ Tunggu sampai fetchProfile selesai
  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  // ⛔ Jika belum login → redirect ke login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ⛔ Jika user.tapi role masih public → belum diverifikasi
  if (role === "public") {
    return (
      <div className="w-full h-screen flex justify-center items-center text-center p-4">
        <div>
          <h2 className="text-xl font-bold mb-3 text-red-600">Account Not Verified</h2>
          <p className="text-gray-600 mb-4">Your account is awaiting admin approval.</p>
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

  // ⛔ Jika bukan admin → tolak akses
  if (role !== "admin") {
    return (
      <div className="w-full h-screen flex justify-center items-center text-center p-4">
        <div>
          <h2 className="text-xl font-bold mb-3 text-red-600">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You do not have permission to access the admin dashboard.
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

  // ✔ Jika admin → izinkan
  return children;
}
