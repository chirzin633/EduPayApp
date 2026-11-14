import api from "./api";

export async function downloadReceipt(paymentId, filename) {
  const res = await api.get(`/receipts/${paymentId}`, {
    responseType: "blob",
    headers: { Accept: "application/pdf" },
  });

  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `receipt-${paymentId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
