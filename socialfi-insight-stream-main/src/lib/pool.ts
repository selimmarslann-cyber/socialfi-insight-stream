import { BrowserProvider, Contract } from "ethers";
import poolAbi from "../abi/NOPSocialPool.json";

// Kontrat adresini .env'den oku
const POOL_ADDRESS =
  import.meta.env.VITE_POOL_ADDRESS ||
  import.meta.env.VITE_NEXT_PUBLIC_POOL_ADDRESS ||
  "";

if (!POOL_ADDRESS) {
  console.warn(
    "Pool address is not configured. Set VITE_POOL_ADDRESS in your .env file."
  );
}

async function getProviderAndSigner() {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("Wallet (window.ethereum) bulunamadı");
  }

  const provider = new BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  return { provider, signer };
}

export async function getPoolContract() {
  if (!POOL_ADDRESS) {
    throw new Error("Pool address is not configured (VITE_POOL_ADDRESS boş)");
  }

  const { signer } = await getProviderAndSigner();
  return new Contract(POOL_ADDRESS, poolAbi as any, signer);
}

// V1: amount sayısını zincire yazar, NOP token transferi yok.
export async function openPosition(amount: number) {
  const contract = await getPoolContract();
  const tx = await contract.openPosition(amount);
  const receipt = await tx.wait();
  return receipt;
}
