import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./components/MainLayout";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import DashboardPage from "./pages/DashboardPage";
import AcademicYearsPage from "./pages/AcademicYearsPage";
import AcademicYearsForm from "./components/AcademicYearForm";

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
              element={
                <MainLayout>
                  <Outlet />
                </MainLayout>
              }
            >
              <Route path="/" element={<DashboardPage />} />
            </Route>
          </Route>

          {/* Protected Routes Khusus Admin */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<MainLayout />}>
              <Route path="/academic-years" element={<AcademicYearsPage />} />
              <Route
                path="/academic-years/create"
                element={<AcademicYearsForm />}
              />
              <Route
                path="/academic-years/:id/edit"
                element={<AcademicYearsForm />}
              />
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to={"/"} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
