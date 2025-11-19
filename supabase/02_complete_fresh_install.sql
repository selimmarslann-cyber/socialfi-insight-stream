-- =====================================================================
--  NOP Intelligence Layer - COMPLETE FRESH INSTALL
--  Bu dosya TÜM SİSTEMİ sıfırdan kurar
--  ⚠️ DİKKAT: TÜM VERİLER SİLİNİR!
-- =====================================================================

-- Önce reset script'ini çalıştırın, sonra bu dosyayı çalıştırın
-- VEYA direkt bu dosyayı çalıştırın (içinde reset de var)

-- =====================================================================
-- STEP 1: TEMİZLEME
-- =====================================================================

-- Tüm tabloları sil (CASCADE ile bağımlılıklar da silinir)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Tüm fonksiyonları sil
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
    END LOOP;
END $$;

-- =====================================================================
-- STEP 2: EXTENSIONS
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- STEP 3: ANA SCHEMA (00_full_schema_and_policies.sql içeriği)
-- =====================================================================

-- Buraya 00_full_schema_and_policies.sql dosyasının TAM İÇERİĞİNİ yapıştırın
-- VEYA iki dosyayı sırayla çalıştırın:
-- 1. Önce 01_reset_and_recreate.sql
-- 2. Sonra 00_full_schema_and_policies.sql

