# DersTakip+ v0.2 - GitHub Güncelleme Sırası

## 1) Önce Supabase migration
Supabase -> SQL Editor -> New query

Şu dosyanın tamamını çalıştır:

`supabase/migrations/002_core_features.sql`

Başarılı olursa `Success. No rows returned` benzeri bir sonuç görürsün.

## 2) GitHub'da değiştirilecek dosyalar
Aşağıdaki dosyaları v0.2 paketindeki sürümlerle değiştir:

- `App.tsx`
- `app.json`
- `package.json`
- `README.md`
- `.github/workflows/android-apk.yml`
- `src/components/AppShell.tsx`
- `src/data/mock.ts`
- `src/lib/supabase.ts`
- `src/screens/FamilyDashboard.tsx`
- `src/screens/InviteScreen.tsx`
- `src/screens/ListScreens.tsx`
- `src/screens/TeacherDashboard.tsx`
- `src/services/appData.ts`
- `src/types.ts`
- `supabase/schema.sql`

Yeni eklenecek dosyalar:

- `src/screens/TeacherActionModal.tsx`
- `supabase/migrations/002_core_features.sql`

## 3) GitHub Secrets değişmiyor
Aşağıdakiler mevcut kalmalı:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## 4) Build
GitHub -> Actions -> Android APK -> Run workflow

Beklenen artifact:

`DersTakipPlus-Release-APK/app-release.apk`

## 5) İlk fonksiyon testi
Öğretmen hesabıyla sırayla:

1. Öğrenci ekle
2. Ders paketi tanımla (örn. 8 ders)
3. Ders planla
4. Takvimden derse dokun -> ders sonu raporunu kaydet
5. Paketin 8 -> 7 olduğunu kontrol et
6. Ödev ver
7. Sınav sonucu ekle
8. Ödeme kaydı ekle
9. Veli davet kodu üret
10. İkinci telefonda veli hesabı aç -> kodu gir -> aynı öğrenciyi gör

## 6) Öğrenci testi
Öğrenci davet kodu üret -> öğrenci hesabı ile kodu kullan -> Ödevler -> bekleyen ödeve dokun -> “Gönderildi” yap.

Öğretmen hesabına dön -> aynı ödeve dokun -> “Tamamlandı” yap.
