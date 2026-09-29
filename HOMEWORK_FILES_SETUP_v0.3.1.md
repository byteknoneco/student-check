# DersTakip+ v0.3.1 - Odev Fotograf / PDF Kurulumu

Bu guncelleme odevlere iki yonlu dosya ekler:

- Ogretmen: odev verirken kamera, galeri veya PDF ekleyebilir.
- Ogretmen: mevcut odeve sonradan materyal ekleyebilir.
- Ogrenci: cozumu kamera, galeri veya PDF ile yukleyebilir.
- Ogretmen: teslim dosyalarini gorup odevi degerlendirebilir.
- Ogretmen: geri bildirime fotograf/PDF ekleyebilir.
- Veli: bagli ogrencinin odev materyali, teslimi ve geri bildirim dosyalarini gorebilir.

## 1. Supabase

`supabase/migrations/005_homework_files.sql` dosyasinin TAMAMINI kopyalayin.

Supabase -> SQL Editor -> New query -> yapistir -> Run.

Bu migration otomatik olarak:

- `homework_files` tablosunu,
- `homework-files` adli PRIVATE Storage bucket'ini,
- tablo RLS kurallarini,
- Storage RLS kurallarini,
- gerekli indexleri

olusturur.

`schema.sql`, `002`, `003` veya `004` migrationlarini tekrar calistirmayin.

## 2. GitHub

Guncelleme paketindeki dosyalari repo kokune yukleyip mevcut dosyalarin uzerine yazin.

Yeni dosyalar:

- `src/services/homeworkFiles.ts`
- `src/components/HomeworkAttachmentPicker.tsx`
- `src/screens/HomeworkDetailModal.tsx`
- `supabase/migrations/005_homework_files.sql`

Degisen ana dosyalar:

- `App.tsx`
- `app.json`
- `package.json`
- `src/types.ts`
- `src/data/mock.ts`
- `src/services/appData.ts`
- `src/screens/ListScreens.tsx`
- `src/screens/TeacherActionModal.tsx`

Yeni GitHub Secret gerekmez.

## 3. Build

GitHub -> Actions -> Android APK -> Run workflow.

`package.json` yeni Expo paketlerini icerdigi icin Actions otomatik olarak sunlari kurar:

- `expo-image-picker`
- `expo-document-picker`
- `expo-file-system`

Yeni APK kamera izni de ister.

## 4. Test akisi

### Ogretmen

1. Odevler -> + Odev ver.
2. Kamera / Galeri / PDF ile materyal ekle.
3. Odev kaydet.
4. Odev satirina dokun ve dosyanin gorundugunu kontrol et.

### Ogrenci

1. Ayni odevi ac.
2. `Cozumunu ekle` alanindan fotograf/PDF sec.
3. `Odevi gonder` de.

### Ogretmen tekrar

1. Odevde `Gonderildi` durumunu gor.
2. Odevi ac, ogrencinin dosyasina dokun.
3. `Odevi degerlendir` de.
4. Istersen geri bildirime fotograf/PDF ekle.

### Veli

Odevi actiginda ogretmen materyali, ogrenci teslimi ve ogretmen geri bildirim dosyalari gorunmelidir.

## Guvenlik

Bucket public degildir. Dosyalar kalici public URL ile paylasilmaz. Uygulama dosya acarken 15 dakikalik signed URL olusturur.

- Ogretmen sadece kendi ogrencisinin odev dosyalarini yukleyebilir.
- Ogrenci sadece kendi kaydina bagli odev icin teslim dosyasi yukleyebilir.
- Veli sadece bagli ogrencinin dosyalarini gorur.
- Dosya basina limit: 10 MB.
- Izin verilen turler: JPEG/JPG, PNG, WEBP, HEIC/HEIF ve PDF.

