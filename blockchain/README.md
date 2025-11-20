# zkSync Era Mainnet Deployment

Bu klasör zkSync Era mainnet'e contract deploy etmek için kullanılır.

## Kurulum

```bash
npm install
```

## Environment Variables

`.env` dosyası oluşturun (`.env.example` dosyasını referans alın):

```env
PRIVATE_KEY=your_private_key_here
ETH_MAINNET_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
TREASURY_ADDRESS=0x... (optional)
NOP_TOKEN_ADDRESS=0x941Fc398d9FAebdd9f311011541045A1d66c748E
```

## Deploy

```bash
npx hardhat deploy-zksync --network zkSyncMainnet
```

veya

```bash
npx hardhat run deploy/deploy-zksync.ts --network zkSyncMainnet
```

## Deploy Edilen Contract'lar

- **NOPSocialPool**: Pool contract'ı
- **NOPPositionNFT**: Position NFT contract'ı (V2 - authorized minters desteği ile)

Deploy sonrası çıkan adresleri frontend `.env` dosyasına ekleyin.

