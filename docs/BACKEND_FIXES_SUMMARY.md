# Backend Sorunları ve Çözümler

## 🔴 Tespit Edilen Sorunlar

### 1. **Katkılar Kayboluyor / Görünmüyor**
**Sorun:** `/api/contributes` endpoint'i eksikti. Frontend'den katkı oluşturulduğunda backend'de kaydedilmiyordu.

**Çözüm:** ✅ `api/contributes.ts` endpoint'i oluşturuldu.

### 2. **Yeni Kullanıcılar Görünmüyor**
**Sorun:** Wallet ile giriş yapan kullanıcılar `social_profiles` tablosuna kaydedilmiyor olabilir.

**Çözüm:** ✅ `getOrCreateCurrentProfile()` fonksiyonu mevcut ve çalışıyor. Supabase trigger'ı (`handle_new_user`) kontrol edilmeli.

### 3. **Sayfa Yenilenince Kayboluyor**
**Sorun:** Veriler Supabase'e kaydedilmediği için sayfa yenilenince kayboluyordu.

**Çözüm:** ✅ API endpoint'i eklendi, artık veriler Supabase'e kaydedilecek.

## ✅ Yapılan Düzeltmeler

### 1. API Endpoint Eklendi
**Dosya:** `api/contributes.ts`

**Özellikler:**
- `GET /api/contributes` - Tüm katkıları listele
- `POST /api/contributes` - Yeni katkı oluştur
- `GET /api/contributes/:id` - Tekil katkı getir
- CORS desteği
- Supabase entegrasyonu
- Hata yönetimi

### 2. Vercel Environment Variables Dokümantasyonu
**Dosya:** `docs/VERCEL_ENV_SETUP.md`

**Gerekli Environment Variables:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📋 Yapılması Gerekenler

### 1. Vercel Environment Variables Ekle

1. **Vercel Dashboard** → Projeniz → **Settings** → **Environment Variables**
2. Aşağıdaki değişkenleri ekleyin:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Environment:** Production, Preview, Development (hepsini seçin)
4. **Save** → **Redeploy**

### 2. Supabase Kontrolleri

#### A. Contributes Tablosu Kontrolü
Supabase Dashboard → SQL Editor'de çalıştırın:

```sql
-- Contributes tablosu var mı?
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'contributes';

-- RLS politikaları aktif mi?
SELECT * FROM pg_policies WHERE tablename = 'contributes';
```

#### B. Social Profiles Tablosu Kontrolü
```sql
-- Social profiles tablosu var mı?
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'social_profiles';

-- Yeni kullanıcı trigger'ı çalışıyor mu?
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

#### C. RLS Politikaları Kontrolü
```sql
-- Contributes için public read/write var mı?
SELECT * FROM pg_policies 
WHERE tablename = 'contributes' 
AND policyname LIKE '%public%';
```

### 3. Test Adımları

1. **Katkı Oluşturma Testi:**
   - Wallet bağla
   - "Create Contribute" butonuna tıkla
   - Formu doldur ve gönder
   - Supabase Dashboard → Table Editor → `contributes` tablosunda görünmeli

2. **Kullanıcı Kayıt Testi:**
   - Yeni bir wallet ile giriş yap
   - Supabase Dashboard → Table Editor → `social_profiles` tablosunda görünmeli

3. **Sayfa Yenileme Testi:**
   - Katkı oluştur
   - Sayfayı yenile (F5)
   - Katkı hala görünmeli

## 🔍 Sorun Giderme

### Katkılar hala görünmüyor
1. ✅ Vercel Functions log'larını kontrol edin
2. ✅ Browser Console'da hata var mı kontrol edin
3. ✅ Network tab'ında `/api/contributes` isteği başarılı mı kontrol edin
4. ✅ Supabase'de `contributes` tablosunda veri var mı kontrol edin

### API 500 hatası alıyorum
1. ✅ `SUPABASE_SERVICE_ROLE_KEY` doğru mu kontrol edin
2. ✅ Vercel'de environment variables doğru mu kontrol edin
3. ✅ Vercel Functions log'larını kontrol edin

### Yeni kullanıcılar görünmüyor
1. ✅ `social_profiles` tablosunda veri var mı kontrol edin
2. ✅ `handle_new_user()` trigger'ı çalışıyor mu kontrol edin
3. ✅ RLS politikaları doğru mu kontrol edin

## 📚 İlgili Dosyalar

- `api/contributes.ts` - Yeni API endpoint
- `docs/VERCEL_ENV_SETUP.md` - Vercel environment variables rehberi
- `supabase/00_full_schema_and_policies.sql` - Supabase schema

## 🚀 Sonraki Adımlar

1. ✅ Vercel environment variables ekle
2. ✅ Redeploy yap
3. ✅ Test et
4. ✅ Sorun devam ederse Vercel Functions log'larını kontrol et

