import { useState, useMemo } from "react";
import { Search, Plus, Trash2, Edit, Ban, CheckCircle, FileDown, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { User, UserRole, UserStatus } from "@/types";
import { exportUsersCSV, parseCSVUsers } from "@/lib/csv";

function generateId() { return crypto.randomUUID(); }

function initialUsers(): User[] {
  try {
    const saved = localStorage.getItem("admin_users");
    return saved ? JSON.parse(saved) : [
      { id: "owner-1", email: "owner@sekolahku.dev", name: "Kepala Sekolah", role: "owner", avatar_url: null, google_id: null, subscription_id: "plan_sekolah", active_period_end: "2027-06-01", status: "active", created_at: "2025-01-01", updated_at: "2026-06-01" },
      { id: "u1", email: "admin@sekolahku.dev", name: "Admin Sekolah", role: "admin", avatar_url: null, google_id: null, subscription_id: "plan_pro", active_period_end: "2027-06-01", status: "active", created_at: "2025-02-01", updated_at: "2026-05-01" },
      { id: "u2", email: "budi@smpn1.sch.id", name: "Budi Santoso", role: "guru", avatar_url: null, google_id: null, subscription_id: "plan_free", active_period_end: "2027-01-01", status: "active", created_at: "2025-03-01", updated_at: "2026-04-01" },
      { id: "u3", email: "siti@smpn1.sch.id", name: "Siti Nurhaliza", role: "guru", avatar_url: null, google_id: null, subscription_id: "plan_free", active_period_end: "2026-08-01", status: "suspended", created_at: "2025-04-01", updated_at: "2026-03-01" },
      { id: "u4", email: "doni@smpn1.sch.id", name: "Doni Prasetyo", role: "staf", avatar_url: null, google_id: null, subscription_id: "plan_free", active_period_end: "2027-01-01", status: "blocked", created_at: "2025-05-01", updated_at: "2026-02-01" },
      { id: "u5", email: "andi@gmail.com", name: "Andi Pratama", role: "siswa", avatar_url: null, google_id: null, subscription_id: "plan_free", active_period_end: "2027-06-01", status: "active", created_at: "2025-06-01", updated_at: "2026-01-01" },
      { id: "u6", email: "rini@smpn1.sch.id", name: "Rini Oktaviani", role: "staf", avatar_url: null, google_id: null, subscription_id: "plan_free", active_period_end: "2027-03-01", status: "active", created_at: "2025-07-01", updated_at: "2026-06-01" },
      { id: "u7", email: "dwi@sekolahku.dev", name: "Dwi Lestari", role: "admin", avatar_url: null, google_id: null, subscription_id: "plan_sekolah", active_period_end: "2027-12-01", status: "active", created_at: "2025-08-01", updated_at: "2026-06-01" },
    ];
  } catch {
    return [];
  }
}

const roleLabels: Record<UserRole, string> = { owner: "Owner", admin: "Admin", guru: "Guru", siswa: "Siswa", staf: "Staf" };
const statusColors: Record<UserStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-amber-50 text-amber-700 border-amber-200",
  blocked: "bg-red-50 text-red-700 border-red-200",
};

const PAGE_SIZE = 5;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "">("");
  const [filterStatus, setFilterStatus] = useState<UserStatus | "">("");
  const [page, setPage] = useState(0);

  const [modal, setModal] = useState<{ open: boolean; mode: "add" | "edit"; user?: User }>({ open: false, mode: "add" });
  const [form, setForm] = useState({ name: "", email: "", role: "guru" as UserRole, status: "active" as UserStatus, active_period_end: "" });

  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);

  const saveUsers = (data: User[]) => { setUsers(data); localStorage.setItem("admin_users", JSON.stringify(data)); };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterRole && u.role !== filterRole) return false;
      if (filterStatus && u.status !== filterStatus) return false;
      return true;
    });
  }, [users, search, filterRole, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openAdd = () => {
    setForm({ name: "", email: "", role: "guru", status: "active", active_period_end: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0] });
    setModal({ open: true, mode: "add" });
  };

  const openEdit = (user: User) => {
    setForm({ name: user.name, email: user.email, role: user.role, status: user.status, active_period_end: user.active_period_end || "" });
    setModal({ open: true, mode: "edit", user });
  };

  const handleSave = () => {
    if (modal.mode === "add") {
      const newUser: User = {
        id: generateId(), email: form.email, name: form.name, role: form.role, status: form.status,
        avatar_url: null, google_id: null, subscription_id: "plan_free",
        active_period_end: form.active_period_end || null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      saveUsers([newUser, ...users]);
    } else if (modal.mode === "edit" && modal.user) {
      if (modal.user.role === "owner") return;
      saveUsers(users.map((u) => u.id === modal.user!.id ? { ...u, name: form.name, email: form.email, role: form.role, status: form.status, active_period_end: form.active_period_end || null, updated_at: new Date().toISOString() } : u));
    }
    setModal({ open: false, mode: "add" });
  };

  const handleDelete = () => {
    if (deleteConfirm && deleteConfirm.role !== "owner") {
      saveUsers(users.filter((u) => u.id !== deleteConfirm.id));
    }
    setDeleteConfirm(null);
  };

  const handleStatusChange = (user: User, status: UserStatus) => {
    if (user.role === "owner") return;
    saveUsers(users.map((u) => u.id === user.id ? { ...u, status, updated_at: new Date().toISOString() } : u));
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imported = parseCSVUsers(reader.result as string);
      if (imported.length > 0) {
        saveUsers([...imported as User[], ...users]);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h2>
          <p className="text-gray-500 mt-1">{users.length} pengguna terdaftar</p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" className="gap-1" asChild>
              <span><Upload className="w-4 h-4" /> Import CSV</span>
            </Button>
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => exportUsersCSV(users)}>
            <FileDown className="w-4 h-4" /> Export CSV
          </Button>
          <Button size="sm" className="gap-1" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Tambah
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Cari nama atau email..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => { setFilterRole(e.target.value as UserRole | ""); setPage(0); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">Semua Role</option>
              {Object.entries(roleLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value as UserStatus | ""); setPage(0); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="suspended">Suspended</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-500">Nama</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-500">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-500">Masa Aktif</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                      {user.role === "owner" && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">OWNER</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {user.active_period_end || "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {user.role === "owner" ? (
                      <span className="text-xs text-gray-300 italic">Immutable</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        {user.status !== "active" && (
                          <button
                            onClick={() => handleStatusChange(user, "active")}
                            className="p-1.5 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Aktifkan"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {user.status !== "suspended" && (
                          <button
                            onClick={() => handleStatusChange(user, "suspended")}
                            className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Suspend"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {user.status !== "blocked" && (
                          <button
                            onClick={() => handleStatusChange(user, "blocked")}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Block"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Tidak ada pengguna ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Menampilkan {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} dari {filtered.length}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={i === page ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(i)}
                className="min-w-[36px]"
              >
                {i + 1}
              </Button>
            ))}
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modal.open} onOpenChange={(o) => setModal({ ...modal, open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal.mode === "add" ? "Tambah Pengguna" : "Edit Pengguna"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@sekolah.id" type="email" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                  disabled={modal.user?.role === "owner"}
                >
                  {Object.entries(roleLabels).filter(([k]) => k !== "owner").map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                >
                  <option value="active">Aktif</option>
                  <option value="suspended">Suspended</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Masa Aktif Sampai</label>
              <Input
                type="date"
                value={form.active_period_end}
                onChange={(e) => setForm({ ...form, active_period_end: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setModal({ open: false, mode: "add" })}>Batal</Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pengguna</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mt-2">
            Anda yakin ingin menghapus <strong>{deleteConfirm?.name}</strong> ({deleteConfirm?.email})? Tindakan ini tidak dapat dibatalkan.
          </p>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
