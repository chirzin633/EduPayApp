import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./components/MainLayout";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import DashboardPage from "./pages/DashboardPage";
import AcademicYearsPage from "./pages/AcademicYearsPage";
import AcademicYearsForm from "./components/AcademicYearForm";
import ClassesPage from "./pages/ClassesPage";
import ClassFormPage from "./components/ClassesForm";
import StudentsPage from "./pages/StudentPage";
import StudentForm from "./components/StudentForm";
import FeeComponentPage from "./pages/FeeComponentPage";
import FeeComponentForm from "./components/FeeComponentForm";
import StudentClassAssignmentsPage from "./pages/StudentClassAssignmentsPage";
import StudentClassAssignmentsForm from "./components/StudentClassAssignmentsForm";
import InvoicePage from "./pages/InvoicePage";
import InvoiceForm from "./components/InvoiceForm";
import InvoiceDetail from "./components/InvoiceDetail";
import PaymentPage from "./pages/PaymentPage";
import PaymentForm from "./components/PaymentForm";

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
            <Route element={<MainLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/invoices" element={<InvoicePage />} />
              <Route path="/invoices/create" element={<InvoiceForm />} />
              <Route path="'/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/payments" element={<PaymentPage />} />
            </Route>
          </Route>

          {/* Protected Routes Khusus Admin */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<MainLayout />}>
              {/* Academic Years */}
              <Route path="/academic-years" element={<AcademicYearsPage />} />
              <Route
                path="/academic-years/create"
                element={<AcademicYearsForm />}
              />
              <Route
                path="/academic-years/:id/edit"
                element={<AcademicYearsForm />}
              />

              {/* Classes */}
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/classes/create" element={<ClassFormPage />} />
              <Route path="/classes/:id/edit" element={<ClassFormPage />} />

              {/* Students */}
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/create" element={<StudentForm />} />
              <Route path="/students/:id/edit" element={<StudentForm />} />

              {/* Fee Components */}
              <Route path="/fee-components" element={<FeeComponentPage />} />
              <Route
                path="/fee-components/create"
                element={<FeeComponentForm />}
              />

              {/* Student Class Assignments */}
              <Route
                path="/student-class-assignments"
                element={<StudentClassAssignmentsPage />}
              />
              <Route
                path="/student-class-assignments/create"
                element={<StudentClassAssignmentsForm />}
              />

              {/* Payments */}
              <Route path="/payments/create" element={<PaymentForm />} />
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to={"/"} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
