# Supabase - DersTakip+ v0.4 Kurulumu

## Onemli
Mevcut projede `schema.sql`, 002, 003, 004, 005 ve 006 migrationlari daha once calistirildiysa tekrar calistirma.

v0.4 icin sadece:

`supabase/migrations/007_platform_v04.sql`

calistirilacak.

## Adimlar
1. Supabase Dashboard -> SQL Editor -> New query.
2. `007_platform_v04.sql` dosyasinin TAMAMINI kopyala.
3. SQL Editor'a yapistir.
4. Run butonuna bas.
5. `Success` sonucu bekle.

Migration tekrar calistirilabilir sekilde tasarlanmistir, ancak migration gecmisini temiz tutmak icin basarili olduktan sonra yeniden calistirmaya gerek yoktur.

## Migration sonrasinda kontrol
Table Editor altinda sunlar bulunmali:
- `notification_preferences`
- `message_reads`
- `message_hidden_for`

Mevcut tablolarda sunlar eklenmis olmali:
- `notifications.deleted_at`
- `messages.edited_at`
- `messages.deleted_at`
- `students.archived_at`
- `students.private_note`

Storage altinda:
- `avatars`

bucket'i bulunmali ve public OLMAMALI.

## Eklenen RPC fonksiyonlari
- `trash_notification`
- `restore_notification`
- `trash_read_notifications`
- `trash_all_notifications`
- `edit_message`
- `delete_message_everyone`
- `hide_message_for_me`
- `unhide_message_for_me`
- `mark_student_messages_read`
- `set_student_archived`
- `update_student_private_note`

## Bildirim tercihleri
`notify_user()` v0.4'te tekrar tanimlanir ve kullanicinin `notification_preferences` tablosundaki tercihlerini kontrol eder.

## GitHub Secrets
Yeni zorunlu Supabase Secret yoktur. Mevcut iki secret aynen kalir:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Firebase / remote push secrets bu surumun derlenmesi icin zorunlu degildir.
