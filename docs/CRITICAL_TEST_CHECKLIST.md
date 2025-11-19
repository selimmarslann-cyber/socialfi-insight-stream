# 🚨 KRİTİK TEST KONTROL LİSTESİ - REZİL OLMAYALIM!

**Tarih:** 2025  
**Durum:** Test öncesi son kontrol

---

## ✅ ÇALIŞAN SİSTEMLER (Kod Hazır)

### 1. **User Registration** ✅
- ✅ Wallet bağlandığında otomatik profile oluşturuluyor
- ✅ `getProfileByWallet()` → Profile yoksa otomatik oluşturur
- ✅ `insertProfileRow()` - Yeni kullanıcı kaydı
- ✅ `social_profiles` tablosu kullanılıyor

**Flow:**
```
Wallet Connect → getProfileByWallet() → Profile yoksa → insertProfileRow() → Profile hazır!
```

---

### 2. **Post Creation** ✅
- ✅ `createSocialPost()` fonksiyonu hazır
- ✅ Supabase'e kaydediyor (`social_posts` tablosu)
- ✅ Image upload çalışıyor (Supabase Storage)
- ✅ Feed'e otomatik ekleniyor

**Flow:**
```
Post yaz → Image upload → createSocialPost() → Supabase → Feed'de görünür
```

---

### 3. **Contribute Creation** ✅
- ✅ UI hazır (`CreateContributeDialog`)
- ✅ Image upload çalışıyor
- ✅ API endpoint'e POST yapıyor (`/api/contributes`)

**Flow:**
```
Contribute oluştur → Image upload → API POST → Backend kaydeder
```

---

## ⚠️ KRİTİK KONTROLLER (Yapılması Gerekenler)

### 1. **Supabase Storage Buckets** ⚠️⚠️⚠️
**SORUN:** Image upload çalışmaz!

**GEREKLİ:**
- `posts` bucket (public) - Post images için
- `avatars` bucket (public) - Avatar images için

**YAPILACAK:**
1. Supabase Dashboard → Storage
2. "New bucket" → `posts` (public)
3. "New bucket" → `avatars` (public)
4. Public access enabled olmalı!

**KONTROL:**
```sql
-- Supabase SQL Editor'de çalıştır
SELECT name, public FROM storage.buckets;
```

---

### 2. **Database Tables** ⚠️⚠️
**SORUN:** Tablolar yoksa hiçbir şey çalışmaz!

**GEREKLİ TABLOLAR:**
- `social_profiles` - User profiles
- `social_posts` - Posts
- `contributes` - Contributes (eğer API'de kullanılıyorsa)
- `nop_trades` - Trade history
- `creator_earnings` - Creator rewards
- `followers` - Follow system
- `notifications` - Notifications

**YAPILACAK:**
1. Supabase Dashboard → SQL Editor
2. `supabase/00_full_schema_and_policies.sql` dosyasını aç
3. Tüm içeriği kopyala
4. SQL Editor'e yapıştır
5. "Run" butonuna bas
6. Hata var mı kontrol et!

**KONTROL:**
```sql
-- Tablolar var mı?
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('social_profiles', 'social_posts', 'contributes');
```

---

### 3. **API Endpoint** ⚠️⚠️⚠️
**SORUN:** Contribute oluşturulamaz!

**GEREKLİ:**
- `/api/contributes` endpoint çalışıyor mu?

**KONTROL:**
1. Vercel Dashboard → Functions
2. `api/contributes.ts` var mı?
3. Deploy edilmiş mi?

**TEST:**
```bash
curl -X POST https://your-domain.vercel.app/api/contributes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test"}'
```

**⚠️ EĞER YOKSA:**
- Contribute creation çalışmaz!
- Sadece Post creation çalışır

---

### 4. **Environment Variables** ⚠️⚠️⚠️
**SORUN:** Supabase bağlantısı çalışmaz!

**GEREKLİ (Vercel):**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_API_BASE=/api
```

**YAPILACAK:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Tüm variables ekle
3. Redeploy yap

**KONTROL:**
- Browser console'da hata var mı?
- "Supabase yapılandırması eksik" mesajı görünüyor mu?

---

### 5. **RLS Policies** ⚠️
**SORUN:** Kullanıcılar post oluşturamaz!

**KONTROL:**
1. Supabase Dashboard → Authentication → Policies
2. `social_posts` tablosu için:
   - `social_posts_insert_own` policy var mı?
   - `social_posts_select_public` policy var mı?

**YAPILACAK:**
- `00_full_schema_and_policies.sql` çalıştırıldıysa policies otomatik oluşur

---

## 🧪 TEST SENARYOLARI

### Test 1: User Registration ✅
1. Yeni kullanıcı wallet bağlar
2. **BEKLENEN:** Profile otomatik oluşur
3. **KONTROL:** Supabase → `social_profiles` tablosunda görünür mü?

### Test 2: Post Creation ✅
1. Kullanıcı post yazar
2. Image ekler (opsiyonel)
3. **BEKLENEN:** Post kaydedilir, feed'de görünür
4. **KONTROL:** Supabase → `social_posts` tablosunda görünür mü?

### Test 3: Contribute Creation ⚠️
1. Kullanıcı contribute oluşturur
2. Cover image ekler (opsiyonel)
3. **BEKLENEN:** Contribute kaydedilir
4. **KONTROL:** API endpoint çalışıyor mu? Backend'de kaydediliyor mu?

### Test 4: Image Upload ⚠️
1. Post'a image ekle
2. **BEKLENEN:** Image Supabase Storage'a upload olur
3. **KONTROL:** Supabase → Storage → `posts` bucket'ında görünür mü?

---

## 🚨 ACİL YAPILACAKLAR (Test Öncesi)

### 1. Supabase Setup (5 dakika)
```
✅ Storage buckets oluştur (posts, avatars)
✅ Database tables oluştur (SQL script çalıştır)
✅ RLS policies kontrol et
```

### 2. Vercel Setup (2 dakika)
```
✅ Environment variables set et
✅ Redeploy yap
```

### 3. API Endpoint (5 dakika)
```
✅ /api/contributes endpoint var mı kontrol et
✅ Yoksa oluştur veya Contribute creation'ı devre dışı bırak
```

---

## ✅ HAZIRLIK DURUMU

**✅ Hazır:**
- User registration (otomatik)
- Post creation flow
- Contribute creation UI
- Image upload logic
- Database schema

**⚠️ Kontrol Gereken:**
- Storage buckets (KRİTİK!)
- API endpoint (KRİTİK!)
- Environment variables (KRİTİK!)
- Database tables (KRİTİK!)

---

## 🎯 SONUÇ

**Kod hazır! ✅**  
**Ama Supabase setup yapılmadıysa çalışmaz! ⚠️**

**Test öncesi mutlaka:**
1. Storage buckets oluştur
2. Database tables oluştur
3. Environment variables set et
4. API endpoint kontrol et

**Rezil olmamak için bunları yap! 🚀**

---

**Hazırlayan:** NOP Super Architect AI  
**Tarih:** 2025  
**Durum:** Test hazırlığı - Rezil olmamak için! 😎

