import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import "../../public/mazer/compiled/css/auth.css";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;

        if (status === 429) {
          setErrorMessage(
            "Terlalu banyak percobaan login. Silahkan tunggu 1 menit.",
          );
        } else if (status === 422) {
          setErrorMessage(data.message || "Email atau password salah.");
          if (data.errors) {
            setFieldErrors(data.errors);
          }
        } else {
          setErrorMessage(data.message || "Terjadi kesalahan pada server.");
        }
      } else {
        setErrorMessage("Gagal terhubung ke server backend.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div id="auth">
      <div className="auth">
        <div className="row h-100">
          <div className="col-lg-5 col-12">
            <div id="auth-left">
              <div className="auth-logo">
                <a href="#">
                  <h3 className="text-primary fw-bold">EduPay</h3>
                </a>
              </div>
              <h1 className="auth-title">Log in.</h1>
              <p className="auth-subtitle mb-5">
                Masuk dengan akun Admin atau Principal yang telah terdaftar.
              </p>

              {/* Alert Error */}
              {errorMessage && (
                <div
                  className="alert alert-danger alert-dismissible fade show mb-4"
                  role="alert"
                >
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errorMessage}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                {/* Field Email */}
                <div className="form-group position-relative has-icon-left mb-4">
                  <input
                    type="email"
                    className={`form-control form-control-xl ${fieldErrors.email ? "is-invalid" : ""}`}
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />

                  <div className="form-control-icon">
                    <i className="bi bi-person"></i>
                  </div>
                  {fieldErrors.email && (
                    <div className="invalid-feedback d-block">
                      {fieldErrors.email[0]}
                    </div>
                  )}
                </div>

                {/* Field Password */}
                <div className="form-group position-relative has-icon-left mb-4">
                  <input
                    type="password"
                    className={`form-control form-control-xl ${fieldErrors.password ? "is-invalid" : ""}`}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />

                  <div className="form-control-icon">
                    <i className="bi bi-shield-lock"></i>
                  </div>
                  {fieldErrors.password && (
                    <div className="invalid-feedback d-block">
                      {fieldErrors.password[0]}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg shadow-lg mt-5 w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Memproses
                    </>
                  ) : (
                    "Log in"
                  )}
                </button>
              </form>

              <div className="text-center mt-5 text-lg fs-4">
                <p className="text-secondary">
                  Sistem Manajemen Pembayaran Sekolah
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
