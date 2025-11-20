# Sepolia'dan zkSync Era'ya Geçiş Rehberi

Bu rehber, projeyi Ethereum Sepolia testnet'inden zkSync Era mainnet'e taşımanız için gereken tüm adımları içerir.

---

## 📋 İçindekiler

1. [Ön Hazırlık](#ön-hazırlık)
2. [zkSync Era Network Bilgileri](#zksync-era-network-bilgileri)
3. [Smart Contract Deployment](#smart-contract-deployment)
4. [Frontend Konfigürasyonu](#frontend-konfigürasyonu)
5. [Environment Variables](#environment-variables)
6. [Test ve Doğrulama](#test-ve-doğrulama)
7. [Sorun Giderme](#sorun-giderme)

---

## 🔧 Ön Hazırlık

### Gereksinimler

1. **zkSync Era Mainnet RPC URL**
   - Public RPC: `https://mainnet.era.zksync.io`
   - Veya Alchemy/Infura gibi servislerden özel RPC alabilirsiniz

2. **Deploy Wallet**
   - zkSync Era'da deploy için ETH gerekiyor (gas fees için)
   - En az 0.01-0.1 ETH önerilir

3. **Contract Source Code**
   - `NOPSocialPool.sol` ✅ (Mevcut)
   - `NOPPositionNFT_V2.sol` ✅ (Mevcut - authorized minters desteği ile)

---

## 🌐 zkSync Era Network Bilgileri

```
Chain ID: 324
Network Name: zkSync Era Mainnet
RPC URL: https://mainnet.era.zksync.io
Explorer: https://explorer.zksync.io
Native Currency: ETH (18 decimals)
```

---

## 📦 Smart Contract Deployment

### Adım 1: Hardhat zkSync Plugin Kurulumu

zkSync Era'ya deploy etmek için Hardhat zkSync plugin'i gerekiyor:

```bash
cd blockchain
npm install --save-dev @matterlabs/hardhat-zksync-solc @matterlabs/hardhat-zksync-deploy
```

### Adım 2: Hardhat Config Güncelleme

`blockchain/hardhat.config.js` dosyasını güncelleyin:

```javascript
require("@matterlabs/hardhat-zksync-solc");
require("@matterlabs/hardhat-zksync-deploy");

module.exports = {
  zksolc: {
    version: "1.3.17",
    compilerSource: "binary",
    settings: {
      optimizer: {
        enabled: true,
      },
    },
  },
  defaultNetwork: "zkSyncEra",
  networks: {
    zkSyncEra: {
      url: "https://mainnet.era.zksync.io",
      ethNetwork: "mainnet", // Ethereum mainnet for bridging
      zksync: true,
      accounts: [process.env.PRIVATE_KEY], // Deploy wallet private key
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
```

### Adım 3: Deploy Script Hazırlama

`blockchain/scripts/deploy-zksync.js` oluşturun:

```javascript
const { deploy } = require("@matterlabs/hardhat-zksync-deploy");
const { Wallet } = require("zksync-web3");
const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts to zkSync Era...");

  // Deploy wallet (from private key)
  const wallet = new Wallet(process.env.PRIVATE_KEY);

  // 1. Deploy NOP Token (if not already deployed)
  // Eğer NOP token zaten deploy edilmişse, adresini kullanın
  const NOP_TOKEN_ADDRESS = process.env.NOP_TOKEN_ADDRESS || "0x941Fc398d9FAebdd9f311011541045A1d66c748E";
  console.log("Using NOP Token:", NOP_TOKEN_ADDRESS);

  // 2. Deploy NOPSocialPool
  console.log("\n=== Deploying NOPSocialPool ===");
  const poolArtifact = await hre.artifacts.readArtifact("NOPSocialPool");
  const poolContract = await deploy(hre.zkWallet, poolArtifact, [
    NOP_TOKEN_ADDRESS,
    process.env.TREASURY_ADDRESS || wallet.address, // Treasury address
  ]);
  await poolContract.deployed();
  console.log("NOPSocialPool deployed to:", poolContract.address);

  // 3. Deploy NOPPositionNFT_V2
  console.log("\n=== Deploying NOPPositionNFT_V2 ===");
  const nftArtifact = await hre.artifacts.readArtifact("NOPPositionNFT");
  const nftContract = await deploy(hre.zkWallet, nftArtifact, []);
  await nftContract.deployed();
  console.log("NOPPositionNFT deployed to:", nftContract.address);

  // 4. Authorize Pool as Minter
  console.log("\n=== Authorizing Pool as NFT Minter ===");
  const authorizeTx = await nftContract.authorizeMinter(poolContract.address);
  await authorizeTx.wait();
  console.log("Pool authorized as minter");

  // 5. Verify contracts (optional)
  console.log("\n=== Deployment Summary ===");
  console.log("NOP Token:", NOP_TOKEN_ADDRESS);
  console.log("NOPSocialPool:", poolContract.address);
  console.log("NOPPositionNFT:", nftContract.address);
  console.log("\nAdd these to your .env file:");
  console.log(`VITE_NOP_TOKEN_ADDRESS=${NOP_TOKEN_ADDRESS}`);
  console.log(`VITE_NOP_POOL_ADDRESS=${poolContract.address}`);
  console.log(`VITE_NOP_POSITION_NFT_ADDRESS=${nftContract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Adım 4: Environment Variables (.env)

`blockchain/.env` dosyası oluşturun:

```env
# Deploy Wallet Private Key (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Treasury Address (fee'lerin gideceği adres)
TREASURY_ADDRESS=0x...

# NOP Token Address (eğer zaten deploy edilmişse)
NOP_TOKEN_ADDRESS=0x941Fc398d9FAebdd9f311011541045A1d66c748E

# Sepolia (optional, for testing)
SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_KEY
```

### Adım 5: Deploy İşlemi

```bash
cd blockchain
npx hardhat deploy-zksync --network zkSyncEra
```

**ÖNEMLİ:** 
- Private key'inizi asla commit etmeyin!
- Deploy işlemi gas fee gerektirir (ETH)
- Transaction'lar explorer'da görünecek

---

## 🎨 Frontend Konfigürasyonu

### Adım 1: chains.ts Güncelleme

`src/config/chains.ts` zaten zkSync'i destekliyor, ama default chain'i kontrol edin:

```typescript
export const DEFAULT_CHAIN_KEY = "zksync"; // ✅ Zaten ayarlı
```

### Adım 2: Environment Variables Güncelleme

`.env` dosyasını güncelleyin:

```env
# zkSync Era Mainnet
VITE_CHAIN_ID=324
VITE_RPC_URL=https://mainnet.era.zksync.io

# Contract Addresses (deploy sonrası güncelleyin)
VITE_NOP_TOKEN_ADDRESS=0x941Fc398d9FAebdd9f311011541045A1d66c748E
VITE_NOP_POOL_ADDRESS=<DEPLOY_EDILMIS_POOL_ADDRESS>
VITE_NOP_POSITION_NFT_ADDRESS=<DEPLOY_EDILMIS_NFT_ADDRESS>
```

### Adım 3: Vercel/Netlify Environment Variables

Production'da da aynı değişkenleri ekleyin:

**Vercel:**
1. Project Settings → Environment Variables
2. Production, Preview, Development için ekleyin

**Netlify:**
1. Site settings → Environment variables
2. Deploy contexts için ekleyin

---

## ✅ Test ve Doğrulama

### 1. Network Bağlantısı

1. MetaMask'i açın
2. zkSync Era network'ü ekleyin (NetworkStatus component'i otomatik ekler)
3. Chain ID'nin 324 olduğunu kontrol edin

### 2. Contract Adresleri

1. Explorer'da contract adreslerini kontrol edin:
   - `https://explorer.zksync.io/address/<POOL_ADDRESS>`
   - `https://explorer.zksync.io/address/<NFT_ADDRESS>`

2. Contract'ların doğru deploy edildiğini doğrulayın

### 3. NFT Minting Testi

1. Bir contribute'a yatırım yapın
2. NFT'nin otomatik mint edildiğini kontrol edin
3. Profile sayfasında NFT'nin göründüğünü kontrol edin

### 4. NFT Transfer Testi

1. Profile sayfasında bir NFT seçin
2. "Transfer" butonuna tıklayın
3. Başka bir wallet adresine transfer edin
4. Transfer'in başarılı olduğunu doğrulayın

---

## 🚨 Sorun Giderme

### Sorun 1: "Network not found" Hatası

**Çözüm:**
- MetaMask'e zkSync Era network'ünü manuel ekleyin
- NetworkStatus component'i otomatik eklemeye çalışır ama bazen manuel gerekir

### Sorun 2: Contract Adresi Bulunamıyor

**Çözüm:**
- Environment variables'ı kontrol edin
- Vercel/Netlify'da da eklediğinizden emin olun
- Redeploy yapın

### Sorun 3: NFT Mint Edilmiyor

**Çözüm:**
- Pool contract'ın NFT contract'ta authorized minter olduğunu kontrol edin
- Deploy script'te `authorizeMinter` çağrısının yapıldığından emin olun

### Sorun 4: RPC Timeout

**Çözüm:**
- Public RPC yerine Alchemy/Infura gibi özel RPC kullanın
- `VITE_RPC_URL`'i güncelleyin

---

## 📝 Checklist

### Deployment Öncesi

- [ ] zkSync Era RPC URL'i hazır
- [ ] Deploy wallet'ta yeterli ETH var
- [ ] Private key güvenli bir yerde
- [ ] Treasury address belirlendi
- [ ] NOP Token adresi doğrulandı

### Deployment

- [ ] Hardhat zkSync plugin kuruldu
- [ ] hardhat.config.js güncellendi
- [ ] Deploy script hazırlandı
- [ ] Contract'lar deploy edildi
- [ ] Pool, NFT contract'ta authorized minter olarak eklendi

### Frontend

- [ ] chains.ts default chain zkSync
- [ ] Environment variables güncellendi
- [ ] Vercel/Netlify environment variables eklendi
- [ ] Build başarılı

### Test

- [ ] Network bağlantısı çalışıyor
- [ ] Contract adresleri doğru
- [ ] Buy işlemi çalışıyor
- [ ] NFT mint ediliyor
- [ ] NFT transfer edilebiliyor

---

## 🔗 Faydalı Linkler

- [zkSync Era Docs](https://docs.zksync.io/)
- [zkSync Explorer](https://explorer.zksync.io)
- [Hardhat zkSync Plugin](https://github.com/matter-labs/hardhat-zksync)
- [zkSync RPC Providers](https://docs.zksync.io/build/developer-reference/rpc)

---

## ⚠️ Önemli Notlar

1. **Private Key Güvenliği:** Private key'inizi asla commit etmeyin, `.env` dosyasını `.gitignore`'a ekleyin

2. **Gas Fees:** zkSync Era'da gas fees ETH ile ödenir, yeterli ETH olduğundan emin olun

3. **Contract Verification:** Explorer'da contract'ları verify etmek için source code'u paylaşmanız gerekebilir

4. **Backup:** Deploy edilen contract adreslerini güvenli bir yerde saklayın

5. **Testing:** Mainnet'e deploy etmeden önce testnet'te test edin (zkSync Era testnet varsa)

---

## 🎯 Sonraki Adımlar

1. Contract'ları deploy edin
2. Environment variables'ı güncelleyin
3. Frontend'i test edin
4. Kullanıcılara duyurun! 🚀

