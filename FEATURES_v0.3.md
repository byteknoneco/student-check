# DersTakip+ v0.3 - Buyuk Gelistirme Paketi

Bu surum, uygulamayi sadece kayit tutan bir panelden ogretmen-ogrenci-veli arasinda calisan bir ozel ders yonetim platformuna tasir.

## Yeni ve gelistirilen fonksiyonlar

- Kalici davet kodu sonucu: kod modal kapanana kadar ekranda kalir; kopyalama ve paylasma vardir.
- Uygulama ici bildirim merkezi ve okunmamis bildirim sayaci.
- Odev, ders, sinav, paket, odeme ve mesaj olaylarinda otomatik bildirim kaydi.
- Expo Notifications tabanli cihaz push-token kaydi.
- Opsiyonel Firebase/Expo altyapisiyla uygulama kapaliyken Android push bildirimi.
- Tek seferlik ve 1-52 hafta arasi tekrarlayan ders planlama.
- Ders iptal etme ve erteleme.
- Ders sonu raporunda 1-5 puan: derse hazirlik, katilim, konu hakimiyeti, odev performansi.
- Ders tamamlandiginda uygun paket ders sayisinin otomatik dusmesi.
- Odev akisi: Atandi -> Gonderildi -> Degerlendirildi.
- Ogretmen odev geri bildirimi.
- Sinav analizinde puan, maksimum puan, dogru, yanlis, bos ve not.
- Konu bazli gelisim haritasi (%0-%100).
- Calisma hedefleri ve ilerleme takibi.
- Gelismis Dikkat Merkezi: geciken odev, raporu eksik ders, azalan paket, 30 gundur sinav sonucu olmayan ogrenci ve dusen son-3-sinav trendi.
- Ogrenci Merkezi: tek ekranda ders, odev, performans, paket, konu gelisimi, hedef ve sinav ozeti.
- PDF ogrenci/veli gelisim raporu olusturma ve paylasma.
- Ogretmen-veli/ogrenci odakli uygulama ici mesajlasma.
- Veli birden fazla cocuga bagliysa cocuk secimi.
- Sifremi unuttum akisi.
- Hesabi kalici silme icin Supabase Edge Function altyapisi.
- Yeni DersTakip+ uygulama ikonu, adaptive icon, notification icon ve splash ekrani.
- GitHub Actions'ta opsiyonel Firebase google-services.json kurulumu.

## Bilincli olarak sonraki faza birakilanlar

- Odev icine fotograf/PDF dosyasi yukleme (Supabase Storage)
- Ayrintili gelir-gider muhasebesi
- Google Play AAB/release signing pipeline
- iOS yayin pipeline'i
- Ayrintili bildirim tercihleri (bildirim turu bazinda ac/kapat)
- Otomatik AI ders ozeti / analiz
