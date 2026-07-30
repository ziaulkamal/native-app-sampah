import { formatDate, formatPeriod } from '@/lib/dates';
import type {
  Bill,
  BillStatus,
  CashOnHand,
  Complaint,
  Deposit,
  PayMethod,
  Transaction,
  TxStatus,
} from '@/types';
import type {
  BankAccountDto,
  BillDto,
  CashOnHandDto,
  ComplaintDto,
  DepositDto,
  PaymentDto,
} from '../types';
import type { BankAccount } from '@/types';

/** Tagihan server → Bill domain, lengkap dengan dendanya. */
export function toBill(dto: BillDto): Bill {
  return {
    id: dto.id,
    customerId: dto.service_location_id,
    period: formatPeriod(dto.period_start),
    periodStart: dto.period_start,
    amount: dto.amount,
    penalty: dto.penalty_total ?? 0,
    status: toBillStatus(dto),
    dueDate: formatDate(dto.due_date),
    paidAt: dto.paid_at === null ? undefined : formatDate(dto.paid_at),
  };
}

/** `tunggakan` adalah status turunan (belum bayar + lewat jatuh tempo), dihitung server. */
function toBillStatus(dto: BillDto): BillStatus {
  if (dto.status === 'paid') return 'lunas';
  return dto.is_overdue ? 'tunggakan' : 'belum_bayar';
}

/**
 * Pembayaran → baris riwayat. Satu pembayaran bisa melunasi beberapa tagihan sekaligus;
 * periode yang ditampilkan adalah tagihan terlama di dalamnya.
 */
export function toTransaction(dto: PaymentDto): Transaction {
  const oldest = [...(dto.bills ?? [])].sort((a, b) =>
    a.period_start.localeCompare(b.period_start),
  )[0];
  return {
    id: dto.id,
    customerId: dto.people_id,
    customerName: dto.customer_name ?? '—',
    period: oldest === undefined ? '' : formatPeriod(oldest.period_start),
    amount: dto.total_amount,
    status: toTxStatus(dto.status),
    method: toPayMethod(dto.method),
    ref: dto.payment_code,
    date: formatDate(dto.verified_at ?? dto.created_at),
    operatorId: dto.collected_by ?? undefined,
    // Pengutipnya bila tunai; kalau tidak, petugas area — itulah yang diminta §11 agar
    // transaksi non-tunai pun bisa ditelusuri ke petugas wilayahnya.
    operatorNames:
      dto.collector_name !== undefined && dto.collector_name !== ''
        ? [dto.collector_name]
        : dto.scope_operator_names,
  };
}

function toTxStatus(status: PaymentDto['status']): TxStatus {
  if (status === 'verified') return 'selesai';
  if (status === 'rejected' || status === 'expired') return 'tertunggak';
  return 'menunggu';
}

/** Server membedakan tunai kantor & tunai petugas; UI cukup tahu itu tunai. */
function toPayMethod(method: PaymentDto['method']): PayMethod {
  if (method === 'qris') return 'qris';
  return method === 'transfer_manual' ? 'transfer' : 'tunai';
}

export function toComplaint(dto: ComplaintDto): Complaint {
  return {
    id: dto.id,
    customerId: dto.people_id,
    customerName: dto.customer_name ?? '—',
    type: dto.type,
    description: dto.description,
    status: dto.status,
    createdAt: formatDate(dto.created_at),
  };
}

export function toDeposit(dto: DepositDto): Deposit {
  return {
    id: dto.id,
    operatorId: dto.operator_id,
    operatorName: dto.operator_name ?? '—',
    amount: dto.total_amount,
    // Selagi menunggu keputusan `received_at` masih kosong; pakai tanggal pengajuan.
    date: formatDate(dto.received_at ?? dto.created_at),
    ref: dto.deposit_code,
    status: dto.status,
    note: dto.note ?? undefined,
    rejectionNote: dto.rejection_note ?? undefined,
    paymentsCount: dto.payments_count,
  };
}

export function toCashOnHand(dto: CashOnHandDto): CashOnHand {
  return {
    total: dto.total_amount,
    depositable: dto.depositable_amount,
    pendingApproval: dto.pending_approval_amount,
    deposited: dto.deposited_amount,
  };
}

export function toBankAccount(dto: BankAccountDto): BankAccount {
  return {
    id: dto.id,
    bank: dto.bank_name,
    accountNumber: dto.account_number,
    accountName: dto.account_name,
    primary: dto.is_primary,
  };
}
