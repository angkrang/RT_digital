import React, { useState, useMemo } from "react";
import {
  Plus, Search, Pencil, Users2,
} from "lucide-react";
import { AdminStatsBar } from "../admin/AdminStatsBar";
import { ResidentForm } from "../admin/ResidentForm";
import { Badge, Btn, Card, EmptyState, Modal, TextInput } from "../components/ui";
import { C } from "../constants/theme";

export const DataWargaPage = ({ households, residents, onAddResident, onUpdateResident }) => {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const householdMap = useMemo(() => Object.fromEntries(households.map((h) => [h.id, h])), [households]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter((r) => {
      const house = householdMap[r.household_id];
      return (
        String(r.name).toLowerCase().includes(q) ||
        String(r.nik).includes(q) ||
        String(r.kk_number).includes(q) ||
        String(r.phone).includes(q) ||
        String(house?.house_number || "").toLowerCase().includes(q)
      );
    });
  }, [residents, householdMap, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => String(a.name).localeCompare(b.name, "id")), [filtered]);

  return (
    <div className="space-y-5">
      <AdminStatsBar households={households} residents={residents} />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: C.border }}>
          <div className="relative sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, NIK, KK, HP, nomor rumah..." className="pl-9" />
          </div>
          <Btn size="sm" onClick={() => setModal({ type: "add" })} disabled={households.length === 0}><Plus size={14} /> Tambah Warga</Btn>
        </div>

        {sorted.length === 0 ? (
          <EmptyState icon={Users2} title="Belum ada data warga" subtitle="Tambahkan rumah terlebih dahulu, lalu tambahkan warga." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                  <th className="px-4 py-3">Nama</th><th className="px-4 py-3">Rumah</th><th className="px-4 py-3">NIK</th>
                  <th className="px-4 py-3">Hubungan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">HP</th><th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                    <td className="px-4 py-3 font-medium" style={{ color: C.text }}>{r.name}</td>
                    <td className="px-4 py-3" style={{ color: C.textMuted }}>No. {householdMap[r.household_id]?.house_number || "-"}</td>
                    <td className="px-4 py-3 tabular-nums" style={{ color: C.textMuted }}>{r.nik}</td>
                    <td className="px-4 py-3" style={{ color: C.textMuted }}>{r.relationship}</td>
                    <td className="px-4 py-3"><Badge tone={r.resident_status === "Tetap" ? "green" : r.resident_status === "Pindah" || r.resident_status === "Meninggal" ? "muted" : "orange"}>{r.resident_status}</Badge></td>
                    <td className="px-4 py-3" style={{ color: C.textMuted }}>{r.phone || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setModal({ type: "edit", resident: r })} className="rtd-focus rounded-lg p-1.5" style={{ color: C.textMuted }} title="Edit"><Pencil size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal?.type === "add" && (
        <Modal title="Tambah Warga" onClose={() => setModal(null)}>
          <ResidentForm households={households} onCancel={() => setModal(null)} onSubmit={async (form) => { await onAddResident(form); setModal(null); }} />
        </Modal>
      )}
      {modal?.type === "edit" && (
        <Modal title="Edit Warga" subtitle={modal.resident.name} onClose={() => setModal(null)}>
          <ResidentForm initial={modal.resident} households={households} onCancel={() => setModal(null)} onSubmit={async (form) => { await onUpdateResident({ ...form, id: modal.resident.id }); setModal(null); }} />
        </Modal>
      )}
    </div>
  );
};

/* -- Kelola Jenis Iuran (nominal per jenis) -- */
