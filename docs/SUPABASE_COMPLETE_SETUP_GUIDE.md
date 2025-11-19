# 🗄️ Supabase SQL - Komple Yapılandırma Rehberi

Bu rehber, Supabase'i sıfırdan yapılandırmanız için adım adım talimatlar içerir.

---

## 📋 İçindekiler

1. [Ön Hazırlık](#ön-hazırlık)
2. [Supabase Projesi Oluşturma](#supabase-projesi-oluşturma)
3. [Environment Variables (Gizli Anahtarlar)](#environment-variables)
4. [SQL Schema Yükleme](#sql-schema-yükleme)
5. [Storage Buckets (Dosya Depolama)](#storage-buckets)
6. [Authentication Ayarları](#authentication-ayarları)
7. [RLS (Row Level Security) Kontrolü](#rls-kontrolü)
8. [Test ve Doğrulama](#test-ve-doğrulama)
9. [Sorun Giderme](#sorun-giderme)

---

## 🎯 Ön Hazırlık

### Gereksinimler:
- ✅ Supabase hesabı (ücretsiz tier yeterli)
- ✅ Proje dosyalarına erişim
- ✅ `.env` dosyası oluşturma yetkisi

### Hazırlık Adımları:
1. Supabase hesabınızı oluşturun: https://supabase.com
2. Proje klasörünüzde `.env` dosyası oluşturun (varsa `.env.example`'dan kopyalayın)

---

## 🆕 Supabase Projesi Oluşturma

### Adım 1: Yeni Proje Oluştur
1. **Supabase Dashboard**'a giriş yap: https://app.supabase.com
2. **"New Project"** butonuna tıkla
3. Proje bilgilerini doldur:
   - **Name**: `nop-intelligence-layer` (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre seç (kaydet!)
   - **Region**: En yakın bölgeyi seç (örn: `West US`, `Europe West`)
   - **Pricing Plan**: Free tier yeterli (başlangıç için)

4. **"Create new project"** butonuna tıkla
5. Proje oluşturulmasını bekleyin (2-3 dakika)

### Adım 2: Proje Bilgilerini Kaydet
Proje oluşturulduktan sonra:
1. **Project Settings** → **API** sayfasına git
2. Şu bilgileri kopyala ve güvenli bir yere kaydet:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (⚠️ ÇOK GİZLİ!)

---

## 🔐 Environment Variables

### Adım 1: `.env` Dosyası Oluştur

Proje kök dizininde `.env` dosyası oluştur:

```bash
# Windows PowerShell
New-Item -Path .env -ItemType File

# Mac/Linux
touch .env
```

### Adım 2: Environment Variables Ekle

`.env` dosyasına şu değişkenleri ekle:

```env
# ============================================
# SUPABASE CONFIGURATION
# ============================================

# Frontend (Public - Tarayıcıda görünür)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend/Server (Private - Sadece sunucuda)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# OPTIONAL CONFIGURATION
# ============================================

# API Base URL (default: /api)
VITE_API_BASE=/api

# Admin Token (burn admin panel için)
VITE_ADMIN_TOKEN=your-secure-random-token-here
ADMIN_TOKEN=your-secure-random-token-here

# News RSS Feeds (virgülle ayrılmış)
VITE_NEWS_RSS=https://decrypt.co/feed,https://cointelegraph.com/rss,https://www.coindesk.com/arc/outboundfeeds/rss/
```

### Adım 3: Değerleri Doldur

1. **VITE_SUPABASE_URL**: Supabase Dashboard → Settings → API → Project URL
2. **VITE_SUPABASE_ANON_KEY**: Supabase Dashboard → Settings → API → anon public key
3. **SUPABASE_SERVICE_ROLE**: Supabase Dashboard → Settings → API → service_role key (⚠️ GİZLİ!)
4. **VITE_ADMIN_TOKEN**: Rastgele güçlü bir string (örn: `openssl rand -hex 32`)

### ⚠️ ÖNEMLİ GÜVENLİK NOTLARI:

- ❌ `.env` dosyasını **ASLA** Git'e commit etmeyin!
- ✅ `.gitignore` dosyasında `.env` olduğundan emin olun
- ✅ Production'da (Vercel/Netlify) bu değişkenleri environment variables olarak ekleyin
- ✅ `service_role` key'i **SADECE** backend'de kullanın, frontend'e asla göndermeyin!

---

## 📊 SQL Schema Yükleme

### Adım 1: SQL Dosyasını Aç

1. Proje klasöründe `supabase/00_full_schema_and_policies.sql` dosyasını aç
2. Tüm içeriği kopyala (Ctrl+A, Ctrl+C)

### Adım 2: Supabase SQL Editor'a Git

1. Supabase Dashboard'da **SQL Editor** sekmesine tıkla
2. **"New query"** butonuna tıkla
3. Yeni bir query penceresi açılacak

### Adım 3: SQL'i Yükle ve Çalıştır

1. SQL Editor'a yapıştır (Ctrl+V)
2. **"Run"** butonuna tıkla (veya F5)
3. İşlemin tamamlanmasını bekleyin (30-60 saniye)

### ✅ Başarı Kontrolü

SQL çalıştıktan sonra şunları kontrol et:

1. **Table Editor** → Tablolar görünmeli:
   - ✅ `profiles`
   - ✅ `posts`
   - ✅ `contributes`
   - ✅ `pool_positions`
   - ✅ `creator_earnings`
   - ✅ `follows`
   - ✅ `notifications`
   - ✅ `boosted_tasks`
   - ✅ `crypto_news_cache`
   - ✅ `burn_widgets`
   - ✅ `gaming_scores`
   - ✅ `game_sessions`

2. **SQL Editor** → Hata mesajı olmamalı
3. **Authentication** → Policies aktif olmalı

### 🔄 SQL'i Tekrar Çalıştırma

SQL dosyası **idempotent** (güvenli tekrar çalıştırılabilir):
- ✅ Eksik tabloları oluşturur
- ✅ Mevcut tabloları güncellemez
- ✅ Politikaları yeniden oluşturur
- ✅ Trigger'ları günceller

**Not**: Eğer hata alırsanız, hata mesajını okuyun ve gerekirse tabloları manuel olarak silip tekrar çalıştırın.

---

## 📦 Storage Buckets (Dosya Depolama)

### Adım 1: Bucket Oluştur

1. Supabase Dashboard → **Storage** sekmesine git
2. **"New bucket"** butonuna tıkla
3. Bucket ayarları:
   - **Name**: `posts`
   - **Public bucket**: ✅ **AÇIK** (işaretle)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/*` (veya boş bırak)

4. **"Create bucket"** butonuna tıkla

### Adım 2: Storage Policies (İzinler)

Storage bucket'ı oluşturduktan sonra, otomatik olarak RLS politikaları oluşturulur. Eğer manuel kontrol etmek isterseniz:

1. **Storage** → **policies** sekmesine git
2. `posts` bucket'ı için şu politikalar olmalı:
   - ✅ **Public read access**: Herkes okuyabilir
   - ✅ **Authenticated upload**: Sadece giriş yapmış kullanıcılar yükleyebilir

### Adım 3: Test Upload

1. **Storage** → **posts** bucket'ına git
2. **"Upload file"** butonuna tıkla
3. Bir test resmi yükle
4. URL'yi kopyala ve tarayıcıda aç (public olmalı)

---

## 🔒 Authentication Ayarları

### Adım 1: Email/Password Provider

1. Supabase Dashboard → **Authentication** → **Providers**
2. **Email** provider'ı bul
3. **Enable Email provider** seçeneğini aç
4. **Confirm email** seçeneğini kapat (development için)
5. **Save** butonuna tıkla

### Adım 2: URL Configuration (Redirect URLs)

1. **Authentication** → **URL Configuration**
2. **Site URL**: Production domain'inizi ekleyin
   - Örn: `https://your-app.vercel.app`
3. **Redirect URLs**: Şu URL'leri ekleyin:
   ```
   https://your-app.vercel.app/**
   http://localhost:5173/**
   http://localhost:3000/**
   ```

### Adım 3: Email Templates (Opsiyonel)

1. **Authentication** → **Email Templates**
2. Email şablonlarını özelleştirebilirsiniz
3. Development için default şablonlar yeterli

---

## 🛡️ RLS (Row Level Security) Kontrolü

### Adım 1: RLS Durumunu Kontrol Et

1. **Table Editor** → Herhangi bir tabloya git (örn: `profiles`)
2. Tablonun üst kısmında **"RLS enabled"** yazısı görünmeli
3. Eğer görünmüyorsa, SQL Editor'da şunu çalıştır:
   ```sql
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   ```

### Adım 2: Policy Kontrolü

1. **Table Editor** → `profiles` tablosuna git
2. Sağ üstte **"Policies"** butonuna tıkla
3. Şu politikalar olmalı:
   - ✅ `profiles_select_public` - Herkes okuyabilir
   - ✅ `profiles_insert_self` - Kullanıcı kendi profilini oluşturabilir
   - ✅ `profiles_update_own` - Kullanıcı kendi profilini güncelleyebilir

### Adım 3: Test Query

SQL Editor'da şunu çalıştır:

```sql
-- Public read test
SELECT * FROM public.profiles LIMIT 5;

-- Bu çalışmalı (herkes okuyabilir)
```

---

## ✅ Test ve Doğrulama

### Adım 1: Local Development Test

1. Terminal'de proje klasörüne git
2. Dependencies yükle:
   ```bash
   npm install
   # veya
   bun install
   ```
3. Development server'ı başlat:
   ```bash
   npm run dev
   # veya
   bun run dev
   ```
4. Tarayıcıda aç: `http://localhost:5173`

### Adım 2: Supabase Bağlantı Testi

Uygulamada şunları kontrol et:

1. **Boosted Tasks** widget'ı görünmeli (hata mesajı olmamalı)
2. **Crypto News** widget'ı görünmeli
3. **Token Burn** widget'ı görünmeli
4. Console'da hata olmamalı (F12 → Console)

### Adım 3: Database Test

SQL Editor'da test query'leri çalıştır:

```sql
-- 1. Profiles tablosu
SELECT COUNT(*) FROM public.profiles;

-- 2. Contributes tablosu
SELECT COUNT(*) FROM public.contributes;

-- 3. Storage bucket
SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'posts';

-- 4. RLS test (authenticated user olarak)
SELECT * FROM public.profiles WHERE id = auth.uid();
```

### Adım 4: Production Environment Variables

Vercel/Netlify'da environment variables ekle:

1. **Vercel Dashboard** → Project → Settings → Environment Variables
2. Şu değişkenleri ekle:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE`
   - `VITE_ADMIN_TOKEN`
   - `ADMIN_TOKEN`

3. **Save** butonuna tıkla
4. **Redeploy** yap

---

## 🐛 Sorun Giderme

### Problem 1: "Supabase yapılandırılmadı" Hatası

**Çözüm:**
1. `.env` dosyasını kontrol et
2. Environment variables'ların doğru olduğundan emin ol
3. Uygulamayı yeniden başlat (`npm run dev`)
4. Browser cache'i temizle (Ctrl+Shift+Delete)

### Problem 2: SQL Çalıştırma Hatası

**Hata**: `relation already exists`

**Çözüm:**
```sql
-- Tabloyu sil ve yeniden oluştur (DİKKAT: Veri kaybı olur!)
DROP TABLE IF EXISTS public.profiles CASCADE;
-- Sonra SQL dosyasını tekrar çalıştır
```

### Problem 3: RLS Policy Hatası

**Hata**: `new row violates row-level security policy`

**Çözüm:**
1. SQL Editor'da policy'leri kontrol et:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
2. Eksik policy varsa, SQL dosyasını tekrar çalıştır
3. Kullanıcının authenticated olduğundan emin ol

### Problem 4: Storage Upload Hatası

**Hata**: `new row violates row-level security policy for table "storage.objects"`

**Çözüm:**
1. Storage → `posts` bucket → Policies
2. Şu policy'yi ekle:
   ```sql
   CREATE POLICY "Users can upload own files"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'posts');
   ```

### Problem 5: Authentication Redirect Hatası

**Hata**: `redirect_uri_mismatch`

**Çözüm:**
1. Supabase Dashboard → Authentication → URL Configuration
2. Redirect URLs'e domain'inizi ekle
3. Site URL'i güncelle

### Problem 6: Service Role Key Hatası

**Hata**: `Invalid API key`

**Çözüm:**
1. Supabase Dashboard → Settings → API
2. Service role key'i kopyala
3. `.env` dosyasında `SUPABASE_SERVICE_ROLE` değerini güncelle
4. Uygulamayı yeniden başlat

---

## 📚 Ek Kaynaklar

### Supabase Dokümantasyonu:
- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)
- [Authentication](https://supabase.com/docs/guides/auth)

### Proje Dosyaları:
- `supabase/00_full_schema_and_policies.sql` - Ana SQL schema
- `docs/SUPABASE_SETUP.md` - Kısa setup rehberi
- `ENV_SETUP.md` - Environment variables rehberi

---

## ✅ Checklist

Yapılandırma tamamlandığında şunları kontrol et:

- [ ] Supabase projesi oluşturuldu
- [ ] `.env` dosyası oluşturuldu ve dolduruldu
- [ ] SQL schema başarıyla çalıştırıldı
- [ ] Tüm tablolar oluşturuldu
- [ ] Storage bucket (`posts`) oluşturuldu ve public yapıldı
- [ ] Authentication provider'lar aktif
- [ ] Redirect URLs yapılandırıldı
- [ ] RLS politikaları aktif
- [ ] Local development test başarılı
- [ ] Production environment variables eklendi
- [ ] Uygulama hatasız çalışıyor

---

## 🎉 Tamamlandı!

Artık Supabase yapılandırmanız hazır! Uygulamanızı kullanmaya başlayabilirsiniz.

**Sonraki Adımlar:**
1. İlk kullanıcıyı oluştur (Authentication → Users → Add user)
2. Test verisi ekle (Table Editor veya SQL)
3. Production'a deploy et

**Sorularınız mı var?** 
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: Proje repository'sinde issue açın

---

**Son Güncelleme**: 2024
**Versiyon**: 1.0.0

