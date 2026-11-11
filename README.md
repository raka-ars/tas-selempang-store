# 🎒 Tas Selempang Official - Website Katalog & AI Chatbot RAG

Website katalog bisnis interaktif untuk lapak Shopee **[tas.selempang](https://shopee.co.id/tas.selempang#product_list)** yang dilengkapi dengan **AI Chatbot berbasis Retrieval-Augmented Generation (RAG)** menggunakan model LLM Groq Cloud (`qwen/qwen3.8-27b`).

Dibuat sebagai pemenuhan **Tugas Praktikum Artificial Intelligence and Its Application** (Semester Ganjil 2026–2027).

---

## 🌟 Fitur Utama

1. **Katalog Produk Terstruktur (30 Produk Hasil Scraping)**:
   - Menampilkan koleksi Tas Selempang Pria & Wanita, Waistbag, Tas Ransel Laptop, Tote Bag, Dompet, dan Jasa Embos Nama.
   - Filter instan per kategori & pencarian kata kunci (*live search*).
   - Pengurutan harga terendah, tertinggi, dan nama.
   - Tombol **"Beli di Shopee"** (langsung membuka URL produk resmi).
   - Tombol **"Order WA"** dengan format teks pesan otomatis (`wa.me/...`).

2. **AI Chatbot RAG (Floating Widget)**:
   - Terintegrasi langsung di pojok kanan bawah website.
   - Menggunakan arsitektur RAG: mencocokkan pertanyaan pengunjung dengan data katalog `data/products.json`.
   - Menggunakan Vercel Serverless Function (`/api/chat`) yang ditenagai oleh Groq Cloud LLM.
   - Dilengkapi *fail-safe client-side RAG fallback* sehingga bot tetap aktif dan cerdas merespon.

3. **Gateway WhatsApp yang Tersinkronisasi**:
   - Backend lokal WhatsApp (`chatbot-rag/server-v2.js`) menggunakan basis data `products.csv` yang sama persis.

---

## 🚀 Cara Menjalankan di Komputer Lokal

```bash
# 1. Masuk ke direktori
cd tas-selempang-web

# 2. Install dependensi
npm install

# 3. Jalankan server lokal
npm start
```
Buka browser di **[http://localhost:3000](http://localhost:3000)**.

---

## ☁️ Panduan Deployment ke Vercel (Gratis & Cepat)

### Opsi A: Lewat GitHub & Web Vercel (Direkomendasikan)

1. **Buat Repository Baru di GitHub**:
   - Buka [https://github.com/new](https://github.com/new).
   - Beri nama repository, misalnya `tas-selempang-store`.
   - Klik **Create repository**.

2. **Push Project ke GitHub**:
   Jalankan perintah berikut di folder `tas-selempang-web`:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit katalog shopee & AI chatbot RAG"
   git branch -M main
   git remote add origin https://github.com/<username-github-anda>/tas-selempang-store.git
   git push -u origin main
   ```

3. **Deploy di Vercel**:
   - Buka [https://vercel.com](https://vercel.com) dan login dengan akun GitHub.
   - Klik **Add New...** → **Project**.
   - Pilih repository `tas-selempang-store` lalu klik **Import**.
   - Pada bagian **Environment Variables**, tambahkan:
     - `GROQ_API_KEY`: `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`
     - `GROQ_MODEL`: `qwen/qwen3.8-27b`
   - Klik **Deploy**.
   - Dalam ~30 detik, website Anda sudah aktif secara online dengan URL publik (contoh: `https://tas-selempang-store.vercel.app`).

---

## 📂 Struktur Project

```
tas-selempang-web/
├── api/
│   └── chat.js            # Vercel Serverless Function (RAG Engine + Groq LLM)
├── data/
│   └── products.json      # 30 Data produk lapak Shopee terstruktur
├── index.html             # Antarmuka katalog modern & widget chatbot
├── style.css              # Styling responsif e-commerce
├── app.js                 # Logika filter, pencarian, & interaksi chat
├── vercel.json            # Konfigurasi routing serverless Vercel
├── package.json           # Manifest dependensi (groq-sdk)
├── server.js              # Server pengujian lokal
└── README.md              # Dokumentasi project
```

---

## 🔗 Informasi Sumber Data

- **Lapak Shopee:** [https://shopee.co.id/tas.selempang#product_list](https://shopee.co.id/tas.selempang#product_list)
- **Model LLM:** Groq `qwen/qwen3.8-27b`
