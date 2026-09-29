# DersTakip+ v0.4 - Gunluk Kullanim Surumu

v0.4, yeni temel moduller eklemekten cok uygulamanin her gun rahat ve guvenli kullanilmasina odaklanir.

## Oturum ve hesap
- Supabase oturumu cihazdaki AsyncStorage icinde kalici tutulur.
- Uygulama normal sekilde kapatilip yeniden acildiginda oturum geri yuklenir.
- Giris ekrani, Supabase session kontrolu tamamlanmadan gosterilmez.
- Kullanici Cikis Yap derse oturum silinir.
- Uygulama kaldirilip tekrar kurulursa Android uygulama verileri silinecegi icin yeniden giris gerekir.
- Profil fotografi ekleme/kaldirma desteklenir.
- Avatarlar private `avatars` Storage bucket icinde saklanir.

## Bildirim Merkezi 2.0
- Tek bildirimi silme.
- Silinen tek bildirimi aninda Geri Al.
- Okunan bildirimleri toplu temizleme.
- Tum bildirimleri temizleme.
- Tumunu okundu isaretleme.
- Silme islemleri soft-delete mantigiyla `deleted_at` uzerinden yapilir.
- Bildirim tercihleri:
  - Odevler
  - Dersler
  - Mesajlar
  - Sinav sonuclari
  - Paket / odeme
  - Diger bildirimler
- `notify_user()` artik kullanicinin bildirim tercihlerini dikkate alir.

## Mesajlar 2.0
- Gonderen adi gosterilmeye devam eder.
- Okundu bilgisi / goruldu bilgisi.
- Konusma acildiginda gelen mesajlar okunmus olarak isaretlenir.
- Kendi mesajini ilk 15 dakika icinde duzenleme.
- Kendi mesajini ilk 15 dakika icinde herkesten silme.
- Herkesten silinen mesajda `Bu mesaj silindi.` bilgisi kalir.
- Her mesaji sadece kendi ekranindan gizleme (`Benden sil`).
- Benden sil isleminden hemen sonra Geri Al.
- Duzenlenmis mesajlarda `duzenlendi` etiketi.

## Ogrenci yonetimi
- Aktif / Arsiv sekmeleri.
- Ogrenciyi silmek yerine arsivleme.
- Arsivden tekrar aktif etme.
- Tum eski ders, odev, sinav ve odeme gecmisi korunur.
- Arsivlenen ogrenci yeni ders/odev olusturma listelerinden cikarilir.
- Ogretmene ozel ogrenci notu.
- Bu not veli ve ogrenci tarafinda gosterilmez.

## Akilli Dashboard
- Degerlendirme bekleyen odev sayisi.
- Okunmamis mesaj sayisi.
- Okunmamis bildirim sayisi.
- Raporu kapanmamis gecmis ders sayisi.
- Son hareketler zaman akisi:
  - odev gonderimi/degerlendirmesi
  - tamamlanan ders
  - sinav sonucu
  - odeme
- Dikkat Merkezi aktif ogrencileri esas alir.

## Global arama
Tek arama ekranindan:
- ogrenciler
- odevler
- dersler
- sinavlar
- mesajlar
aranabilir.

## Takvim
- Bugun
- 7 gun
- Tumu
filtreleri eklendi.

## Profil ve ayarlar
- Profil fotografi.
- Oturum hatirlama bilgisi.
- Bildirim tercihleri.
- Surum bilgisi: v0.4.
- Cikis Yap ve Hesabi Sil islevleri korunur.

## Bu surumde bilincli olarak ertelenen
- Tam koyu tema (Dark Mode) v0.4.1'e ayrildi. Mevcut UI dosyalarinin tamamini tema sistemine gecirmeden yarim bir koyu mod eklenmedi.
- Ayri bir Cop Kutusu ekrani yok. Bildirimlerde soft-delete + undo, mesajlarda benden sil + undo, ogrencilerde arsiv/geri alma mevcut.
