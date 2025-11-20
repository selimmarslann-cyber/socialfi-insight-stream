# zkSync Era + NFT Entegrasyon Rehberi

Bu rehber, NOP Intelligence Layer projesini zkSync Era mainnet'e bağlamak ve Position NFT minting sistemini tam olarak çalışır hale getirmek için gereken tüm adımları içerir.

---

## 📋 İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [zkSync Era Network Konfigürasyonu](#zksync-era-network-konfigürasyonu)
3. [Smart Contract Adresleri](#smart-contract-adresleri)
4. [Environment Variables](#environment-variables)
5. [NFT Minting Sistemi](#nft-minting-sistemi)
6. [Network Switching](#network-switching)
7. [Test ve Doğrulama](#test-ve-doğrulama)

---

## 🔧 Gereksinimler

### 1. zkSync Era Mainnet Bilgileri

- **Chain ID:** `324`
- **RPC URL:** `https://mainnet.era.zksync.io` (veya custom RPC)
- **Explorer:** `https://explorer.zksync.io`
- **Native Currency:** ETH (18 decimals)

### 2. Deploy Edilmiş Contract'lar

Aşağıdaki contract'ların zkSync Era mainnet'te deploy edilmiş olması gerekiyor:

1. **NOP Token (ERC-20)**
   - Address: `0x941Fc398d9FAebdd9f311011541045A1d66c748E` (şu anki config'de)
   - Doğrula: Bu adres gerçekten zkSync'te deploy edilmiş mi?

2. **NOPSocialPool Contract**
   - Address: Environment variable'dan alınacak (`VITE_NOP_POOL_ADDRESS`)
   - Deploy edilmiş mi kontrol et

3. **NOPPositionNFT Contract (ERC-721)**
   - Address: Environment variable'dan alınacak (`VITE_NOP_POSITION_NFT_ADDRESS`)
   - Deploy edilmiş mi kontrol et
   - **ÖNEMLİ:** Bu contract'ın `mintPosition` fonksiyonu `onlyOwner` - bu yüzden minting için özel bir mekanizma gerekiyor

---

## 🌐 zkSync Era Network Konfigürasyonu

### Adım 1: `src/config/chains.ts` Güncellemesi

Mevcut dosya zaten zkSync'i destekliyor ama eksikler var. Şunları ekle:

```typescript
// nopPositionNftAddress eklenmeli
// getActiveChain() fonksiyonu eklenmeli
```

### Adım 2: Network MetaMask'e Ekleme

Kullanıcılar MetaMask'e zkSync Era'yı eklemeli. `NetworkStatus` component'i bunu otomatik yapıyor ama doğru config gerekli.

---

## 📝 Smart Contract Adresleri

### Kontrol Listesi:

- [ ] NOP Token contract zkSync'te deploy edildi mi?
- [ ] NOPSocialPool contract zkSync'te deploy edildi mi?
- [ ] NOPPositionNFT contract zkSync'te deploy edildi mi?
- [ ] Tüm contract adresleri doğru mu?

### Contract Adreslerini Environment Variables'a Ekle:

```env
# zkSync Era Mainnet
VITE_RPC_URL=https://mainnet.era.zksync.io
VITE_NOP_TOKEN_ADDRESS=0x941Fc398d9FAebdd9f311011541045A1d66c748E
VITE_NOP_POOL_ADDRESS=<DEPLOY_EDILMIS_POOL_ADDRESS>
VITE_NOP_POSITION_NFT_ADDRESS=<DEPLOY_EDILMIS_NFT_ADDRESS>
VITE_CHAIN_ID=324
```

---

## 🔑 Environment Variables

### `.env` Dosyasına Eklenecekler:

```env
# zkSync Era Configuration
VITE_RPC_URL=https://mainnet.era.zksync.io
VITE_CHAIN_ID=324

# Contract Addresses
VITE_NOP_TOKEN_ADDRESS=0x941Fc398d9FAebdd9f311011541045A1d66c748E
VITE_NOP_POOL_ADDRESS=<YOUR_POOL_ADDRESS>
VITE_NOP_POSITION_NFT_ADDRESS=<YOUR_NFT_ADDRESS>

# Optional: Custom RPC (Alchemy, Infura, etc.)
# VITE_RPC_URL=https://zksync-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

### Vercel/Netlify Environment Variables:

Production'da da aynı değişkenleri ekle:
- Vercel: Settings → Environment Variables
- Netlify: Site settings → Environment variables

---

## 🎨 NFT Minting Sistemi

### Mevcut Durum:

✅ `mintPositionNft()` fonksiyonu var
✅ `buyShares()` içinde auto-mint çağrılıyor
❌ `getActiveChain()` eksik
❌ NFT contract adresi environment variable'dan alınmıyor
❌ Contract'ın `onlyOwner` olması sorun yaratıyor

### Sorunlar ve Çözümler:

#### Sorun 1: `getActiveChain()` Eksik

`positionNft.ts` içinde `getActiveChain()` çağrılıyor ama `chains.ts`'de tanımlı değil.

**Çözüm:** `chains.ts`'e ekle.

#### Sorun 2: NFT Contract Adresi Eksik

`chain.nopPositionNftAddress` kullanılıyor ama `SupportedChain` type'ında yok.

**Çözüm:** Type'a ekle ve environment variable'dan oku.

#### Sorun 3: `onlyOwner` Minting Sorunu

Contract'ta `mintPosition` `onlyOwner` - bu yüzden normal kullanıcılar mint edemez.

**Çözüm Seçenekleri:**

**A) Contract'ı Güncelle (Önerilen):**
```solidity
// NOPPositionNFT.sol içinde
mapping(address => bool) public authorizedMinters;

function mintPosition(...) external {
    require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized");
    // mint logic
}
```

**B) Backend Proxy (Geçici):**
- Backend'de bir endpoint oluştur
- Backend contract owner olarak mint eder
- Frontend bu endpoint'i çağırır

**C) Relayer Pattern:**
- Kullanıcı signature oluşturur
- Relayer service mint eder

---

## 🔄 Network Switching

### Mevcut Durum:

✅ `NetworkStatus` component'i var
✅ `wallet_switchEthereumChain` kullanılıyor
✅ `wallet_addEthereumChain` fallback var
❌ zkSync için özel network config eksik olabilir

### zkSync Era Network Config:

```javascript
{
  chainId: "0x144", // 324 in hex
  chainName: "zkSync Era Mainnet",
  rpcUrls: ["https://mainnet.era.zksync.io"],
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  blockExplorerUrls: ["https://explorer.zksync.io"]
}
```

---

## ✅ Test ve Doğrulama

### 1. Network Bağlantısı Testi

1. MetaMask'i aç
2. Wallet'ı bağla
3. Network'ün zkSync Era olduğunu kontrol et
4. `NetworkStatus` component'inin doğru gösterdiğini kontrol et

### 2. Contract Bağlantısı Testi

1. Pool contract'ına bağlanabildiğini kontrol et
2. Token contract'ına bağlanabildiğini kontrol et
3. NFT contract'ına bağlanabildiğini kontrol et

### 3. NFT Minting Testi

1. Bir contribute'a buy yap
2. Transaction başarılı olmalı
3. NFT otomatik mint edilmeli
4. `PositionNFTsCard`'da görünmeli

### 4. NFT Görüntüleme Testi

1. Profile sayfasına git
2. "Position NFTs" card'ını kontrol et
3. Mint edilen NFT'ler görünmeli

---

## 🚨 Kritik Eksiklikler (Düzeltilmesi Gerekenler)

1. **`chains.ts`'de `getActiveChain()` eksik**
2. **`SupportedChain` type'ında `nopPositionNftAddress` eksik**
3. **NFT contract adresi environment variable'dan okunmuyor**
4. **Contract'ın `onlyOwner` olması minting'i engelliyor**
5. **Network switching'de zkSync config tam değil**

---

## 📞 Sonraki Adımlar

1. Contract'ları zkSync Era'ya deploy et
2. Environment variables'ı ayarla
3. `chains.ts`'i güncelle
4. NFT minting mekanizmasını düzelt (contract güncellemesi veya backend proxy)
5. Test et ve doğrula

---

## 🔗 Faydalı Linkler

- [zkSync Era Docs](https://docs.zksync.io/)
- [zkSync Explorer](https://explorer.zksync.io)
- [zkSync RPC Endpoints](https://docs.zksync.io/build/developer-reference/rpc)
- [MetaMask zkSync Guide](https://docs.zksync.io/build/developer-reference/bridging/l1-l2)

