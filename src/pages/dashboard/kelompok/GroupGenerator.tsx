import React, { useState } from 'react';
import AIAssistedInput from '@/components/AIAssistedInput';
import AIAssistedTextarea from '@/components/AIAssistedTextarea';
import { Users, Dices } from 'lucide-react';

export default function GroupGenerator() {
  const [studentNames, setStudentNames] = useState('');
  const [groupCount, setGroupCount] = useState(4);
  const [groupNames, setGroupNames] = useState<string[]>(['Kelompok 1', 'Kelompok 2', 'Kelompok 3', 'Kelompok 4']);
  const [groupType, setGroupType] = useState('random');
  const [resultGroups, setResultGroups] = useState<{name: string, members: string[]}[]>([]);
  const [error, setError] = useState('');

  // Handle group count change to adjust names
  const handleGroupCountChange = (count: number) => {
    setGroupCount(count);
    setGroupNames(prev => Array.from({ length: count }, (_, i) => prev[i] || `Kelompok ${i + 1}`));
  };

  const handleGroupNameChange = (index: number, name: string) => {
    const newNames = [...groupNames];
    newNames[index] = name;
    setGroupNames(newNames);
  };

  const generateGroups = () => {
    setError('');
    const names = studentNames.split('\n').map(n => n.trim()).filter(n => n);
    
    if (names.length === 0) {
      setError('Masukkan nama siswa terlebih dahulu!');
      return;
    }
    
    if (names.length < groupCount) {
      setError('Jumlah siswa harus lebih dari jumlah kelompok!');
      return;
    }

    // Shuffle array
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    
    // Distribute into groups
    const groups: {name: string, members: string[]}[] = Array.from({ length: groupCount }, (_, i) => ({
      name: groupNames[i] || `Kelompok ${i + 1}`,
      members: []
    }));
    shuffled.forEach((name, index) => {
      groups[index % groupCount].members.push(name);
    });

    setResultGroups(groups);
  };

  const colors = [
    'from-blue-500 to-cyan-500', 
    'from-purple-500 to-pink-500', 
    'from-green-500 to-emerald-500', 
    'from-orange-500 to-red-500', 
    'from-indigo-500 to-purple-500', 
    'from-teal-500 to-cyan-500'
  ];

  return (
    <div className="gen-card rounded-2xl p-6 md:p-8  shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
          <Users size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-black">Generator Kelompok Belajar</h3>
          <p className="text-gray-600">Buat kelompok belajar secara acak dengan mudah</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Daftar Nama Siswa (satu nama per baris)</label>
            <AIAssistedTextarea value={studentNames}
              onChange={(e) => setStudentNames(e.target.value)}
              rows={8} 
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
              placeholder="Masukkan nama siswa...&#10;Ahmad&#10;Budi&#10;Citra&#10;Diana&#10;..." 
              contextPrompt="Berikan daftar 10-15 nama siswa-siswi Indonesia secara acak (kombinasi nama laki-laki dan perempuan). HANYA TULIS NAMA, SATU NAMA PER BARIS, TANPA NOMOR, TANPA TEKS LAINNYA." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Kelompok</label>
              <input 
                type="number" 
                value={groupCount}
                onChange={(e) => handleGroupCountChange(parseInt(e.target.value) || 2)}
                min="2" max="20" 
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Pengelompokan</label>
              <select 
                value={groupType}
                onChange={(e) => setGroupType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black focus:border-blue-500 transition-all"
              >
                <option value="random">Acak Total</option>
                <option value="balanced">Seimbang Gender</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Kelompok (Opsional)</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {Array.from({ length: groupCount }).map((_, i) => (
                <AIAssistedInput key={i}
                  type="text"
                  value={groupNames[i] || ''}
                  onChange={(e) => handleGroupNameChange(i, e.target.value)}
                  placeholder={`Kelompok ${i + 1}`}
                  contextPrompt="Berikan 1 ide nama kelompok yang sangat kreatif, keren, dan singkat untuk anak sekolah (contoh: 'Garuda', 'Pioneers', 'Alpha', atau nama ilmuwan). HANYA TULIS NAMA KELOMPOK, tanpa tanda kutip, tanpa penjelasan."
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm text-black focus:border-blue-500 transition-all"
                />
              ))}
            </div>
          </div>
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <button 
            onClick={generateGroups} 
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-bold text-lg text-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25 btn-generate-animated"
          >
            <span><Dices size={24} /></span> Generate Kelompok
          </button>
        </div>
        
        <div className="gen-card bg-red-50 rounded-xl p-6 min-h-[300px]">
          {resultGroups.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {resultGroups.map((group, i) => (
                <div key={i} className={`bg-gradient-to-br ${colors[i % colors.length]} rounded-xl p-4 shadow-lg`}>
                  <h4 className="font-bold text-lg mb-2 text-black">{group.name}</h4>
                  <ul className="space-y-1">
                    {group.members.map((name, j) => (
                      <li key={j} className="text-sm bg-black/20 text-black rounded px-2 py-1 ">
                        {j + 1}. {name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-16 h-full flex flex-col items-center justify-center">
              <div className="mb-4 opacity-50 flex justify-center text-gray-400">
                <Users size={64} />
              </div>
              <p>Hasil kelompok akan muncul di sini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
