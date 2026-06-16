export type UserRole = "owner" | "admin" | "guru" | "siswa" | "staf";
export type UserStatus = "active" | "suspended" | "blocked";
export type AttendanceStatus = "Hadir" | "Sakit" | "Izin" | "Alfa" | "Terlambat";
export type AssessmentType = "Tugas" | "UH" | "Praktik" | "UTS" | "UAS";

export interface Subscription {
  id: string;
  plan_name: string;
  price: number;
  features: string[];
  max_users: number;
  max_students: number;
  created_at: string;
}

export interface UserProfile {
  nip: string;
  jenjang: string;
  tahunPelajaran: string;
  namaSekolah: string;
  kepalaSekolah: string;
  faseKelas: string;
  email: string;
  phone: string;
  role: string;
  displayName: string;
  nama: string;
  tier: string;
  jenisNipKepalaSekolah: "NIP" | "NIK";
  nipKepalaSekolah: string;
  nipGuru: string;
  jenisNipGuru: "NIP" | "NIK";
  logoUrl?: string;
}

export interface User {
  id: string;
  uid?: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
  google_id: string | null;
  subscription_id: string | null;
  active_period_end: string | null;
  status: UserStatus;
  profile?: UserProfile;
  created_at: string;
  updated_at: string;
}

export interface Kelas {
  id: string;
  nama: string;
  tingkat: number;
  wali_kelas: string | null;
  tahun_ajaran: string;
  created_at: string;
}

export interface MataPelajaran {
  id: string;
  nama: string;
  kode: string;
  created_at: string;
}

export interface PerangkatAjar {
  id: string;
  user_id: string;
  kelas_id: string | null;
  mapel_id: string | null;
  topic: string;
  time_allocation: string;
  text_model_used: string | null;
  image_model_used: string | null;
  ai_response_json: string | null;
  created_at: string;
}

export interface JurnalPembelajaran {
  id: string;
  user_id: string;
  kelas_id: string | null;
  mapel_id: string | null;
  date: string;
  class_name: string | null;
  material_progress: string | null;
  activities: string | null;
  obstacles: string | null;
  follow_up: string | null;
  created_at: string;
  updated_at: string;
}

export interface Absensi {
  id: string;
  student_id: string;
  kelas_id: string;
  date: string;
  status: AttendanceStatus;
  note: string | null;
  created_at: string;
}

export interface Penilaian {
  id: string;
  student_id: string;
  kelas_id: string | null;
  mapel_id: string | null;
  type: AssessmentType;
  score: number;
  description: string | null;
  date: string;
  created_at: string;
}

export interface AIModel {
  id: string;
  name: string;
  description?: string;
}
