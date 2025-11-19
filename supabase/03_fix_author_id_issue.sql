-- =====================================================================
--  FIX: author_id kolonu hatası
--  Bu script'i ÖNCE çalıştırın, sonra 00_full_schema_and_policies.sql'i çalıştırın
-- =====================================================================

-- Mevcut contributes tablosunda author_id varsa, author'a dönüştür veya sil
DO $$ 
BEGIN
  -- contributes tablosu var mı kontrol et
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'contributes'
  ) THEN
    -- author_id kolonu varsa
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
        ALTER TABLE public.contributes 
          ADD COLUMN author text;
        
        -- author_id'den author'a veri kopyala
        UPDATE public.contributes 
        SET author = author_id::text 
        WHERE author IS NULL;
      END IF;
      
      -- author_id kolonunu sil (CASCADE ile bağımlılıklar da silinir)
      ALTER TABLE public.contributes 
        DROP COLUMN IF EXISTS author_id CASCADE;
    END IF;
  END IF;
END $$;

-- Pool positions tablosunda da author_id referansı varsa düzelt
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'pool_positions'
  ) THEN
    -- author_id kolonu varsa sil
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'pool_positions' 
        AND column_name = 'author_id'
    ) THEN
      ALTER TABLE public.pool_positions 
        DROP COLUMN IF EXISTS author_id CASCADE;
    END IF;
  END IF;
END $$;

-- Index'leri temizle (author_id ile ilgili)
DROP INDEX IF EXISTS idx_contributes_author_id;
DROP INDEX IF EXISTS public.idx_contributes_author_id;

-- Policy'leri temizle (author_id kullanan)
DROP POLICY IF EXISTS "contributes_insert_own" ON public.contributes;
DROP POLICY IF EXISTS "contributes_update_own" ON public.contributes;
DROP POLICY IF EXISTS "contributes_delete_own" ON public.contributes;

-- ✅ Tamamlandı! Şimdi 00_full_schema_and_policies.sql dosyasını çalıştırın

