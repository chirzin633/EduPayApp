export function formatRupiah(value, compact = false) {
  if (value === null || value === undefined || isNaN(value)) {
    return "-";
  }

  if (compact) {
    return new Intl.NumberFormat("id-ID", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(value);
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatMonthLabel(ym) {
  // "2026-01" → "Jan 2026"
  const [y, m] = ym.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric",
  });
}

export const PAYMENT_METHOD_LABELS = {
  cash: "Tunai",
  bank_transfer: "Transfer Bank",
  qris: "QRIS",
  debit_edc: "EDC Debit",
};

export const INVOICE_STATUS_LABELS = {
  unpaid: "Belum Dibayar",
  partially_paid: "Sebagian",
  paid: "Lunas",
};
