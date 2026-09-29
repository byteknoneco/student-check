# DersTakip+ v0.3 - Supabase Kurulumu

> Mevcut projenizde `schema.sql`, `002_core_features.sql` ve `003_student_create_rpc.sql` zaten calistiysa bunlari tekrar calistirmayin.

## A. Veritabani migration

1. Supabase Dashboard -> SQL Editor -> New query.
2. `supabase/migrations/004_platform_v03.sql` dosyasinin TAMAMINI kopyalayin.
3. Run'a basin.
4. Sonuc `Success` olmali.

Migration su yapilari ekler/gunceller:
- notifications
- push_tokens
- topic_progress
- study_goals
- messages
- ders performans alanlari
- odev geri bildirim ve zaman alanlari
- sinav analiz alanlari
- tekrarli ders / iptal / erteleme RPC'leri
- otomatik bildirim trigger'lari

## B. Edge Function - delete-account

Bu fonksiyon Profil -> Hesabimi kalici olarak sil islemi icin gereklidir.

Supabase Dashboard -> Edge Functions -> Deploy a new function -> Via Editor:
- Function name: `delete-account`
- `supabase/functions/delete-account/index.ts` icerigini yapistirin.
- Deploy edin.

JWT dogrulamasi acik kalabilir. Uygulama kullanicinin mevcut Authorization token'i ile cagirir.

## C. Edge Function - send-push

Arka planda push bildirimi kullanmak istiyorsaniz:

Supabase Dashboard -> Edge Functions -> Deploy a new function -> Via Editor:
- Function name: `send-push`
- `supabase/functions/send-push/index.ts` icerigini yapistirin.
- Deploy edin.

## D. Database Webhook - notifications -> send-push

Supabase Dashboard -> Database Webhooks:
1. Create webhook.
2. Table: `public.notifications`
3. Event: `INSERT`
4. Target: Supabase Edge Function
5. Function: `send-push`
6. Method: POST
7. Auth header/service key secenegi varsa etkinlestirin.
8. Kaydedin.

Bu webhook, veritabanina yeni notification geldiginde push Edge Function'ini tetikler.

## E. Bildirimlerin iki seviyesi

### Seviye 1 - hemen calisir
`004_platform_v03.sql` + yeni APK yeterlidir:
- Uygulama ici Bildirim Merkezi
- Okunmamis bildirim sayaci
- Uygulama acikken realtime bildirim ve lokal banner

### Seviye 2 - uygulama kapaliyken push
Ek olarak sunlar gerekir:
- Expo project ID
- Android Firebase/FCM yapilandirmasi
- `google-services.json`
- GitHub Secrets'ta ilgili degerler
- `send-push` Edge Function + Database Webhook

## F. Kontrol sorgulari

Tablolari kontrol etmek icin:

```sql
select table_name
from information_schema.tables
where table_schema='public'
  and table_name in ('notifications','push_tokens','topic_progress','study_goals','messages')
order by table_name;
```

Fonksiyonlari kontrol etmek icin:

```sql
select routine_name
from information_schema.routines
where routine_schema='public'
  and routine_name in (
    'create_recurring_lessons',
    'cancel_lesson',
    'reschedule_lesson',
    'complete_lesson_v03',
    'review_homework',
    'update_study_goal'
  )
order by routine_name;
```
