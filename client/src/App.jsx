import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./components/MainLayout";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes (Admin & Principal) */}
          <Route
            element={<ProtectedRoute allowedRoles={["admin", "principal"]} />}
          >
            <Route
              path="/"
              element={
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              }
            />
          </Route>

          {/* Protected Routes Khusus Admin */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}></Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to={"/"} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function DashboardPage() {
  return (
    <div className="card">
      <div className="card-header">
        <h4>Dashboard Page</h4>
      </div>

      <div className="card-body">
        Selamat datang di Sistem Manajemen Pembayaran Sekolah
      </div>
    </div>
  );
}
