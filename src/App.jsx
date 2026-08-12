import React, { useState, useEffect } from "react";
import {
  AlertTriangle, Info,
} from "lucide-react";
import { apiGet, apiPost } from "./api/client";
import { ArisanPage } from "./arisan/ArisanPage";
import { LoginPage } from "./auth/LoginPage";
import { GlobalStyle } from "./components/GlobalStyle";
import { Btn, Card, ConfirmDialog, Modal, Toasts } from "./components/ui";
import { ARISAN_MEMBER_IDS, ARISAN_PERIOD, DEFAULT_SETTINGS, PEMBAYARAN_PERIOD, RESIDENT_MAP } from "./constants/data";
import { C } from "./constants/theme";
import { Dashboard } from "./dashboard/Dashboard";
import { IuranWargaPage } from "./iuran/IuranWargaPage";
import { JimpitanForm } from "./jimpitan/JimpitanForm";
import { JimpitanPage } from "./jimpitan/JimpitanPage";
import { KasRT } from "./kas/KasRT";
import { ListPage } from "./kas/ListPage";
import { Sidebar } from "./layout/Sidebar";
import { Topbar } from "./layout/Topbar";
import { PembayaranWargaPage } from "./pembayaran/PembayaranWargaPage";
import { PengaturanPage } from "./pengaturan/PengaturanPage";
import { PublicHome } from "./public/PublicHome";
import { ReportPage } from "./report/ReportPage";
import { SosialPage } from "./sosial/SosialPage";
import { TransactionDetail } from "./transactions/TransactionDetail";
import { TransactionForm } from "./transactions/TransactionForm";
import { allocatePayment, computeObligation } from "./utils/dues";
import { formatPeriodLabel, formatRupiah } from "./utils/format";
import { DataRumahPage } from "./warga/DataRumahPage";
import { DataWargaPage } from "./warga/DataWargaPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [payments, setPayments] = useState([]);
  const [jimpitan, setJimpitan] = useState([]);
  const [arisan, setArisan] = useState({ riwayat: [] });
  const [households, setHouseholds] = useState([]);
  const [residents, setResidents] = useState([]);
  const [duesTypes, setDuesTypes] = useState([]);
  const [dues, setDues] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [confirmTx, setConfirmTx] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");

  const notify = (message, tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  };

  const loadFromSheet = () => {
    setLoadingData(true);
    setLoadError("");
    return apiGet("bootstrap")
      .then((data) => {
        setTransactions(data.transactions || []);
        setSettings(data.settings || DEFAULT_SETTINGS);
        setPayments(data.payments || []);
        setJimpitan(data.jimpitan || []);
        setArisan({ riwayat: data.arisanRiwayat || [] });
        setHouseholds(data.households || []);
        setResidents(data.residents || []);
        setDuesTypes(data.duesTypes || []);
        setDues(data.dues || []);
      })
      .catch((err) => setLoadError(err.message || "Gagal memuat data dari Google Spreadsheet."))
      .finally(() => setLoadingData(false));
  };

  // Data kondisi keuangan & arisan dimuat begitu sistem dibuka, tanpa
  // menunggu login — supaya pengunjung langsung melihat saldo,
  // pemasukan, pengeluaran, dan status arisan.
  useEffect(() => {
    loadFromSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions = {
    view: (tx) => setModal({ type: "detail", tx }),
    edit: (tx) => setModal({ type: "edit", tx }),
    del: (tx) => setConfirmTx(tx),
  };

  // Menyimpan transaksi ke Google Spreadsheet lalu memasukkan hasilnya ke state lokal.
  const addTransaction = async (partial) => {
    const { transaction } = await apiPost("addTransaction", { ...partial, created_by: user.name });
    setTransactions((prev) => [...prev, transaction]);
    return transaction;
  };

  const handleRecordPembayaran = async (payment, resident, { amount, date, method }) => {
    try {
      const ob = computeObligation(resident.id, settings);
      const sisa = Math.max(0, ob.total - payment.paid_amount);
      const applied = Math.min(amount, sisa);
      const kembalian = Math.max(0, amount - sisa);
      const alloc = allocatePayment(payment.paid_amount, applied, ob);
      const newPaidAmount = Math.min(ob.total, payment.paid_amount + applied);

      const { payment: savedPayment } = await apiPost("upsertPayment", {
        id: payment.id, resident_id: resident.id, period: payment.period,
        paid_amount: newPaidAmount, payment_date: date,
      });
      setPayments((prev) => prev.map((p) => (p.id === payment.id ? savedPayment : p)));

      if (alloc.iuran > 0) {
        await addTransaction({
          transaction_date: date, type: "masuk", category: "Iuran Warga", amount: alloc.iuran,
          description: `Iuran warga periode ${PEMBAYARAN_PERIOD} - ${resident.house}`, source: resident.name, payment_method: method,
        });
      }
      if (alloc.arisan > 0) {
        await addTransaction({
          transaction_date: date, type: "masuk", category: "Arisan", amount: alloc.arisan,
          description: `Setoran arisan periode ${ARISAN_PERIOD} - ${resident.house}`, source: resident.name, payment_method: method,
        });
      }
      if (alloc.sosial > 0) {
        await addTransaction({
          transaction_date: date, type: "masuk", category: "Dana Sosial", amount: alloc.sosial,
          description: `Setoran dana sosial wajib periode ${ARISAN_PERIOD} - ${resident.house}`, source: resident.name, payment_method: method,
        });
      }

      notify(
        kembalian > 0
          ? `Pembayaran tercatat. Kembalikan ${formatRupiah(kembalian)} kepada ${resident.name}.`
          : "Pembayaran warga berhasil dicatat."
      );
    } catch (err) {
      notify(err.message || "Gagal menyimpan pembayaran.", "error");
    }
  };

  const handleSaveSettings = async (newSettings) => {
    try {
      const { settings: saved } = await apiPost("saveSettings", newSettings);
      setSettings(saved);
      notify("Nominal pembayaran warga berhasil diperbarui.");
    } catch (err) {
      notify(err.message || "Gagal menyimpan pengaturan.", "error");
    }
  };

  /* -- Batch 3A: Jimpitan (Master Data Rumah) --
     Transaksi Kas RT otomatis dibuat oleh backend (bukan lagi di frontend)
     supaya nominal, tanggal, dan reference_type/reference_id-nya konsisten
     dengan baris Jimpitan yang tersimpan. */
  const handleAddJimpitan = async (payload, force) => {
    try {
      const res = await apiPost("addJimpitan", { ...payload, created_by: user.name, force: !!force });
      setJimpitan((prev) => [...prev, res.jimpitan]);
      if (res.transaction) setTransactions((prev) => [...prev, res.transaction]);
      notify("Setoran jimpitan berhasil dicatat.");
      return res;
    } catch (err) {
      // Peringatan duplikasi (tanggal + rumah sama) ditangani oleh JimpitanForm,
      // jangan tampilkan toast error untuk kasus ini.
      if (!String(err.message || "").startsWith("DUPLICATE:")) {
        notify(err.message || "Gagal menyimpan setoran jimpitan.", "error");
      }
      throw err;
    }
  };

  const handleUpdateJimpitan = async (payload) => {
    try {
      const res = await apiPost("updateJimpitan", { ...payload, created_by: user.name });
      setJimpitan((prev) => prev.map((j) => (j.id === res.jimpitan.id ? res.jimpitan : j)));
      if (res.transaction) {
        setTransactions((prev) => {
          const exists = prev.some((t) => t.id === res.transaction.id);
          return exists ? prev.map((t) => (t.id === res.transaction.id ? res.transaction : t)) : [...prev, res.transaction];
        });
      }
      notify("Pencatatan jimpitan berhasil diperbarui.");
      return res;
    } catch (err) {
      notify(err.message || "Gagal memperbarui pencatatan jimpitan.", "error");
      throw err;
    }
  };

  const handleAddSosial = async ({ type, date, amount, description, party, method }) => {
    try {
      await addTransaction({
        transaction_date: date, type, category: type === "masuk" ? "Dana Sosial" : "Sosial",
        amount, description, source: party, payment_method: method,
      });
      notify(type === "masuk" ? "Sumbangan dana sosial berhasil dicatat." : "Penyaluran bantuan sosial berhasil dicatat.");
    } catch (err) {
      notify(err.message || "Gagal menyimpan data dana sosial.", "error");
    }
  };

  const handleArisanDraw = async () => {
    const winnerIds = new Set(arisan.riwayat.map((r) => r.winner_id));
    const paymentByResident = Object.fromEntries(payments.map((p) => [p.resident_id, p]));
    const eligible = ARISAN_MEMBER_IDS.filter((id) => {
      const p = paymentByResident[id];
      const ob = computeObligation(id, settings);
      return p && p.paid_amount >= ob.total && !winnerIds.has(id);
    });
    if (eligible.length === 0) { notify("Belum ada peserta yang memenuhi syarat untuk diundi.", "error"); return; }
    const winnerId = eligible[Math.floor(Math.random() * eligible.length)];
    try {
      const { arisan: saved } = await apiPost("addArisanWinner", { period: ARISAN_PERIOD, winner_id: winnerId });
      setArisan((prev) => ({ ...prev, riwayat: [...prev.riwayat, saved] }));
      notify(`${RESIDENT_MAP[winnerId].name} terpilih sebagai pemenang arisan periode ${ARISAN_PERIOD}.`);
    } catch (err) {
      notify(err.message || "Gagal menyimpan hasil undian arisan.", "error");
    }
  };

  /* -- Phase 2: Master Data Rumah + Warga -- */
  const handleAddHousehold = async (form) => {
    try {
      const { household } = await apiPost("addHousehold", form);
      setHouseholds((prev) => [...prev, household]);
      notify(`Rumah No. ${household.house_number} berhasil ditambahkan.`);
      return household;
    } catch (err) {
      notify(err.message || "Gagal menambah data rumah.", "error");
      throw err;
    }
  };

  const handleUpdateHousehold = async (form) => {
    try {
      const { household } = await apiPost("updateHousehold", form);
      setHouseholds((prev) => prev.map((h) => (h.id === household.id ? household : h)));
      notify("Data rumah berhasil diperbarui.");
      return household;
    } catch (err) {
      notify(err.message || "Gagal memperbarui data rumah.", "error");
      throw err;
    }
  };

  const handleAddResident = async (form) => {
    try {
      const { resident } = await apiPost("addResident", form);
      setResidents((prev) => [...prev, resident]);
      if (resident.relationship === "Kepala Keluarga") {
        setHouseholds((prev) => prev.map((h) => (h.id === resident.household_id ? { ...h, head_resident_id: resident.id } : h)));
      }
      notify(`Warga "${resident.name}" berhasil ditambahkan.`);
      return resident;
    } catch (err) {
      notify(err.message || "Gagal menambah data warga.", "error");
      throw err;
    }
  };

  const handleUpdateResident = async (form) => {
    try {
      const { resident } = await apiPost("updateResident", form);
      setResidents((prev) => prev.map((r) => (r.id === resident.id ? resident : r)));
      if (resident.relationship === "Kepala Keluarga") {
        setHouseholds((prev) => prev.map((h) => (h.id === resident.household_id ? { ...h, head_resident_id: resident.id } : h)));
      }
      notify("Data warga berhasil diperbarui.");
      return resident;
    } catch (err) {
      notify(err.message || "Gagal memperbarui data warga.", "error");
      throw err;
    }
  };

  /* -- Phase 2: Master Jenis Iuran -- */
  const handleSaveDuesTypes = async (rows) => {
    try {
      const { duesTypes: saved } = await apiPost("saveDuesTypes", { duesTypes: rows });
      setDuesTypes(saved);
      notify("Jenis iuran berhasil diperbarui.");
      return saved;
    } catch (err) {
      notify(err.message || "Gagal menyimpan jenis iuran.", "error");
      throw err;
    }
  };

  /* -- Phase 2: Generate tagihan iuran bulanan -- */
  const handleGenerateDues = async ({ period, dues_type_id }) => {
    try {
      const res = await apiPost("generateDues", { period, dues_type_id });
      if (res.dues?.length) setDues((prev) => [...prev, ...res.dues]);
      if (res.created > 0) notify(`${res.created} tagihan iuran periode ${formatPeriodLabel(period)} berhasil dibuat.`);
      else notify("Tidak ada tagihan baru — seluruh rumah sudah memiliki tagihan untuk periode ini.", "info");
      return res;
    } catch (err) {
      notify(err.message || "Gagal membuat tagihan iuran.", "error");
      throw err;
    }
  };

  /* -- Phase 2: Catat pembayaran iuran (Dues + Payments + Transactions dalam satu operasi) -- */
  const handleRecordDuesPayment = async ({ dues_id, amount, date, method }) => {
    try {
      const res = await apiPost("recordPayment", { dues_id, amount, date, method, created_by: user.name });
      setDues((prev) => prev.map((d) => (d.id === res.dues.id ? res.dues : d)));
      setPayments((prev) => [...prev, res.payment]);
      setTransactions((prev) => [...prev, res.transaction]);
      notify("Pembayaran iuran berhasil dicatat & otomatis masuk Kas RT.");
      return res;
    } catch (err) {
      notify(err.message || "Gagal menyimpan pembayaran iuran.", "error");
      throw err;
    }
  };

  const handleSave = async (form) => {
    try {
      if (modal?.type === "edit") {
        const { transaction } = await apiPost("updateTransaction", { id: modal.tx.id, ...form });
        setTransactions((prev) => prev.map((t) => (t.id === modal.tx.id ? transaction : t)));
        notify("Transaksi berhasil diperbarui.");
      } else {
        await addTransaction(form);
        notify("Transaksi berhasil disimpan.");
      }
      setModal(null);
    } catch (err) {
      notify(err.message || "Gagal menyimpan transaksi.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await apiPost("deleteTransaction", { id: confirmTx.id });
      setTransactions((prev) => prev.filter((t) => t.id !== confirmTx.id));
      notify("Transaksi berhasil dihapus.");
      setConfirmTx(null);
      if (modal?.tx?.id === confirmTx.id) setModal(null);
    } catch (err) {
      notify(err.message || "Gagal menghapus transaksi.", "error");
    }
  };

  if (loadingData) {
    return (
      <div className="rtd-root flex min-h-screen items-center justify-center" style={{ background: C.bg }}>
        <GlobalStyle />
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4" style={{ borderColor: C.navyFaint, borderTopColor: C.navy }} />
          <p className="text-sm font-semibold" style={{ color: C.text }}>Memuat data dari Google Spreadsheet...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rtd-root flex min-h-screen items-center justify-center px-4" style={{ background: C.bg }}>
        <GlobalStyle />
        <Card className="max-w-sm p-6 text-center">
          <AlertTriangle size={22} style={{ color: C.red, margin: "0 auto" }} />
          <p className="mt-3 text-sm font-semibold" style={{ color: C.text }}>Gagal memuat data</p>
          <p className="mt-1 text-xs" style={{ color: C.textMuted }}>{loadError}</p>
          <Btn className="mt-4 w-full" onClick={loadFromSheet}>Coba Lagi</Btn>
        </Card>
      </div>
    );
  }

  // Belum login: pengunjung langsung disajikan kondisi keuangan &
  // arisan (PublicHome). Tombol "Masuk" membuka LoginPage untuk
  // pengurus/bendahara yang perlu akses kelola data.
  if (!user) {
    if (showLogin) {
      return <LoginPage onLogin={(acc) => { setUser(acc); setShowLogin(false); }} onBack={() => setShowLogin(false)} />;
    }
    return (
      <PublicHome
        transactions={transactions}
        payments={payments}
        settings={settings}
        arisan={arisan}
        onLoginClick={() => setShowLogin(true)}
      />
    );
  }

  const dashboardNotify = { view: actions.view, edit: actions.edit, del: actions.del };

  return (
    <div className="rtd-root flex min-h-screen" style={{ background: C.bg }}>
      <GlobalStyle />
      <div className="no-print contents">
        <Sidebar page={page} setPage={setPage} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} notify={notify} />
      </div>
      <div className="flex min-h-screen flex-1 flex-col" style={{ minWidth: 0 }}>
        <div className="no-print contents">
          <Topbar page={page} user={user} onLogout={() => setUser(null)} onMenu={() => setMobileOpen(true)} onAdd={() => setModal({ type: "add" })} />
        </div>
        <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">
          <div className="mx-auto max-w-6xl">
            <div className="no-print mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: C.orangeSoft, color: C.orange }}>
              <Info size={13} /> DATA DEMO — seluruh transaksi di bawah ini adalah data contoh untuk keperluan simulasi.
            </div>
            {page === "dashboard" && <Dashboard transactions={transactions} payments={payments} settings={settings} notify={dashboardNotify} />}
            {page === "rumah" && <DataRumahPage households={households} residents={residents} dues={dues} onAddHousehold={handleAddHousehold} onUpdateHousehold={handleUpdateHousehold} onAddResident={handleAddResident} onUpdateResident={handleUpdateResident} />}
            {page === "warga" && <DataWargaPage households={households} residents={residents} onAddResident={handleAddResident} onUpdateResident={handleUpdateResident} />}
            {page === "kas" && <KasRT transactions={transactions} actions={actions} />}
            {page === "pemasukan" && <ListPage type="masuk" transactions={transactions} actions={actions} />}
            {page === "pengeluaran" && <ListPage type="keluar" transactions={transactions} actions={actions} />}
            {page === "iuran" && <IuranWargaPage households={households} residents={residents} duesTypes={duesTypes} dues={dues} onGenerateDues={handleGenerateDues} onRecordPayment={handleRecordDuesPayment} onSaveDuesTypes={handleSaveDuesTypes} userRole={user.role} />}
            {page === "pembayaran" && <PembayaranWargaPage payments={payments} settings={settings} onRecordPayment={handleRecordPembayaran} />}
            {page === "jimpitan" && <JimpitanPage households={households} residents={residents} jimpitan={jimpitan} onAddJimpitan={handleAddJimpitan} onUpdateJimpitan={handleUpdateJimpitan} />}
            {page === "arisan" && <ArisanPage arisan={arisan} payments={payments} settings={settings} onDraw={handleArisanDraw} goToPembayaran={() => setPage("pembayaran")} />}
            {page === "sosial" && <SosialPage transactions={transactions} onAddSosial={handleAddSosial} />}
            {page === "laporan" && <ReportPage transactions={transactions} />}
            {page === "pengaturan" && <PengaturanPage settings={settings} onSave={handleSaveSettings} userRole={user.role} />}
          </div>
        </main>
      </div>

      {(modal?.type === "add" || modal?.type === "edit") && (
        <Modal title={modal.type === "edit" ? "Edit Transaksi" : "Tambah Transaksi"} subtitle={modal.type === "edit" ? modal.tx.transaction_code : "Catat pemasukan atau pengeluaran kas RT"} onClose={() => setModal(null)}>
          <TransactionForm initial={modal.type === "edit" ? modal.tx : null} onCancel={() => setModal(null)} onSubmit={handleSave} />
        </Modal>
      )}

      {modal?.type === "detail" && (
        <Modal title="Detail Transaksi" subtitle={modal.tx.transaction_code} onClose={() => setModal(null)}>
          <TransactionDetail
            tx={modal.tx}
            onEdit={actions.edit}
            onDelete={actions.del}
            onClose={() => setModal(null)}
            households={households}
            residents={residents}
            duesTypes={duesTypes}
            dues={dues}
            onViewIuranDetail={() => { setPage("iuran"); setModal(null); }}
          />
        </Modal>
      )}

      {confirmTx && (
        <ConfirmDialog
          title="Hapus transaksi ini?"
          message={`Apakah Anda yakin ingin menghapus transaksi "${confirmTx.description}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmTx(null)}
        />
      )}

      <Toasts toasts={toasts} remove={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
