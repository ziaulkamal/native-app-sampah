import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readBranding } from '@/api/branding';
import { setSessionExpiredHandler } from '@/api/client';
import { createAuthActions } from './authActions';
import { BRANDING_FALLBACK, toBranding, type Branding } from './branding';
import { createDataActions } from './dataActions';
import { createFeedbackActions } from './feedback';
import { initialSession } from './session';
import type { AppContextValue, AppState, UiActions } from './types';
import { usePulse } from './usePulse';

const AppContext = createContext<AppContextValue | null>(null);

/**
 * Store aplikasi — porting `store/AppContext.tsx` web.
 *
 * Dua irisan web dilepas dari sini: `dark`/`toggleDark` pindah ke `ThemeProvider`
 * (penyimpanannya asinkron, tak bisa dibaca sinkron seperti `localStorage`) dan
 * `screen`/`stack` ke React Navigation. Sisanya — sesi, data role, umpan balik —
 * bentuknya sama persis supaya layar bisa diporting tanpa menulis ulang logikanya.
 */
const INITIAL: AppState = {
  ...initialSession,
  branding: BRANDING_FALLBACK,
  dataState: 'loading',
  dataError: null,
  dataRevision: 0,
  bills: [],
  transactions: [],
  customers: [],
  bankAccounts: [],
  deposits: [],
  cashOnHand: null,
  complaints: [],
  tariffs: [],
  zones: [],
  operators: [],
  notifications: [],
  selCustomerId: null,
  selBillId: null,
  activeLocationId: null,
  alertSpec: null,
  pendingConfirm: null,
  toasts: [],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL);

  const auth = useMemo(() => createAuthActions(setState), []);
  const feedback = useMemo(() => createFeedbackActions(setState), []);
  const data = useMemo(
    () => createDataActions(setState, state.session, feedback),
    [state.session, feedback],
  );
  const ui = useMemo(() => createUiActions(setState), []);

  // Server menolak token (kedaluwarsa/dicabut) → sesi lokal ikut ditutup.
  useEffect(() => setSessionExpiredHandler(auth.endSession), [auth]);
  useEffect(() => void auth.restoreSession(), [auth]);
  // Identitas dimuat lepas dari sesi dan kegagalannya sengaja ditelan: mereknya sudah
  // punya nilai bawaan, dan menghalangi layar masuk gara-gara logo yang tak terambil
  // menukar cacat kecil dengan aplikasi yang tak bisa dipakai sama sekali.
  useEffect(() => {
    let alive = true;
    void readBranding()
      .then((dto) => {
        if (alive) setState((s) => ({ ...s, branding: toBranding(dto) }));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => void data.refresh(), [data]);
  usePulse(state.session !== null, data);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      authed: state.session !== null,
      role: state.session?.role ?? 'pelanggan',
      ...auth,
      ...data,
      ...feedback,
      ...ui,
    }),
    [state, auth, data, feedback, ui],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/** Aksi murni tampilan yang tersisa setelah navigasi & tema pindah keluar. */
function createUiActions(setState: React.Dispatch<React.SetStateAction<AppState>>): UiActions {
  return {
    selectCustomer: (id: string | null) => setState((s) => ({ ...s, selCustomerId: id })),
    setActiveLocation: (id: string | null) => setState((s) => ({ ...s, activeLocationId: id })),
    setBranding: (branding: Branding) => setState((s) => ({ ...s, branding })),
  };
}

/** Akses app store. Melempar error bila dipakai di luar provider. */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
