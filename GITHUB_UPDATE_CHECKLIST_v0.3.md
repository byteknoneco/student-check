# DersTakip+ v0.3 - GitHub Guncelleme Checklist

## En kolay yontem

`DersTakipPlus_v0.3_GitHub_Update.zip` paketinin icerigini repo kokune kopyalayin ve mevcut dosyalarin uzerine yazin.

## Degisen / yeni ana dosyalar

- `.github/workflows/android-apk.yml`
- `.gitignore`
- `App.tsx`
- `app.json`
- `app.config.js` (YENI)
- `package.json`
- `assets/*` (YENI ikon/splash)
- `src/*` guncel uygulama kaynaklari
- `supabase/migrations/004_platform_v03.sql` (YENI)
- `supabase/functions/send-push/index.ts` (YENI)
- `supabase/functions/delete-account/index.ts` (YENI)

## Mevcut zorunlu GitHub Secrets

Bunlar zaten sizde var ve aynen kalacak:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Opsiyonel push notification Secrets

Arka planda push bildirimini etkinlestirmek icin:
- `EXPO_PUBLIC_EXPO_PROJECT_ID`
- `GOOGLE_SERVICES_JSON_BASE64`

Bu ikisi yoksa build BOZULMAZ. Uygulama ici Bildirim Merkezi calisir; uzak/background push token kurulumu atlanir.

## Firebase JSON'i GitHub Secret'a cevirme (Windows PowerShell)

Firebase'den indirdiginiz `google-services.json` dosyasinin bulundugu klasorde:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("google-services.json"))
```

Cikan tek satirlik uzun metni GitHub -> Settings -> Secrets and variables -> Actions -> New repository secret altinda:

`GOOGLE_SERVICES_JSON_BASE64`

adi ile kaydedin.

## Build

1. Tum dosyalari commit edin.
2. Actions -> Android APK.
3. Run workflow.
4. `Type check` yesil olmali.
5. `Build standalone release APK` yesil olmali.
6. Artifact -> `DersTakipPlus-Release-APK` indirin.
7. `app-release.apk` telefona kurun.

## Test sirasi

1. Ogretmen girisi
2. Ogrenci ekle
3. Konu gelisimi gir
4. Calisma hedefi gir
5. 3 haftalik tekrarli ders olustur
6. Bir dersi ertele, digerini iptal et
7. Dersi tamamla ve 1-5 performans puanlarini gir
8. Odev ver
9. Ogrenci hesabindan odev gonder
10. Ogretmen hesabindan odev degerlendir
11. Sinav sonucu + D/Y/B gir
12. Veli davet kodu olustur; kodun ekranda kaldigini ve Kopyala/Paylas'i test et
13. Veli ile kodu kullan
14. Veli ekraninda gelisim/odev/sinav gor
15. Bildirim Merkezi'ni kontrol et
16. Ogrenci Merkezi -> PDF Rapor -> paylas
17. Mesaj gonder ve diger hesapta gor
