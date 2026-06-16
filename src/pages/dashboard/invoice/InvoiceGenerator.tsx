import { universalPrint } from '@/lib/print';
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Download, Printer, Save, RefreshCw, Upload, Image as ImageIcon } from 'lucide-react';
import { QRCode } from 'react-qrcode-logo';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number | string;
  price: number | string;
}

export default function InvoiceGenerator() {
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceTitle, setInvoiceTitle] = useState('INVOICE');
  const [qrData, setQrData] = useState('https://digen.id');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [fromName, setFromName] = useState('DIGEN.ID');
  const [fromAddress, setFromAddress] = useState('Jl. Pendidikan No. 1, Samarinda');
  const [fromEmail, setFromEmail] = useState('admin@digen.id');
  const [fromPhone, setFromPhone] = useState('0812-3456-7890');
  const [fromLogo, setFromLogo] = useState(''); // Base64 or URL

  const [toName, setToName] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [toPhone, setToPhone] = useState('');

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: Date.now().toString(), description: 'Paket Ultimate (1 Tahun)', quantity: 1, price: 500000 }
  ]);

  const [taxPercent, setTaxPercent] = useState<number | string>(0);
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [discountValue, setDiscountValue] = useState<number | string>(0);
  const [notes, setNotes] = useState('Terima kasih atas kepercayaan Anda menggunakan layanan kami.');

  // New features state
  const [themeColor, setThemeColor] = useState('blue');
  const [paymentStatus, setPaymentStatus] = useState('NONE');
  const [signatureImage, setSignatureImage] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [signatureRole, setSignatureRole] = useState('');

  const [isSaved, setIsSaved] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('digen_id_admin_invoice');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.invoiceNo) setInvoiceNo(data.invoiceNo);
        if (data.invoiceTitle) setInvoiceTitle(data.invoiceTitle);
        if (data.qrData) setQrData(data.qrData);
        if (data.date) setDate(data.date);
        if (data.dueDate) setDueDate(data.dueDate);
        if (data.fromName) setFromName(data.fromName);
        if (data.fromAddress) setFromAddress(data.fromAddress);
        if (data.fromEmail) setFromEmail(data.fromEmail);
        if (data.fromPhone) setFromPhone(data.fromPhone);
        if (data.fromLogo) setFromLogo(data.fromLogo);
        if (data.toName) setToName(data.toName);
        if (data.toAddress) setToAddress(data.toAddress);
        if (data.toEmail) setToEmail(data.toEmail);
        if (data.toPhone) setToPhone(data.toPhone);
        if (data.items) setItems(data.items);
        if (data.taxPercent !== undefined) setTaxPercent(data.taxPercent);
        if (data.discountType) setDiscountType(data.discountType);
        if (data.discountValue !== undefined) setDiscountValue(data.discountValue);
        // legacy support
        if (data.discountAmount !== undefined && data.discountValue === undefined) setDiscountValue(data.discountAmount);
        if (data.notes) setNotes(data.notes);
        if (data.themeColor) setThemeColor(data.themeColor);
        if (data.paymentStatus) setPaymentStatus(data.paymentStatus);
        if (data.signatureImage) setSignatureImage(data.signatureImage);
        if (data.signatureName) setSignatureName(data.signatureName);
        if (data.signatureRole) setSignatureRole(data.signatureRole);
      } catch (e) {
        console.error('Failed to parse saved invoice data', e);
      }
    } else {
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setDueDate(nextMonth.toISOString().split('T')[0]);
      setInvoiceNo(`INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
    }
  }, []);

  // Save to LocalStorage automatically whenever data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const data = {
        invoiceNo, invoiceTitle, qrData, date, dueDate, fromName, fromAddress, fromEmail, fromPhone, fromLogo,
        toName, toAddress, toEmail, toPhone, items, taxPercent, discountType, discountValue, notes,
        themeColor, paymentStatus, signatureImage, signatureName, signatureRole
      };
      localStorage.setItem('digen_id_admin_invoice', JSON.stringify(data));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }, 1000);
    return () => clearTimeout(timer);
  }, [invoiceNo, invoiceTitle, qrData, date, dueDate, fromName, fromAddress, fromEmail, fromPhone, fromLogo, toName, toAddress, toEmail, toPhone, items, taxPercent, discountType, discountValue, notes, themeColor, paymentStatus, signatureImage, signatureName, signatureRole]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Limit to 2MB
        alert('Ukuran file terlalu besar. Maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, price: 0 }]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const subtotal = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);
  const discountAmountCalc = discountType === 'PERCENT' ? subtotal * ((Number(discountValue) || 0) / 100) : (Number(discountValue) || 0);
  const taxAmount = (subtotal - discountAmountCalc) * ((Number(taxPercent) || 0) / 100);
  const total = subtotal - discountAmountCalc + taxAmount;

  // Theme definitions for print & preview
  const themes: Record<string, { primary: string, light: string, text: string }> = {
    blue: { primary: '#2563eb', light: '#eff6ff', text: 'text-blue-600' },
    green: { primary: '#16a34a', light: '#f0fdf4', text: 'text-green-600' },
    red: { primary: '#dc2626', light: '#fef2f2', text: 'text-red-600' },
    purple: { primary: '#9333ea', light: '#faf5ff', text: 'text-purple-600' },
    slate: { primary: '#475569', light: '#f8fafc', text: 'text-slate-600' },
  };

  const currentTheme = themes[themeColor] || themes.blue;

  const handlePrint = () => {
    const printContent = document.getElementById('printArea')?.innerHTML || '';
    universalPrint(`
        ${printContent}
      `, `${invoiceTitle || 'INVOICE'} ${invoiceNo}`);
  };

  const resetForm = () => {
    if (window.confirm("Apakah Anda yakin ingin mengulang form ini? Data yang belum disimpan akan hilang.")) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setDueDate(nextMonth.toISOString().split('T')[0]);
      setInvoiceNo(`INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
      setInvoiceTitle('INVOICE');
      setQrData('https://digen.id');
      setToName('');
      setToAddress('');
      setToEmail('');
      setToPhone('');
      setItems([{ id: Date.now().toString(), description: '', quantity: 1, price: 0 }]);
      setTaxPercent(0);
      setDiscountValue(0);
      setNotes('Terima kasih atas kepercayaan Anda menggunakan layanan kami.');
      setThemeColor('blue');
      setPaymentStatus('NONE');
      setSignatureImage('');
      setSignatureName('');
      setSignatureRole('');
      setFromLogo('');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText size={24} className={currentTheme.text} />
            Invoice Generator
          </h2>
          <p className="text-xs text-gray-500">Kelola dan terbitkan faktur secara profesional.</p>
        </div>
        <div className="flex gap-2">
          {isSaved && <span className="text-xs text-green-600 font-bold flex items-center gap-1"><Save size={14}/> Tersimpan otomatis</span>}
          <button onClick={resetForm} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
            <RefreshCw size={14} /> Reset
          </button>
          <button onClick={handlePrint} className={`px-4 py-2 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-2`} style={{ backgroundColor: currentTheme.primary }}>
            <Printer size={16} /> Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* Grid Utama: Kiri Form (print:hidden), Kanan Preview (print:w-full) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: Form Input */}
        <div className="space-y-6 print:hidden">
          
          {/* Tampilan & Tema */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-700 text-sm border-b pb-2">Tampilan & Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Tema Warna</label>
                <div className="flex gap-2">
                  {Object.keys(themes).map(color => (
                    <button
                      key={color}
                      onClick={() => setThemeColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${themeColor === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: themes[color].primary }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Status Pembayaran</label>
                <select 
                  value={paymentStatus} 
                  onChange={e => setPaymentStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NONE">Tidak Ada (Normal)</option>
                  <option value="PAID">Lunas (PAID)</option>
                  <option value="OVERDUE">Jatuh Tempo (OVERDUE)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Detail Invoice */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-700 text-sm border-b pb-2">Detail Invoice</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Judul Dokumen</label>
                  <input type="text" value={invoiceTitle} onChange={e => setInvoiceTitle(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="INVOICE" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Nomor</label>
                  <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="INV-2026..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Jatuh Tempo</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Dari & Kepada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 flex flex-col">
              <h3 className="font-bold text-gray-700 text-sm border-b pb-2">Dari (Pengirim)</h3>
              <div className="flex-1 space-y-2">
                <input type="text" value={fromName} onChange={e => setFromName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" placeholder="Nama Perusahaan/Instansi" />
                <textarea value={fromAddress} onChange={e => setFromAddress(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" placeholder="Alamat" rows={2} />
                <input type="text" value={fromEmail} onChange={e => setFromEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" placeholder="Email" />
                <input type="text" value={fromPhone} onChange={e => setFromPhone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" placeholder="Nomor Telepon/WA" />
                
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Logo Perusahaan</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer bg-gray-50 border border-gray-200 border-dashed rounded-lg p-2 text-center hover:bg-gray-100 transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setFromLogo)} />
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <Upload size={14} /> Upload Logo
                      </div>
                    </label>
                    {fromLogo && (
                      <button onClick={() => setFromLogo('')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-100">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <input type="text" value={fromLogo} onChange={e => setFromLogo(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs mt-2" placeholder="Atau paste URL gambar..." />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
              <h3 className="font-bold text-gray-700 text-sm border-b pb-2">Kepada (Klien)</h3>
              <div className="space-y-2">
                <input type="text" value={toName} onChange={e => setToName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" placeholder="Nama Klien/Sekolah" />
                <textarea value={toAddress} onChange={e => setToAddress(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" placeholder="Alamat Klien" rows={2} />
                <input type="text" value={toEmail} onChange={e => setToEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" placeholder="Email Klien" />
                <input type="text" value={toPhone} onChange={e => setToPhone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" placeholder="Nomor Telepon/WA" />
              </div>
            </div>
          </div>

          {/* Daftar Item */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-gray-700 text-sm">Daftar Item</h3>
              <button onClick={addItem} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1 font-bold">
                <Plus size={14} /> Tambah
              </button>
            </div>
            
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="w-full sm:w-2/5">
                    <input type="text" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm" placeholder="Deskripsi layanan/produk" />
                  </div>
                  <div className="w-full sm:w-1/5 flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 sm:hidden">Qty:</span>
                    <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm" placeholder="Qty" />
                  </div>
                  <div className="w-full sm:w-1/4 flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 sm:hidden">Harga:</span>
                    <input type="number" min="0" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm" placeholder="Harga Satuan" />
                  </div>
                  <div className="w-full sm:w-auto flex justify-end shrink-0">
                    <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 mt-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Pajak (%)</label>
                <input type="number" min="0" max="100" value={taxPercent} onChange={e => setTaxPercent(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Diskon</label>
                <div className="flex gap-2">
                  <select 
                    value={discountType} 
                    onChange={e => setDiscountType(e.target.value as 'FIXED' | 'PERCENT')}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm w-1/3"
                  >
                    <option value="FIXED">Rp</option>
                    <option value="PERCENT">%</option>
                  </select>
                  <input type="number" min="0" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" placeholder="Nilai Diskon" />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 mt-2">Catatan / Syarat Ketentuan</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" rows={3} />
            </div>
          </div>

          {/* Tanda Tangan & QR Code */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-700 text-sm border-b pb-2">Footer & Tanda Tangan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Upload Tanda Tangan (Opsional)</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer bg-gray-50 border border-gray-200 border-dashed rounded-lg p-2 text-center hover:bg-gray-100 transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setSignatureImage)} />
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <Upload size={14} /> Upload TTD
                      </div>
                    </label>
                    {signatureImage && (
                      <button onClick={() => setSignatureImage('')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-100">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Nama Penandatangan</label>
                  <input type="text" value={signatureName} onChange={e => setSignatureName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" placeholder="Cth: Ahmad Fulan" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Jabatan / Peran</label>
                  <input type="text" value={signatureRole} onChange={e => setSignatureRole(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" placeholder="Cth: Direktur Utama" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Data QR Code (Opsional)</label>
                  <input type="text" value={qrData} onChange={e => setQrData(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" placeholder="https://digen.id" />
                </div>
                <p className="text-[10px] text-gray-400">QR Code akan muncul di sebelah tanda tangan. Kosongkan jika tidak ingin menampilkan QR Code.</p>
              </div>
            </div>
          </div>

        </div>

        {/* KOLOM KANAN: Preview Invoice */}
        <div className="print:col-span-2">
          <div id="printArea" className="bg-white rounded-xl shadow-md border border-gray-200 p-8 min-h-[800px] print:shadow-none print:border-none print:p-0 print:min-h-auto print:w-full print:m-0 w-full overflow-hidden relative z-0">
            
            {/* Watermark */}
            {paymentStatus === 'PAID' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-green-500 opacity-10 font-black text-8xl md:text-9xl tracking-widest border-8 border-green-500 p-8 rounded-2xl z-0 pointer-events-none select-none">
                LUNAS
              </div>
            )}
            {paymentStatus === 'OVERDUE' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-red-500 opacity-10 font-black text-6xl md:text-8xl tracking-widest border-8 border-red-500 p-8 rounded-2xl z-0 pointer-events-none select-none text-center leading-tight">
                JATUH<br/>TEMPO
              </div>
            )}

            <div className="relative z-10">
              {/* Header Invoice */}
              <div className="flex justify-between items-start border-b-2 pb-6 mb-8" style={{ borderColor: currentTheme.primary }}>
                <div>
                  {fromLogo ? (
                    <img src={fromLogo} alt="Logo" className="h-16 mb-4 object-contain max-w-[200px]" />
                  ) : (
                    <div className="text-3xl font-black mb-4 tracking-tighter" style={{ color: currentTheme.primary }}>{invoiceTitle || 'INVOICE'}</div>
                  )}
                  <div className="text-gray-800 font-bold text-lg mb-1">{fromName || 'Nama Perusahaan'}</div>
                  <div className="text-gray-500 text-sm whitespace-pre-wrap">{fromAddress || 'Alamat Perusahaan'}</div>
                  <div className="text-gray-500 text-sm">{fromPhone} {fromEmail ? ` • ${fromEmail}` : ''}</div>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-black text-gray-200 uppercase tracking-widest mb-4">{invoiceTitle || 'INVOICE'}</h1>
                  <div className="text-sm">
                    <div className="grid grid-cols-2 gap-x-4 mb-1">
                      <span className="text-gray-500 font-medium">Nomor Invoice:</span>
                      <span className="font-bold text-gray-800">{invoiceNo || '-'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 mb-1">
                      <span className="text-gray-500 font-medium">Tanggal:</span>
                      <span className="font-bold text-gray-800">{date || '-'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4">
                      <span className="text-gray-500 font-medium">Jatuh Tempo:</span>
                      <span className="font-bold text-gray-800">{dueDate || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-2 border-b border-gray-100 pb-1 inline-block" style={{ color: currentTheme.primary }}>Tagihan Kepada:</h3>
                <div className="text-gray-800 font-bold text-lg mb-1 mt-1">{toName || 'Nama Klien'}</div>
                <div className="text-gray-600 text-sm whitespace-pre-wrap mb-1">{toAddress || 'Alamat Klien'}</div>
                <div className="text-gray-600 text-sm">{toPhone} {toEmail ? ` • ${toEmail}` : ''}</div>
              </div>

              {/* Table Items */}
              <div className="mb-8">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-y border-gray-200" style={{ backgroundColor: currentTheme.light }}>
                      <th className="py-3 px-4 font-bold" style={{ color: currentTheme.primary }}>Deskripsi</th>
                      <th className="py-3 px-4 font-bold text-center w-24" style={{ color: currentTheme.primary }}>Kuantitas</th>
                      <th className="py-3 px-4 font-bold text-right w-40" style={{ color: currentTheme.primary }}>Harga Satuan</th>
                      <th className="py-3 px-4 font-bold text-right w-40" style={{ color: currentTheme.primary }}>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-800">{item.description || '-'}</td>
                        <td className="py-3 px-4 text-gray-800 text-center">{item.quantity}</td>
                        <td className="py-3 px-4 text-gray-800 text-right">{formatRupiah(Number(item.price) || 0)}</td>
                        <td className="py-3 px-4 text-gray-800 text-right font-medium">{formatRupiah((Number(item.quantity) || 0) * (Number(item.price) || 0))}</td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400 italic">Belum ada item tagihan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-12">
                <div className="w-full sm:w-1/2 lg:w-2/3 xl:w-1/2">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatRupiah(subtotal)}</span>
                    </div>
                    {discountAmountCalc > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>Diskon {discountType === 'PERCENT' ? `(${discountValue}%)` : ''}</span>
                        <span>- {formatRupiah(discountAmountCalc)}</span>
                      </div>
                    )}
                    {Number(taxPercent) > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Pajak ({taxPercent}%)</span>
                        <span>{formatRupiah(taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-black border-t-2 border-gray-200 pt-3 mt-3" style={{ color: currentTheme.primary }}>
                      <span>Total Tagihan</span>
                      <span>{formatRupiah(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes & Footer */}
              <div className="mt-auto border-t border-gray-100 pt-8 flex justify-between items-end">
                <div className="w-1/2 pr-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: currentTheme.primary }}>Catatan / Syarat & Ketentuan:</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{notes}</p>
                </div>
                <div className="w-1/2 flex justify-end items-end gap-6">
                  {(signatureName || signatureImage) && (
                    <div className="text-center shrink-0">
                      <div className="text-xs text-gray-500 mb-1">Hormat Kami,</div>
                      {signatureImage ? (
                        <img src={signatureImage} alt="Signature" className="h-16 object-contain mx-auto my-2" />
                      ) : (
                        <div className="h-16"></div>
                      )}
                      <div className="font-bold text-gray-800 text-sm border-b border-gray-800 inline-block px-2 pb-0.5">{signatureName || '_________________'}</div>
                      {signatureRole && <div className="text-[10px] text-gray-500 mt-1">{signatureRole}</div>}
                    </div>
                  )}
                  {qrData && (
                    <div className="shrink-0">
                      <QRCode id="invoice-qr" value={qrData} size={80} qrStyle="squares" eyeRadius={4} />
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
