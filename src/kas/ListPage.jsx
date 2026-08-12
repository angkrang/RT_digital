import React, { useState, useMemo } from "react";
import {
  Search,
} from "lucide-react";
import { Card, Pagination, Select, TextInput } from "../components/ui";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from "../constants/data";
import { C } from "../constants/theme";
import { TxTable } from "../transactions/TxTable";
import { formatRupiah } from "../utils/format";

export const FilterBar = ({ search, setSearch, category, setCategory, method, setMethod, categories, placeholder }) => (
  <div className="grid grid-cols-1 gap-3 border-b p-4 sm:grid-cols-3" style={{ borderColor: C.border }}>
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
      <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
    <Select value={category} onChange={(e) => setCategory(e.target.value)}>
      <option value="">Semua Kategori</option>
      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
    </Select>
    <Select value={method} onChange={(e) => setMethod(e.target.value)}>
      <option value="">Semua Metode</option>
      {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
    </Select>
  </div>
);

export const ListPage = ({ type, transactions, actions }) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const categories = type === "masuk" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => t.type === type)
      .filter((t) => !category || t.category === category)
      .filter((t) => !method || t.payment_method === method)
      .filter((t) => !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.source.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
  }, [transactions, type, category, method, search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const total = filtered.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5">
      <Card className="p-5" style={{ background: type === "masuk" ? C.greenSoft : C.redSoft, border: "none" }}>
        <p className="text-xs font-semibold" style={{ color: type === "masuk" ? C.green : C.red }}>{type === "masuk" ? "TOTAL PEMASUKAN" : "TOTAL PENGELUARAN"} (SESUAI FILTER)</p>
        <p className="rtd-display mt-1 text-2xl font-bold tabular-nums" style={{ color: type === "masuk" ? C.green : C.red }}>{formatRupiah(total)}</p>
      </Card>

      <Card className="p-0">
        <FilterBar
          search={search} setSearch={(v) => { setSearch(v); setPage(1); }}
          category={category} setCategory={(v) => { setCategory(v); setPage(1); }}
          method={method} setMethod={(v) => { setMethod(v); setPage(1); }}
          categories={categories}
          placeholder={type === "masuk" ? "Cari berdasarkan keterangan / sumber" : "Cari berdasarkan keterangan / penerima"}
        />
        <TxTable rows={pageRows} onView={actions.view} onEdit={actions.edit} onDelete={actions.del} emptyTitle="Tidak ada transaksi yang cocok" />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={pageSize} />
      </Card>
    </div>
  );
};

/* ============================================================
   IURAN WARGA PAGE
   ============================================================ */
