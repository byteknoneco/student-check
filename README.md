# DersTakip+

Özel ders öğretmeni, öğrenci ve veliyi aynı ortak veritabanında buluşturan React Native / Expo uygulaması.

## Bu sürümde neler var?

- Öğretmen, veli ve öğrenci için ayrı dashboard deneyimi
- Supabase Auth ile e-posta/şifre girişi
- Supabase bağlı değilse otomatik Demo Mod
- Ortak PostgreSQL veritabanı
- Row Level Security (RLS): veli/öğrenci yalnızca bağlı öğrenci kayıtlarını görür
- Davet kodu ile veli/öğrenci eşleştirme altyapısı
- Öğrenci, ders, ödev, sınav, paket ve ödeme tabloları
- GitHub Actions ile her `main` push'unda install edilebilir Android debug APK

## 1. Yerelde çalıştır

Gerekenler: Node.js 22 LTS, npm ve Expo Go.

```bash
npm install
cp .env.example .env
npm start
```

Supabase bilgilerini henüz girmezsen uygulama Demo Modda açılır. Profil ekranından Öğretmen / Veli / Öğrenci görünümünü değiştirebilirsin.

## 2. Supabase kurulumu

1. Supabase'de ücretsiz bir proje oluştur.
2. SQL Editor aç ve `supabase/schema.sql` dosyasının tamamını çalıştır.
3. Project Settings / Connect ekranından Project URL ve Publishable Key değerlerini al.
4. `.env` içine ekle:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
```

> `service_role` anahtarını **asla mobil uygulamaya veya GitHub reposuna koyma**. Uygulama yalnızca publishable key kullanır; erişim güvenliği RLS tarafından sağlanır.

## 3. İlk öğretmen hesabı

Uygulamada `Hesap oluştur` bölümünden rol olarak **Öğretmen** seçebilirsin. `handle_new_user` trigger'ı `profiles` tablosunu otomatik doldurur.

Sonrasında Supabase Table Editor'dan veya ileride ekleyeceğimiz öğretmen UI'sından öğrenci oluşturabilirsin. `supabase/demo_helpers.sql` örnek SQL içerir.

### Veli / öğrenci eşleştirme

Öğretmen `invites` tablosunda `parent` veya `student` hedefli bir kod üretir. Veli/öğrenci kendi hesabını oluşturup kodu uygulamadaki eşleştirme ekranında kullanır. `redeem_invite()` fonksiyonu bağlantıyı sunucu tarafında güvenli şekilde kurar.

## 4. GitHub'a gönder

```bash
git init
git add .
git commit -m "Initial DersTakip+ MVP"
git branch -M main
git remote add origin https://github.com/KULLANICI/REPO.git
git push -u origin main
```

## 5. GitHub Actions'tan APK üret

Repo -> **Settings -> Secrets and variables -> Actions -> New repository secret** alanına şunları ekle:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Ardından **Actions -> Android APK -> Run workflow**.

Build sonunda **Artifacts -> DersTakipPlus-APK** içinden `app-debug.apk` dosyasını indirebilirsin. Debug APK test ve telefonlara kurulum için uygundur. Google Play yayını için daha sonra ayrı imzalı `release` / AAB pipeline kuracağız.

## Mimari

```text
React Native + Expo
       |
       +-- Auth -> Supabase Auth
       +-- Data -> Supabase Postgres
       +-- Security -> RLS policies
       +-- Linking -> Invite code RPC
       |
       +-- GitHub Actions
                |
                +-- Expo prebuild
                +-- Gradle assembleDebug
                +-- APK artifact
```

## Yol haritası

Bir sonraki geliştirme fazı:

- Öğretmen tarafında gerçek Öğrenci Ekle / Ders Ekle / Ödev Ver formları
- Ders sonrası tek ekranda katılım + konu + ödev + öğretmen notu
- Otomatik davet kodu oluşturma / paylaşma
- Push notification
- Mesajlaşma
- Paket / tahsilat raporu
- Sınav gelişim grafikleri ve konu bazlı analiz
- Fotoğraf / PDF ödev yükleme için Supabase Storage
- Play Store için signed AAB pipeline
