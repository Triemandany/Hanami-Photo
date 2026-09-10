# TODO - Rapihin Web Photobooth

- [ ] Buat edit plan berdasarkan hasil baca `index.html`, `style.css`, `script.js`.
- [ ] Setelah plan disetujui, rapihin `script.js`:
  - [ ] Perbaiki bug: `composeStrip()` memanggil `addPhotoToGallery()` dan `loadAndCompose()` juga memanggilnya (potensi strip dobel).
  - [ ] Rapihin flow async `loadAndCompose` agar komposisi hanya menghasilkan `canvas`/`dataURL` sekali.
  - [ ] Rapihin `updatePreviewPlaceholder/resetPreview` biar tidak bolak-balik `innerHTML` yang berpotensi merusak referensi.
  - [ ] Konsolidasikan state dan guard (captureInProgress, button disabling/enabling).
- [ ] Jalankan build/test ringan: buka di browser dan pastikan snapshot & multi-capture berjalan tanpa error.
- [ ] Update hasil (ringkas) setelah perubahan selesai.

