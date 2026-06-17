import React, { useEffect, useState, useRef } from 'react';
import { Shield, ShieldAlert, Edit2, Users, Search, Save, X, Calendar, Crown, Trash2, Plus, Settings, Power, Download, Activity, MessageSquare, Phone, DollarSign, Star, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import InvoiceGenerator from '../invoice/InvoiceGenerator';

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('All');
  
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editRole, setEditRole] = useState('guest');
  const [editTier, setEditTier] = useState('Free');
  const [editTokens, setEditTokens] = useState('');
  const [editActiveUntil, setEditActiveUntil] = useState('');
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [editIsBanned, setEditIsBanned] = useState(false);
  const [editSuspendedUntil, setEditSuspendedUntil] = useState('');
  const [editStatusMode, setEditStatusMode] = useState<'active' | 'suspend' | 'banned'>('active');
  const [bulkTokens, setBulkTokens] = useState('');
  const [bulkSuspendDays, setBulkSuspendDays] = useState('');
  const [historyModalData, setHistoryModalData] = useState<any[] | null>(null);
  const [historyModalUser, setHistoryModalUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [importConfirmData, setImportConfirmData] = useState<any[] | null>(null);
  const [bulkDeleteConfirmData, setBulkDeleteConfirmData] = useState<{count: number} | null>(null);
  const [confirmImportChecked, setConfirmImportChecked] = useState(false);
  const [confirmDeleteChecked, setConfirmDeleteChecked] = useState(false);
  const [voucherActive, setVoucherActive] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [trialActive, setTrialActive] = useState(false);
  const [trialDays, setTrialDays] = useState('3');
  const [trialTier, setTrialTier] = useState('Premium');
  const [trialTokens, setTrialTokens] = useState('50');
  const [trialEmails, setTrialEmails] = useState('');
  const [trialEmailInput, setTrialEmailInput] = useState('');
  const [showTrialConfirm, setShowTrialConfirm] = useState(false);
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [maintenanceEndTime, setMaintenanceEndTime] = useState('');
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [globalAnnouncement, setGlobalAnnouncement] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [waNumber2, setWaNumber2] = useState('');
  const [priceEssential, setPriceEssential] = useState('');
  const [pricePremium, setPricePremium] = useState('');
  const [priceUltimate, setPriceUltimate] = useState('');
  const [priceSupreme, setPriceSupreme] = useState('');
  const [priceTitan, setPriceTitan] = useState('');
  const [priceGuruPertama, setPriceGuruPertama] = useState('');
  const [priceGuruMuda, setPriceGuruMuda] = useState('');
  const [priceGuruMadya, setPriceGuruMadya] = useState('');
  const [priceGuruUtama, setPriceGuruUtama] = useState('');
  
  const [savedSettings, setSavedSettings] = useState<Record<string, string>>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{uid: string, email: string} | null>(null);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Pagination & Bulk Actions
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkTier, setBulkTier] = useState('');
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  
  const getBtnClass = (key: string, currentValue: string | boolean, baseClass: string) => {
    const isUnsaved = savedSettings[key] !== String(currentValue);
    if (isUnsaved) {
      return `${baseClass} bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all`;
    }
    return `${baseClass} bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all`;
  };

  const [stats, setStats] = useState<any>(null);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [logTab, setLogTab] = useState<'admin'|'activity'>('admin');
  const [visibleLogsCount, setVisibleLogsCount] = useState<number>(50);

  useEffect(() => {
    fetchUsers();
    fetchSettings();
    fetchStats();
    fetchLogs();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/admin/stats?t=${Date.now()}`);
      if (res.ok) setStats(await res.json());
    } catch(e) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/admin/logs?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json() as any;
        setAdminLogs(data.adminLogs || []);
        setActivityLogs(data.activityLogs || []);
      }
    } catch(e) {}
  };

  const postLog = async (action: string) => {
    try {
      await fetch('/api/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      fetchLogs(); // refresh logs
    } catch(e) {}
  };

  const fetchSettings = async () => {
    try {
      const fetchSet = async (k: string, setter: any, isBool = false) => {
        const res = await fetch(`/api/settings/${k}?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json() as any;
          if (data.value) {
            setter(isBool ? data.value === 'true' : data.value);
            setSavedSettings(prev => ({ ...prev, [k]: String(data.value) }));
          }
        }
      };
      await Promise.all([
        fetchSet('promo_voucher_active', setVoucherActive, true),
        fetchSet('promo_voucher_code', setVoucherCode),
        fetchSet('promo_trial_active', setTrialActive, true),
        fetchSet('promo_trial_days', setTrialDays),
        fetchSet('promo_trial_tier', setTrialTier),
        fetchSet('promo_trial_tokens', setTrialTokens),
        fetchSet('promo_trial_emails', setTrialEmails),
        fetchSet('maintenance_active', setMaintenanceActive, true),
        fetchSet('maintenance_end_time', setMaintenanceEndTime),
        fetchSet('maintenance_reason', setMaintenanceReason),
        fetchSet('global_announcement', setGlobalAnnouncement),
        fetchSet('whatsapp_admin_number', setWaNumber),
        fetchSet('whatsapp_admin_number_2', setWaNumber2),
        fetchSet('price_essential', setPriceEssential),
        fetchSet('price_premium', setPricePremium),
        fetchSet('price_ultimate', setPriceUltimate),
        fetchSet('price_supreme', setPriceSupreme),
        fetchSet('price_titan', setPriceTitan),
        fetchSet('price_guru_pertama', setPriceGuruPertama),
        fetchSet('price_guru_muda', setPriceGuruMuda),
        fetchSet('price_guru_madya', setPriceGuruMadya),
        fetchSet('price_guru_utama', setPriceGuruUtama),
      ]);
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  };

  const saveSetting = async (key: string, value: string, notify = true) => {
    try {
      setIsSavingSettings(true);
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      postLog(`Mengubah pengaturan: ${key}`);
      if (notify) toast.success("Pengaturan berhasil disimpan!");
      setSavedSettings(prev => ({ ...prev, [key]: String(value) }));
    } catch (e) {
      console.error('Failed to save setting', e);
      if (notify) toast.error("Gagal menyimpan pengaturan.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleVoucherToggle = async () => {
    const newValue = !voucherActive;
    setVoucherActive(newValue);
    await saveSetting('promo_voucher_active', newValue ? 'true' : 'false', false);
  };

  const confirmTrialToggle = () => {
    if (!trialActive) {
      setShowTrialConfirm(true);
    } else {
      setTrialActive(false);
      saveSetting('promo_trial_active', 'false', false);
    }
  };

  const handleTrialToggle = async () => {
    setTrialActive(true);
    await saveSetting('promo_trial_active', 'true', false);
    setShowTrialConfirm(false);
  };

  const emailsArray = trialEmails ? trialEmails.split(',').map(e => e.trim()).filter(e => e) : [];

  const handleAddTrialEmail = () => {
    if (!trialEmailInput.trim()) return;
    const newEmails = [...emailsArray, trialEmailInput.trim()];
    const newString = newEmails.join(',');
    setTrialEmails(newString);
    saveSetting('promo_trial_emails', newString, false);
    setTrialEmailInput('');
  };

  const handleRemoveTrialEmail = (emailToRemove: string) => {
    const newEmails = emailsArray.filter(e => e !== emailToRemove);
    const newString = newEmails.join(',');
    setTrialEmails(newString);
    saveSetting('promo_trial_emails', newString, false);
  };

  const confirmMaintenanceToggle = () => {
    setPendingMaintenanceState(!maintenanceActive);
    setShowMaintenanceConfirm(true);
  };

  const handleMaintenanceToggle = async () => {
    const newValue = pendingMaintenanceState;
    setMaintenanceActive(newValue);
    await saveSetting('maintenance_active', newValue ? 'true' : 'false', false);
    setShowMaintenanceConfirm(false);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?t=${Date.now()}`);
      if (res.ok) {
        const data = (await res.json()) as any[];
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setEditName(user.displayName || '');
    setEditRole(user.role || 'siswa');
    setEditTier(user.tier || 'Free');
    setEditTokens(user.tokens != null ? String(user.tokens) : '');
    setEditActiveUntil(user.activeUntil || '');
    setEditIsBanned(user.isBanned === 1);
    setEditSuspendedUntil(user.suspendedUntil || '');
    
    if (user.isBanned === 1) {
      setEditStatusMode('banned');
    } else if (user.suspendedUntil && new Date() < new Date(user.suspendedUntil)) {
      setEditStatusMode('suspend');
    } else {
      setEditStatusMode('active');
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setNewEmail('');
    setNewName('');
    setEditRole('siswa');
    setEditTier('Free');
    setEditTokens('');
    setEditActiveUntil('');
    setEditIsBanned(false);
    setEditSuspendedUntil('');
    setEditStatusMode('active');
  };

  const confirmDeleteUser = (uid: string, email: string) => {
    setUserToDelete({uid, email});
  };

  const executeDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.uid}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("User dihapus");
        postLog(`Menghapus pengguna: ${userToDelete.email}`);
        await fetchUsers();
        await fetchStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUserToDelete(null);
    }
  };

  const fetchUserHistory = async (user: any) => {
    try {
      const res = await fetch(`/api/admin/users/${user.uid}/logs`);
      if (res.ok) {
        setHistoryModalUser(user);
        setHistoryModalData(await res.json());
      }
    } catch (e) {
      toast.error('Gagal mengambil history');
    }
  };

  const submitAddUser = async () => {
    if (!newEmail) return toast.error('Email wajib diisi');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) return toast.error('Format email tidak valid');
    try {
      setIsSaving(true);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, displayName: newName, role: editRole, tier: editTier, activeUntil: editActiveUntil, tokens: editTokens ? parseInt(editTokens) : undefined })
      });
      if (res.ok) {
        setIsAdding(false);
        toast.success('User berhasil ditambahkan');
        postLog(`Menambahkan pengguna baru: ${newEmail} (${editTier})`);
        await fetchUsers();
        await fetchStats();
      } else {
        const data = (await res.json()) as any;
        toast.error(data.error || 'Gagal menambahkan user');
      }
    } catch (e) {
      console.error(e);
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setIsSaving(false);
    }
  };

  const saveUser = async () => {
    if (!editingUser) return;
    try {
      setIsSaving(true);
      const res = await fetch(`/api/admin/users/${editingUser.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editRole,
          tier: editTier,
          activeUntil: editActiveUntil,
          displayName: editName,
          tokens: editTokens ? parseInt(editTokens) : undefined,
          isBanned: editStatusMode === 'banned',
          suspendedUntil: editStatusMode === 'suspend' ? editSuspendedUntil : null
        })
      });
      
      if (res.ok) {
        toast.success("Perubahan disimpan");
        postLog(`Memperbarui profil ${editingUser.email} (Role: ${editRole}, Tier: ${editTier})`);
        setEditingUser(null);
        await fetchUsers();
        await fetchStats();
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  const setPresetDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setEditActiveUntil(d.toISOString().split('T')[0]);
  };

  const handleExportCSV = () => {
    const headers = ['Email', 'Name', 'Role', 'Tier', 'Active Until', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...users.map(u => `"${u.email || ''}","${(u.displayName || '').replace(/"/g, '""')}","${u.role || ''}","${u.tier || ''}","${u.activeUntil || ''}","${u.createdAt || ''}"`)
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'users_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    postLog("Mengekspor data pengguna ke CSV");
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) return toast.error('File CSV kosong atau tidak valid.');
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        const emailIdx = headers.indexOf('email');
        const nameIdx = headers.indexOf('name') > -1 ? headers.indexOf('name') : headers.indexOf('displayname');
        const roleIdx = headers.indexOf('role');
        const tierIdx = headers.indexOf('tier');

        if (emailIdx === -1) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return toast.error('Kolom email tidak ditemukan dalam file CSV.');
        }

        const usersToImport: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const rawLine = lines[i];
          const cols = rawLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rawLine.split(',');
          const cleanCol = (idx: number) => {
            if (!cols[idx]) return '';
            let val = cols[idx].trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
            return val;
          };

          usersToImport.push({
            email: cleanCol(emailIdx),
            displayName: nameIdx > -1 ? cleanCol(nameIdx) : '',
            role: roleIdx > -1 ? cleanCol(roleIdx) : 'siswa',
            tier: tierIdx > -1 ? cleanCol(tierIdx) : 'Free'
          });
        }

        if (usersToImport.length === 0) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        setConfirmImportChecked(false);
        setImportConfirmData(usersToImport);
      } catch (err) {
        toast.error('Terjadi kesalahan saat membaca file CSV.');
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const executeImportCSV = async () => {
    if (!importConfirmData) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: importConfirmData })
      });
      const data = await res.json() as any;
      if (data.success) {
        toast.success(`Berhasil mengimpor ${data.imported} pengguna. Gagal/Duplikat: ${data.failed}.`);
        postLog(`Impor CSV: ${data.imported} berhasil, ${data.failed} gagal`);
        fetchUsers();
      } else {
        toast.error(data.error || 'Gagal mengimpor pengguna.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat mengimpor.');
    } finally {
      setIsImporting(false);
      setImportConfirmData(null);
      setConfirmImportChecked(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredUsers = users.filter(u => {
    const searchMatch = ((u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()));
    
    let tierMatch = true;
    if (filterTier === 'Suspend/Banned') {
      tierMatch = u.isBanned === 1 || (u.suspendedUntil && new Date(u.suspendedUntil) > new Date());
    } else if (filterTier === 'Free') {
      tierMatch = u.tier === 'Free' || !u.tier;
    } else if (filterTier === 'Supreme' || filterTier === 'SUPREME') {
      tierMatch = u.tier === 'Supreme' || u.tier === 'SUPREME';
    } else if (filterTier !== 'All') {
      tierMatch = u.tier === filterTier;
    }

    return searchMatch && tierMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleBulkAction = async () => {
    if (selectedUsers.length === 0 || !bulkAction) return;
    if (bulkAction === 'delete') {
      setConfirmDeleteChecked(false);
      setBulkDeleteConfirmData({ count: selectedUsers.length });
      return;
    }
    executeBulkAction();
  };

  const executeBulkAction = async () => {
    if (selectedUsers.length === 0 || !bulkAction) return;
    
    try {
      setIsBulkSaving(true);
      let payload: any = { action: bulkAction, uids: selectedUsers };
      if (bulkAction === 'updateTier') payload.tier = bulkTier;
      if (bulkAction === 'addTokens') payload.tokens = bulkTokens ? parseInt(bulkTokens) : undefined;
      if (bulkAction === 'suspendTemp') {
        if (!bulkSuspendDays) {
          toast.error('Masukkan jumlah hari suspend');
          setIsBulkSaving(false);
          return;
        }
        const suspendDate = new Date();
        suspendDate.setDate(suspendDate.getDate() + parseInt(bulkSuspendDays));
        payload.suspendedUntil = suspendDate.toISOString();
      }

      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(`Berhasil memproses ${selectedUsers.length} pengguna`);
        postLog(`Aksi massal (${bulkAction}) pada ${selectedUsers.length} pengguna`);
        setSelectedUsers([]);
        setBulkAction('');
        await fetchUsers();
        await fetchStats();
      } else {
        toast.error('Gagal melakukan aksi massal');
      }
    } catch (e) {
      toast.error('Kesalahan jaringan');
    } finally {
      setIsBulkSaving(false);
      setBulkDeleteConfirmData(null);
      setConfirmDeleteChecked(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(paginatedUsers.map(u => u.uid));
    } else {
      setSelectedUsers([]);
    }
  };

  const toggleSelectUser = (uid: string) => {
    if (selectedUsers.includes(uid)) {
      setSelectedUsers(selectedUsers.filter(id => id !== uid));
    } else {
      setSelectedUsers([...selectedUsers, uid]);
    }
  };

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTier]);

  if (user?.role?.toLowerCase() !== 'owner' && user?.role?.toLowerCase() !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-red-100 shadow-sm animate-in fade-in">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Akses Ditolak</h2>
        <p className="text-gray-500 text-sm mt-2">Halaman ini khusus untuk Administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black italic text-blue-600 flex items-center gap-2">
            <Shield size={24} /> ADMIN DASHBOARD
          </h2>
          <p className="text-xs text-gray-500 mb-2">Kelola pengguna, log aktivitas, dan pengaturan sistem.</p>
          <div className="flex gap-2 items-center flex-wrap">
            <button 
              onClick={() => setShowSkillModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
            >
              <Download size={12} /> Unduh Skill Dev
              <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-wider border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                Update
              </span>
            </button>
            <button 
              onClick={() => setShowHelpModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
            >
              <ShieldAlert size={12} /> Panduan Admin
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Star size={16} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Users size={16} /> Pengguna
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'logs' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Activity size={16} /> Log
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Settings size={16} /> Pengaturan
          </button>
          <button 
            onClick={() => setActiveTab('invoice')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'invoice' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FileText size={16} /> Invoice
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users size={24} /></div>
              <div>
                <p className="text-xs text-gray-500 font-bold">Total Pengguna</p>
                <h3 className="text-2xl font-black text-gray-800">{users.length}</h3>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><Crown size={24} /></div>
              <div>
                <p className="text-xs text-gray-500 font-bold">Pengguna Premium+</p>
                <h3 className="text-2xl font-black text-gray-800">{users.filter(u => u.tier !== 'Free').length}</h3>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-xl"><Activity size={24} /></div>
              <div>
                <p className="text-xs text-gray-500 font-bold">Total Token (All)</p>
                <h3 className="text-2xl font-black text-gray-800">{users.reduce((acc, u) => acc + (Number(u.tokens) || 0), 0).toLocaleString('id-ID')}</h3>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><ShieldAlert size={24} /></div>
              <div>
                <p className="text-xs text-gray-500 font-bold">Banned/Suspend</p>
                <h3 className="text-2xl font-black text-gray-800">{users.filter(u => u.isBanned || (u.suspendedUntil && new Date(u.suspendedUntil) > new Date())).length}</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tier Distribution PieChart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Distribusi Tier Pengguna</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        users.reduce((acc, u) => {
                          const t = u.tier || 'Free';
                          acc[t] = (acc[t] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([name, value]) => ({ name, value })).sort((a, b) => (b.value as number) - (a.value as number))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(
                        users.reduce((acc, u) => {
                          const t = u.tier || 'Free';
                          acc[t] = (acc[t] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map((entry, index) => {
                        const colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#6366f1', '#eab308'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} User`, 'Jumlah']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Role Distribution BarChart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Distribusi Peran (Role)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(
                      users.reduce((acc, u) => {
                        const r = u.role || 'guest';
                        acc[r] = (acc[r] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([name, value]) => ({ name, value }))}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Jumlah User">
                      {Object.entries(
                        users.reduce((acc, u) => {
                          const r = u.role || 'guest';
                          acc[r] = (acc[r] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry[0] === 'admin' ? '#f59e0b' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <>
          {/* Stats Cards */}
          {users && users.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-3 mb-6">
              {[
                { title: 'Total Pengguna', count: users.length, filterVal: 'All', colorClass: 'text-blue-600' },
                { title: 'Free', count: users.filter(u => u.tier === 'Free' || !u.tier).length, filterVal: 'Free', colorClass: 'text-slate-500' },
                { title: 'Essential', count: users.filter(u => u.tier === 'Essential').length, filterVal: 'Essential', colorClass: 'text-yellow-600' },
                { title: 'Premium', count: users.filter(u => u.tier === 'Premium').length, filterVal: 'Premium', colorClass: 'text-green-600' },
                { title: 'Ultimate', count: users.filter(u => u.tier === 'Ultimate').length, filterVal: 'Ultimate', colorClass: 'text-indigo-600' },
                { title: 'Supreme', count: users.filter(u => u.tier === 'Supreme' || u.tier === 'SUPREME').length, filterVal: 'SUPREME', colorClass: 'text-purple-600' },
                { title: 'Titan', count: users.filter(u => u.tier === 'Titan').length, filterVal: 'Titan', colorClass: 'text-amber-500' },
                { title: 'Guru Pertama', count: users.filter(u => u.tier === 'Guru Pertama').length, filterVal: 'Guru Pertama', colorClass: 'text-lime-600' },
                { title: 'Guru Muda', count: users.filter(u => u.tier === 'Guru Muda').length, filterVal: 'Guru Muda', colorClass: 'text-teal-600' },
                { title: 'Guru Madya', count: users.filter(u => u.tier === 'Guru Madya').length, filterVal: 'Guru Madya', colorClass: 'text-pink-600' },
                { title: 'Guru Utama', count: users.filter(u => u.tier === 'Guru Utama').length, filterVal: 'Guru Utama', colorClass: 'text-orange-600' },
                { title: 'Suspend/Banned', count: users.filter(u => u.isBanned === 1 || (u.suspendedUntil && new Date(u.suspendedUntil) > new Date())).length, filterVal: 'Suspend/Banned', colorClass: 'text-red-600' }
              ].map((card, idx) => (
                <div 
                  key={idx}
                  onClick={() => setFilterTier(card.filterVal)}
                  className={`bg-white p-3 rounded-xl border ${filterTier === card.filterVal ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'} shadow-sm flex flex-col justify-center cursor-pointer hover:border-blue-300 transition-colors`}
                >
                  <div className="text-gray-500 text-[10px] uppercase font-bold mb-1">{card.title}</div>
                  <div className={`text-xl font-black ${card.colorClass}`}>{card.count}</div>
                </div>
              ))}
            </div>
          )}



          <div className="flex flex-col md:flex-row gap-3 w-full justify-between items-center mb-4">
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={handleAdd} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm flex-1 md:flex-none">
                <Plus size={16} /> Tambah
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm flex-1 md:flex-none">
                <Download className="rotate-180" size={16} /> {isImporting ? 'Mengimpor...' : 'Impor CSV'}
              </button>
              <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleImportCSV} />
              <button onClick={handleExportCSV} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm flex-1 md:flex-none">
                <Download size={16} /> Ekspor CSV
              </button>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="All">Semua Tier</option>
                <option value="Free">Free</option>
                <option value="Guru Pertama">Guru Pertama</option>
                <option value="Guru Muda">Guru Muda</option>
                <option value="Guru Madya">Guru Madya</option>
                <option value="Guru Utama">Guru Utama</option>
                <option value="Essential">Essential</option>
                <option value="Premium">Premium</option>
                <option value="Ultimate">Ultimate</option>
                <option value="SUPREME">SUPREME</option>
                <option value="Titan">Titan</option>
                <option value="Suspend/Banned">Suspend/Banned</option>
              </select>
              <div className="relative flex-1 md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari email/nama..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in zoom-in-95">
          <div className="text-sm font-bold text-blue-800">
            {selectedUsers.length} pengguna dipilih
          </div>
          <div className="flex gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-700 focus:outline-none"
            >
              <option value="">-- Pilih Aksi --</option>
              <option value="updateTier">Ubah Tier</option>
              <option value="addTokens">Tambah Token</option>
              <option value="suspend">Banned Permanen</option>
              <option value="suspendTemp">Suspend Sementara</option>
              <option value="unsuspend">Unsuspend User</option>
              <option value="delete">Hapus Massal</option>
            </select>
            
            {bulkAction === 'updateTier' && (
              <select
                value={bulkTier}
                onChange={(e) => setBulkTier(e.target.value)}
                className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-700 focus:outline-none"
              >
                <option value="">-- Pilih Tier --</option>
                <option value="Free">Free</option>
                <option value="Guru Pertama">Guru Pertama</option>
                <option value="Guru Muda">Guru Muda</option>
                <option value="Guru Madya">Guru Madya</option>
                <option value="Guru Utama">Guru Utama</option>
                <option value="Essential">Essential</option>
                <option value="Premium">Premium</option>
                <option value="Ultimate">Ultimate</option>
                <option value="SUPREME">SUPREME</option>
                <option value="Titan">Titan</option>
              </select>
            )}
            
            {bulkAction === 'addTokens' && (
              <input
                type="number"
                placeholder="Jml Token"
                value={bulkTokens}
                onChange={e => setBulkTokens(e.target.value)}
                className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-700 w-24 focus:outline-none"
              />
            )}
            
            {bulkAction === 'suspendTemp' && (
              <input
                type="number"
                placeholder="Jml Hari"
                value={bulkSuspendDays}
                onChange={e => setBulkSuspendDays(e.target.value)}
                className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-700 w-24 focus:outline-none"
              />
            )}

            <button 
              onClick={handleBulkAction}
              disabled={isBulkSaving || !bulkAction || (bulkAction === 'updateTier' && !bulkTier)}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isBulkSaving ? 'Memproses...' : 'Terapkan'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-xs uppercase font-bold tracking-wider text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={handleSelectAll}
                    checked={paginatedUsers.length > 0 && selectedUsers.length === paginatedUsers.length}
                  />
                </th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Active Until</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Tidak ada user ditemukan.</td>
                </tr>
              ) : (
                paginatedUsers.map(u => (
                  <tr key={u.uid} className={`transition-colors ${selectedUsers.includes(u.uid) ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedUsers.includes(u.uid)}
                        onChange={() => toggleSelectUser(u.uid)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800 flex items-center gap-2">
                        {u.displayName || 'Unknown'}
                        {u.isBanned === 1 ? (
                          <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold">BANNED</span>
                        ) : u.suspendedUntil && new Date() < new Date(u.suspendedUntil) ? (
                          <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded font-bold" title={`Hingga: ${new Date(u.suspendedUntil).toLocaleString('id-ID')}`}>SUSPENDED</span>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'owner' ? 'bg-amber-100 text-amber-700' :
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role === 'owner' ? <Crown size={10} /> : <Shield size={10} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        u.tier === 'Titan' ? 'bg-amber-100 text-amber-700' :
                        u.tier === 'SUPREME' ? 'bg-purple-100 text-purple-700' :
                        u.tier === 'Ultimate' ? 'bg-indigo-100 text-indigo-700' :
                        u.tier === 'Premium' ? 'bg-blue-100 text-blue-700' :
                        u.tier === 'Essential' ? 'bg-green-100 text-green-700' :
                        u.tier === 'Guru Utama' ? 'bg-orange-100 text-orange-700' :
                        u.tier === 'Guru Madya' ? 'bg-pink-100 text-pink-700' :
                        u.tier === 'Guru Muda' ? 'bg-teal-100 text-teal-700' :
                        u.tier === 'Guru Pertama' ? 'bg-lime-100 text-lime-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {u.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {u.activeUntil ? (
                        <span className={new Date(u.activeUntil) < new Date() ? 'text-red-500 font-bold' : 'text-emerald-600'}>
                          {u.activeUntil}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">No Expiry</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => fetchUserHistory(u)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg text-xs font-bold uppercase transition-colors"
                        >
                          <Activity size={12} /> Log
                        </button>
                        <button 
                          onClick={() => handleEdit(u)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-xs font-bold uppercase transition-colors"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button 
                          onClick={() => confirmDeleteUser(u.uid, u.email)}
                          className="inline-flex items-center px-2 py-1.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                          title="Hapus Pengguna"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Menampilkan <span className="font-bold text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> dari <span className="font-bold text-gray-700">{filteredUsers.length}</span> pengguna
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Prev
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {stats?.growth && stats.growth.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mt-6 mb-6 relative overflow-hidden group/chart animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Decorative background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-between items-end mb-6 relative z-10">
            <div>
              <h3 className="text-lg font-black italic text-gray-800 flex items-center gap-2">
                <Activity size={20} className="text-blue-500 animate-pulse" /> TREN PENDAFTARAN
              </h3>
              <p className="text-xs text-gray-500">Statistik pertumbuhan pengguna dalam 30 hari terakhir</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-blue-600">
                {stats.growth.reduce((sum: number, g: any) => sum + g.count, 0)}
              </div>
              <div className="text-[10px] uppercase font-bold text-gray-400">Total Pendaftar Baru</div>
            </div>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
                  }}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={20}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <RechartsTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-900 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-xl flex flex-col items-center">
                          <span className="text-blue-300 mb-1">{label}</span>
                          <span className="text-sm">{payload[0].value} Pengguna</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb', stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      </>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Activity size={20} className="text-blue-500" /> Log Sistem
              </h3>
              <p className="text-xs text-gray-500">Merekam aktivitas admin dan aksi pengguna dalam aplikasi.</p>
            </div>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => { setLogTab('admin'); setVisibleLogsCount(50); }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${logTab === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Log Admin
              </button>
              <button 
                onClick={() => { setLogTab('activity'); setVisibleLogsCount(50); }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${logTab === 'activity' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Aktivitas Pengguna
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative scrollbar-thin scrollbar-thumb-gray-200">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-xs uppercase font-bold tracking-wider text-gray-500 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4">Waktu</th>
                  {logTab === 'admin' ? (
                    <>
                      <th className="px-6 py-4">Admin Email</th>
                      <th className="px-6 py-4 w-full">Aksi</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4">Pengguna</th>
                      <th className="px-6 py-4">Aktivitas</th>
                      <th className="px-6 py-4 w-full">Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logTab === 'admin' ? (
                  adminLogs.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Belum ada aktivitas admin tercatat.</td></tr>
                  ) : (
                    adminLogs.slice(0, visibleLogsCount).map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                          {log.created_at ? new Date(log.created_at).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-3 px-6"><span className="font-bold text-gray-800 text-xs">{log.admin_email || 'Sistem'}</span></td>
                        <td className="py-3 px-6"><span className="text-gray-600 text-xs">{log.action || '-'}</span></td>
                      </tr>
                    ))
                  )
                ) : (
                  activityLogs.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Belum ada aktivitas pengguna tercatat.</td></tr>
                  ) : (
                    activityLogs.slice(0, visibleLogsCount).map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : (log.time || '-')}
                        </td>
                        <td className="py-3 px-6"><span className="font-bold text-gray-800 text-xs">Aktivitas</span></td>
                        <td className="py-3 px-6"><span className="text-gray-600 text-xs">{log.msg}</span></td>
                        <td className="py-3 px-6">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-${log.color}-100 text-${log.color}-700`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
            
            {/* Load More Button */}
            {((logTab === 'admin' && adminLogs.length > visibleLogsCount) || 
              (logTab === 'activity' && activityLogs.length > visibleLogsCount)) && (
              <div className="p-4 flex justify-center bg-gray-50/90 sticky bottom-0 z-10 backdrop-blur-sm border-t border-gray-100">
                <button
                  onClick={() => setVisibleLogsCount(prev => prev + 50)}
                  className="px-6 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <Activity size={16} className="text-gray-400"/> Muat Lebih Banyak
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-3xl animate-in fade-in slide-in-from-right-4 space-y-6 pb-12">
          <h3 className="text-xl font-bold text-gray-800 px-2 flex items-center gap-2">
            <Settings size={24} className="text-blue-500" /> Pengaturan Global Aplikasi
          </h3>
          
          <div className="space-y-6">
            {/* Section: Promo Voucher */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                  <Star size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800">Manajemen Voucher Diskon</h2>
                  <p className="text-xs text-gray-500">Aktifkan atau nonaktifkan voucher global untuk pengguna.</p>
                </div>
                <div className="ml-auto">
                  <button 
                    onClick={handleVoucherToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${voucherActive ? 'bg-green-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${voucherActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {voucherActive && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">Kode Voucher Custom</label>
                  <p className="text-[10px] text-gray-400 mb-3">Kosongkan jika ingin menggunakan kode bawaan (GURUHEBAT20).</p>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder="GURUHEBAT20"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 font-bold uppercase tracking-widest"
                    />
                    <button 
                      onClick={() => saveSetting('promo_voucher_code', voucherCode)}
                      className={getBtnClass('promo_voucher_code', voucherCode, "px-6 py-3 rounded-xl text-sm font-bold shadow-sm w-full sm:w-auto")}
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Section: Promo Trial */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Star size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800">Manajemen Uji Coba (Free Trial)</h2>
                  <p className="text-xs text-gray-500">Berikan akses trial otomatis untuk pengguna yang baru mendaftar dengan pilihan khusus.</p>
                </div>
                <div className="ml-auto">
                  <button 
                    onClick={confirmTrialToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${trialActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${trialActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {trialActive && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Durasi Trial (Hari)</label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="number"
                        value={trialDays}
                        onChange={(e) => setTrialDays(e.target.value)}
                        placeholder="3"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={() => saveSetting('promo_trial_days', trialDays)}
                        className={getBtnClass('promo_trial_days', trialDays, "w-full px-6 py-3 rounded-xl text-sm font-bold shadow-sm")}
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Jumlah Token Awal</label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="number"
                        value={trialTokens}
                        onChange={(e) => setTrialTokens(e.target.value)}
                        placeholder="50"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={() => saveSetting('promo_trial_tokens', trialTokens)}
                        className={getBtnClass('promo_trial_tokens', trialTokens, "w-full px-6 py-3 rounded-xl text-sm font-bold shadow-sm")}
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Tier Trial (Tanpa WM)</label>
                    <div className="flex flex-col gap-2">
                      <select
                        value={trialTier}
                        onChange={(e) => setTrialTier(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="Essential">Essential</option>
                        <option value="Premium">Premium</option>
                        <option value="Ultimate">Ultimate</option>
                        <option value="Supreme">Supreme</option>
                        <option value="Guru Pertama">Guru Pertama</option>
                        <option value="Guru Muda">Guru Muda</option>
                        <option value="Guru Madya">Guru Madya</option>
                        <option value="Guru Utama">Guru Utama</option>
                        <option value="Free">Free (Dengan Watermark)</option>
                      </select>
                      <button 
                        onClick={() => saveSetting('promo_trial_tier', trialTier)}
                        className={getBtnClass('promo_trial_tier', trialTier, "w-full px-6 py-3 rounded-xl text-sm font-bold shadow-sm")}
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                  
                  {/* Email Whitelist Spanning Full Width */}
                  <div className="md:col-span-3 border-t border-gray-100 pt-4 mt-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Target Email Spesifik (Opsional)</label>
                    <p className="text-[10px] text-gray-400 mb-3">Jika ditambahkan, hanya email di bawah ini yang akan mendapatkan akses trial. Kosongkan daftar ini jika ingin berlaku untuk <b>semua</b> pendaftar baru.</p>
                    
                    <div className="flex flex-col gap-3">
                      {/* Form Tambah Email */}
                      <div className="flex gap-2 items-stretch">
                        <input
                          type="email"
                          value={trialEmailInput}
                          onChange={(e) => setTrialEmailInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTrialEmail()}
                          placeholder="Masukkan email (contoh: budi@gmail.com)"
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                        />
                        <button 
                          onClick={handleAddTrialEmail}
                          className="px-4 py-3 bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-colors flex items-center justify-center shadow-sm shrink-0"
                        >
                          <Plus size={20} />
                        </button>
                      </div>

                      {/* List Email */}
                      {emailsArray.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {emailsArray.map((email, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-700 shadow-sm">
                              <span>{email}</span>
                              <button 
                                onClick={() => handleRemoveTrialEmail(email)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section: Mode Pemeliharaan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800">Mode Pemeliharaan (Maintenance)</h2>
                  <p className="text-xs text-gray-500">Tutup akses aplikasi untuk umum dengan waktu batas.</p>
                </div>
                <div className="ml-auto">
                  <button 
                    onClick={confirmMaintenanceToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maintenanceActive ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {maintenanceActive && (
                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <label className="block text-xs font-bold text-indigo-800 mb-2">Batas Waktu Maintenance (Selesai pada)</label>
                  <p className="text-[10px] text-indigo-500 mb-2 font-medium">💡 Klik ikon kalender/jam di ujung kolom input ini untuk memilih tanggal secara visual tanpa harus mengetik manual.</p>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch mb-4">
                    <div className="relative flex-1">
                      <input
                        type="datetime-local"
                        value={maintenanceEndTime}
                        onChange={(e) => setMaintenanceEndTime(e.target.value)}
                        className="w-full pl-4 pr-4 py-3 border border-indigo-200 rounded-xl text-sm font-bold text-indigo-900 bg-white shadow-inner focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                      />
                    </div>
                    <button 
                      onClick={() => saveSetting('maintenance_end_time', maintenanceEndTime)}
                      className={getBtnClass('maintenance_end_time', maintenanceEndTime, "px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap shadow-sm w-full sm:w-auto")}
                    >
                      Simpan
                    </button>
                  </div>
                  
                  <label className="block text-xs font-bold text-indigo-800 mb-2">Pesan/Alasan Maintenance (Opsional)</label>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch mb-2">
                    <div className="relative flex-1">
                      <textarea
                        value={maintenanceReason}
                        onChange={(e) => setMaintenanceReason(e.target.value)}
                        placeholder="Contoh: Kami sedang melakukan peningkatan sistem database..."
                        className="w-full px-4 py-3 border border-indigo-200 rounded-xl text-sm text-indigo-900 bg-white shadow-inner focus:outline-none focus:border-indigo-500 min-h-[80px]"
                      />
                    </div>
                    <button 
                      onClick={() => saveSetting('maintenance_reason', maintenanceReason)}
                      className={getBtnClass('maintenance_reason', maintenanceReason, "px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap shadow-sm w-full sm:w-auto h-auto sm:h-full")}
                    >
                      Simpan
                    </button>
                  </div>
                  <p className="text-[10px] text-indigo-600 mt-2">Hanya Admin dan Owner yang dapat melihat sistem selama mode ini aktif.</p>
                </div>
              )}
            </div>


            {/* Section: Pengumuman Global */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800">Pengumuman Global</h2>
                  <p className="text-xs text-gray-500">Pesan ini akan muncul di banner atas aplikasi.</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Teks Banner Pengumuman</label>
                <p className="text-[10px] text-gray-500 mb-2">Akan muncul di bagian paling atas aplikasi. Kosongkan jika tidak ada pengumuman.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={globalAnnouncement}
                    onChange={(e) => setGlobalAnnouncement(e.target.value)}
                    placeholder="Server sedang dalam pemeliharaan..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button 
                    onClick={() => saveSetting('global_announcement', globalAnnouncement)}
                    disabled={isSavingSettings}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>

            {/* Section: Harga & Kontak */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800">Harga & Kontak</h2>
                  <p className="text-xs text-gray-500">Atur harga tier berlangganan dan nomor WhatsApp kontak.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Harga Essential</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={priceEssential}
                      onChange={(e) => setPriceEssential(e.target.value)}
                      placeholder="Rp 170.000"
                      className="w-full pl-4 pr-20 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={() => saveSetting('price_essential', priceEssential)}
                      className={getBtnClass('price_essential', priceEssential, "absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-bold")}
                    >Simpan</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Harga Premium</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={pricePremium}
                      onChange={(e) => setPricePremium(e.target.value)}
                      placeholder="Rp 408.000"
                      className="w-full pl-4 pr-20 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={() => saveSetting('price_premium', pricePremium)}
                      className={getBtnClass('price_premium', pricePremium, "absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-bold")}
                    >Simpan</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Harga Ultimate</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={priceUltimate}
                      onChange={(e) => setPriceUltimate(e.target.value)}
                      placeholder="Rp 816.000"
                      className="w-full pl-4 pr-20 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={() => saveSetting('price_ultimate', priceUltimate)}
                      className={getBtnClass('price_ultimate', priceUltimate, "absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-bold")}
                    >Simpan</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Harga SUPREME</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={priceSupreme}
                      onChange={(e) => setPriceSupreme(e.target.value)}
                      placeholder="Rp 1.250.000"
                      className="w-full pl-4 pr-20 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={() => saveSetting('price_supreme', priceSupreme)}
                      className={getBtnClass('price_supreme', priceSupreme, "absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-bold")}
                    >Simpan</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Harga Titan</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={priceTitan}
                      onChange={(e) => setPriceTitan(e.target.value)}
                      placeholder="Rp 2.000.000"
                      className="w-full pl-4 pr-20 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={() => saveSetting('price_titan', priceTitan)}
                      className={getBtnClass('price_titan', priceTitan, "absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-bold")}
                    >Simpan</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Harga Guru Pertama</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={priceGuruPertama}
                      onChange={(e) => setPriceGuruPertama(e.target.value)}
                      placeholder="Rp 49.000"
                      className="w-full pl-4 pr-20 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={() => saveSetting('price_guru_pertama', priceGuruPertama)}
                      className={getBtnClass('price_guru_pertama', priceGuruPertama, "absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-bold")}
                    >Simpan</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Harga Guru Muda</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={priceGuruMuda}
                      onChange={(e) => setPriceGuruMuda(e.target.value)}
                      placeholder="Rp 135.000"
                      className="w-full pl-4 pr-20 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={() => saveSetting('price_guru_muda', priceGuruMuda)}
                      className={getBtnClass('price_guru_muda', priceGuruMuda, "absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-bold")}
                    >Simpan</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Harga Guru Madya</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={priceGuruMadya}
                      onChange={(e) => setPriceGuruMadya(e.target.value)}
                      placeholder="Rp 249.000"
                      className="w-full pl-4 pr-20 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={() => saveSetting('price_guru_madya', priceGuruMadya)}
                      className={getBtnClass('price_guru_madya', priceGuruMadya, "absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-bold")}
                    >Simpan</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Harga Guru Utama</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={priceGuruUtama}
                      onChange={(e) => setPriceGuruUtama(e.target.value)}
                      placeholder="Rp 449.000"
                      className="w-full pl-4 pr-20 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={() => saveSetting('price_guru_utama', priceGuruUtama)}
                      className={getBtnClass('price_guru_utama', priceGuruUtama, "absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-bold")}
                    >Simpan</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Nomor WhatsApp Admin 1 (Tanpa +)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      placeholder="628123456789"
                      className="w-full pl-4 pr-20 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={() => saveSetting('whatsapp_admin_number', waNumber)}
                      className={getBtnClass('whatsapp_admin_number', waNumber, "absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-bold")}
                    >Simpan</button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Gunakan format 62xxx. Akan dihubungi oleh klien.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Nomor WhatsApp Admin 2 (Opsional)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={waNumber2}
                      onChange={(e) => setWaNumber2(e.target.value)}
                      placeholder="628987654321"
                      className="w-full pl-4 pr-20 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={() => saveSetting('whatsapp_admin_number_2', waNumber2)}
                      className={getBtnClass('whatsapp_admin_number_2', waNumber2, "absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-bold")}
                    >Simpan</button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Jika diisi, chat klien akan dibagi rata antara Admin 1 dan Admin 2.</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Edit2 size={16} className="text-blue-500" /> Edit User
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Kolom Kiri */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">User Info</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nama Pengguna"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-500 mb-1"
                    />
                    <div className="text-[11px] font-mono text-gray-500 pl-1">{editingUser.email}</div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Role / Hak Akses</label>
                    <div className="flex gap-2 flex-wrap">
                      {['siswa', 'staf', 'admin', 'owner'].map(r => (
                        <button
                          key={r}
                          onClick={() => setEditRole(r)}
                          className={`flex-1 min-w-[60px] py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest border transition-all ${editRole === r ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Masa Aktif (YYYY-MM-DD)</label>
                    <div className="relative mb-2">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={editActiveUntil}
                        onChange={(e) => setEditActiveUntil(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditActiveUntil('')} className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-[10px] font-bold uppercase">Clear</button>
                      <button onClick={() => setPresetDate(30)} className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[10px] font-bold uppercase">+30 Hari</button>
                      <button onClick={() => setPresetDate(180)} className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[10px] font-bold uppercase">+6 Bln</button>
                      <button onClick={() => setPresetDate(365)} className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[10px] font-bold uppercase">+1 Thn</button>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Subscription Tier</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Free', 'Guru Pertama', 'Guru Muda', 'Guru Madya', 'Guru Utama', 'Essential', 'Premium', 'Ultimate', 'SUPREME', 'Titan'].map(t => (
                        <button
                          key={t}
                          onClick={() => setEditTier(t)}
                          className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${editTier === t ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Sisa Token (Opsional)</label>
                    <p className="text-[10px] text-gray-400 mb-2 leading-tight">Kosongkan kolom ini jika ingin token diisi otomatis mengikuti bawaan paket Tier di atas.</p>
                    <input
                      type="number"
                      value={editTokens}
                      onChange={(e) => setEditTokens(e.target.value)}
                      placeholder="Contoh: 1500"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Status Akun</label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <button
                        onClick={() => setEditStatusMode('active')}
                        className={`py-2 px-3 border rounded-lg text-xs font-bold transition-colors ${editStatusMode === 'active' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setEditStatusMode('suspend')}
                        className={`py-2 px-3 border rounded-lg text-xs font-bold transition-colors ${editStatusMode === 'suspend' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        Suspend Temp
                      </button>
                      <button
                        onClick={() => setEditStatusMode('banned')}
                        className={`py-2 px-3 border rounded-lg text-xs font-bold transition-colors ${editStatusMode === 'banned' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        Banned
                      </button>
                    </div>
                    {editStatusMode === 'suspend' && (
                      <div className="mt-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Sampai Tanggal (Suspend)</label>
                        <input
                          type="datetime-local"
                          value={editSuspendedUntil ? new Date(new Date(editSuspendedUntil).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''}
                          onChange={(e) => setEditSuspendedUntil(new Date(e.target.value).toISOString())}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button 
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 transition-colors"
              >
                BATAL
              </button>
              <button 
                onClick={saveUser}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : <><Save size={14} /> SIMPAN</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Plus size={16} className="text-blue-500" /> Tambah User Baru
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Kolom Kiri */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Nama Pengguna (Opsional)</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nama Lengkap"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 mb-3"
                    />
                    
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Alamat Email *</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Role / Hak Akses</label>
                    <div className="flex gap-2 flex-wrap">
                      {['siswa', 'staf', 'admin', 'owner'].map(r => (
                        <button
                          key={r}
                          onClick={() => setEditRole(r)}
                          className={`flex-1 min-w-[60px] py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest border transition-all ${editRole === r ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Masa Aktif (YYYY-MM-DD)</label>
                    <div className="relative mb-2">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={editActiveUntil}
                        onChange={(e) => setEditActiveUntil(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditActiveUntil('')} className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-[10px] font-bold uppercase">Clear</button>
                      <button onClick={() => setPresetDate(30)} className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[10px] font-bold uppercase">+30 Hari</button>
                      <button onClick={() => setPresetDate(180)} className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[10px] font-bold uppercase">+6 Bln</button>
                      <button onClick={() => setPresetDate(365)} className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[10px] font-bold uppercase">+1 Thn</button>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Subscription Tier</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Free', 'Guru Pertama', 'Guru Muda', 'Guru Madya', 'Guru Utama', 'Essential', 'Premium', 'Ultimate', 'SUPREME', 'Titan'].map(t => (
                        <button
                          key={t}
                          onClick={() => setEditTier(t)}
                          className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${editTier === t ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Sisa Token (Opsional)</label>
                    <p className="text-[10px] text-gray-400 mb-2 leading-tight">Kosongkan kolom ini jika ingin token diisi otomatis mengikuti bawaan paket Tier di atas.</p>
                    <input
                      type="number"
                      value={editTokens}
                      onChange={(e) => setEditTokens(e.target.value)}
                      placeholder="Contoh: 1500"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 transition-colors"
              >
                BATAL
              </button>
              <button 
                onClick={submitAddUser}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : <><Save size={14} /> TAMBAH USER</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Confirmation Modal */}
      {showMaintenanceConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 relative border border-gray-100">
            <button onClick={() => setShowMaintenanceConfirm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
              <X size={20} />
            </button>
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6 shadow-sm ${pendingMaintenanceState ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-xl font-black text-center text-gray-800 mb-2">
              Konfirmasi {pendingMaintenanceState ? 'Aktivasi' : 'Nonaktifkan'}
            </h3>
            <p className="text-center text-gray-500 text-sm mb-8 leading-relaxed">
              {pendingMaintenanceState 
                ? 'Mode Pemeliharaan akan diaktifkan. Pengguna umum tidak dapat mengakses aplikasi hingga batas waktu yang ditentukan.' 
                : 'Mode Pemeliharaan akan dinonaktifkan. Pengguna umum akan dapat mengakses aplikasi kembali.'}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowMaintenanceConfirm(false)} 
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleMaintenanceToggle} 
                className={`flex-1 px-4 py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:-translate-y-0.5 ${pendingMaintenanceState ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'}`}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Confirmation Modal */}
      {importConfirmData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setImportConfirmData(null)}>
          <div 
            className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl transform transition-all border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Download size={32} className="rotate-180" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Impor Pengguna?</h3>
              <p className="text-gray-500 mb-4 text-sm">
                Anda akan mengimpor <span className="font-bold text-gray-800">{importConfirmData.length}</span> pengguna dari file CSV. Lanjutkan?
              </p>
              <label className="flex items-center gap-2 mb-6 cursor-pointer bg-blue-50 p-3 rounded-lg border border-blue-200 w-full text-left">
                <input 
                  type="checkbox" 
                  checked={confirmImportChecked}
                  onChange={(e) => setConfirmImportChecked(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-blue-800 font-medium">Saya sudah mengecek ulang file CSV ini</span>
              </label>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => { setImportConfirmData(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={executeImportCSV}
                  disabled={isImporting || !confirmImportChecked}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isImporting ? 'Mengimpor...' : 'Impor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirmData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setBulkDeleteConfirmData(null)}>
          <div 
            className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl transform transition-all border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Massal?</h3>
              <p className="text-gray-500 mb-4 text-sm">
                Yakin ingin menghapus <span className="font-bold text-gray-800">{bulkDeleteConfirmData.count}</span> pengguna secara permanen?
              </p>
              <label className="flex items-center gap-2 mb-6 cursor-pointer bg-red-50 p-3 rounded-lg border border-red-200 w-full text-left">
                <input 
                  type="checkbox" 
                  checked={confirmDeleteChecked}
                  onChange={(e) => setConfirmDeleteChecked(e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-red-800 font-medium">Ya, saya yakin dan paham aksi ini permanen</span>
              </label>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setBulkDeleteConfirmData(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={executeBulkAction}
                  disabled={isBulkSaving || !confirmDeleteChecked}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md shadow-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBulkSaving ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setUserToDelete(null)}>
          <div 
            className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl transform transition-all border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Pengguna?</h3>
              <p className="text-gray-500 mb-6 text-sm">
                Tindakan ini permanen dan tidak dapat dibatalkan. Pengguna <span className="font-bold text-gray-800">{userToDelete.email}</span> akan dihapus dari sistem.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={executeDeleteUser}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md shadow-red-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Free Trial Confirmation Modal */}
      {showTrialConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setShowTrialConfirm(false)}>
          <div 
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl transform transition-all border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Star size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aktifkan Free Trial?</h3>
              <p className="text-gray-500 mb-6 text-sm text-center">
                Mengaktifkan fitur ini akan memunculkan penawaran <b>Free Trial</b> secara publik di halaman Berlangganan (Pricing).
              </p>
              
              <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 text-left">
                <p className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wider">Detail Paket Trial:</p>
                <ul className="space-y-2 text-sm text-blue-900">
                  <li className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="font-medium">Tier Akun:</span> 
                    <span className="font-bold">{trialTier}</span>
                  </li>
                  <li className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="font-medium">Jumlah Token:</span> 
                    <span className="font-bold">{trialTokens} Token</span>
                  </li>
                  <li className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="font-medium">Masa Aktif:</span> 
                    <span className="font-bold">{trialDays} Hari</span>
                  </li>
                  <li className="flex justify-between pb-1">
                    <span className="font-medium">Watermark:</span> 
                    <span className="font-bold">{trialTier === 'Free' ? 'Ada Watermark' : 'Tanpa Watermark'}</span>
                  </li>
                </ul>
                <p className="text-[10px] text-blue-600 mt-3 bg-blue-100 p-2 rounded-lg leading-tight">
                  Pengguna akan diarahkan ke WhatsApp Admin saat mengklaim promo ini.
                </p>
              </div>

              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowTrialConfirm(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleTrialToggle}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  Ya, Aktifkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invoice' && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <InvoiceGenerator />
        </div>
      )}

      {/* History Modal */}
      {historyModalData && historyModalUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50 shrink-0">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 min-w-0">
                <Activity size={16} className="text-purple-500 shrink-0" />
                <span className="shrink-0 hidden sm:inline">Riwayat Token:</span>
                <span className="shrink-0 sm:hidden">Riwayat:</span>
                <span className="font-mono text-sm ml-1 truncate text-gray-500" title={historyModalUser.email}>{historyModalUser.email}</span>
              </h3>
              <button onClick={() => setHistoryModalData(null)} className="text-gray-400 hover:text-red-500 transition-colors shrink-0 p-1 rounded-md hover:bg-gray-200">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto min-h-0 bg-gray-50">
              {historyModalData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Belum ada riwayat penggunaan token.</div>
              ) : (
                <div className="space-y-3">
                  {historyModalData.map((log: any) => (
                    <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{log.action}</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(log.timestamp).toLocaleString('id-ID')}</div>
                      </div>
                      <div className="font-mono text-red-600 font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                        -{log.tokens_spent} Token
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Skill Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-black text-lg flex items-center gap-2">
                <Download size={20} /> Panduan Instalasi Skill AI
              </h3>
              <button onClick={() => setShowSkillModal(false)} className="text-white/80 hover:text-white transition-colors shrink-0 p-1 rounded-md hover:bg-white/10">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700">
              <p className="font-semibold">Agar agen AI (seperti Google Antigravity, Cursor, atau Roo Code) di komputer admin/developer lain bisa otomatis memahami arsitektur Pemuryadi Generator, ikuti langkah berikut:</p>
              
              <ol className="list-decimal list-inside space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <li>
                  <span className="font-semibold text-gray-900">Unduh File Skill:</span> Klik tombol unduh di bawah ini.
                </li>
                <li>
                  <span className="font-semibold text-gray-900">Buat Folder Konfigurasi:</span> Buka File Explorer/Finder dan buat folder berikut (jika belum ada):<br/>
                  <code className="block mt-1 bg-gray-200 p-2 rounded text-xs select-all text-blue-700 break-all">C:\Users\NAMA_USER_ANDA\.gemini\config\skills\pemuryadi-generator-dev</code>
                  <span className="text-[10px] text-gray-500 block mt-1">(Untuk pengguna Mac/Linux: `~/.gemini/config/skills/pemuryadi-generator-dev`)</span>
                </li>
                <li>
                  <span className="font-semibold text-gray-900">Pindahkan:</span> Pindahkan file <code>SKILL.md</code> yang baru saja Anda unduh ke dalam folder tersebut.
                </li>
                <li>
                  <span className="font-semibold text-gray-900">Selesai!</span> Buka kembali AI Editor Anda. AI akan otomatis mendeteksi dan mematuhi aturan arsitektur & kolaborasi (Git Workflow) Pemuryadi tanpa perlu diajari ulang!
                </li>
              </ol>

              <div className="mt-6 flex justify-center">
                <a 
                  href="/pemuryadi-generator-dev-skill.md" 
                  download="SKILL.md"
                  onClick={() => setShowSkillModal(false)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-black transition-all shadow-lg hover:shadow-blue-500/30 w-full sm:w-auto"
                >
                  <Download size={18} />
                  UNDUH FILE SKILL SEKARANG
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-black text-lg flex items-center gap-2">
                <Shield size={20} /> Panduan Admin Dashboard
              </h3>
              <button onClick={() => setShowHelpModal(false)} className="text-white/80 hover:text-white transition-colors shrink-0 p-1 rounded-md hover:bg-white/10">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5 text-sm text-gray-700">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 flex items-center gap-2 mb-2"><Star size={16} /> Tab Overview</h4>
                <ul className="list-disc pl-5 space-y-1 text-emerald-900/80 text-xs">
                  <li><strong>Analitik Visual:</strong> Pantau distribusi pengguna berdasarkan Tier dan Role melalui grafik dinamis.</li>
                  <li><strong>Ringkasan Data:</strong> Lihat metrik utama seperti total pengguna, pengguna berbayar, dan akun yang ditangguhkan.</li>
                </ul>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-2"><Users size={16} /> Tab Pengguna</h4>
                <ul className="list-disc pl-5 space-y-1 text-amber-900/80 text-xs">
                  <li><strong>Manajemen Akun:</strong> Ubah Role, atur Tier langganan, dan pantau tanggal kedaluwarsa.</li>
                  <li><strong>Ekspor & Impor:</strong> Unduh semua data ke file Excel (CSV) atau impor massal data pengguna baru.</li>
                  <li><strong>Kontrol Akses:</strong> Tambah/kurangi Token secara manual, atau Banned/Suspend user yang melanggar.</li>
                  <li><strong>Aksi Massal:</strong> Pilih banyak user sekaligus untuk ditambah token atau di-suspend via "Bulk Actions".</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2"><Activity size={16} /> Tab Log</h4>
                <ul className="list-disc pl-5 space-y-1 text-blue-900/80 text-xs">
                  <li><strong>Riwayat Sistem:</strong> Pantau semua aktivitas penggunaan token oleh pengguna.</li>
                  <li><strong>Aktivitas Admin:</strong> Melacak perubahan yang dilakukan oleh admin lain untuk transparansi.</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <h4 className="font-bold text-purple-800 flex items-center gap-2 mb-2"><Settings size={16} /> Tab Pengaturan</h4>
                <ul className="list-disc pl-5 space-y-1 text-purple-900/80 text-xs">
                  <li><strong>Harga & Promo:</strong> Atur harga paket langganan secara dinamis dan setel kode voucher/trial.</li>
                  <li><strong>Komunikasi:</strong> Ubah nomor WhatsApp CS dan buat Pengumuman Global di layar depan pengguna.</li>
                  <li><strong>Sistem:</strong> Aktifkan "Maintenance Mode" jika sedang ada perbaikan untuk mencegah akses user.</li>
                </ul>
              </div>

              <div className="mt-4 flex justify-center">
                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors w-full sm:w-auto"
                >
                  Tutup Panduan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Force Vite HMR reload
