import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

const confirmModal = Swal.mixin({
  customClass: {
    confirmButton: "btn btn-danger me-2",
    cancelButton: "btn btn-light-secondary",
  },
  buttonsStyling: false,
});

export const showToast = {
  success: (title = "Berhasil") =>
    Toast.fire({
      icon: "success",
      title,
    }),

  error: (title = "Terjadi kesalahan") =>
    Toast.fire({
      icon: "error",
      title,
    }),

  warning: (title = "Peringatan") =>
    Toast.fire({
      icon: "warning",
      title,
    }),
};

const DEFAULT_CONFIRM_OPTIONS = {
  title: "Apakah Anda yakin?",
  text: "Tindakan ini tidak dapat diurungkan.",
  icon: "question",
  confirmButtonText: "Ya, lanjutkan",
  cancelButtonText: "Batal",
};

export async function confirmAction(options = {}) {
  const config = { ...DEFAULT_CONFIRM_OPTIONS, ...options };

  const result = await confirmModal.fire({
    title: config.title,
    text: config.text,
    icon: config.icon,
    showCancelButton: true,
    confirmButtonText: config.confirmButtonText,
    cancelButtonText: config.cancelButtonText,
  });

  return result.isConfirmed;
}
