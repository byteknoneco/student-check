# DersTakip+ v0.3

Ozel ders ogretmeni, ogrenci ve veliyi ortak Supabase veritabaninda bulusturan React Native / Expo uygulamasi.

## v0.3 ozeti

Bu surum buyuk bir fonksiyon guncellemesidir: bildirim merkezi, push altyapisi, tekrarli ders, iptal/erteleme, ders performans puanlari, gelisim haritasi, calisma hedefleri, gelismis sinav analizi, mesajlasma, PDF rapor, hesap silme ve yeni uygulama ikonlari eklenmistir.

Kurulum icin:
- `GITHUB_UPDATE_CHECKLIST_v0.3.md`
- `SUPABASE_SETUP_v0.3.md`
- `FEATURES_v0.3.md`

dosyalarini izleyin.

## Teknoloji

- React Native / Expo 57
- TypeScript
- Supabase Auth + Postgres + RLS + Edge Functions + Database Webhooks
- Expo Notifications
- Expo Print / Sharing
- GitHub Actions Android release APK

## Guvenlik

- Mobil uygulamaya Supabase `service_role` veya `sb_secret_...` anahtari koymayin.
- Mobil uygulama yalnizca Publishable Key kullanir.
- Yetkilendirme RLS ve server-side RPC'lerle yapilir.
- `google-services.json` workflow tarafinda opsiyonel secret olarak restore edilebilir ve `.gitignore` icindedir.

## v0.3.1 - Odev fotograf/PDF

Odevlere fotograf ve PDF ekleme, ogrenci teslim dosyalari ve ogretmen geri bildirim dosyalari eklendi. Supabase tarafinda `005_homework_files.sql` migration'i calistirilmalidir. Ayrintilar `HOMEWORK_FILES_SETUP_v0.3.1.md` dosyasindadir.
