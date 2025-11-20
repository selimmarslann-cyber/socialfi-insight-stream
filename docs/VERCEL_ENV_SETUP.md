# Vercel Environment Variables Setup

Bu dosya, Vercel'de deploy edilen projenin çalışması için gerekli environment variables'ları listeler.

## 🔴 Zorunlu Environment Variables

Aşağıdaki değişkenler **mutlaka** Vercel'de tanımlanmalıdır:

### Supabase Configuration

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Neden iki key?**
- `VITE_SUPABASE_ANON_KEY`: Frontend'de kullanılır (public, RLS ile korunur)
- `SUPABASE_SERVICE_ROLE_KEY`: Backend API endpoint'lerinde kullanılır (admin yetkileri)

### Supabase URL (Alternatif)

Eğer `VITE_SUPABASE_URL` yoksa, şunu da ekleyebilirsiniz:
```
SUPABASE_URL=https://your-project.supabase.co
```

## 📝 Vercel'de Nasıl Eklenir?

1. **Vercel Dashboard**'a gidin: https://vercel.com/dashboard
2. Projenizi seçin
3. **Settings** → **Environment Variables** sekmesine gidin
4. Her bir değişkeni ekleyin:
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: Supabase projenizin URL'si
   - **Environment**: Production, Preview, Development (hepsini seçin)
5. **Save** butonuna tıklayın
6. **Redeploy** yapın (Settings → Deployments → Redeploy)

## ✅ Kontrol Listesi

- [ ] `VITE_SUPABASE_URL` eklendi
- [ ] `VITE_SUPABASE_ANON_KEY` eklendi
- [ ] `SUPABASE_SERVICE_ROLE_KEY` eklendi
- [ ] Tüm environment'lar için eklendi (Production, Preview, Development)
- [ ] Redeploy yapıldı

## 🔍 Sorun Giderme

### Katkılar kayboluyor / görünmüyor
- ✅ Supabase'de `contributes` tablosu var mı kontrol edin
- ✅ RLS politikaları doğru mu kontrol edin (`contributes_select_public` ve `contributes_insert_public`)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` doğru mu kontrol edin

### Yeni kullanıcılar görünmüyor
- ✅ Supabase'de `profiles` tablosu var mı kontrol edin
- ✅ `handle_new_user()` trigger'ı çalışıyor mu kontrol edin
- ✅ RLS politikaları doğru mu kontrol edin

### API endpoint'leri çalışmıyor
- ✅ Vercel'de environment variables doğru mu kontrol edin
- ✅ Vercel Functions log'larını kontrol edin
- ✅ Network tab'ında API isteklerini kontrol edin

## 📚 İlgili Dokümanlar

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Supabase Complete Setup Guide](./SUPABASE_COMPLETE_SETUP_GUIDE.md)

