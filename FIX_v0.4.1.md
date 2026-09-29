# DersTakip+ v0.4.1 - Mesaj Merkezi loop düzeltmesi

## Sorun
Mesajlar açıldığında ekran sürekli tam sayfa veri yenilemesine geçiyor ve Mesaj Merkezi her yenilemede yeniden mount oluyordu. Mount sırasında `mark_student_messages_read()` tekrar çağrıldığı için döngü devam ediyordu.

## Düzeltme
- Arka plandaki veri yenilemeleri artık açık modalı unmount etmiyor.
- Mesaj okundu RPC'si mevcut read receipt satırlarını tekrar update etmiyor.
- Mesaj ekranı sadece yeni bir okundu kaydı oluştuysa dashboard verisini bir kez yeniliyor.

## Supabase
Sadece `008_message_center_loop_fix.sql` çalıştırılır. Önceki migration'lar tekrar çalıştırılmaz.

## GitHub
Şu dosyaları güncelle:
- `App.tsx`
- `src/screens/MessageCenter.tsx`
- `package.json`
- `app.json`
- `supabase/migrations/008_message_center_loop_fix.sql`

Sonra Android APK workflow'unu çalıştır.
