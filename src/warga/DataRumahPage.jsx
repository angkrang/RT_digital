import React, { useState, useMemo } from "react";
import {
  Plus, Search, Home, Users2, Phone, MapPin,
} from "lucide-react";
import { AdminStatsBar } from "../admin/AdminStatsBar";
import { HouseholdDetail } from "../admin/HouseholdDetail";
import { HouseholdForm } from "../admin/HouseholdForm";
import { ResidentForm } from "../admin/ResidentForm";
import { Badge, Btn, Card, EmptyState, Modal, TextInput } from "../components/ui";
import { C } from "../constants/theme";
import { DenahRT } from "../denah/DenahRT";
import { PetaRT } from "../map/PetaRT";

export const DataRumahPage = ({ households, residents, dues, onAddHousehold, onUpdateHousehold, onAddResident, onUpdateResident }) => {
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid"); // 'grid' | 'denah' | 'peta'
  const [modal, setModal] = useState(null); // { type: 'add' | 'edit' | 'detail', household? }

  const residentsByHousehold = useMemo(() => {
    const map = {};
    residents.forEach((r) => { (map[r.household_id] ||= []).push(r); });
    return map;
  }, [residents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return households;
    return households.filter((h) => {
      const members = residentsByHousehold[h.id] || [];
      return (
        String(h.house_number).toLowerCase().includes(q) ||
        String(h.address).toLowerCase().includes(q) ||
        members.some((m) => String(m.name).toLowerCase().includes(q) || String(m.nik).includes(q) || String(m.kk_number).includes(q) || String(m.phone).includes(q))
      );
    });
  }, [households, residentsByHousehold, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => String(a.house_number).localeCompare(String(b.house_number), "id", { numeric: true })), [filtered]);

  return (
    <div className="space-y-5">
      <AdminStatsBar households={households} residents={residents} />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nomor rumah, nama, NIK, KK, HP..." className="pl-9" disabled={view !== "grid"} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg p-0.5" style={{ background: C.navyFaint }}>
              <button
                onClick={() => setView("grid")}
                className="rtd-focus rounded-md px-3 py-1.5 text-xs font-semibold transition"
                style={view === "grid" ? { background: C.card, color: C.navy, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: C.textMuted }}
              >
                Grid
              </button>
              <button
                onClick={() => setView("denah")}
                className="rtd-focus rounded-md px-3 py-1.5 text-xs font-semibold transition"
                style={view === "denah" ? { background: C.card, color: C.navy, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: C.textMuted }}
              >
                <span className="inline-flex items-center gap-1"><MapPin size={12} /> Denah</span>
              </button>
              <button
                onClick={() => setView("peta")}
                className="rtd-focus rounded-md px-3 py-1.5 text-xs font-semibold transition"
                style={view === "peta" ? { background: C.card, color: C.navy, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: C.textMuted }}
              >
                <span className="inline-flex items-center gap-1"><MapPin size={12} /> Peta</span>
              </button>
            </div>
            <Btn size="sm" onClick={() => setModal({ type: "add" })}><Plus size={14} /> Tambah Rumah</Btn>
          </div>
        </div>
      </Card>

      {view === "denah" ? (
        <DenahRT households={households} residents={residents} dues={dues} onSelect={(h) => setModal({ type: "detail", household: h })} />
      ) : view === "peta" ? (
        <PetaRT households={households} residents={residents} dues={dues} onSelect={(h) => setModal({ type: "detail", household: h })} />
      ) : sorted.length === 0 ? (
        <Card className="p-0"><EmptyState icon={Home} title="Belum ada data rumah" subtitle="Klik Tambah Rumah untuk mulai mendata." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((h) => {
            const members = residentsByHousehold[h.id] || [];
            const head = members.find((m) => m.id === h.head_resident_id) || members.find((m) => m.relationship === "Kepala Keluarga");
            return (
              <Card key={h.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold tracking-wide" style={{ color: C.textMuted }}>RUMAH {h.house_number}</p>
                    <p className="rtd-display mt-0.5 text-base font-bold" style={{ color: C.text }}>{head ? head.name : "Belum ada kepala keluarga"}</p>
                  </div>
                  <Badge tone={h.status === "Aktif" ? "green" : "muted"}>{h.status}</Badge>
                </div>
                <div className="mt-3 space-y-1.5 text-xs" style={{ color: C.textMuted }}>
                  <p className="flex items-center gap-1.5"><Users2 size={13} /> {members.length} anggota keluarga</p>
                  {head?.phone && <p className="flex items-center gap-1.5"><Phone size={13} /> {head.phone}</p>}
                  {h.address && <p className="flex items-center gap-1.5"><MapPin size={13} /> {h.address}</p>}
                </div>
                <Btn size="sm" variant="subtle" className="mt-4 w-full" onClick={() => setModal({ type: "detail", household: h })}>Lihat Detail</Btn>
              </Card>
            );
          })}
        </div>
      )}

      {modal?.type === "add" && (
        <Modal title="Tambah Rumah" subtitle="Data rumah menjadi induk untuk anggota keluarga" onClose={() => setModal(null)} width={560}>
          <HouseholdForm
            residents={residents}
            onCancel={() => setModal(null)}
            onSubmit={async (form) => { await onAddHousehold(form); setModal(null); }}
          />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title="Edit Rumah" subtitle={`Rumah No. ${modal.household.house_number}`} onClose={() => setModal(null)} width={560}>
          <HouseholdForm
            initial={modal.household}
            residents={residents}
            onCancel={() => setModal(null)}
            onSubmit={async (form) => { await onUpdateHousehold({ ...form, id: modal.household.id }); setModal(null); }}
          />
        </Modal>
      )}

      {modal?.type === "detail" && (
        <Modal title={`Rumah No. ${modal.household.house_number}`} subtitle="Detail rumah & anggota keluarga" onClose={() => setModal(null)} width={620}>
          <HouseholdDetail
            household={households.find((h) => h.id === modal.household.id) || modal.household}
            residents={residents}
            onEdit={() => setModal({ type: "edit", household: modal.household })}
            onAddResident={() => setModal({ type: "addResident", household: modal.household })}
            onEditResident={(resident) => setModal({ type: "editResident", household: modal.household, resident })}
          />
        </Modal>
      )}

      {modal?.type === "addResident" && (
        <Modal title="Tambah Warga" subtitle={`Anggota keluarga Rumah No. ${modal.household.house_number}`} onClose={() => setModal(null)}>
          <ResidentForm
            initial={{ name: "", nik: "", kk_number: "", gender: "L", birth_place: "", birth_date: "", phone: "", relationship: "Anak", occupation: "", resident_status: "Tetap", household_id: modal.household.id }}
            households={households}
            onCancel={() => setModal(null)}
            onSubmit={async (form) => { await onAddResident(form); setModal({ type: "detail", household: modal.household }); }}
          />
        </Modal>
      )}

      {modal?.type === "editResident" && (
        <Modal title="Edit Warga" subtitle={modal.resident.name} onClose={() => setModal(null)}>
          <ResidentForm
            initial={modal.resident}
            households={households}
            onCancel={() => setModal(null)}
            onSubmit={async (form) => { await onUpdateResident({ ...form, id: modal.resident.id }); setModal({ type: "detail", household: modal.household }); }}
          />
        </Modal>
      )}
    </div>
  );
};

/* -- DATA WARGA PAGE -- */
