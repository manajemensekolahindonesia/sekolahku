export const translations: Record<string, any> = {
  id: {
    heroSubtitle: 'Platform Pendidikan Digital',
    heroTitle1: 'Generator',
    heroTitle2: 'Edukatif',
    heroTitle3: 'Kurikulum Merdeka',
    welcomeMessage: 'Selamat datang di platform pendidikan digital yang membantu guru Indonesia dalam menyiapkan administrasi pembelajaran sesuai Permendikdasmen No. 1 Tahun 2026',
    todayLabel: '👥 Pengunjung Hari Ini',
    monthLabel: '📅 Pengunjung Bulan Ini',
    totalLabel: '🎯 Total Pengunjung'
  },
  en: {
    heroSubtitle: 'Digital Education Platform',
    heroTitle1: 'Educational',
    heroTitle2: 'Generator',
    heroTitle3: 'Independent Curriculum',
    welcomeMessage: 'Welcome to the digital education platform that helps Indonesian teachers prepare learning administration according to Permendikdasmen No. 1 of 2026',
    todayLabel: '👥 Visitors Today',
    monthLabel: '📅 Visitors This Month',
    totalLabel: '🎯 Total Visitors'
  },
  ar: {
    heroSubtitle: 'منصة التعليم الرقمية',
    heroTitle1: 'منشئ',
    heroTitle2: 'تعليمي',
    heroTitle3: 'المنهج المستقل',
    welcomeMessage: 'مرحبا بك في منصة التعليم الرقمية التي تساعد معلمي إندونيسيا على تحضير إدارة التعلم وفقا لقانون Permendikdasmen رقم 1 لعام 2026',
    todayLabel: '👥 الزوار اليوم',
    monthLabel: '📅 الزوار هذا الشهر',
    totalLabel: '🎯 إجمالي الزوار'
  },
  zh: {
    heroSubtitle: '数字教育平台',
    heroTitle1: '教育',
    heroTitle2: '生成器',
    heroTitle3: '独立课程',
    welcomeMessage: '欢迎来到数字教育平台，帮助印度尼西亚教师根据2026年Permendikdasmen第1号准备学习管理',
    todayLabel: '👥 今日访客',
    monthLabel: '📅 本月访客',
    totalLabel: '🎯 总访客数'
  },
  ja: {
    heroSubtitle: 'デジタル教育プラットフォーム',
    heroTitle1: '教育',
    heroTitle2: 'ジェネレーター',
    heroTitle3: '独立カリキュラム',
    welcomeMessage: 'インドネシアの教師がPermendikdasmen第1号に従って学習管理を準備するのを支援するデジタル教育プラットフォームへようこそ',
    todayLabel: '👥 今日の訪問者',
    monthLabel: '📅 今月の訪問者',
    totalLabel: '🎯 総訪問者数'
  }
};

export const eduQuestions: Record<string, any> = {
  sd: {
    matematika: [
      { q: "5 + 3 = ?", a: "8" },
      { q: "Berapa hasil 10 - 4?", a: "6" },
      { q: "3 x 4 = ?", a: "12" },
      { q: "Berapa 20 : 5?", a: "4" },
      { q: "Sebutkan bilangan genap antara 1-10!", a: "2, 4, 6, 8, 10" },
      { q: "Berapa 15 + 7?", a: "22" },
      { q: "Nama bangun datar dengan 4 sisi sama?", a: "Persegi" },
      { q: "Berapa 100 - 35?", a: "65" }
    ],
    ipa: [
      { q: "Planet terdekat dari Matahari?", a: "Merkurius" },
      { q: "Hewan yang bertelur disebut?", a: "Ovipar" },
      { q: "Bagian tumbuhan untuk fotosintesis?", a: "Daun" },
      { q: "Air mendidih pada suhu?", a: "100°C" },
      { q: "Tulang daun singkong berbentuk?", a: "Menjari" },
      { q: "Metamorfosis kupu-kupu dimulai dari?", a: "Telur" }
    ],
    ips: [
      { q: "Ibu kota Indonesia?", a: "Jakarta/Nusantara" },
      { q: "Pulau terbesar di Indonesia?", a: "Kalimantan" },
      { q: "Hari kemerdekaan Indonesia?", a: "17 Agustus 1945" },
      { q: "Presiden pertama Indonesia?", a: "Ir. Soekarno" },
      { q: "Mata uang Indonesia?", a: "Rupiah" }
    ],
    bahasa: [
      { q: "Kata benda disebut juga?", a: "Nomina" },
      { q: "Lawan kata 'besar'?", a: "Kecil" },
      { q: "Huruf kapital digunakan untuk?", a: "Awal kalimat/nama" },
      { q: "Sinonim kata 'cantik'?", a: "Indah/Elok" },
      { q: "Kata kerja disebut?", a: "Verba" }
    ],
    ppkn: [
      { q: "Sila pertama Pancasila?", a: "Ketuhanan Yang Maha Esa" },
      { q: "Lambang negara Indonesia?", a: "Garuda Pancasila" },
      { q: "Semboyan negara Indonesia?", a: "Bhinneka Tunggal Ika" },
      { q: "Warna bendera Indonesia?", a: "Merah Putih" }
    ]
  },
  smp: {
    matematika: [
      { q: "Rumus luas lingkaran?", a: "πr²" },
      { q: "Teorema Pythagoras?", a: "a² + b² = c²" },
      { q: "Berapa √144?", a: "12" },
      { q: "25% dari 200?", a: "50" },
      { q: "Rumus keliling persegi?", a: "4 x sisi" }
    ],
    ipa: [
      { q: "Satuan gaya?", a: "Newton" },
      { q: "Rumus kecepatan?", a: "v = s/t" },
      { q: "Unsur dengan simbol O?", a: "Oksigen" },
      { q: "Organ pernapasan manusia?", a: "Paru-paru" },
      { q: "Rumus massa jenis?", a: "ρ = m/v" }
    ],
    ips: [
      { q: "Teori asal usul nenek moyang Indonesia?", a: "Yunan (Cina Selatan)" },
      { q: "Kerajaan Hindu pertama di Indonesia?", a: "Kutai" },
      { q: "Perang Diponegoro terjadi tahun?", a: "1825-1830" }
    ],
    bahasa: [
      { q: "Struktur teks prosedur?", a: "Tujuan, bahan, langkah" },
      { q: "Ciri-ciri teks deskripsi?", a: "Menggambarkan objek" },
      { q: "Majas perbandingan?", a: "Metafora/Simile" }
    ],
    ppkn: [
      { q: "Asas pemilu di Indonesia?", a: "Luber Jurdil" },
      { q: "Hak asasi manusia diatur dalam?", a: "UUD 1945 Pasal 28" },
      { q: "Sistem pemerintahan Indonesia?", a: "Presidensial" }
    ]
  },
  sma: {
    matematika: [
      { q: "Turunan dari x³?", a: "3x²" },
      { q: "Integral dari 2x?", a: "x² + C" },
      { q: "Limit x→0 sin(x)/x?", a: "1" },
      { q: "Rumus kombinasi?", a: "C(n,r) = n!/r!(n-r)!" },
      { q: "Nilai sin 90°?", a: "1" }
    ],
    ipa: [
      { q: "Hukum Newton III?", a: "Aksi = Reaksi" },
      { q: "Rumus E = mc² ditemukan oleh?", a: "Einstein" },
      { q: "Organel sel untuk respirasi?", a: "Mitokondria" },
      { q: "Jenis ikatan NaCl?", a: "Ionik" },
      { q: "Rumus energi kinetik?", a: "½mv²" }
    ],
    ips: [
      { q: "Perang Dunia II berakhir tahun?", a: "1945" },
      { q: "Organisasi ekonomi ASEAN?", a: "MEA/AEC" },
      { q: "Teori sosiologi oleh Max Weber?", a: "Tindakan Sosial" }
    ],
    bahasa: [
      { q: "Unsur intrinsik novel?", a: "Tema, tokoh, alur, latar" },
      { q: "Jenis karya sastra puisi?", a: "Soneta, balada, elegi" },
      { q: "Struktur teks editorial?", a: "Pernyataan pendapat, argumentasi, rekomendasi" }
    ],
    ppkn: [
      { q: "UUD 1945 diamandemen berapa kali?", a: "4 kali" },
      { q: "Lembaga tinggi negara bidang yudisial?", a: "MA, MK, KY" },
      { q: "Fungsi DPR?", a: "Legislasi, anggaran, pengawasan" }
    ]
  }
};

export const snakes = [
  { head: 98, tail: 78 },
  { head: 95, tail: 56 },
  { head: 87, tail: 36 },
  { head: 62, tail: 18 },
  { head: 48, tail: 26 },
  { head: 36, tail: 6 }
];

export const ladders = [
  { bottom: 4, top: 14 },
  { bottom: 9, top: 31 },
  { bottom: 21, top: 42 },
  { bottom: 28, top: 84 },
  { bottom: 51, top: 67 },
  { bottom: 72, top: 91 }
];

export const supervisionIndicators = {
  planning: [
    "Identitas modul ajar lengkap (nama satuan pendidikan, fase, kelas, mata pelajaran)",
    "Capaian Pembelajaran (CP) sesuai dengan fase dan elemen",
    "Tujuan Pembelajaran terukur dan operasional",
    "Alur Tujuan Pembelajaran (ATP) tersusun sistematis",
    "Profil Pelajar Pancasila terintegrasi dalam pembelajaran",
    "Pemahaman bermakna dan pertanyaan pemantik tersedia",
    "Materi pembelajaran sesuai dengan CP dan TP",
    "Metode/model pembelajaran sesuai karakteristik peserta didik",
    "Media dan sumber belajar bervariasi dan kontekstual",
    "Langkah pembelajaran terstruktur (pembuka, inti, penutup)"
  ],
  execution: [
    "Pembelajaran dimulai dengan apersepsi dan motivasi",
    "Menyampaikan tujuan pembelajaran dengan jelas",
    "Menggunakan pertanyaan pemantik untuk memicu rasa ingin tahu",
    "Menerapkan pembelajaran berdiferensiasi sesuai kebutuhan",
    "Menggunakan model pembelajaran aktif (PBL/PjBL/Discovery)",
    "Memanfaatkan teknologi dan media pembelajaran secara efektif",
    "Memberikan kesempatan peserta didik untuk berdiskusi dan berkolaborasi",
    "Pembelajaran berpusat pada peserta didik (student-centered)",
    "Memberikan penguatan dan umpan balik selama proses",
    "Menutup pembelajaran dengan refleksi dan kesimpulan"
  ],
  assessment: [
    "Melaksanakan asesmen diagnostik di awal pembelajaran",
    "Melaksanakan asesmen formatif selama proses pembelajaran",
    "Instrumen asesmen sesuai dengan tujuan pembelajaran",
    "Kriteria ketercapaian tujuan pembelajaran (KKTP) jelas",
    "Menggunakan berbagai teknik asesmen (tes, observasi, portofolio)",
    "Melakukan analisis hasil asesmen untuk perbaikan",
    "Memberikan umpan balik yang konstruktif kepada peserta didik",
    "Mendokumentasikan hasil asesmen dengan baik"
  ],
  reflection: [
    "Melakukan refleksi terhadap proses pembelajaran",
    "Mengidentifikasi kendala dan solusi pembelajaran",
    "Merencanakan tindak lanjut berdasarkan hasil refleksi",
    "Mendiskusikan hasil refleksi dengan teman sejawat",
    "Mengembangkan diri melalui berbagai kegiatan pengembangan profesional"
  ]
};

export const cpData: Record<string, any> = {
  'seni-rupa': {
      A: '1. Mengalami (Experiencing) Mengenali dan menyebutkan unsur-unsur rupa dalam benda-benda di sekitar/karya seni rupa. 2. Merefleksikan (Reflecting) Merefleksikan dan mengapresiasi karya diri sendiri. 3. Berpikir dan Bekerja Artistik (Thinking and Working Artistically) Mengenali dan menguji coba alat dan/atau bahan yang dimiliki. 4. Menciptakan (Making/Creating) Membuat karya seni rupa berdasarkan pengalaman dan hasil pengamatan terhadap lingkungan sekitar. 5. Berdampak (Impacting) Menghasilkan karya seni rupa yang berdampak pada perasaan dirinya.',
      B: '1. Mengalami (Experiencing) Mengidentifikasi unsur rupa dan prinsip desain dalam benda-benda di sekitar/karya seni rupa. 2. Merefleksikan (Reflecting) Merefleksikan dan mengapresiasi karya diri sendiri dan teman sekelas menggunakan kosa kata seni rupa yang sesuai. 3. Berpikir dan Bekerja Artistik (Thinking and Working Artistically) Mengenali dan menguji coba alat dan/atau bahan yang dimiliki serta prosedur penggunaannya. 4. Menciptakan (Making/Creating) Membuat karya seni rupa berdasarkan pengalaman dan hasil pengamatan terhadap lingkungan sekitar. 5. Berdampak (Impacting) Menghasilkan karya seni rupa yang berdampak pada perasaan atau mewakili harapannya.',
      C: '1. Mengalami (Experiencing) Menjelaskan unsur rupa dan prinsip desain dalam benda-benda di sekitar/karya seni rupa. 2. Merefleksikan (Reflecting) Merefleksikan dan mengapresiasi karya diri sendiri dan teman sekelas menggunakan kosa kata seni rupa yang sesuai. 3. Berpikir dan Bekerja Artistik (Thinking and Working Artistically) Mengenali dan menguji coba variasi teknik penggunaan alat dan/atau bahan. 4. Menciptakan (Making/Creating) Membuat karya seni rupa berdasarkan pengalaman dan/atau hasil pengamatan terhadap lingkungan sekitar melalui pengembangan imajinasi. 5. Berdampak (Impacting) Menghasilkan karya seni rupa yang mewakili minatnya.',
      D: '1. Mengalami (Experiencing) Menganalisis unsur rupa dan prinsip desain dalam benda-benda di sekitar/karya seni rupa. 2. Merefleksikan (Reflecting) Merefleksikan dan mengapresiasi karya diri sendiri dan teman sekelas; membandingkan unsur rupa, prinsip desain, dan fungsi karya seni rupa menggunakan kosa kata seni rupa yang sesuai. 3. Berpikir dan Bekerja Artistik (Thinking and Working Artistically) Mengaplikasikan variasi teknik penggunaan alat dan bahan yang dimiliki untuk berkarya; mengeksplorasi alternatif/potensi alat dan bahan yang ada di lingkungan sekitar. 4. Menciptakan (Making/Creating) Membuat karya seni rupa berdasarkan pengalaman dan/atau hasil pengamatan terhadap lingkungan sekitar, dengan mempertimbangkan fungsi, menggunakan gaya atau teknik yang telah dipelajari. 5. Berdampak (Impacting) Menghasilkan karya seni rupa untuk merespon pengalaman sehari-hari dan mengekspresikan perasaan atau minat.',
      E: '1. Mengalami (Experiencing) Mengeksplorasi unsur rupa dan prinsip desain dalam benda-benda di sekitar/karya seni rupa. 2. Merefleksikan (Reflecting) Merefleksikan penggunaan unsur rupa, prinsip desain, dan fungsi dalam karya diri sendiri dan teman sekelas menggunakan kosa kata seni rupa yang sesuai. 3. Berpikir dan Bekerja Artistik (Thinking and Working Artistically) Mengeksplorasi alternatif/potensi alat dan bahan yang ada di lingkungan sekitar dan menghubungkan seni dengan kelompok atau bidang keilmuan lain dalam berkarya seni rupa. 4. Menciptakan (Making/Creating) Membuat karya seni rupa berdasarkan pengalaman dan/atau hasil pengamatan terhadap lingkungan sekitar, dengan mempertimbangkan fungsi, menggunakan gaya atau teknik yang dipilih. 5. Berdampak (Impacting) Menghasilkan karya seni rupa untuk mengajak orang lain, merespon pengalaman sehari-hari, dan mengekspresikan perasaan atau minat.',
      F: '1. Mengalami (Experiencing) Mengeksplorasi penggunaan unsur rupa dan prinsip desain dalam benda-benda di sekitar/karya seni rupa. 2. Merefleksikan (Reflecting) Merefleksikan penggunaan unsur rupa, prinsip desain, dan fungsi dalam karya diri sendiri dan teman sekelas menggunakan kosa kata seni rupa yang sesuai. 3. Berpikir dan Bekerja Artistik (Thinking and Working Artistically) Menganalisis potensi alat dan bahan yang ada di lingkungan sekitar dan keterhubungan seni rupa dengan kelompok atau bidang keilmuan lain dalam berkarya. 4. Menciptakan (Making/Creating) Membuat karya seni rupa berdasarkan pengalaman dan/atau hasil pengamatan terhadap lingkungan sekitar, dengan mempertimbangkan fungsi, menggunakan gaya atau teknik yang dikuasai. 5. Berdampak (Impacting) Menghasilkan karya seni rupa untuk mengajak orang lain, merespon pengalaman sehari-hari, mengekspresikan perasaan, minat, dan/atau isu sosial dalam masyarakat.'
  },
  'bahasa-indonesia': {
      A: 'Peserta didik mampu menyimak, membaca, dan memirsa teks sederhana serta menggunakan konteks untuk mengartikan kata. Peserta didik mampu menulis dan menyajikan informasi dengan bantuan.',
      B: 'Peserta didik mampu memahami instruksi dan konten dari berbagai jenis teks dengan bantuan audio visual. Peserta didik mampu menulis, menyajikan, dan membicarakan teks sesuai tujuan.',
      C: 'Peserta didik mampu mencari, mengidentifikasi, dan menyintesis informasi dari berbagai jenis teks. Peserta didik mampu menulis teks terstruktur dengan kosakata yang bervariasi.',
      D: 'Peserta didik mampu menganalisis dan mengevaluasi informasi dari berbagai teks. Peserta didik mampu memproduksi teks dengan memperhatikan aspek kebahasaan.'
  },
  matematika: {
      A: 'Peserta didik mengenali bilangan cacah sampai 100 dan dapat melakukan penjumlahan dan pengurangan bilangan cacah sampai 20.',
      B: 'Peserta didik memahami operasi hitung bilangan cacah, pecahan sederhana, dan geometri dasar dalam konteks kehidupan sehari-hari.',
      C: 'Peserta didik menerapkan pemahaman operasi hitung, pengukuran, dan geometri dalam memecahkan masalah kontekstual.',
      D: 'Peserta didik menggunakan penalaran matematis untuk memecahkan masalah yang melibatkan bilangan, aljabar, geometri, dan statistika.'
  },
  ipas: {
      A: 'Peserta didik mengamati fenomena alam di sekitar dan mengenali bagian-bagian tubuh serta kebutuhan makhluk hidup.',
      B: 'Peserta didik mengidentifikasi proses yang terjadi pada makhluk hidup dan benda di sekitarnya dengan bimbingan.',
      C: 'Peserta didik menganalisis hubungan antar komponen dan proses yang terjadi di alam serta dampaknya bagi kehidupan.',
      D: 'Peserta didik menggunakan konsep sains dan keterampilan proses sains untuk memecahkan masalah dan membuat keputusan.'
  },
  ppkn: {
      A: 'Peserta didik mampu mengenali dan menceritakan simbol dan lambang Pancasila serta menerapkan nilai-nilainya dalam kehidupan sehari-hari.',
      B: 'Peserta didik memahami makna sila-sila Pancasila dan menerapkannya dalam lingkungan keluarga dan sekolah.',
      C: 'Peserta didik menganalisis penerapan nilai-nilai Pancasila dalam kehidupan bermasyarakat dan bernegara.',
      D: 'Peserta didik mengevaluasi penerapan prinsip demokrasi dan hak asasi manusia dalam konteks Indonesia.'
  },
  'pab-islam': {
      A: 'Peserta didik mampu mengucapkan kalimat tahlil dan memahami keimanan dasar Islam. Peserta didik menerapkan kesederhanaan dan kebersihan sesuai ajaran Islam.',
      B: 'Peserta didik mampu memahami asmaul husna dan 5 pilar Islam, serta menerapkan akhlak mulia dalam kehidupan sehari-hari.',
      C: 'Peserta didik menganalisis nilai-nilai ajaran Islam tentang iman, ibadah, dan akhlak dalam konteks kehidupan sosial.',
      D: 'Peserta didik mengevaluasi pemahaman iman, ibadah, dan akhlak Islam dalam membentuk kepribadian yang berkarakter sesuai Syariat.'
  },
  'pab-kristen': {
      A: 'Peserta didik mampu menceritakan kisah-kisah dalam Alkitab dan memahami kasih Tuhan kepada umat manusia. Peserta didik mengenal doa dan Tuhan Yesus Kristus.',
      B: 'Peserta didik mampu memahami ajaran Yesus Kristus dan menerapkan nilai-nilai Kristiani dalam kehidupan keluarga dan sekolah.',
      C: 'Peserta didik menganalisis iman Kristen dan pelaksanaan nilai-nilai Kristen dalam bermasyarakat dan berbangsa.',
      D: 'Peserta didik mengevaluasi pemahaman iman, ibadah, dan akhlak Kristen dalam membentuk kepribadian yang beriman dan bertanggung jawab.'
  },
  'pab-katolik': {
      A: 'Peserta didik mampu mengenal Allah dan Yesus Kristus serta memahami kasih sayang Tuhan dalam kehidupan melalui Gereja.',
      B: 'Peserta didik mampu memahami ajaran Gereja Katolik, sakramen, dan menerapkan nilai-nilai Kristiani dalam kehidupan.',
      C: 'Peserta didik menganalisis iman Katolik dan pelaksanaan nilai-nilai Kristiani dalam kehidupan bermasyarakat dan bernegara.',
      D: 'Peserta didik mengevaluasi pemahaman iman, liturgi, dan akhlak Katolik dalam membentuk pribadi yang beriman dan berjiwa solidaritas.'
  },
  'pab-hindu': {
      A: 'Peserta didik mampu mengenal Tuhan Yang Maha Esa melalui pemahaman agama Hindu dan menerapkan nilai karma-yoga dalam kehidupan.',
      B: 'Peserta didik mampu memahami konsep Brahman, Tri Murti, dan ajaran-ajaran utama Hindu serta menerapkannya dalam kehidupan.',
      C: 'Peserta didik menganalisis ajaran agama Hindu tentang dharma, karma, dan samsara serta pelaksanaannya dalam kehidupan sosial.',
      D: 'Peserta didik mengevaluasi pemahaman teologi Hindu, dharma, yoga, dan akhlak Hindu dalam membentuk pribadi yang luhur dan bijaksana.'
  },
  'pab-buddha': {
      A: 'Peserta didik mampu memahami ajaran Sang Buddha tentang penderitaan dan kebahagiaan serta menerapkan sila dalam kehidupan.',
      B: 'Peserta didik mampu memahami Empat Kebenaran Mulia dan Jalan Tengah, serta menerapkan nilai-nilai dharma dalam kehidupan sehari-hari.',
      C: 'Peserta didik menganalisis Eightfold Path, meditasi, dan pelaksanaan ajaran Buddha dalam kehidupan bermasyarakat.',
      D: 'Peserta didik mengevaluasi pemahaman Buddha-dharma, sila, meditasi, dan kebijaksanaan dalam membentuk pribadi yang tenang dan bijaksana.'
  },
  'pab-konghucu': {
      A: 'Peserta didik mampu memahami ajaran Konghucu tentang kemanusiaan (Ren) dan saling menghormati dalam keluarga.',
      B: 'Peserta didik mampu memahami konsep Li (aturan), Ren (kemanusiaan), dan menerapkannya dalam kehidupan keluarga dan sekolah.',
      C: 'Peserta didik menganalisis ajaran moral Konghucu tentang hubungan sosial dan pelaksanaannya dalam kehidupan yang harmonis.',
      D: 'Peserta didik mengevaluasi pemahaman filsafat Konghucu, etika relasional, dan akhlak dalam membentuk pribadi yang berbudi pekerti luhur.'
  }
};

export const atpData: Record<string, any> = {
  'bahasa-indonesia': {
      A: '1. Menyimak teks sederhana dengan saksama.\n2. Membaca dan mengartikan kata menggunakan konteks.\n3. Menulis informasi sederhana dengan bantuan.',
      B: '1. Memahami instruksi dari teks audio visual.\n2. Menulis teks sesuai tujuan.\n3. Menyajikan dan membicarakan teks di depan kelas.',
      C: '1. Mencari dan mengidentifikasi informasi dari berbagai teks.\n2. Menyintesis informasi yang ditemukan.\n3. Menulis teks terstruktur dengan kosakata bervariasi.',
      D: '1. Menganalisis informasi dari berbagai teks.\n2. Mengevaluasi keakuratan informasi.\n3. Memproduksi teks dengan memperhatikan aspek kebahasaan.'
  },
  matematika: {
      A: '1. Mengenali bilangan cacah sampai 100.\n2. Melakukan penjumlahan bilangan cacah sampai 20.\n3. Melakukan pengurangan bilangan cacah sampai 20.',
      B: '1. Memahami operasi hitung bilangan cacah.\n2. Mengenal pecahan sederhana.\n3. Memahami geometri dasar dalam kehidupan sehari-hari.',
      C: '1. Menerapkan operasi hitung dalam masalah kontekstual.\n2. Menggunakan pengukuran dalam kehidupan sehari-hari.\n3. Menerapkan geometri dalam pemecahan masalah.',
      D: '1. Menggunakan penalaran matematis untuk bilangan dan aljabar.\n2. Memecahkan masalah geometri.\n3. Menganalisis data dan statistika dasar.'
  },
  ipas: {
      A: '1. Mengamati fenomena alam di sekitar.\n2. Mengenali bagian-bagian tubuh makhluk hidup.\n3. Mengidentifikasi kebutuhan dasar makhluk hidup.',
      B: '1. Mengidentifikasi proses pada makhluk hidup.\n2. Mengamati benda-benda di sekitar.\n3. Melakukan pengamatan dengan bimbingan.',
      C: '1. Menganalisis hubungan antar komponen alam.\n2. Memahami proses yang terjadi di alam.\n3. Menjelaskan dampak fenomena alam bagi kehidupan.',
      D: '1. Menggunakan konsep sains dalam pengamatan.\n2. Menerapkan keterampilan proses sains.\n3. Memecahkan masalah dan membuat keputusan berbasis sains.'
  },
  ppkn: {
      A: '1. Mengenali simbol dan lambang Pancasila.\n2. Menceritakan makna simbol Pancasila.\n3. Menerapkan nilai Pancasila dalam kehidupan sehari-hari.',
      B: '1. Memahami makna sila-sila Pancasila.\n2. Menerapkan nilai Pancasila di keluarga.\n3. Menerapkan nilai Pancasila di sekolah.',
      C: '1. Menganalisis penerapan nilai Pancasila di masyarakat.\n2. Menganalisis penerapan nilai Pancasila dalam bernegara.\n3. Menunjukkan sikap sesuai nilai Pancasila.',
      D: '1. Mengevaluasi penerapan prinsip demokrasi.\n2. Memahami hak asasi manusia di Indonesia.\n3. Menerapkan prinsip demokrasi dalam kehidupan.'
  },
  'pab-islam': {
      A: '1. Mengucapkan kalimat tahlil.\n2. Memahami keimanan dasar Islam.\n3. Menerapkan kesederhanaan dan kebersihan.',
      B: '1. Memahami asmaul husna.\n2. Memahami 5 pilar Islam.\n3. Menerapkan akhlak mulia sehari-hari.',
      C: '1. Menganalisis nilai ajaran Islam tentang iman.\n2. Memahami tata cara ibadah.\n3. Menerapkan akhlak dalam konteks sosial.',
      D: '1. Mengevaluasi pemahaman iman dan ibadah.\n2. Membentuk kepribadian berkarakter.\n3. Menerapkan Syariat Islam dalam kehidupan.'
  },
  'pab-kristen': {
      A: '1. Memahami kasih Allah melalui ciptaan-Nya.\n2. Mensyukuri pemeliharaan Allah.\n3. Menerapkan kasih kepada sesama.',
      B: '1. Memahami karya penyelamatan Allah.\n2. Meneladani sikap Yesus Kristus.\n3. Menerapkan nilai Kristiani di sekolah.',
      C: '1. Menganalisis peran Roh Kudus.\n2. Memahami makna gereja dan pelayanan.\n3. Menerapkan nilai Kristiani di masyarakat.',
      D: '1. Mengevaluasi pertumbuhan iman.\n2. Memahami etika Kristen dalam pergaulan.\n3. Menjadi saksi Kristus di tengah masyarakat.'
  },
  'pab-katolik': {
      A: '1. Mengenal Allah sebagai Pencipta.\n2. Mensyukuri diri sebagai citra Allah.\n3. Menerapkan doa dasar Katolik.',
      B: '1. Memahami karya keselamatan Yesus.\n2. Mengenal sakramen inisiasi.\n3. Menerapkan kasih di keluarga dan sekolah.',
      C: '1. Menganalisis peran Roh Kudus dan Gereja.\n2. Memahami makna sakramen penyembuhan.\n3. Menerapkan Ajaran Sosial Gereja.',
      D: '1. Mengevaluasi hidup beriman Katolik.\n2. Memahami panggilan hidup (vokasi).\n3. Terlibat aktif dalam kehidupan menggereja.'
  },
  'pab-hindu': {
      A: '1. Mengenal ajaran Tri Pramana.\n2. Memahami nilai-nilai Susila Hindu.\n3. Menerapkan doa sehari-hari (Kramaning Sembah).',
      B: '1. Memahami ajaran Catur Marga.\n2. Mengenal tempat suci dan hari raya.\n3. Menerapkan etika Hindu di sekolah.',
      C: '1. Menganalisis ajaran Panca Sraddha.\n2. Memahami makna Yadnya dalam kehidupan.\n3. Menerapkan ajaran Tat Twam Asi.',
      D: '1. Mengevaluasi pemahaman Darsana.\n2. Memahami kepemimpinan Hindu (Asta Brata).\n3. Menerapkan ajaran Hindu dalam masyarakat modern.'
  },
  'pab-buddha': {
      A: '1. Mengenal riwayat Pangeran Siddhartha.\n2. Memahami nilai kasih sayang (Metta).\n3. Menerapkan sikap hormat (Anjali).',
      B: '1. Memahami Hukum Karma dasar.\n2. Mengenal hari raya agama Buddha.\n3. Menerapkan Pancasila Buddhis di sekolah.',
      C: '1. Menganalisis Empat Kebenaran Mulia.\n2. Memahami Jalan Mulia Berunsur Delapan.\n3. Menerapkan meditasi dasar (Samatha).',
      D: '1. Mengevaluasi pemahaman Hukum Sebab Akibat (Paticcasamuppada).\n2. Memahami konsep Bodhisattva.\n3. Menerapkan ajaran Buddha dalam kehidupan sosial.'
  },
  'pab-konghucu': {
      A: '1. Mengenal ajaran dasar tentang Tian.\n2. Memahami nilai kebajikan (Ren).\n3. Menerapkan sikap hormat kepada orang tua (Xiao).',
      B: '1. Memahami makna ibadah Konghucu.\n2. Mengenal tempat ibadah (Litang/Kelenteng).\n3. Menerapkan etika Konghucu di sekolah.',
      C: '1. Menganalisis penerapan Delapan Kebajikan (Ba De).\n2. Memahami makna hari raya Konghucu.\n3. Menerapkan ajaran Zhong Shu (Setia dan Tepaselira).',
      D: '1. Mengevaluasi pemahaman kitab suci Si Shu.\n2. Memahami konsep Junzi (Manusia Budiman).\n3. Menerapkan ajaran Konghucu dalam bernegara.'
  }
};

export const pabProfilPelajar: Record<string, string[]> = {
  'pab-islam': ['Beriman kepada Allah SWT', 'Berakhlak Mulia', 'Mandiri', 'Bernalar Kritis', 'Berkebinekaan Global', 'Bergotong Royong'],
  'pab-kristen': ['Beriman kepada Tuhan Yesus Kristus', 'Berakhlak Mulia', 'Mandiri', 'Bernalar Kritis', 'Berkebinekaan Global', 'Bergotong Royong'],
  'pab-katolik': ['Beriman kepada Allah & Yesus Kristus', 'Berakhlak Mulia', 'Mandiri', 'Bernalar Kritis', 'Berkebinekaan Global', 'Bergotong Royong'],
  'pab-hindu': ['Beriman kepada Brahman (Tuhan)', 'Berakhlak Luhur', 'Mandiri', 'Bernalar Kritis', 'Berkebinekaan Global', 'Bergotong Royong'],
  'pab-buddha': ['Beriman kepada Dharma Buddha', 'Berakhlak Bijaksana', 'Mandiri', 'Bernalar Kritis', 'Berkebinekaan Global', 'Bergotong Royong'],
  'pab-konghucu': ['Beriman kepada Tuhan & Ajaran Konfusius', 'Berakhlak Berbudi', 'Mandiri', 'Bernalar Kritis', 'Berkebinekaan Global', 'Bergotong Royong']
};

export const mapelNames: Record<string, string> = {
  'bahasa-indonesia': 'Bahasa Indonesia',
  'matematika': 'Matematika',
  'ipas': 'IPAS',
  'ipa': 'IPA',
  'ips': 'IPS',
  'ppkn': 'PPKn',
  'pjok': 'PJOK',
  'seni-rupa': 'Seni Rupa',
  'seni-musik': 'Seni Musik',
  'seni-tari': 'Seni Tari',
  'seni-teater': 'Seni Teater',
  'musik': 'Seni Musik',
  'tik': 'Teknologi Informasi & Komunikasi',
  'bk': 'Bimbingan & Konseling',
  'pab-islam': 'Pendidikan Agama & Budi Pekerti (Islam)',
  'pab-kristen': 'Pendidikan Agama & Budi Pekerti (Kristen Protestan)',
  'pab-katolik': 'Pendidikan Agama & Budi Pekerti (Kristen Katolik)',
  'pab-hindu': 'Pendidikan Agama & Budi Pekerti (Hindu)',
  'pab-buddha': 'Pendidikan Agama & Budi Pekerti (Buddha)',
  'pab-konghucu': 'Pendidikan Agama & Budi Pekerti (Konghucu)'
};

export const modelNames: Record<string, string> = {
  pbl: 'Problem Based Learning',
  pjbl: 'Project Based Learning',
  inquiry: 'Inquiry Learning',
  discovery: 'Discovery Learning',
  cooperative: 'Cooperative Learning'
};

export const educationLevels = [
  { id: 'paud', label: 'PAUD' },
  { id: 'sd', label: 'SD/MI' },
  { id: 'smp', label: 'SMP/MTs' },
  { id: 'sma', label: 'SMA/MA/SMK' }
];

export const phaseClassMap: Record<string, { phases: {id: string, label: string}[], classes: Record<string, {id: string, label: string}[]> }> = {
  paud: { 
    phases: [{id: 'Fondasi', label: 'Fase Fondasi (PAUD)'}], 
    classes: { 'Fondasi': [{id: 'PAUD', label: 'Usia PAUD/TK/RA'}] } 
  },
  sd: { 
    phases: [{id: 'A', label: 'Fase A'}, {id: 'B', label: 'Fase B'}, {id: 'C', label: 'Fase C'}], 
    classes: { 
      'A': [{id: '1', label: 'Kelas I SD/MI'}, {id: '2', label: 'Kelas II SD/MI'}], 
      'B': [{id: '3', label: 'Kelas III SD/MI'}, {id: '4', label: 'Kelas IV SD/MI'}], 
      'C': [{id: '5', label: 'Kelas V SD/MI'}, {id: '6', label: 'Kelas VI SD/MI'}] 
    } 
  },
  smp: { 
    phases: [{id: 'D', label: 'Fase D'}], 
    classes: { 'D': [{id: '7', label: 'Kelas VII SMP/MTs'}, {id: '8', label: 'Kelas VIII SMP/MTs'}, {id: '9', label: 'Kelas IX SMP/MTs'}] } 
  },
  sma: { 
    phases: [{id: 'E', label: 'Fase E'}, {id: 'F', label: 'Fase F'}], 
    classes: { 
      'E': [{id: '10', label: 'Kelas X SMA/MA/SMK'}], 
      'F': [{id: '11', label: 'Kelas XI SMA/MA/SMK'}, {id: '12', label: 'Kelas XII SMA/MA/SMK'}] 
    } 
  }
};

export const subjectsByLevel: Record<string, { id: string, label: string }[]> = {
  paud: [
    { id: 'nilai-agama', label: 'Nilai Agama dan Budi Pekerti' },
    { id: 'jati-diri', label: 'Jati Diri' },
    { id: 'literasi-sains', label: 'Dasar Literasi, Matematika, Sains, Teknologi, Rekayasa, dan Seni' }
  ],
  sd: [
    { id: 'bahasa-indonesia', label: 'Bahasa Indonesia' },
    { id: 'matematika', label: 'Matematika' },
    { id: 'ipas', label: 'IPAS' },
    { id: 'pendidikan-pancasila', label: 'Pendidikan Pancasila' },
    { id: 'pjok', label: 'PJOK' },
    { id: 'seni-rupa', label: 'Seni Rupa' },
    { id: 'seni-musik', label: 'Seni Musik' },
    { id: 'seni-tari', label: 'Seni Tari' },
    { id: 'seni-teater', label: 'Seni Teater' },
    { id: 'bahasa-inggris', label: 'Bahasa Inggris' },
    { id: 'pab-islam', label: 'Pendidikan Agama Islam dan Budi Pekerti' },
    { id: 'pab-kristen', label: 'Pendidikan Agama Kristen dan Budi Pekerti' },
    { id: 'pab-katolik', label: 'Pendidikan Agama Katolik dan Budi Pekerti' },
    { id: 'pab-hindu', label: 'Pendidikan Agama Hindu dan Budi Pekerti' },
    { id: 'pab-buddha', label: 'Pendidikan Agama Buddha dan Budi Pekerti' },
    { id: 'pab-konghucu', label: 'Pendidikan Agama Konghucu dan Budi Pekerti' },
    { id: 'al-quran-hadis', label: 'Al-Qur\'an Hadis' },
    { id: 'akidah-akhlak', label: 'Akidah Akhlak' },
    { id: 'fikih', label: 'Fikih' },
    { id: 'ski', label: 'Sejarah Kebudayaan Islam (SKI)' },
    { id: 'bahasa-arab', label: 'Bahasa Arab' }
  ],
  smp: [
    { id: 'bahasa-indonesia', label: 'Bahasa Indonesia' },
    { id: 'matematika', label: 'Matematika' },
    { id: 'ipa', label: 'Ilmu Pengetahuan Alam (IPA)' },
    { id: 'ips', label: 'Ilmu Pengetahuan Sosial (IPS)' },
    { id: 'pendidikan-pancasila', label: 'Pendidikan Pancasila' },
    { id: 'pjok', label: 'PJOK' },
    { id: 'informatika', label: 'Informatika' },
    { id: 'seni-rupa', label: 'Seni Rupa' },
    { id: 'seni-musik', label: 'Seni Musik' },
    { id: 'seni-tari', label: 'Seni Tari' },
    { id: 'seni-teater', label: 'Seni Teater' },
    { id: 'bahasa-inggris', label: 'Bahasa Inggris' },
    { id: 'prakarya', label: 'Prakarya' },
    { id: 'pab-islam', label: 'Pendidikan Agama Islam dan Budi Pekerti' },
    { id: 'pab-kristen', label: 'Pendidikan Agama Kristen dan Budi Pekerti' },
    { id: 'pab-katolik', label: 'Pendidikan Agama Katolik dan Budi Pekerti' },
    { id: 'pab-hindu', label: 'Pendidikan Agama Hindu dan Budi Pekerti' },
    { id: 'pab-buddha', label: 'Pendidikan Agama Buddha dan Budi Pekerti' },
    { id: 'pab-konghucu', label: 'Pendidikan Agama Konghucu dan Budi Pekerti' },
    { id: 'al-quran-hadis', label: 'Al-Qur\'an Hadis' },
    { id: 'akidah-akhlak', label: 'Akidah Akhlak' },
    { id: 'fikih', label: 'Fikih' },
    { id: 'ski', label: 'Sejarah Kebudayaan Islam (SKI)' },
    { id: 'bahasa-arab', label: 'Bahasa Arab' }
  ],
  sma: [
    { id: 'bahasa-indonesia', label: 'Bahasa Indonesia' },
    { id: 'matematika', label: 'Matematika' },
    { id: 'fisika', label: 'Fisika' },
    { id: 'kimia', label: 'Kimia' },
    { id: 'biologi', label: 'Biologi' },
    { id: 'sosiologi', label: 'Sosiologi' },
    { id: 'ekonomi', label: 'Ekonomi' },
    { id: 'sejarah', label: 'Sejarah' },
    { id: 'geografi', label: 'Geografi' },
    { id: 'pendidikan-pancasila', label: 'Pendidikan Pancasila' },
    { id: 'pjok', label: 'PJOK' },
    { id: 'informatika', label: 'Informatika' },
    { id: 'seni-rupa', label: 'Seni Rupa' },
    { id: 'seni-musik', label: 'Seni Musik' },
    { id: 'seni-tari', label: 'Seni Tari' },
    { id: 'seni-teater', label: 'Seni Teater' },
    { id: 'bahasa-inggris', label: 'Bahasa Inggris' },
    { id: 'prakarya', label: 'Prakarya' },
    { id: 'pab-islam', label: 'Pendidikan Agama Islam dan Budi Pekerti' },
    { id: 'pab-kristen', label: 'Pendidikan Agama Kristen dan Budi Pekerti' },
    { id: 'pab-katolik', label: 'Pendidikan Agama Katolik dan Budi Pekerti' },
    { id: 'pab-hindu', label: 'Pendidikan Agama Hindu dan Budi Pekerti' },
    { id: 'pab-buddha', label: 'Pendidikan Agama Buddha dan Budi Pekerti' },
    { id: 'pab-konghucu', label: 'Pendidikan Agama Konghucu dan Budi Pekerti' },
    { id: 'al-quran-hadis', label: 'Al-Qur\'an Hadis' },
    { id: 'akidah-akhlak', label: 'Akidah Akhlak' },
    { id: 'fikih', label: 'Fikih' },
    { id: 'ski', label: 'Sejarah Kebudayaan Islam (SKI)' },
    { id: 'bahasa-arab', label: 'Bahasa Arab' }
  ]
};

export const mapelDescriptions: Record<string, string> = {
  'seni-rupa': 'Fokus pada eksplorasi bentuk, warna, garis, dan tekstur melalui kegiatan menggambar, melukis, seni patung, grafis, desain komunikasi visual, maupun kerajinan tangan (kriya).',
  'seni-musik': 'Mencakup eksplorasi bunyi, vokal, alat musik, dan apresiasi musik, baik tradisional maupun modern.',
  'seni-tari': 'Berfokus pada gerak tubuh yang estetis, ekspresif, dan berirama, yang mencakup tari tradisional maupun kreasi baru.',
  'seni-teater': 'Meliputi kegiatan akting, olah tubuh, vokal, pementasan drama, dan pemahaman unsur-unsur pertunjukan'
};

export const topicsBySubject: Record<string, string[]> = {
  'bahasa-indonesia': ['Teks Deskripsi', 'Teks Narasi', 'Teks Prosedur', 'Teks Laporan Hasil Observasi', 'Teks Eksposisi', 'Teks Anekdot', 'Teks Hikayat', 'Puisi', 'Drama', 'Surat Resmi dan Pribadi', 'Literasi Digital'],
  'matematika': ['Bilangan Bulat dan Pecahan', 'Aljabar', 'Persamaan Linear dan Pertidaksamaan', 'Geometri dan Bangun Ruang', 'Pengukuran', 'Statistika dan Analisis Data', 'Peluang', 'Kalkulus Dasar', 'Trigonometri'],
  'ipas': ['Makhluk Hidup dan Lingkungannya', 'Zat dan Perubahannya', 'Gaya dan Energi', 'Bumi dan Tata Surya', 'Kelistrikan dan Kemagnetan', 'Interaksi Sosial', 'Sejarah Indonesia', 'Geografi Lingkungan'],
  'ipa': ['Sistem Organ Manusia', 'Zat dan Perubahannya', 'Gaya dan Energi', 'Bumi dan Tata Surya', 'Kelistrikan dan Kemagnetan', 'Pewarisan Sifat', 'Bioteknologi'],
  'ips': ['Interaksi Sosial', 'Sejarah Indonesia', 'Geografi Lingkungan', 'Kegiatan Ekonomi', 'Dinamika Penduduk', 'Perubahan Sosial Budaya'],
  'pendidikan-pancasila': ['Pancasila sebagai Dasar Negara', 'Undang-Undang Dasar 1945', 'Bhinneka Tunggal Ika', 'Negara Kesatuan Republik Indonesia (NKRI)', 'Hak dan Kewajiban Warga Negara', 'Demokrasi Indonesia', 'Sistem Pemerintahan'],
  'bahasa-inggris': ['Descriptive Text', 'Narrative Text', 'Recount Text', 'Procedure Text', 'Report Text', 'Greeting and Introduction', 'Daily Routines', 'Expressing Opinions', 'Analytical Exposition'],
  'pjok': ['Permainan Bola Besar (Sepak Bola, Voli, Basket)', 'Permainan Bola Kecil (Kasti, Bulu Tangkis, Tenis Meja)', 'Atletik', 'Kebugaran Jasmani', 'Senam Lantai', 'Aktivitas Gerak Berirama', 'Renang dan Aktivitas Air', 'Pola Hidup Sehat'],
  'seni-budaya': ['Seni Rupa: Menggambar Bentuk', 'Seni Musik: Bernyanyi Unisono', 'Seni Tari: Tari Tradisional', 'Seni Teater: Bermain Peran', 'Apresiasi Karya Seni'],
  'informatika': ['Berpikir Komputasional', 'Teknologi Informasi dan Komunikasi (TIK)', 'Sistem Komputer', 'Jaringan Komputer dan Internet', 'Analisis Data', 'Algoritma dan Pemrograman', 'Dampak Sosial Informatika'],
  'fisika': ['Besaran dan Satuan', 'Gerak Lurus', 'Hukum Newton', 'Usaha dan Energi', 'Momentum dan Impuls', 'Termodinamika', 'Gelombang', 'Listrik Statis dan Dinamis'],
  'kimia': ['Struktur Atom', 'Sistem Periodik Unsur', 'Ikatan Kimia', 'Stoikiometri', 'Laju Reaksi', 'Kesetimbangan Kimia', 'Asam Basa', 'Senyawa Karbon'],
  'biologi': ['Keanekaragaman Hayati', 'Sel', 'Jaringan Tumbuhan dan Hewan', 'Sistem Gerak', 'Sistem Peredaran Darah', 'Sistem Pencernaan', 'Sistem Pernapasan', 'Evolusi'],
  'sosiologi': ['Interaksi Sosial', 'Nilai dan Norma', 'Lembaga Sosial', 'Mobilitas Sosial', 'Konflik dan Integrasi Sosial', 'Perubahan Sosial'],
  'ekonomi': ['Konsep Ilmu Ekonomi', 'Masalah Ekonomi', 'Pelaku Ekonomi', 'Pasar dan Terbentuknya Harga', 'Bank dan Lembaga Keuangan', 'Pendapatan Nasional', 'APBN dan APBD'],
  'sejarah': ['Konsep Dasar Sejarah', 'Masa Praaksara', 'Kerajaan Hindu-Buddha', 'Kerajaan Islam', 'Masa Penjajahan', 'Pergerakan Nasional', 'Proklamasi Kemerdekaan'],
  'geografi': ['Pengetahuan Dasar Geografi', 'Pemetaan', 'Litosfer', 'Atmosfer', 'Hidrosfer', 'Biosfer', 'Antroposfer'],
  'pab-islam': ['Al-Qur\'an dan Hadis', 'Aqidah (Keimanan)', 'Akhlak', 'Fiqih (Ibadah)', 'Sejarah Peradaban Islam'],
  'pab-kristen': ['Allah Tritunggal', 'Penciptaan', 'Penyelamatan', 'Gereja dan Masyarakat', 'Etika Kristen'],
  'pab-katolik': ['Pribadi Yesus Kristus', 'Gereja', 'Sakramen', 'Moral Katolik', 'Ajaran Sosial Gereja'],
  'pab-hindu': ['Sraddha (Keimanan)', 'Susila (Etika)', 'Yadnya (Ritual)', 'Sejarah Agama Hindu'],
  'pab-buddha': ['Sejarah Buddha Gautama', 'Dhamma', 'Sila', 'Samadhi', 'Panna'],
  'pab-konghucu': ['Sejarah Nabi Kongzi', 'Keimanan (Xin)', 'Tata Ibadah (Li)', 'Etika Moral (De)'],
  'al-quran-hadis': ['Hafalan Surah Pendek', 'Tajwid', 'Kisah Nabi dan Rasul', 'Hadis tentang Akhlak', 'Memahami Isi Kandungan Ayat'],
  'akidah-akhlak': ['Rukun Iman', 'Asmaul Husna', 'Akhlak Terpuji', 'Menghindari Akhlak Tercela', 'Adab Sehari-hari'],
  'fikih': ['Rukun Islam', 'Thaharah (Bersuci)', 'Shalat Fardhu', 'Zakat dan Puasa', 'Pengurusan Jenazah', 'Haji dan Umrah'],
  'ski': ['Sejarah Nabi Muhammad SAW', 'Khulafaur Rasyidin', 'Bani Umayyah', 'Bani Abbasiyah', 'Sejarah Masuknya Islam di Nusantara'],
  'bahasa-arab': ['Istima\' (Mendengarkan)', 'Kalam (Berbicara)', 'Qira\'ah (Membaca)', 'Kitabah (Menulis)', 'Mufrodat (Kosakata)', 'Qawaid (Tata Bahasa)'],
  'default': ['Bab 1: Pendahuluan', 'Bab 2: Konsep Dasar', 'Bab 3: Penerapan', 'Bab 4: Analisis Lanjut', 'Bab 5: Evaluasi']
};
