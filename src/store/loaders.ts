import {
  toBankAccount,
  toBill,
  toCashOnHand,
  toComplaint,
  toDeposit,
  toTransaction,
} from '@/api/adapters/billing';
import { toTariff, toZone } from '@/api/adapters/catalog';
import { toCustomers, toOperator } from '@/api/adapters/customer';
import * as bills from '@/api/bills';
import * as categories from '@/api/categories';
import * as customers from '@/api/customers';
import * as misc from '@/api/misc';
import * as notifications from '@/api/notifications';
import * as payments from '@/api/payments';
import * as zones from '@/api/zones';
import type { PeopleDto } from '@/api/types';
import type { Role, Tariff, Zone } from '@/types';
import type { AppState } from './types';

/** Tiap role memuat kumpulan berbeda — pelanggan tak pernah menyentuh endpoint dinas. */
export function loadFor(role: Role): Promise<Partial<AppState>> {
  if (role === 'pelanggan') return loadPelanggan();
  return role === 'operator' ? loadOperator() : loadAdmin();
}

async function loadAdmin(): Promise<Partial<AppState>> {
  const [
    tariffs,
    zoneList,
    people,
    billList,
    paymentList,
    complaints,
    users,
    banks,
    deposits,
    notifs,
  ] = await Promise.all([
    categories.listCategories(),
    zones.listZones(),
    customers.listPeople(),
    bills.listBills(),
    payments.listPayments(),
    misc.listComplaints(),
    misc.listUsers({ level: 2 }),
    misc.listBankAccounts(),
    misc.listDeposits(),
    notifications.listNotifications(),
  ]);

  return {
    tariffs: tariffs.map(toTariff),
    zones: zoneList.map(toZone),
    customers: toCustomers(people.data),
    bills: billList.data.map(toBill),
    transactions: paymentList.data.map(toTransaction),
    complaints: complaints.data.map(toComplaint),
    operators: users.data.map(toOperator),
    bankAccounts: banks.map(toBankAccount),
    deposits: deposits.data.map(toDeposit),
    notifications: notifs,
  };
}

/** Petugas: server sudah mempersempit pelanggan, tagihan, dan titik peta ke zonanya. */
async function loadOperator(): Promise<Partial<AppState>> {
  const [tariffs, zoneList, people, billList, paymentList, deposits, banks, cash, notifs] =
    await Promise.all([
      categories.listCategories(),
      zones.listZones(),
      customers.listPeople(),
      bills.listBills(),
      payments.listPayments(),
      misc.listDeposits(),
      misc.listBankAccounts(),
      misc.cashOnHand(),
      notifications.listNotifications(),
    ]);

  return {
    tariffs: tariffs.map(toTariff),
    zones: zoneList.map(toZone),
    customers: toCustomers(people.data),
    bills: billList.data.map(toBill),
    transactions: paymentList.data.map(toTransaction),
    deposits: deposits.data.map(toDeposit),
    bankAccounts: banks.map(toBankAccount),
    cashOnHand: toCashOnHand(cash),
    notifications: notifs,
  };
}

/** Pelanggan hanya melihat datanya sendiri; endpoint `/my/*` yang menegakkannya. */
async function loadPelanggan(): Promise<Partial<AppState>> {
  const [profile, billList, paymentList, complaints, banks, notifs] = await Promise.all([
    customers.myProfile(),
    bills.listMyBills(),
    payments.listMyPayments(),
    misc.listMyComplaints(),
    misc.listBankAccounts(),
    // Notifikasi pelanggan selalu bertuan (`user_id`) — hasil verifikasi
    // pembayarannya sendiri, bukan kabar untuk seluruh pelanggan.
    notifications.listNotifications(),
  ]);

  return {
    // Titik layanan sendiri jadi satu-satunya "customers" yang dilihat pelanggan;
    // golongan & zona diambil dari sana, bukan dari daftar dinas yang tertutup baginya.
    customers: toCustomers([profile]),
    tariffs: tariffsOf(profile),
    zones: zonesOf(profile),
    bills: billList.data.map(toBill),
    transactions: paymentList.data.map(toTransaction),
    complaints: complaints.data.map(toComplaint),
    bankAccounts: banks.map(toBankAccount),
    notifications: notifs,
  };
}

/** Golongan yang relevan bagi pelanggan: hanya yang menempel di titiknya sendiri. */
function tariffsOf(profile: PeopleDto): Tariff[] {
  const seen = new Map<string, Tariff>();
  for (const location of profile.locations ?? []) {
    if (location.category != null) seen.set(location.category.id, toTariff(location.category));
  }
  return [...seen.values()];
}

/** Zona berikut jadwal angkutnya, ikut terkirim bersama titik layanan pelanggan. */
function zonesOf(profile: PeopleDto): Zone[] {
  const seen = new Map<string, Zone>();
  for (const location of profile.locations ?? []) {
    if (location.zone != null) seen.set(location.zone.id, toZone(location.zone));
  }
  return [...seen.values()];
}
