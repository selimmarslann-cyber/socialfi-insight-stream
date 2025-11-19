# 🧪 TEST HAZIRLIK KONTROLÜ - DETAYLI ANALİZ

**Tarih:** 2025  
**Amaç:** Test öncesi sistem kontrolü - Rezil olmamak için! 😅

---

## ✅ KONTROL EDİLEN ALANLAR

### 1. **Supabase Client Configuration** ✅
**Dosya:** `src/lib/supabaseClient.ts`

**Durum:** ✅ Aktif
- `VITE_SUPABASE_URL` kontrol ediliyor
- `VITE_SUPABASE_ANON_KEY` kontrol ediliyor
- Fallback mekanizması var
- Error handling mevcut

**Kontrol:**
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

**⚠️ DİKKAT:** Environment variables set edilmeli!

---

### 2. **User Registration & Authentication** ✅
**Dosya:** `src/lib/profile.ts`

**Durum:** ✅ Otomatik kayıt sistemi var
- Wallet bağlandığında otomatik profile oluşturuluyor
- `getProfileByWallet()` - Profile yoksa otomatik oluşturuyor
- `insertProfileRow()` - Yeni kullanıcı kaydı

**Flow:**
1. Kullanıcı wallet bağlar
2. `getProfileByWallet()` çağrılır
3. Profile yoksa → `insertProfileRow()` otomatik oluşturur
4. Profile hazır!

**✅ GÜVENLİ:** Otomatik kayıt çalışıyor

---

### 3. **Post/Contribute Creation** ✅
**Dosyalar:**
- `src/lib/social.ts` - `createSocialPost()`
- `src/components/post/PostComposer.tsx`
- `src/components/contribute/CreateContributeDialog.tsx`

**Durum:** ✅ Aktif

**Post Creation Flow:**
1. Kullanıcı post yazar
2. Image upload (Supabase Storage)
3. `createSocialPost()` çağrılır
4. Supabase'e kaydedilir
5. Feed'e eklenir

**Contribute Creation Flow:**
1. Kullanıcı contribute oluşturur
2. Cover image upload (Supabase Storage)
3. API'ye POST request
4. Backend'e kaydedilir

**⚠️ DİKKAT:** 
- API endpoint çalışıyor mu? (`/api/contributes`)
- Supabase Storage bucket'ları oluşturulmuş mu?

---

### 4. **Supabase Storage Buckets** ⚠️
**Dosya:** `src/lib/upload.ts`

**Gerekli Buckets:**
1. `posts` - Post images için
2. `avatars` - Avatar images için (profile.ts'de)

**Kontrol:**
```typescript
supabase.storage.from("posts").upload(...)
supabase.storage.from("avatars").upload(...)
```

**⚠️ KRİTİK:** Bu bucket'lar Supabase'de oluşturulmalı!

---

### 5. **RLS Policies (Row Level Security)** ✅
**Dosya:** `supabase/00_full_schema_and_policies.sql`

**Kontrol Edilen Tablolar:**
- ✅ `social_profiles` - RLS enabled
- ✅ `social_posts` - RLS enabled
- ✅ `contributes` - RLS enabled (eğer tablo varsa)
- ✅ `nop_trades` - RLS enabled
- ✅ `creator_earnings` - RLS enabled
- ✅ `followers` - RLS enabled
- ✅ `notifications` - RLS enabled

**Policies:**
- Public read (çoğu tablo için)
- Own insert/update/delete
- Service role insert (notifications, earnings)

**✅ GÜVENLİ:** RLS policies doğru yapılandırılmış

---

### 6. **Database Tables** ✅
**Kontrol Edilen Tablolar:**

**✅ Mevcut:**
- `social_profiles` - User profiles
- `social_posts` - Posts/contributions
- `nop_trades` - Trade history
- `creator_earnings` - Creator rewards
- `followers` - Follow system
- `notifications` - Notifications
- `reputation_scores` - Alpha scores
- `social_positions` - Trading positions

**⚠️ KONTROL GEREKLİ:**
- `contributes` tablosu var mı? (API'de kullanılıyor)

---

### 7. **API Endpoints** ⚠️
**Gerekli Endpoints:**
- `/api/contributes` - POST (create contribute)
- `/api/contributes` - GET (list contributes)
- `/api/sentiment` - POST (sentiment analysis)

**⚠️ DİKKAT:** Backend API çalışıyor mu?

---

### 8. **Environment Variables** ⚠️
**Gerekli Variables:**

**Frontend (.env):**
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
VITE_API_BASE=/api
```

**Backend (Vercel):**
```
SUPABASE_URL=<supabase-project-url>
SUPABASE_SERVICE_ROLE=<supabase-service-role>
ADMIN_TOKEN=<shared-admin-token>
```

**⚠️ KRİTİK:** Tüm variables set edilmeli!

---

## 🚨 KRİTİK KONTROL LİSTESİ

### ÖNCE BUNLARI KONTROL ET:

1. **✅ Supabase Project Aktif mi?**
   - Dashboard'a git
   - Project status kontrol et

2. **✅ Storage Buckets Oluşturulmuş mu?**
   - Supabase Dashboard → Storage
   - `posts` bucket var mı?
   - `avatars` bucket var mı?
   - Public access enabled mi?

3. **✅ Database Tables Oluşturulmuş mu?**
   - Supabase Dashboard → SQL Editor
   - `00_full_schema_and_policies.sql` çalıştırıldı mı?
   - Tablolar oluşturuldu mu?

4. **✅ RLS Policies Aktif mi?**
   - Supabase Dashboard → Authentication → Policies
   - RLS enabled mi?

5. **✅ Environment Variables Set mi?**
   - Vercel Dashboard → Settings → Environment Variables
   - Tüm variables var mı?

6. **✅ API Endpoints Çalışıyor mu?**
   - `/api/contributes` test et
   - Backend functions deploy edilmiş mi?

---

## 🧪 TEST SENARYOLARI

### Test 1: User Registration
1. Yeni kullanıcı wallet bağlar
2. Profile otomatik oluşur mu? ✅
3. Profile görüntülenebilir mi? ✅

### Test 2: Post Creation
1. Kullanıcı post yazar
2. Image upload çalışıyor mu? ⚠️ (Storage bucket kontrol)
3. Post kaydediliyor mu? ✅
4. Feed'de görünüyor mu? ✅

### Test 3: Contribute Creation
1. Kullanıcı contribute oluşturur
2. Cover image upload çalışıyor mu? ⚠️ (Storage bucket kontrol)
3. API'ye kaydediliyor mu? ⚠️ (API endpoint kontrol)
4. Contributes listesinde görünüyor mu? ✅

### Test 4: Image Upload
1. Post image upload test
2. Avatar upload test
3. Contribute cover image upload test

---

## ⚠️ POTANSİYEL SORUNLAR

### 1. **Storage Buckets Yok**
**Sorun:** Image upload çalışmaz
**Çözüm:** Supabase Dashboard → Storage → Create bucket

### 2. **RLS Policies Yanlış**
**Sorun:** Kullanıcılar post oluşturamaz
**Çözüm:** Policies kontrol et, düzelt

### 3. **API Endpoint Çalışmıyor**
**Sorun:** Contribute oluşturulamaz
**Çözüm:** Backend deploy kontrol, API test

### 4. **Environment Variables Eksik**
**Sorun:** Supabase bağlantısı çalışmaz
**Çözüm:** Vercel'de variables set et

### 5. **Database Tables Yok**
**Sorun:** Hiçbir şey çalışmaz
**Çözüm:** SQL script çalıştır

---

## ✅ HAZIRLIK ADIMLARI

### 1. Supabase Setup
```sql
-- 00_full_schema_and_policies.sql çalıştır
-- Tüm tablolar oluşturuldu mu kontrol et
```

### 2. Storage Setup
```
Supabase Dashboard → Storage
- posts bucket oluştur (public)
- avatars bucket oluştur (public)
```

### 3. Environment Variables
```
Vercel Dashboard → Settings → Environment Variables
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE
```

### 4. API Deploy
```
Backend functions deploy edildi mi?
/api/contributes endpoint çalışıyor mu?
```

---

## 🎯 SONUÇ

**✅ Hazır Olan:**
- User registration (otomatik)
- Post creation flow
- Contribute creation UI
- RLS policies
- Database schema

**⚠️ Kontrol Gereken:**
- Storage buckets
- API endpoints
- Environment variables
- Database tables (contributes)

**🚨 Test Öncesi Yapılacaklar:**
1. Storage buckets oluştur
2. Environment variables kontrol
3. API endpoints test
4. Database tables kontrol

---

**Hazırlayan:** NOP Super Architect AI  
**Tarih:** 2025  
**Durum:** Test hazırlığı - Rezil olmamak için! 😎

