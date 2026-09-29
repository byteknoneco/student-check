# GitHub - v0.4 Guncelleme Checklist

## 1. Supabase'i once guncelle
APK'yi build etmeden once `007_platform_v04.sql` Supabase SQL Editor'da basariyla calismis olmali.

## 2. Guncellenecek dosyalar
Repo kokune update paketinin icerigini yukle. Mevcut dosyalarin uzerine yaz.

Degisen / yeni ana dosyalar:
- `App.tsx`
- `app.json`
- `package.json`
- `src/types.ts`
- `src/data/mock.ts`
- `src/components/AppShell.tsx`
- `src/screens/AuthScreen.tsx`
- `src/screens/GlobalSearch.tsx` (YENI)
- `src/screens/ListScreens.tsx`
- `src/screens/MessageCenter.tsx`
- `src/screens/NotificationCenter.tsx`
- `src/screens/StudentDetailScreen.tsx`
- `src/screens/TeacherActionModal.tsx`
- `src/screens/TeacherDashboard.tsx`
- `src/services/appData.ts`
- `src/services/profile.ts` (YENI)
- `supabase/migrations/007_platform_v04.sql` (YENI)

## 3. Secrets
Degisiklik yok:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## 4. Commit
Ornek mesaj:
`DersTakip+ v0.4 daily-use upgrade`

## 5. Build
GitHub -> Actions -> Android APK -> Run workflow.

Beklenen asamalar:
- Verify Supabase configuration
- Setup Node.js
- Setup Java
- Setup Android SDK
- Install dependencies
- Type check
- Generate Android project
- Build standalone release APK
- Upload release APK

## 6. APK
Artifact icinden `app-release.apk` dosyasini indir.

Oturum kaliciligi testinde uygulamayi KALDIRMADAN yeni APK'yi mevcut kurulumun ustune guncellemek veya uygulamayi normal kapat/ac yapmak gerekir. Uygulamayi uninstall etmek Android uygulama verilerini ve yerel Supabase session bilgisini siler.
