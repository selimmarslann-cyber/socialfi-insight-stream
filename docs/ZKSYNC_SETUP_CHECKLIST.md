# zkSync Era + NFT Entegrasyon Checklist

## ✅ Tamamlanan İşlemler

1. **chains.ts Güncellemesi**
   - ✅ zkSync Era mainnet config eklendi (Chain ID: 324)
   - ✅ `getActiveChain()` fonksiyonu eklendi
   - ✅ `nopPositionNftAddress` field'ı eklendi
   - ✅ Environment variable desteği eklendi

2. **NFT Contract Adresi Desteği**
   - ✅ `positionNft.ts` güncellendi - chain config'den adres alıyor
   - ✅ Environment variable fallback eklendi
   - ✅ Hata mesajları iyileştirildi

3. **Network Switching**
   - ✅ `NetworkStatus` component'i zkSync için güncellendi
   - ✅ `WalletConnectButton` chain ID'yi config'den alıyor
   - ✅ MetaMask network switching düzeltildi

4. **Pool Contract Adresi**
   - ✅ `pool.ts` chain config desteği eklendi
   - ✅ Environment variable fallback eklendi

5. **NFT Minting İyileştirmeleri**
   - ✅ Authorization kontrolü eklendi
   - ✅ Hata mesajları iyileştirildi
   - ✅ V2 contract hazırlandı (authorizedMinters desteği)

---

## 🔧 Yapılması Gerekenler

### 1. Environment Variables Ayarlama

`.env` dosyasına veya Vercel/Netlify environment variables'a ekle:

```env
# zkSync Era Mainnet
VITE_CHAIN_ID=324
VITE_RPC_URL=https://mainnet.era.zksync.io

# Contract Addresses (zkSync Era'da deploy edilmiş olmalı)
VITE_NOP_TOKEN_ADDRESS=0x941Fc398d9FAebdd9f311011541045A1d66c748E
VITE_NOP_POOL_ADDRESS=<DEPLOY_EDILMIS_POOL_ADDRESS>
VITE_NOP_POSITION_NFT_ADDRESS=<DEPLOY_EDILMIS_NFT_ADDRESS>
```

### 2. Smart Contract Deployment

#### A) NOPSocialPool Contract
```bash
# zkSync Era'ya deploy et
# Deploy edilen adresi VITE_NOP_POOL_ADDRESS'e ekle
```

#### B) NOPPositionNFT Contract
**ÖNEMLİ:** İki seçenek var:

**Seçenek 1: V2 Contract Kullan (Önerilen)**
- `blockchain/contracts/NOPPositionNFT_V2.sol` dosyasını deploy et
- Bu contract `authorizedMinters` desteği var
- NOPSocialPool contract'ını authorized minter olarak ekle:
  ```solidity
  // NFT contract'ta
  nftContract.authorizeMinter(poolContractAddress);
  ```

**Seçenek 2: V1 Contract + Backend Proxy**
- Mevcut `NOPPositionNFT.sol` kullan (onlyOwner)
- Backend'de bir endpoint oluştur
- Frontend bu endpoint'i çağırsın, backend mint etsin

### 3. Contract Authorization (V2 kullanıyorsan)

Deploy sonrası:
```javascript
// NFT contract owner olarak
await nftContract.authorizeMinter(poolContractAddress);
```

### 4. Test Senaryoları

1. **Network Bağlantısı**
   - [ ] MetaMask'te zkSync Era'ya geç
   - [ ] `NetworkStatus` component'i doğru gösteriyor mu?
   - [ ] Yanlış network'te uyarı gösteriyor mu?

2. **Pool İşlemleri**
   - [ ] Token approve çalışıyor mu?
   - [ ] Buy transaction başarılı mı?
   - [ ] Sell transaction başarılı mı?

3. **NFT Minting**
   - [ ] Buy sonrası NFT otomatik mint ediliyor mu?
   - [ ] NFT transaction hash loglanıyor mu?
   - [ ] `PositionNFTsCard`'da NFT görünüyor mu?

4. **NFT Görüntüleme**
   - [ ] Profile sayfasında NFT'ler listeleniyor mu?
   - [ ] NFT metadata doğru mu?
   - [ ] Explorer link'i çalışıyor mu?

---

## 🚨 Kritik Sorunlar ve Çözümleri

### Sorun 1: NFT Minting Authorization

**Durum:** Contract'ta `mintPosition` `onlyOwner` - normal kullanıcılar mint edemez.

**Çözüm:**
- V2 contract'ı deploy et (`NOPPositionNFT_V2.sol`)
- Pool contract'ı authorized minter olarak ekle
- Veya backend proxy kullan

### Sorun 2: Contract Adresleri Eksik

**Durum:** Environment variables ayarlanmamış.

**Çözüm:**
- Contract'ları zkSync Era'ya deploy et
- Adresleri environment variables'a ekle
- Vercel/Netlify'da da ekle

### Sorun 3: RPC URL

**Durum:** Default RPC yavaş olabilir.

**Çözüm:**
- Alchemy veya Infura'dan zkSync RPC al
- `VITE_RPC_URL`'e ekle

---

## 📝 Detaylı Rehber

Tam detaylı rehber için: `docs/ZKSYNC_NFT_INTEGRATION_GUIDE.md`

---

## 🔗 Faydalı Linkler

- [zkSync Era Docs](https://docs.zksync.io/)
- [zkSync Explorer](https://explorer.zksync.io)
- [zkSync RPC](https://docs.zksync.io/build/developer-reference/rpc)
- [Hardhat zkSync Plugin](https://github.com/matter-labs/hardhat-zksync)

