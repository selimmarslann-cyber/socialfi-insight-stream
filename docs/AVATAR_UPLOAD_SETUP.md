# Avatar Upload Setup Guide

## 🔴 Sorun: Avatar Yükleme Hatası

Avatar yükleme sırasında hata alıyorsanız, aşağıdaki adımları kontrol edin.

## ✅ Supabase Storage Bucket Kurulumu

### 1. Storage Bucket Oluştur

1. **Supabase Dashboard** → **Storage** → **Buckets**
2. **New bucket** butonuna tıklayın
3. **Bucket name:** `avatars` (tam olarak bu isim olmalı)
4. **Public bucket:** ✅ **Aktif** (önemli!)
5. **File size limit:** 2MB (veya istediğiniz limit)
6. **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/gif`
7. **Create bucket** butonuna tıklayın

### 2. Storage Policies (RLS) Kontrolü

Supabase Dashboard → **Storage** → **Policies** → `avatars` bucket'ı seçin

**Gerekli Politikalar:**

#### A. Public Read Policy
```sql
-- Herkes avatar'ları okuyabilir
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

#### B. Authenticated Upload Policy
```sql
-- Sadece authenticated kullanıcılar yükleyebilir
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);
```

#### C. Users can update own avatars
```sql
-- Kullanıcılar kendi avatar'larını güncelleyebilir
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### D. Users can delete own avatars
```sql
-- Kullanıcılar kendi avatar'larını silebilir
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Not:** Wallet-based authentication kullanıyorsanız, RLS politikalarını wallet address'e göre ayarlamanız gerekebilir.

### 3. Alternatif: Basit Public Policy (Wallet-based için)

Eğer wallet-based authentication kullanıyorsanız ve RLS'yi basit tutmak istiyorsanız:

```sql
-- Public read
CREATE POLICY "Public Avatar Read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Public upload (herkes yükleyebilir - güvenlik için wallet kontrolü frontend'de)
CREATE POLICY "Public Avatar Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- Public update
CREATE POLICY "Public Avatar Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

-- Public delete
CREATE POLICY "Public Avatar Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');
```

## 🔍 Sorun Giderme

### Hata: "Storage bucket 'avatars' does not exist"
**Çözüm:** Supabase Dashboard → Storage → Buckets → `avatars` bucket'ını oluşturun.

### Hata: "new row violates row-level security"
**Çözüm:** Storage policies'leri yukarıdaki gibi ayarlayın.

### Hata: "File size too large"
**Çözüm:** 
- Dosya boyutu 2MB'dan küçük olmalı
- Veya `src/lib/profile.ts` dosyasındaki `maxSize` değerini artırın

### Hata: "Invalid file type"
**Çözüm:** 
- Sadece şu formatlar desteklenir: JPG, PNG, WebP, GIF
- Dosyayı bu formatlardan birine dönüştürün

### Avatar yüklendi ama görünmüyor
**Çözüm:**
1. Bucket'ın **public** olduğundan emin olun
2. Public URL'in doğru oluşturulduğunu kontrol edin
3. Browser console'da CORS hatası var mı kontrol edin

## 📝 Test Adımları

1. ✅ Supabase Dashboard → Storage → Buckets → `avatars` bucket var mı?
2. ✅ Bucket **public** mi?
3. ✅ Storage policies doğru mu?
4. ✅ 2MB'dan küçük bir JPG/PNG dosyası yüklemeyi deneyin
5. ✅ Browser console'da hata var mı kontrol edin
6. ✅ Network tab'ında upload isteği başarılı mı kontrol edin

## 🚀 Hızlı Kurulum (SQL)

Supabase Dashboard → SQL Editor'de çalıştırın:

```sql
-- Bucket oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Public read policy
DROP POLICY IF EXISTS "Public Avatar Read" ON storage.objects;
CREATE POLICY "Public Avatar Read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Public upload policy
DROP POLICY IF EXISTS "Public Avatar Upload" ON storage.objects;
CREATE POLICY "Public Avatar Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- Public update policy
DROP POLICY IF EXISTS "Public Avatar Update" ON storage.objects;
CREATE POLICY "Public Avatar Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

-- Public delete policy
DROP POLICY IF EXISTS "Public Avatar Delete" ON storage.objects;
CREATE POLICY "Public Avatar Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');
```

## 📚 İlgili Dosyalar

- `src/lib/profile.ts` - `uploadAvatar()` fonksiyonu
- `src/components/profile/ProfileEditDialog.tsx` - Avatar yükleme UI

