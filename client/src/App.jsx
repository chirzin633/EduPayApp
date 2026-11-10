import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./components/MainLayout";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import DashboardPage from "./pages/DashboardPage";

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
