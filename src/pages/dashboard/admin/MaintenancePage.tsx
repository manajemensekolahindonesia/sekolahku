import { useState } from "react";
import { AlertTriangle, Shield, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function MaintenancePage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [activating, setActivating] = useState(false);

  const handleToggle = () => {
    if (maintenanceMode) {
      // Turning off — simple confirm
      setMaintenanceMode(false);
    } else {
      // Turning on — double confirm required
      setShowConfirm(true);
      setConfirmText("");
    }
  };

  const handleConfirmActivate = () => {
    if (confirmText !== "CONFIRM") return;
    setActivating(true);
    setTimeout(() => {
      setMaintenanceMode(true);
      setShowConfirm(false);
      setActivating(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mode Maintenance</h2>
        <p className="text-gray-500 mt-1">Kelola status operasional aplikasi</p>
      </div>

      {/* Status Card */}
      <Card className={maintenanceMode ? "border-red-300 bg-red-50/30" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className={`w-5 h-5 ${maintenanceMode ? "text-red-500" : "text-emerald-500"}`} />
            Status Sistem
          </CardTitle>
          <CardDescription>
            {maintenanceMode
              ? "Aplikasi sedang dalam mode maintenance. Hanya Owner yang dapat mengakses."
              : "Aplikasi berjalan normal. Semua pengguna dapat mengakses."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${maintenanceMode ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
              <span className={`text-sm font-semibold ${maintenanceMode ? "text-red-600" : "text-emerald-600"}`}>
                {maintenanceMode ? "MAINTENANCE" : "ONLINE"}
              </span>
            </div>
            <Button
              variant={maintenanceMode ? "outline" : "destructive"}
              onClick={handleToggle}
            >
              {maintenanceMode ? "Nonaktifkan Maintenance" : "Aktifkan Maintenance"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Yang Terjadi Saat Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-500 space-y-1">
            <li>Halaman publik tetap bisa diakses</li>
            <li>Login non-Owner akan ditolak</li>
            <li>User yang sudah login di-redirect ke halaman maintenance</li>
            <li>API tetap berfungsi untuk Owner</li>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Keamanan
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-500 space-y-1">
            <li>Hanya Owner yang dapat mengaktifkan/menonaktifkan</li>
            <li>Wajib konfirmasi ganda (Double Confirmation)</li>
            <li>Log aktivitas dicatat untuk audit</li>
          </CardContent>
        </Card>
      </div>

      {/* Double Confirmation Modal */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="border-red-300">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle>Konfirmasi Aktivasi Maintenance</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              <p className="font-semibold">Peringatan!</p>
              <p className="mt-1">
                Mengaktifkan mode maintenance akan memblokir akses semua pengguna kecuali Owner.
                Semua sesi aktif akan dihentikan. Pastikan ini adalah tindakan yang disengaja.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ketik <code className="bg-gray-200 px-2 py-0.5 rounded text-red-600 font-mono">CONFIRM</code> untuk melanjutkan
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Ketik CONFIRM..."
                className="font-mono text-center text-lg tracking-widest"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleConfirmActivate()}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={activating}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmActivate}
              disabled={confirmText !== "CONFIRM" || activating}
              className="gap-2"
            >
              {activating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengaktifkan...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Aktifkan Maintenance
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
