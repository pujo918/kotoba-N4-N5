# Kotoba — PWA Hafal Kosakata & Bacaan JLPT N4, N3 & N2

Aplikasi web (PWA) untuk menghafal kosakata Bahasa Jepang JLPT N4, N3 & N2 dengan metode **Active Recall** + **Spaced Repetition** serta fitur **Sistem Bacaan Kontekstual (Dokkai)**. Tanpa backend — semua data tersimpan di **LocalStorage**.

## Struktur File

```
.
├── index.html
├── style.css
├── app.js
├── manifest.json
├── service-worker.js
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
└── data/
    ├── vocabulary.json   (4000 kosakata: 700 N4 + 1800 N3 + 1500 N2)
    ├── vocabulary.js     (Fallback offline / file://)
    ├── readings.json     (Kumpulan bacaan terkurasi N4, N3, N2)
    └── readings.js       (Fallback offline / file://)
```

## Cara Menjalankan

Aplikasi dapat dibuka langsung atau dijalankan via server lokal:

```bash
python3 -m http.server 8000
# buka http://localhost:8000
```

## Hosting di GitHub Pages

1. Buat repo baru di GitHub, upload semua file ini ke root repo.
2. Settings → Pages → Source: branch `main`, folder `/ (root)` → Save.
3. Buka URL `https://username.github.io/nama-repo/`.
4. Di browser, pilih "Install app" untuk memasang sebagai PWA.

## Fitur Utama

- 📖 **Toggle Furigana global**: Sembunyikan atau tampilkan furigana secara instan di seluruh aplikasi.
- 🏠 **Beranda Interaktif**: Statistik total N4/N3/N2, dipelajari, dikuasai, % progress, dan 🔥 streak harian.
- 📚 **Daftar Kosakata**: Pencarian real-time, filter level (Semua/N4/N3/N2), dan status hafalan.
- 📖 **Sistem Bacaan (読解 - Dokkai)**:
  - Koleksi cerita dan artikel berjenjang per level (N4, N3, N2).
  - Deteksi dan highlight kosakata otomatis dari kamus 4.000 kata.
  - Interaksi tap/klik untuk pop-up arti lengkap, furigana, audio pengucapan (TTS), dan status hafalan.
  - Mode **➕ Teks Mandiri**: Tempel teks/berita sendiri dan sistem otomatis mendeteksi kotobanya.
  - Toggle terjemahan bahasa Indonesia per artikel.
- 🃏 **Flashcard**: Active recall (Sulit / Lumayan / Mudah) dengan algoritma Spaced Repetition (Leitner).
- ✏️ **Quiz 4 Mode**: Kanji→Arti, Kanji→Furigana, Arti→Kanji, dan Random.
- 🎯 **Latihan Khusus Kata yang Pernah Salah**: Mempercepat perbaikan hafalan kata yang sering keliru.
- 📊 **Statistik Detail**: Grafik progres per level N4, N3, dan N2.
- 🌙 **Dark Mode & Desain Responsif**: Tampilan modern, mobile-friendly bottom sheet.

