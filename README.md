# Kotoba — PWA Hafal Kosakata JLPT N4 & N3

Aplikasi web (PWA) untuk menghafal kosakata Bahasa Jepang JLPT N4 & N3 dengan metode **Active Recall** + **Spaced Repetition**. Tanpa backend — semua data tersimpan di **LocalStorage**.

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
    └── vocabulary.json   (2500 kosakata: 700 N4 + 1800 N3)
```

## Cara Menjalankan

Karena memuat file JSON via fetch, jalankan lewat server (bukan `file://`):

```bash
python3 -m http.server 8000
# buka http://localhost:8000
```

## Hosting di GitHub Pages

1. Buat repo baru di GitHub, upload semua file ini ke root repo.
2. Settings → Pages → Source: branch `main`, folder `/ (root)` → Save.
3. Buka URL `https://username.github.io/nama-repo/`.
4. Di browser, pilih "Install app" untuk memasang sebagai PWA.

## Fitur

- 📖 Toggle Furigana global (tersimpan di LocalStorage)
- 🏠 Beranda: total N4/N3, dipelajari, dikuasai, % progress, 🔥 streak
- 📚 Daftar kosakata: pencarian + filter level (Semua/N4/N3)
- 🃏 Flashcard: Sulit / Lumayan / Mudah
- ✏️ Quiz 4 mode: Kanji→Arti, Kanji→Furigana, Arti→Kanji, Random
- 🔁 Spaced Repetition (Leitner): sering salah = lebih sering muncul
- 📊 Statistik + grafik progress N4 & N3
- 🌙 Dark mode, desain modern responsif
