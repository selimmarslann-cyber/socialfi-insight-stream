# 🔧 Supabase SQL Hata Düzeltmesi

## ❌ Hata
```
ERROR: 42703: column "author_id" does not exist
```

## ✅ Çözüm

SQL dosyasına `contributes` tablosu eksikti. Şimdi eklendi.

### Yapılacaklar:

1. **Güncellenmiş SQL dosyasını kullan:**
   - Dosya: `supabase/00_full_schema_and_policies.sql`
   - Bu dosya artık `contributes` tablosunu içeriyor

2. **Supabase SQL Editor'da:**
   - Eski hatalı SQL'i sil
   - Yeni SQL dosyasını kopyala-yapıştır
   - Run'a tıkla

3. **Eğer hala hata alırsan:**
   - Supabase Dashboard → Table Editor
   - `contributes` tablosu var mı kontrol et
   - Varsa, tabloyu sil ve SQL'i tekrar çalıştır

## 📋 Eklenen Tablo: `contributes`

```sql
create table if not exists public.contributes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  author text not null,  -- ⚠️ author_id DEĞİL, author (text)
  tags text[],
  category text default 'trading',
  cover_image text,
  pool_enabled boolean not null default false,
  contract_post_id bigint,
  weekly_score integer not null default 0,
  weekly_volume_nop numeric(38,18) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## ✅ Kontrol

SQL çalıştırdıktan sonra:
- `contributes` tablosu oluşmalı
- `pool_positions` tablosu oluşmalı
- Hata mesajı olmamalı

