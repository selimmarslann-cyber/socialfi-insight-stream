# 🔧 author_id Hatası - Hızlı Çözüm

## ❌ Hata
```
ERROR: 42703: column "author_id" does not exist
```

## ✅ ÇÖZÜM (2 ADIM)

### ADIM 1: Önce Bu Script'i Çalıştırın

Supabase SQL Editor'da şu SQL'i çalıştırın:

```sql
-- author_id kolonunu temizle
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'contributes'
  ) THEN
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'contributes' 
        AND column_name = 'author_id'
    ) THEN
      -- author kolonu yoksa oluştur
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'contributes' 
          AND column_name = 'author'
      ) THEN
        ALTER TABLE public.contributes ADD COLUMN author text;
        UPDATE public.contributes SET author = author_id::text WHERE author IS NULL;
      END IF;
      
      -- author_id'yi sil
      ALTER TABLE public.contributes DROP COLUMN IF EXISTS author_id CASCADE;
    END IF;
  END IF;
END $$;

-- Index ve policy'leri temizle
DROP INDEX IF EXISTS idx_contributes_author_id;
DROP POLICY IF EXISTS "contributes_insert_own" ON public.contributes;
DROP POLICY IF EXISTS "contributes_update_own" ON public.contributes;
DROP POLICY IF EXISTS "contributes_delete_own" ON public.contributes;
```

### ADIM 2: Ana Schema'yı Çalıştırın

1. `supabase/00_full_schema_and_policies.sql` dosyasını açın
2. Tüm içeriği kopyalayın
3. Supabase SQL Editor'a yapıştırın
4. **Run** butonuna tıklayın

---

## 🎯 VEYA TEK SEFERDE (ÖNERİLEN)

`supabase/03_fix_author_id_issue.sql` dosyasını önce çalıştırın, sonra `00_full_schema_and_policies.sql` dosyasını çalıştırın.

---

## ✅ Kontrol

SQL çalıştırdıktan sonra test edin:

```sql
-- Bu query çalışmalı (hata vermemeli)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'contributes'
  AND column_name IN ('author', 'author_id');
```

Sadece `author` kolonu görünmeli, `author_id` görünmemeli.

