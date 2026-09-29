# DersTakip+ v0.4

DersTakip+, ozel ders ogretmeni, ogrenci ve veliyi ortak Supabase veritabaninda bulusturan React Native / Expo uygulamasidir.

## Teknoloji
- React Native + Expo + TypeScript
- Supabase Auth + PostgreSQL + RLS + Storage + Realtime
- GitHub Actions ile standalone Android release APK

## v0.4 one cikanlar
- Oturum geri yukleme / tekrar tekrar login istemesini onleme
- Bildirim silme, toplu temizleme, geri alma
- Bildirim tercihleri
- Mesaj okundu bilgisi, duzenleme, benden sil, herkesten sil
- Ogrenci arsivleme / geri alma
- Ogretmene ozel ogrenci notu
- Profil fotografi
- Global arama
- Akilli dashboard ve son hareketler
- Takvim filtreleri

Detaylar: `FEATURES_v0.4.md`

## Mevcut temel moduller
- Ogretmen / veli / ogrenci rolleri
- Ogrenci yonetimi
- Ders takvimi ve tekrarlayan dersler
- Ders sonu raporu ve performans puanlari
- Odev + fotograf/PDF materyal/teslim dosyalari
- Sinav sonuclari
- Konu gelisimi ve calisma hedefleri
- Paket ve odeme takibi
- Davet kodu ile veli/ogrenci eslestirme
- Uygulama ici bildirim merkezi
- Mesajlasma
- PDF gelisim raporu

## Supabase guncelleme
Mevcut v0.3.2 veritabani icin SADECE:

`supabase/migrations/007_platform_v04.sql`

SQL Editor'da bir kez calistirilir. Ayrintilar: `SUPABASE_SETUP_v0.4.md`.

## GitHub Secrets
Repository -> Settings -> Secrets and variables -> Actions:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Build
GitHub -> Actions -> Android APK -> Run workflow.

Basarili build sonunda `DersTakipPlus-Release-APK` artifact'indan `app-release.apk` indirilir.

## Oturum kaliciligi notu
Uygulama normal kapat/ac islemlerinde Supabase session bilgisini cihazda tutar. `Cikis yap` oturumu sonlandirir. Android'de uygulamayi tamamen kaldirmak yerel uygulama verisini silecegi icin yeniden giris gerekir.

## Test
`TEST_CHECKLIST_v0.4.md` dosyasini kullan.

## Siradaki adaylar
- Tam Dark Mode tema refaktoru
- Ayri Cop Kutusu ekrani
- Firebase/FCM ile uygulama kapaliyken gercek push bildirim
- Gelismis takvim / surukle-birak
- Daha gelismis veli raporlari
