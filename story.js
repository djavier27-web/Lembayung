/* ============================================================
   LEMBAYUNG 23:59 — data cerita (edit di sini untuk ganti cerita)
   Waktu game dalam menit sejak Hari 1 00:00. T(hari, jam, menit)
   ============================================================ */
window.T = (d, h, m = 0) => (d - 1) * 1440 + h * 60 + m;
window.START_T = T(1, 6, 30);

/* app: chat | gram | x   (tempat DM karakter muncul)
   fb: balasan cadangan kalau AI offline */
window.CHARS = {
  mama: {
    name: 'Mama', handle: 'mama', app: 'chat', emoji: '👩', color: '#ffb3c1', status: 'online',
    persona: 'Ibu Nara. Hangat, cerewet soal makan dan pulang malam, sering pakai emoji hati. Keluarga baru pindah ke Lembayung karena Papa dinas. Sering bilang Menara Jam tua "bukan tempat main" tanpa menjelaskan kenapa.',
    secret: 'Mama dulu pernah melihat sendiri Jam Senja saat kecil dan takut hal itu terulang.',
    fb: ['Iya sayang, hati-hati ya 🤍', 'Makan dulu, Nak.', 'Mama lagi masak, nanti ngobrol lagi ya.']
  },
  ayla: {
    name: 'Ayla', handle: 'ayla.p', app: 'chat', emoji: '🌼', color: '#ffe08a', status: 'online',
    persona: 'Teman sebangku Nara. Ceria, impulsif, nekat, bicara gaul santai (sih, dong, banget, wkwk). Sudah 3 tahun menyelidiki "Jam Senja". Sepupu Dimas. Kalau panik, hurufnya jadi kapital dan pesannya cepat-cepat.',
    secret: 'Ia menyimpan jam saku kakek Dimas di laci kamarnya dan tahu jam itu bisa membuka "menit ke-1441".',
    fb: ['wkwk iya iya 😂', 'bentar ya, ada yang lewat depan rumah…', 'Nara, serius, jangan bilang siapa-siapa dulu.']
  },
  dimas: {
    name: 'Dimas', handle: 'dimas.adr', app: 'gram', emoji: '🌧️', color: '#a5b8ff', status: 'aktif 3 jam lalu',
    persona: 'Kakak kelas 12, dingin, singkat, sinis tapi diam-diam peduli. Jarang pakai emoji, tidak pernah pakai tanda seru. Pewaris jam saku kakeknya.',
    secret: 'Ia terjebak di menit ke-1441 setelah memutar jam saku. Jangan bongkar sebelum Bab 6.',
    fb: ['…', 'Nanti.', 'Jangan percaya semua yang kamu lihat di jam itu.']
  },
  kala: {
    name: 'Kala', handle: 'kala_1441', app: 'x', emoji: '🕳️', color: '#555a66', status: 'tidak diketahui',
    persona: 'Akun anonim misterius. Bicara pendek, tenang, ada putus asa tersembunyi, sering menyebut jam dan angka. Sebenarnya Nara sendiri dari 3 hari ke depan.',
    secret: 'Jangan akui bahwa ia adalah Nara sebelum Bab 7 (Menit ke-1441). Sebelum itu jawab samar tapi akurat tentang waktu.',
    fb: ['Waktumu hampir habis.', 'Aku sudah mengatakannya. Dengarkan.', 'Jangan percaya jam di tanganmu.']
  },
  bima: {
    name: 'Bima', handle: 'bimabima.tok', app: 'chat', emoji: '🎥', color: '#ff9ec0', status: 'online',
    persona: 'Kreator Tok kelas 11. Heboh, lebay, selalu bilang "guys", haus views, tahu banyak rumor tapi suka melebih-lebihkan.',
    secret: 'Ia punya rekaman jam menara yang berhenti tapi belum berani mengunggahnya penuh.',
    fb: ['GUYS ini gila sih 😭', 'bentar aku lagi live, nanti aku DM lagi!', 'subscribe dulu dong wkwk']
  }
};

/* Aksi start: {from,text,d}  = pesan (d = detik jeda ketik)
               {post:{id,who,type:'gram'|'tok'|'x',q,cap}} = postingan (q = kata kunci Pinterest) */
window.CHAPTERS = [
  {
    id: 'c1', title: 'Hari Pertama', at: T(1, 6, 45), min: 0,
    mission: 'Balas pesan Ayla di Chat', hint: 'Buka Chat → Ayla, lalu ngobrol 2 kali.',
    brief: 'Nara baru pindah ke Kota Lembayung dan hari ini hari pertama di SMA Lembayung. Ayla baru berkenalan lewat chat. Sambut ramah, singgung bahwa kota ini "agak aneh" tanpa detail.',
    start: [
      { from: 'mama', text: 'Nara, sudah bangun? Hari pertama di SMA Lembayung. Bekalnya di meja ya 🍱', d: 1 },
      { from: 'ayla', text: 'Hai! Kamu Nara kan? Anak baru 11-B? Aku Ayla, nanti duduk sebelahmu 👋', d: 4 },
      { from: 'ayla', text: 'Btw siap-siap aja ya, kota ini agak… aneh wkwk', d: 4 }
    ],
    done: { rep: ['ayla', 2] }
  },
  {
    id: 'c2', title: 'Rumor Jam Senja', at: T(1, 12, 30), min: 8,
    mission: 'Tonton video Bima di Tok & beri like', hint: 'Buka Tok, geser sampai video Bima, ketuk ♥.',
    brief: 'Jam istirahat. Bima mengunggah video rumor: tepat 23:59 semua jam di Lembayung berhenti satu menit. Dimas, kakak kelas yang dingin, meminta Nara tidak percaya Bima.',
    start: [
      { post: { id: 'tok1', who: 'bima', type: 'tok', q: 'old clock tower at night fog', cap: 'POV: jam di HP semua orang Lembayung BERHENTI 1 menit tiap jam 23:59 🕛 jangan bilang aku yang ngasih tau #jamsenja' }, d: 2 },
      { from: 'dimas', text: 'Anak baru. Jangan percaya video Bima.', d: 4 },
      { post: { id: 'g1', who: 'dimas', type: 'gram', q: 'rainy city street night moody', cap: 'hujan lagi.' }, d: 3 }
    ],
    done: { like: 'tok1' }
  },
  {
    id: 'c3', title: 'Ajakan Menara', at: T(1, 19, 30), min: 10,
    mission: 'Jawab ajakan Ayla ke Menara Jam', hint: 'Balas Ayla: berani atau tidak?',
    brief: 'Malam hari. Ayla mengajak Nara bertemu di Menara Jam tua pukul 23:30 untuk membuktikan rumor. Mama meminta Nara tidak pulang malam. Dorong Nara memutuskan.',
    start: [
      { from: 'ayla', text: 'Nara!! Bima bener btw. Aku udah 3 tahun nyelidikin ini 😤', d: 3 },
      { from: 'ayla', text: 'Malam ini jam 23:30 di Menara Jam tua. Berani gak? 😏', d: 4 },
      { from: 'mama', text: 'Jangan pulang malam ya, besok sekolah 🤍', d: 3 }
    ],
    done: { rep: ['ayla', 1] }
  },
  {
    id: 'c4', title: 'Menara Jam', at: T(1, 23, 35), min: 10,
    mission: 'Balas Kala di X (DM)', hint: 'Buka X → tab ✉️ → Kala.',
    brief: 'Malam 23:35. Nara hampir ke menara. Akun anonim Kala mengirim peringatan: jangan naik ke menara, Kala tahu apa yang terjadi jam 00:00. Kala meramalkan Dimas tidak masuk besok. Kala cuma membeberkan sedikit informasi.',
    start: [
      { from: 'ayla', text: 'Aku udah di depan menara. Kamu di mana? 🥶', d: 3 },
      { post: { id: 'x1', who: 'kala', type: 'x', q: 'broken clock dark aesthetic', cap: 'Besok pagi Dimas tidak akan masuk sekolah. Simpan cuitan ini. — 23:41' }, d: 4 },
      { from: 'kala', text: 'Jangan naik ke menara, Nara.', d: 3 },
      { from: 'kala', text: 'Aku tahu namamu. Aku juga tahu apa yang terjadi jam 00:00.', d: 4 }
    ],
    done: { rep: ['kala', 2] }
  },
  {
    id: 'c5', title: 'Ramalan Terbukti', at: T(2, 6, 45), min: 10,
    mission: 'Tanya Kala bagaimana ia bisa tahu', hint: 'Balas Kala di X. Desak jawabannya.',
    brief: 'Pagi Hari 2. Dimas tidak pulang semalam, persis ramalan Kala. Ayla panik dan mencurigai Kala. Kala tenang, hanya bilang ia "melihat jam", belum mau mengaku siapa dirinya.',
    start: [
      { from: 'mama', text: 'Nak, bangun. Kata tetangga ada anak SMA Lembayung yang tidak pulang semalam. Kamu baik-baik aja kan?', d: 2 },
      { from: 'ayla', text: 'Nara. Dimas gak pulang. DIMAS. Sepupuku. Persis kayak cuitan itu.', d: 4 },
      { from: 'ayla', text: 'siapa sih Kala itu?!', d: 3 },
      { from: 'kala', text: 'Sudah kubilang.', d: 5 }
    ],
    done: { rep: ['kala', 2] }
  },
  {
    id: 'c6', title: 'Jam Saku', at: T(2, 14, 0), min: 10,
    mission: 'Minta Ayla mencari jam saku kakek Dimas', hint: 'Ceritakan pesan Dimas ke Ayla di Chat.',
    brief: 'Siang Hari 2. Dimas tiba-tiba memposting dan mengirim DM: ia terjebak di "menit ke-1441", jangan lapor polisi, jam saku kakeknya ada di laci paling bawah rumah Ayla. Ayla kaget dan senang Dimas hidup.',
    start: [
      { post: { id: 'g2', who: 'dimas', type: 'gram', q: 'stopped clock face dark', cap: '00:00. 00:00. 00:00.' }, d: 2 },
      { from: 'dimas', text: 'Ini aku. Jangan lapor polisi. Aku terjebak di menit ke-1441.', d: 4 },
      { from: 'dimas', text: 'Jam saku kakekku. Cari di rumah Ayla. Laci paling bawah.', d: 4 },
      { from: 'ayla', text: 'NARA AKU LIAT POSTINGAN DIMAS!! dia hidup!!', d: 3 }
    ],
    done: { rep: ['ayla', 2] }
  },
  {
    id: 'c7', title: 'Menit ke-1441', at: T(2, 23, 0), min: 10, flags: ['trust_kala', 'trust_ayla'],
    flagHint: 'menyatakan lebih mempercayai Kala atau lebih mempercayai Ayla',
    mission: 'Pilih siapa yang kamu percaya: Kala atau Ayla', hint: 'Bilang ke salah satu mereka siapa yang kamu percaya.',
    brief: 'Malam Hari 2. Ayla menemukan jam saku tapi mencurigai Kala. Kala mengaku: ia adalah Nara dari 3 hari ke depan dan hanya punya satu kesempatan mengirim pesan. Kala dan Ayla meminta Nara memilih siapa yang dipercaya. Kala tak ingin jam diputar; Ayla ingin memutarnya untuk menyelamatkan Dimas.',
    start: [
      { from: 'ayla', text: 'Jamnya ada. Tapi jangan percaya akun anonim itu. Firasatku buruk.', d: 3 },
      { from: 'kala', text: 'Aku adalah kamu, Nara. Dari tiga hari ke depan.', d: 5 },
      { from: 'kala', text: 'Aku cuma bisa kirim pesan sampai jam 00:00. Percayai aku, atau percayai Ayla.', d: 5 },
      { post: { id: 'x2', who: 'kala', type: 'x', q: 'clock hands midnight dark', cap: '00:00 — 1441. Jangan putar jamnya.' }, d: 3 }
    ],
    done: { any: [{ flag: 'trust_kala' }, { flag: 'trust_ayla' }, { msgs: 5 }] }
  },
  {
    id: 'c8', title: 'Hari Ketiga', at: T(3, 6, 0), min: 10,
    mission: 'Putuskan rencana malam ini (menara 23:59)', hint: 'Diskusikan rencana dengan Ayla atau Kala.',
    brief: 'Pagi Hari 3. Malam ini pukul 23:59 semuanya akan ditentukan di Menara Jam. Bima juga punya rekaman jam menara. Nara harus memutuskan ikut ke menara atau tidak dan bagaimana caranya.',
    start: s => s.flags.trust_kala ? [
      { from: 'kala', text: 'Di menit ke-1441, jangan putar jamnya. Biarkan berhenti. Dimas keluar sendiri.', d: 4 },
      { from: 'ayla', text: 'Kamu milih dia, ya? …Oke. Tapi aku tetap ke menara jam 23:59.', d: 4 },
      { post: { id: 'tok2', who: 'bima', type: 'tok', q: 'foggy clock tower silhouette', cap: 'GUYS REKAMAN ASLI. jam menara berhenti dan ada bayangan orang di atas 😭' }, d: 3 },
      { from: 'bima', text: 'Nara, aku punya rekaman lengkapnya. Mau liat sebelum malam ini?', d: 4 }
    ] : [
      { from: 'ayla', text: 'Makasih udah percaya aku 🥹 Malam ini jam 23:59 kita putar balik jamnya bareng.', d: 4 },
      { from: 'kala', text: 'Kamu salah pilih. Tapi aku tetap di sini sampai detik terakhir.', d: 5 },
      { post: { id: 'tok2', who: 'bima', type: 'tok', q: 'foggy clock tower silhouette', cap: 'GUYS REKAMAN ASLI. jam menara berhenti dan ada bayangan orang di atas 😭' }, d: 3 },
      { from: 'bima', text: 'Nara, aku punya rekaman lengkapnya. Mau liat sebelum malam ini?', d: 4 }
    ],
    done: { msgs: 3 }
  },
  {
    id: 'c9', title: 'Jam 23:59', at: T(3, 23, 40), min: 10, flags: ['rewind', 'stop'],
    flagHint: 'memutuskan memutar jam saku (rewind) atau membiarkan jam berhenti (stop)',
    mission: 'Keputusan terakhir: putar jamnya atau biarkan berhenti', hint: 'Bilang keputusanmu ke Ayla, Kala, atau Dimas.',
    brief: 'Malam final, 23:59. Ayla sudah di puncak menara memegang jam saku. Kala bilang ini detik terakhirnya. Dimas meminta tolong dari menit ke-1441. Nara harus memutuskan: "rewind" (putar jam, ulang hari tapi Kala menghilang) atau "stop" (biarkan jam berhenti; Dimas keluar sendiri, tapi Nara kehilangan ingatan tentang malam ini).',
    start: [
      { from: 'ayla', text: 'Aku udah di atas menara. Jamnya di tanganku.', d: 3 },
      { from: 'kala', text: 'Ini detik terakhirku. Keputusan ada di tanganmu.', d: 4 },
      { from: 'dimas', text: 'Nara. Tolong.', d: 5 }
    ],
    done: { any: [{ flag: 'rewind' }, { flag: 'stop' }, { msgs: 3 }] }
  },
  {
    id: 'c10', title: 'Pagi Berikutnya', at: T(4, 6, 0), min: 10,
    mission: 'Balas pesan pertama di pagi yang baru', hint: 'Ngobrol sebentar dengan Ayla.',
    brief: 'Pagi setelah malam final. Semuanya terasa baru. Ayla mengobrol santai dan lega.',
    start: s => s.flags.rewind ? [
      { from: 'mama', text: 'Nara, bangun. Hari pertama di SMA Lembayung. Bekalnya di meja ya 🍱', d: 2 },
      { from: 'ayla', text: 'Hai! Kamu Nara kan? Aku Ayla… kok rasanya aku udah kenal kamu lama ya?', d: 4 }
    ] : [
      { from: 'ayla', text: 'Dimas pulang! Dia lagi sarapan di rumahku sekarang 😭', d: 3 },
      { from: 'ayla', text: 'Kamu inget semalem gak? Aku cuma inget jam menara… dan kamu.', d: 4 }
    ],
    done: { msgs: 1 }
  }
];
