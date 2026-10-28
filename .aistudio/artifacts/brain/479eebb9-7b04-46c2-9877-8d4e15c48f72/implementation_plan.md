# Simulasi Fisika 3D Interaktif: Tekanan pada Zat Padat ($P = \frac{F}{A}$)

Aplikasi simulasi fisika 3D berbasis web interaktif untuk mempelajari konsep fundamental **Tekanan pada Zat Padat**. Menampilkan model paku 3D realistis yang melayang di atas balok kayu dan meja laboratorium, dengan simulasi mekanika penekanan, kalkulasi tekanan real-time, efek serbuk kayu fisika partikel, dan visualisasi hubungan matematis $P = \frac{F}{A}$.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Pilihan Konfigurasi Simulasi**
> - **Karakteristik Material & Ambang Batas:** Papan kayu memiliki ambang batas daya tembus default $300\text{ kPa}$ (disertai opsi pemilihan preset jenis kayu: *Kayu Balsa* $150\text{ kPa}$, *Kayu Pinus* $300\text{ kPa}$, dan *Kayu Jati* $600\text{ kPa}$).
> - **Mekanika Penekanan:** Animasi penekanan paku dilengkapi efek dorongan fisis bertahap dengan deteksi kedalaman tembus berbasis rasio tekanan aktual terhadap ambang batas batas kayu.
> - **Visualisasi Tambahan:** Dilengkapi vektor panah gaya ($F$) yang membesar sesuai nilai gaya, pembesaran visual ujung paku ($A$), serta grafik hubungan dinamika $P$ vs $F$ & $A$.

---

## 1. Overview & Core Concept

- **Apa yang Dibangun**: Simulasi 3D real-time di mana pengguna dapat memanipulasi dua parameter utama:
  1. **Gaya Tekan ($F$)**: $0 - 100\text{ N}$
  2. **Luas Ujung Paku ($A$)**: $0.1 - 5.0\text{ cm}^2$
- **Kalkulasi Fisika Real-Time**:
  $$P = \frac{F}{A_{\text{m}^2}} = \frac{F}{A \times 10^{-4}\text{ m}^2} \quad [\text{Pascal / Pa}]$$
- **Dua Skenario Hasil Uji Tekanan**:
  1. **$P \ge P_{\text{ambang}}$ (Menembus)**: Paku menancap ke dalam serat kayu dengan kedalaman proporsional terhadap tekanan, diiringi ledakan partikel serbuk kayu 3D (*sawdust debris*) dan getaran impak.
  2. **$P < P_{\text{ambang}}$ (Gagal Menembus)**: Paku hanya turun menyentuh permukaan kayu lalu tertahan, memunculkan umpan balik bahwa tekanan belum mencukupi untuk memecah serat kayu.
- **Nilai Edukasi**: Memahami secara intuitif bahwa paku tajam (luas kecil) menghasilkan tekanan berlipat ganda dibanding paku tumpul, dan semakin besar gaya yang diberikan maka tekanan semakin tinggi.

---

## 2. User Experience & Visual Design

### A. Komposisi Panggung 3D (Full-Bleed Viewport)
- **Meja Laboratorium & Papan Kayu**: Meja kayu oak halus dengan papan uji serat pinus procedural (beveled edges, tekstur serat kayu prosedural CanvasTexture resolusi tinggi).
- **Model Paku Multi-Komponen (Composite 3D Mesh)**:
  - Kepala paku baja (flat cap dengan bevel)
  - Batang paku silindris bertekstur baja poles
  - Leher tirus peralihan
  - Ujung paku berbentuk kerucut parametrik yang secara dinamis mengubah ketebalan ujungnya saat slider luas penampang digeser!
- **Sistem Partikel Serbuk Kayu (GPU-accelerated Particles)**:
  - Ratusan partikel serpihan kayu yang terpental ke atas dan menyebar dengan fisika gravitasi dan hamburan saat paku menembus papan.
- **Pencahayaan Studio PBR**:
  - Key light terarah hangat dengan bayangan halus (soft shadow maps).
  - Fill light hemisphere sejuk untuk kejernihan kontur objek.
  - Lingkungan refleksi prosedural `RoomEnvironment` untuk kemilau logam paku.

### B. Antarmuka HUD & Dock Kontrol Bawah (Collapsible Bottom Dock)
Mengikuti standar Three.js & Frontend Design AI Studio (dock bawah hemat ruang $\le 15\%$ tanpa menutupi subjek 3D):
1. **Header Ringkas**: Judul simulasi, indikator rumus interaktif $P = F/A$, dan tombol toggle sudut kamera (Orbit, Top-Down, Close-Up Ujung Paku).
2. **Kartu Formula & Edukasi di Pojok Layar**:
   - Teks edukasi wajib: *"Tekanan berbanding lurus dengan Gaya, dan berbanding terbalik dengan Luas Permukaan"*.
   - Nilai $P$ real-time dalam Pascal ($\text{Pa}$) dan kiloPascal ($\text{kPa}$).
3. **Panel Kontrol Bawah (Bottom Dock)**:
   - **Slider Gaya Tekan ($F$)**: Range $0 - 100\text{ N}$, dengan indikator warna dinamis.
   - **Slider Luas Ujung Paku ($A$)**: Range $0.1 - 5.0\text{ cm}^2$, dengan indikator warna dinamis (merah = tekanan tinggi, hijau = tekanan rendah).
   - **Tombol Aksi Utama 'Tekan Paku'**: Tombol berdimensi mantap dengan status animasi penekanan dan tombol 'Reset Posisi'.
   - **Pemilih Material Kayu**: Pilihan Balsa ($150\text{ kPa}$), Pinus ($300\text{ kPa}$), Jati ($600\text{ kPa}$).

---

## 3. Key Product Decisions & Trade-Offs

- **Tekstur Prosedural vs Gambar Eksternal**:
  - *Keputusan*: Membuat tekstur serat kayu dan baja poles $100\%$ secara prosedural menggunakan HTML5 Canvas API di memori klien.
  - *Alasan*: Menjamin zero-dependency, bebas dari error 404 URL gambar eksternal, dan respons instan.
- **Geometri Ujung Paku Adaptif**:
  - *Keputusan*: Mengupdate ketajaman geometri ujung kerucut paku secara halus saat nilai luas ujung ($A$) diubah pengguna.
  - *Alasan*: Memberikan umpan balik visual langsung mengapa luas ujung mempengaruhi tekanan sebelum tombol tekan diklik.
- **Sintesis Audio Web Audio API**:
  - *Keputusan*: Efek suara benturan mekanik kayu dan retakan serat dihasilkan dengan oscillator Web Audio API tanpa file audio eksternal.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App.tsx (Main Coordinator)                      │
│   - State: Force (F), Area (A), Pressure (P), WoodType, AnimationState │
│   - Physics Engine: P = F / (A * 1e-4), Penetration Depth Calculator   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     ThreeScene (3D Canvas)      │       │     SimulationControls (HUD)    │
│  - Three.js WebGLRenderer       │       │  - Header & Status              │
│  - Table & Wood Plank Mesh      │       │  - Dynamic Colored Sliders      │
│  - Adaptive Nail Group (3-part) │       │  - Action Buttons (Tekan/Reset) │
│  - Sawdust Particle Emitter     │       │  - Formula & Educational Callout│
│  - Force Vector & Area Ring     │       │  - Wood Resistance Selector     │
│  - OrbitControls (Damped)       │       └─────────────────────────────────┘
└─────────────────────────────────┘
```

### State & Variabel Fisika:
- $F \in [0, 100]\text{ N}$ (step: $1\text{ N}$, default: $50\text{ N}$)
- $A \in [0.1, 5.0]\text{ cm}^2$ (step: $0.1\text{ cm}^2$, default: $1.0\text{ cm}^2$)
- $P = \frac{F}{A \times 10^{-4}}$ (contoh: $50 / 0.0001 = 500{,}000\text{ Pa} = 500\text{ kPa}$)
- $P_{\text{ambang}}$: Nilai kritis daya tahan kayu terhadap penetrasi.
- Color Gradient Slider: Dari Hijau (tekanan rendah $\le 50\text{ kPa}$) ke Kuning ($100 - 300\text{ kPa}$) hingga Merah pekat ($> 500\text{ kPa}$).

---

Silakan tinjau rencana di atas. Klik **Proceed** jika Anda setuju untuk melanjutkan ke proses pengkodean!
