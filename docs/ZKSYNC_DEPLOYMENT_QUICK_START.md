# zkSync Era Deployment - Hızlı Başlangıç

Bu rehber, contract'ları zkSync Era mainnet'e deploy etmek için minimum adımları içerir.

---

## ⚡ Hızlı Adımlar

### 1. Dependencies Kurulumu

```bash
cd blockchain
npm install --save-dev @matterlabs/hardhat-zksync-solc @matterlabs/hardhat-zksync-deploy zksync-web3
```

### 2. Hardhat Config Güncelleme

`blockchain/hardhat.config.js` dosyasını şu şekilde güncelleyin:

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
      ethNetwork: "mainnet",
      zksync: true,
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

### 3. Environment Variables

`blockchain/.env` dosyası oluşturun:

```env
PRIVATE_KEY=your_private_key_here
TREASURY_ADDRESS=0x... (optional, defaults to deployer)
NOP_TOKEN_ADDRESS=0x941Fc398d9FAebdd9f311011541045A1d66c748E
```

### 4. Deploy

```bash
npx hardhat run scripts/deploy-zksync.js --network zkSyncEra
```

### 5. Frontend Environment Variables

Deploy sonrası çıkan adresleri `.env` dosyasına ekleyin:

```env
VITE_CHAIN_ID=324
VITE_RPC_URL=https://mainnet.era.zksync.io
VITE_NOP_TOKEN_ADDRESS=0x941Fc398d9FAebdd9f311011541045A1d66c748E
VITE_NOP_POOL_ADDRESS=<deploy_sonrası_çıkan_adres>
VITE_NOP_POSITION_NFT_ADDRESS=<deploy_sonrası_çıkan_adres>
```

### 6. Vercel/Netlify

Production environment variables'ı da güncelleyin ve redeploy yapın.

---

## ✅ Tamamlandı!

Artık zkSync Era mainnet'te çalışıyorsunuz! 🎉

