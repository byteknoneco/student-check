# DersTakip+ v0.2

Özel ders öğretmeni, öğrenci ve veliyi aynı Supabase veritabanında buluşturan React Native / Expo uygulaması.

## v0.2 ile çalışan temel akışlar

### Öğretmen
- Öğrenci ekleme
- Ders planlama
- Ders sonu raporu: katılım + konu + öğretmen notu
- Katılım varsa aktif paketten otomatik 1 ders düşme
- Ödev verme
- Öğrencinin gönderdiği ödevi değerlendirme
- Sınav sonucu ekleme
- Ödeme kaydı ekleme
- Ders paketi tanımlama
- Veli veya öğrenci için tek kullanımlık davet kodu üretme
- Dikkat Merkezi: raporu bekleyen geçmiş dersler, geciken ödevler, azalan paketler
- Dashboard'da aylık tahsilat
- Pull-to-refresh / manuel yenileme

### Öğrenci
- Dersleri ve takvimi görme
- Ödevleri görme
- Ödevi “Gönderildi” olarak işaretleme
- Sınav ve gelişim bilgilerini görme
- Davet kodu ile kendi öğrenci kaydına bağlanma

### Veli
- Bağlı öğrencinin ders, ödev, sınav, paket ve öğretmen notlarını görme
- Davet kodu ile çocuğa bağlanma

## Supabase kurulumu

Yeni bir proje kuruyorsan `supabase/schema.sql` dosyasını SQL Editor'da çalıştır.

Mevcut v0.1 veritabanını v0.2'ye yükseltiyorsan yalnızca:

```text
supabase/migrations/002_core_features.sql
```

dosyasını SQL Editor'da çalıştır. Bu migration iki güvenli RPC ekler:

- `complete_lesson(...)`
- `submit_homework(...)`

`complete_lesson` aynı dersi ikinci kez kaydettiğinde paketten tekrar ders düşmez.

## GitHub Secrets

Repo -> Settings -> Secrets and variables -> Actions -> Repository secrets

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Workflow bu değerlerden biri yoksa build'i durdurur; demo APK üretmez.

## APK build

```text
Actions -> Android APK -> Run workflow
```

Başarılı build sonunda:

```text
Artifacts -> DersTakipPlus-Release-APK -> app-release.apk
```

## Güncelleme sırası

1. Supabase SQL Editor'da `supabase/migrations/002_core_features.sql` çalıştır.
2. GitHub repo dosyalarını v0.2 ile güncelle.
3. GitHub Actions'tan yeni Release APK build et.
4. Eski APK'nın üzerine kur veya temiz test için kaldırıp yeniden kur.
5. Öğretmen hesabıyla giriş yap.
6. İlk öğrenci -> paket -> ders -> ders sonu raporu -> ödev -> sınav -> ödeme -> davet kodu akışını test et.

## Güvenlik

- Mobil uygulama yalnızca Supabase Publishable Key kullanır.
- `service_role` / secret key APK'ya konmaz.
- Veriler RLS ile sınırlandırılır.
- Öğrenci yalnızca kendisine bağlı ödevi `submit_homework` RPC üzerinden gönderebilir.
- Ders paketi tüketimi `complete_lesson` RPC içinde sunucu tarafında yapılır.
