# 🔄 Supabase SQL Reset & Yeniden Kurulum Rehberi

## ❌ Sorun
Supabase'de eski SQL'leri silemiyorsunuz ve yeni SQL'i ekleyemiyorsunuz.

## ✅ Çözüm: 3 Yöntem

---

## 🎯 YÖNTEM 1: SQL Editor ile Temizleme (ÖNERİLEN)

### Adım 1: Tüm Tabloları Sil

Supabase SQL Editor'da şu SQL'i çalıştırın:

```sql
-- Tüm public tablolarını sil
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
```

### Adım 2: Tüm Fonksiyonları Sil

```sql
-- Tüm public fonksiyonlarını sil
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
    END LOOP;
END $$;
```

### Adım 3: Yeni Schema'yı Yükle

1. `supabase/00_full_schema_and_policies.sql` dosyasını açın
2. Tüm içeriği kopyalayın
3. Supabase SQL Editor'a yapıştırın
4. **Run** butonuna tıklayın

---

## 🎯 YÖNTEM 2: Reset Script Kullanma

### Adım 1: Reset Script'i Çalıştır

1. `supabase/01_reset_and_recreate.sql` dosyasını açın
2. İçeriği Supabase SQL Editor'a yapıştırın
3. **Run** butonuna tıklayın

### Adım 2: Ana Schema'yı Yükle

1. `supabase/00_full_schema_and_policies.sql` dosyasını açın
2. İçeriği Supabase SQL Editor'a yapıştırın
3. **Run** butonuna tıklayın

---

## 🎯 YÖNTEM 3: Supabase Dashboard'dan Manuel Silme

### Adım 1: Table Editor'dan Silme

1. Supabase Dashboard → **Table Editor**
2. Her tabloyu tek tek:
   - Tabloya tıklayın
   - Sağ üstte **"..."** menüsüne tıklayın
   - **"Delete table"** seçeneğini seçin
   - Onaylayın

### Adım 2: SQL Editor'dan Kalanları Temizle

```sql
-- Kalan trigger'ları sil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_timestamp_profiles ON public.profiles;
-- ... (diğer trigger'lar)
```

### Adım 3: Yeni Schema'yı Yükle

`supabase/00_full_schema_and_policies.sql` dosyasını çalıştırın.

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Veri Kaybı:** Bu işlemler TÜM VERİLERİ SİLER!
2. **Production:** Production ortamında kullanmayın!
3. **Backup:** Önce verilerinizi yedekleyin (eğer önemliyse)

---

## 🔍 Sorun Giderme

### Problem: "Table is being used by another process"

**Çözüm:**
```sql
-- Tüm aktif bağlantıları kes
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid <> pg_backend_pid();
```

Sonra tekrar silme işlemini deneyin.

### Problem: "Cannot drop table because other objects depend on it"

**Çözüm:**
`CASCADE` kullanın:
```sql
DROP TABLE IF EXISTS public.tablo_adi CASCADE;
```

### Problem: "Permission denied"

**Çözüm:**
- Supabase Dashboard'da doğru projede olduğunuzdan emin olun
- Service role key kullanıyorsanız, anon key ile deneyin

---

## ✅ Başarı Kontrolü

SQL çalıştırdıktan sonra:

1. **Table Editor** → Tablolar listesini kontrol edin
2. Şu tablolar olmalı:
   - ✅ `profiles`
   - ✅ `contributes`
   - ✅ `pool_positions`
   - ✅ `creator_earnings`
   - ✅ `follows`
   - ✅ `notifications`
   - Ve diğerleri...

3. **SQL Editor** → Hata mesajı olmamalı

---

## 📝 Hızlı Komutlar

### Tümünü Tek Seferde Sil:

```sql
-- ⚠️ DİKKAT: TÜM VERİLER SİLİNİR!
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Tabloları sil
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Fonksiyonları sil
    FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
    END LOOP;
END $$;
```

Bu komutu çalıştırdıktan sonra `00_full_schema_and_policies.sql` dosyasını çalıştırın.

---

## 🎉 Tamamlandı!

Artık temiz bir Supabase database'iniz var ve yeni schema başarıyla yüklendi!

