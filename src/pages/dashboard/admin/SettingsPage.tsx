import { useState, useEffect } from "react";
import { Settings, BarChart3, CreditCard, TrendingUp, Users, Shield, Coins, Edit2, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const attendanceData = [
  { day: "Sen", Hadir: 42, Terlambat: 3, Alfa: 1 },
  { day: "Sel", Hadir: 40, Terlambat: 5, Alfa: 1 },
  { day: "Rab", Hadir: 43, Terlambat: 2, Alfa: 1 },
  { day: "Kam", Hadir: 38, Terlambat: 6, Alfa: 2 },
  { day: "Jum", Hadir: 44, Terlambat: 1, Alfa: 1 },
];

const attendancePie = [
  { name: "Hadir", value: 207, color: "#10b981" },
  { name: "Terlambat", value: 17, color: "#f59e0b" },
  { name: "Sakit", value: 5, color: "#3b82f6" },
  { name: "Izin", value: 4, color: "#8b5cf6" },
  { name: "Alfa", value: 6, color: "#ef4444" },
];

const paymentData = [
  { name: "GoPay", users: 35 },
  { name: "DANA", users: 28 },
  { name: "OVO", users: 20 },
  { name: "QRIS", users: 15 },
  { name: "Transfer", users: 12 },
  { name: "ShopeePay", users: 8 },
];

const trendData = [
  { month: "Jan", kehadiran: 94, nilai: 78 },
  { month: "Feb", kehadiran: 92, nilai: 80 },
  { month: "Mar", kehadiran: 95, nilai: 77 },
  { month: "Apr", kehadiran: 91, nilai: 82 },
  { month: "Mei", kehadiran: 93, nilai: 84 },
  { month: "Jun", kehadiran: 96, nilai: 81 },
];

export default function SettingsPage() {
  const [kop, setKop] = useState({
    nama: "SEKOLAHKU",
    alamat: "Jl. Pendidikan No. 1, Jakarta",
    telepon: "(021) 1234-5678",
    email: "info@sekolahku.id",
  });

  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ tier: "Free", role: "guru", tokens: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditForm({ tier: user.tier || "Free", role: user.role || "guru", tokens: user.tokens || 0 });
  };

  const handleSaveUser = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          ...editForm
        })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u));
        setEditingUser(null);
      } else {
        alert(data.error || "Gagal menyimpan data");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pengaturan</h2>
        <p className="text-gray-500 mt-1">Konfigurasi sistem dan lihat analitik</p>
      </div>

      <Tabs defaultValue="charts">
        <TabsList>
          <TabsTrigger value="charts">Analitik</TabsTrigger>
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="kop">KOP Sekolah</TabsTrigger>
          <TabsTrigger value="system">Sistem</TabsTrigger>
        </TabsList>

        {/* Charts Tab */}
        <TabsContent value="charts">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Bar Chart — Attendance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Tren Absensi Mingguan
                </CardTitle>
                <CardDescription>Kehadiran per hari dalam seminggu</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="Hadir" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Terlambat" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Alfa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart — Attendance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Distribusi Absensi Bulanan
                </CardTitle>
                <CardDescription>Total kehadiran bulan ini</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={attendancePie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                      {attendancePie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar Chart — Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Metode Pembayaran
                </CardTitle>
                <CardDescription>Penggunaan e-wallet & transfer bank</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={paymentData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="users" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Line Chart — Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Tren Semester
                </CardTitle>
                <CardDescription>Kehadiran & rata-rata nilai per bulan</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="kehadiran" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="nilai" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Manajemen Pengguna
              </CardTitle>
              <CardDescription>Kelola role (badge), tier, dan isi token manual untuk tiap pengguna (Terhubung ke API).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nama / Email</th>
                      <th className="px-4 py-3 font-semibold">Badge/Role</th>
                      <th className="px-4 py-3 font-semibold">Tier</th>
                      <th className="px-4 py-3 font-semibold">Token</th>
                      <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                          Memuat data pengguna atau belum ada pengguna terdaftar...
                        </td>
                      </tr>
                    )}
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            <Shield className="w-3.5 h-3.5" /> {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${user.tier === 'Premium' ? 'bg-emerald-100 text-emerald-700' : user.tier === 'Essential' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                            <Crown className="w-3.5 h-3.5" /> {user.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            {user.tokens}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-semibold">
                            <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Pengguna</DialogTitle>
                <CardDescription>Ubah detail untuk {editingUser?.name}</CardDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Role (Badge)</label>
                  <select 
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                    value={editForm.role}
                    onChange={e => setEditForm({...editForm, role: e.target.value})}
                  >
                    <option value="guru">Guru</option>
                    <option value="admin">Admin</option>
                    <option value="siswa">Siswa</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tier (Paket Berlangganan)</label>
                  <select 
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                    value={editForm.tier}
                    onChange={e => setEditForm({...editForm, tier: e.target.value})}
                  >
                    <option value="Free">Free</option>
                    <option value="Essential">Essential</option>
                    <option value="Premium">Premium</option>
                    <option value="VIP">VIP</option>
                    <option value="Guru Pertama">Guru Pertama</option>
                    <option value="Guru Muda">Guru Muda</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    Isi Token Manual <Coins className="w-4 h-4 text-yellow-500" />
                  </label>
                  <Input 
                    type="number" 
                    value={editForm.tokens}
                    className="font-mono text-base font-bold"
                    onChange={e => setEditForm({...editForm, tokens: parseInt(e.target.value) || 0})}
                  />
                  <p className="text-xs text-gray-500 mt-2">Jumlah sisa token yang dapat digunakan untuk menggunakan fitur AI premium.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isLoading}>Batal</Button>
                <Button onClick={handleSaveUser} className="bg-primary hover:bg-primary/90 text-white font-bold" disabled={isLoading}>
                  {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* KOP Tab */}
        <TabsContent value="kop">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                KOP Sekolah
              </CardTitle>
              <CardDescription>Header yang muncul di setiap dokumen cetak (PDF)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
                <input
                  type="text"
                  value={kop.nama}
                  onChange={(e) => setKop({ ...kop, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <input
                  type="text"
                  value={kop.alamat}
                  onChange={(e) => setKop({ ...kop, alamat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                  <input
                    type="text"
                    value={kop.telepon}
                    onChange={(e) => setKop({ ...kop, telepon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={kop.email}
                    onChange={(e) => setKop({ ...kop, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              </div>
              <Button>Simpan KOP</Button>

              {/* Preview */}
              <div className="mt-6 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <p className="text-xs text-gray-400 mb-3">PREVIEW KOP</p>
                <p className="text-lg font-bold text-gray-900">{kop.nama}</p>
                <p className="text-sm text-gray-500">{kop.alamat}</p>
                <p className="text-sm text-gray-400">Telp: {kop.telepon} | Email: {kop.email}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Sistem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Versi Aplikasi</span>
                <span className="font-mono text-gray-700">1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Frontend</span>
                <span className="font-mono text-gray-700">Vite + React 19 + TS 6</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Backend</span>
                <span className="font-mono text-gray-700">Cloudflare Pages Functions</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Database</span>
                <span className="font-mono text-gray-700">Cloudflare D1 (SQLite)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Auth</span>
                <span className="font-mono text-gray-700">Google OAuth 2.0</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
