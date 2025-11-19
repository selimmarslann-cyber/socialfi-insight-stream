# 🗄️ Supabase SQL Kurulum - HATASIZ REHBER

## ✅ TEK DOSYA - TEK ADIM

Supabase'e **SADECE BİR DOSYA** eklemeniz yeterli:

### 📄 Dosya: `supabase/00_full_schema_and_policies.sql`

---

## 🚀 ADIM ADIM KURULUM

### 1️⃣ Supabase Dashboard'a Git
- https://app.supabase.com
- Projenizi seçin

### 2️⃣ SQL Editor'ı Aç
- Sol menüden **"SQL Editor"** tıkla
- **"New query"** butonuna tıkla

### 3️⃣ SQL Dosyasını Kopyala
- Proje klasörünüzde: `supabase/00_full_schema_and_policies.sql` dosyasını aç
- **TÜM İÇERİĞİ** kopyala (Ctrl+A, Ctrl+C)

### 4️⃣ SQL Editor'a Yapıştır ve Çalıştır
- Supabase SQL Editor'a yapıştır (Ctrl+V)
- **"Run"** butonuna tıkla (veya F5)
- 30-60 saniye bekle

### 5️⃣ ✅ Başarı Kontrolü
SQL Editor'da **hata mesajı olmamalı**. Eğer "Success" görürseniz, tamamlandı!

---

## 📋 Bu Dosya Ne Yapıyor?

Bu tek dosya şunları oluşturur:

✅ **Tablolar:**
- `profiles` - Kullanıcı profilleri
- `posts` - Postlar
- `contributes` - Katkılar
- `pool_positions` - Pool pozisyonları
- `creator_earnings` - Creator kazançları
- `follows` - Takip sistemi
- `notifications` - Bildirimler
- `boosted_tasks` - Görevler
- `gaming_scores` - Oyun skorları
- `crypto_news_cache` - Haber cache
- `burn_widget` - Burn widget
- Ve daha fazlası...

✅ **RLS Politikaları:**
- Tüm tablolar için güvenlik politikaları
- Public read, authenticated write

✅ **Trigger'lar:**
- Otomatik profil oluşturma
- Timestamp güncellemeleri

✅ **Fonksiyonlar:**
- `handle_new_user()` - Yeni kullanıcı için profil oluşturur
- `is_admin()` - Admin kontrolü
- `reset_daily_scores()` - Günlük skor sıfırlama

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Tekrar Çalıştırma:** Bu dosya güvenli bir şekilde tekrar çalıştırılabilir. Eksik olanları ekler, mevcut olanları değiştirmez.

2. **Hata Alırsanız:**
   - Hata mesajını okuyun
   - Genellikle "relation already exists" hatası normaldir (tablo zaten var)
   - Diğer hatalar için hata mesajını kontrol edin

3. **Storage Bucket:**
   - SQL çalıştırdıktan sonra **Storage → Buckets** bölümüne git
   - `posts` adında bir bucket oluştur (public olarak işaretle)

---

## ✅ KURULUM SONRASI

SQL başarıyla çalıştıktan sonra:

1. **Storage Bucket Oluştur:**
   - Storage → New bucket
   - Name: `posts`
   - Public: ✅ Açık

2. **Environment Variables:**
   - `.env` dosyasına Supabase bilgilerini ekle
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. **Test:**
   - Uygulamayı çalıştır: `npm run dev`
   - Hata mesajı olmamalı

---

## 🎯 ÖZET

**SADECE BİR DOSYA:**
```
supabase/00_full_schema_and_policies.sql
```

**SADECE BİR ADIM:**
1. Supabase SQL Editor'a git
2. Dosyayı kopyala-yapıştır
3. Run'a tıkla
4. ✅ Tamamlandı!

---

**Başka SQL dosyasına GEREK YOK!** Bu tek dosya her şeyi içeriyor.

