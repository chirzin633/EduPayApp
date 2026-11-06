<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Kuitansi Pembayaran - {{ $payment->receipt_number }}</title>

    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            margin: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333333;
            padding-bottom: 10px;
        }

        .school-name {
            font-size: 18px;
            font-weight: bold;
        }

        .school-address {
            font-size: 10px;
            color: #555;
            margin-top: 4px;
        }

        .receipt-title {
            font-size: 16px;
            font-weight: bold;
            margin: 15px 0;
            text-align: center;
        }

        table.info {
            width: 100%;
            margin-bottom: 15px;
        }

        table.info td {
            padding: 3px 0;
            vertical-align: top;
        }

        table.info td.label {
            width: 160px;
            font-weight: bold;
        }

        table.details {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        table.details th,
        table.details td {
            border: 1px solid #ccc;
            padding: 6px 8px;
            text-align: left;
        }

        table.details th {
            background-color: #f5f5f5;
        }

        .total-row td {
            font-weight: bold;
            border-top: 2px solid #333;
        }

        .footer {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }

        .signature-box {
            text-align: center;
            width: 200px;
        }

        .signature-line {
            border-top: 1px solid #333;
            margin-top: 50px;
            padding-top: 4px;
        }

        .note {
            font-size: 9px;
            color: #777;
            margin-top: 20px;
            text-align: center;
        }
    </style>
</head>

<body>
    {{-- Header --}}
    <header class="header">
        <div class="school-name">SEKOLAH DASAR ISLAM TERPADU</div>
        <div class="school-address">Jl. Cipto, Kesambi, Kota Cirebon | Telp: (0231) 123456</div>
    </header>

    <div class="receipt-title">KWITANSI PEMBAYARAN</div>

    {{-- Informasi Transaksi --}}
    <table class="info">
        <tr>
            <td class="label">No. Kuitansi</td>
            <td>: {{ $payment->receipt_number }}</td>
        </tr>
        <tr>
            <td class="label">Tanggal Pembayaran</td>
            <td>: {{ $payment->payment_date->format('d/m/Y') }}</td>
        </tr>
        <tr>
            <td class="label">Metode Pembayaran</td>
            <td>: {{ strtoupper(str_replace('_', ' ', $payment->payment_method)) }}</td>
        </tr>
    </table>

    {{-- Informasi Siswa --}}
    <table class="info">
        <tr>
            <td class="label">NIS</td>
            <td>: {{ $invoice->student->nis }}</td>
        </tr>
        <tr>
            <td class="label">Nama Siswa</td>
            <td>: {{ $invoice->student->full_name }}</td>
        </tr>
        <tr>
            <td class="label">Kelas</td>
            <td>: {{ $assignment->classModel->name ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Tahun Ajaran</td>
            <td>: {{ $invoice->academicYear->name }}</td>
        </tr>
        <tr>
            <td class="label">No. Tagihan</td>
            <td>: {{ $invoice->invoice_number }}</td>
        </tr>
    </table>

    {{-- Rincian Pembayaran --}}
    <table class="details">
        <thead>
            <tr>
                <th>Keterangan</th>
                <th style="text-align: right;">Nominal</th>
            </tr>
        </thead>

        <tbody>
            @foreach ($invoice->items as $item)
                <tr>
                    <td>{{ $item->fee_name }}</td>
                    <td style="text-align: right;">Rp {{ number_format($item->amount, 0, ',', '.') }}</td>
                </tr>
            @endforeach
            @if ($invoice->discount_amount > 0)
                <tr>
                    <td>Diskon
                        ({{ $invoice->discount_type === 'percentage' ? $invoice->discount_rate . '%' : 'Nominal' }})
                    </td>
                    <td style="text-align: right;">- Rp {{ number_format($invoice->discount_amount, 0, ',', '.') }}
                    </td>
                </tr>
            @endif

            <tr class="total-row">
                <td>Total Tagihan</td>
                <td style="text-align: right;">Rp {{ number_format($invoice->total_amount, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td>Jumlah Dibayar</td>
                <td style="text-align: right;">Rp {{ number_format($payment->amount, 0, ',', '.') }}</td>
            </tr>
            <tr class="total-row">
                <td>Sisa Tunggakan</td>
                <td style="text-align: right;">Rp {{ number_format($invoice->outstanding_amount, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    {{-- Tanda Tangan --}}
    <div class="footer">
        <div class="signature-box">
            <div>Orang Tua / Wali</div>
            <div class="signature-line">( __________________ )</div>
        </div>
        <div class="signature-box">
            <div>Petugas Keuangan</div>
            <div class="signature-line">{{ $payment->recorder->name }}</div>
        </div>
    </div>

    <div class="note">
        Dokumen ini dicetak secara otomatis oleh sistem. Simpan kuitansi ini sebagai bukti pembayaran yang sah.
    </div>

</body>

</html>
