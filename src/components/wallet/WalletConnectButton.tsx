import { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  Copy,
  LogOut,
  CheckCircle,
  Smartphone,
  Mail,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWalletStore } from '@/lib/store';
import { toast } from 'sonner';

// Declare window.ethereum type
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<string[]>;
      selectedAddress?: string;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

const providerLabels: Record<'metamask' | 'trust' | 'email', string> = {
  metamask: 'MetaMask',
  trust: 'Trust Wallet',
  email: 'Mail',
};

export const WalletConnectButton = () => {
  const {
    connected,
    address,
    provider,
    refCode,
    inviterCode,
    chainId,
    connect,
    disconnect,
  } = useWalletStore();
  const [isModalOpen, setModalOpen] = useState(false);
  const [referralInput, setReferralInput] = useState(inviterCode ?? '');

  const providerLabel = useMemo(
    () => (provider ? providerLabels[provider] : undefined),
    [provider]
  );

  useEffect(() => {
    if (isModalOpen) {
      setReferralInput(inviterCode ?? '');
    }
  }, [isModalOpen, inviterCode]);

  // Persistent wallet connection - auto-reconnect on page load and navigation
  useEffect(() => {
    if (!connected || !address || !provider) {
      // Try to restore from persisted state
      const persistedState = useWalletStore.getState();
      if (persistedState.connected && persistedState.address && persistedState.provider) {
        // Restore connection
        if (persistedState.provider === 'metamask' && typeof window !== 'undefined' && window.ethereum) {
          // Verify MetaMask connection
          window.ethereum
            .request({ method: 'eth_accounts' })
            .then((accounts: string[]) => {
              if (accounts.length > 0) {
                const account = accounts[0].toLowerCase();
                if (account === persistedState.address?.toLowerCase()) {
                  // Wallet is still connected, restore state
                  connect(persistedState.address, {
                    provider: persistedState.provider,
                    chainId: persistedState.chainId,
                    inviterCode: persistedState.inviterCode,
                  });
                } else {
                  // Different account connected, update to new account
                  connect(account, {
                    provider: persistedState.provider,
                    chainId: persistedState.chainId,
                    inviterCode: persistedState.inviterCode,
                  });
                }
              } else {
                // No accounts, but keep persisted state for non-MetaMask providers
                if (persistedState.provider !== 'metamask') {
                  connect(persistedState.address, {
                    provider: persistedState.provider,
                    chainId: persistedState.chainId,
                    inviterCode: persistedState.inviterCode,
                  });
                }
              }
            })
            .catch(() => {
              // MetaMask not available, but keep persisted state for other providers
              if (persistedState.provider !== 'metamask') {
                connect(persistedState.address, {
                  provider: persistedState.provider,
                  chainId: persistedState.chainId,
                  inviterCode: persistedState.inviterCode,
                });
              }
            });
        } else if (persistedState.provider === 'trust' || persistedState.provider === 'email') {
          // Trust Wallet or Email - restore from persisted state
          connect(persistedState.address, {
            provider: persistedState.provider,
            chainId: persistedState.chainId,
            inviterCode: persistedState.inviterCode,
          });
        }
      }
      return;
    }

    // If already connected, verify and maintain connection
    if (provider === 'metamask' && typeof window !== 'undefined' && window.ethereum) {
      // Verify MetaMask connection periodically
      const verifyConnection = () => {
        window.ethereum
          ?.request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts.length > 0) {
              const account = accounts[0].toLowerCase();
              if (account !== address?.toLowerCase()) {
                // Account changed, update state
                connect(account, {
                  provider: 'metamask',
                  chainId: useWalletStore.getState().chainId,
                  inviterCode: useWalletStore.getState().inviterCode,
                });
              }
            } else if (address) {
              // Accounts empty but we have address - might be locked, keep state
              // Don't disconnect, just keep the persisted state
            }
          })
          .catch(() => {
            // Error checking, keep current state
          });
      };

      // Verify on mount
      verifyConnection();

      // Listen for account changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          const account = accounts[0].toLowerCase();
          if (account !== address?.toLowerCase()) {
            connect(account, {
              provider: 'metamask',
              chainId: useWalletStore.getState().chainId,
              inviterCode: useWalletStore.getState().inviterCode,
            });
          }
        } else {
          // User disconnected from MetaMask, but keep our state (they might reconnect)
          // Only disconnect if they explicitly disconnect from our UI
        }
      };

      // Listen for chain changes
      const handleChainChanged = (chainId: string) => {
        const newChainId = Number.parseInt(chainId, 16);
        useWalletStore.getState().setChainId(newChainId);
      };

      // Add event listeners
      if (window.ethereum.on) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      }

      // Cleanup
      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [connected, address, provider, connect, disconnect]);

  const handleModalChange = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setReferralInput(inviterCode ?? '');
    }
  };

  const handleConnect = async (selectedProvider: 'metamask' | 'trust' | 'email') => {
    const trimmed = referralInput.trim();
    const normalizedRef = trimmed ? trimmed.toLowerCase() : undefined;

    if (normalizedRef && !/^nop\d{5}$/i.test(normalizedRef)) {
      toast.error('Ref kodu "nop" ile başlayıp 5 rakamla devam etmelidir.');
      return;
    }

    if (selectedProvider === 'email') {
      window.location.href = 'mailto:user@nop.network';
      return;
    }

    const label = providerLabels[selectedProvider];

    // Get active chain ID from config (synchronous)
    let targetChainId = 324; // Default to zkSync Era
    try {
      const { getActiveChain } = require("@/config/chains");
      const chain = getActiveChain();
      targetChainId = chain.id;
    } catch {
      // Fallback to default
    }

    // For MetaMask, request actual connection
    if (selectedProvider === 'metamask' && typeof window !== 'undefined' && window.ethereum) {
      try {
        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts && accounts.length > 0) {
          const account = accounts[0].toLowerCase();
          // Get current chain ID
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          const currentChainId = Number.parseInt(chainIdHex as string, 16);
          
          connect(account, {
            provider: 'metamask',
            inviterCode: normalizedRef,
            chainId: currentChainId || targetChainId,
          });
          
          toast.success(`${label} bağlantısı başarılı!`);
          handleModalChange(false);
        } else {
          toast.error('MetaMask hesabı seçilmedi');
        }
      } catch (error) {
        console.error('[WalletConnect] MetaMask connection error', error);
        if ((error as { code?: number })?.code === 4001) {
          toast.error('MetaMask bağlantısı reddedildi');
        } else {
          toast.error('MetaMask bağlantısı başarısız');
        }
      }
    } else {
      // For Trust Wallet or fallback, use mock addresses
      const addresses: Record<'metamask' | 'trust', string> = {
        metamask: '0x742d35Cc6634C0532925a3b844Bc9e7595f0aB12',
        trust: '0x3fD5a019867d8bB6d1A7f0d9033B4F2F4eAaC345',
      };

      connect(addresses[selectedProvider], {
        provider: selectedProvider,
        inviterCode: normalizedRef,
        chainId: targetChainId,
      });

      toast.success(`${label} bağlantısı hazır!`);
      handleModalChange(false);
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Adres kopyalandı');
    }
  };

  const handleCopyRefCode = () => {
    if (refCode) {
      navigator.clipboard.writeText(refCode);
      toast.success('Ref kodu kopyalandı');
    }
  };

  const handleDisconnect = () => {
    // Only disconnect if user explicitly clicks disconnect
    // This prevents accidental disconnections
    disconnect();
    toast.info('Cüzdan bağlantısı kesildi');
  };

  const maskAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (connected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 border-border-subtle bg-surface text-text-primary hover:bg-surface-muted"
          >
            <CheckCircle className="h-4 w-4 text-positive" />
            <span className="hidden sm:inline">{maskAddress(address)}</span>
            {providerLabel && (
              <span className="hidden text-xs text-text-secondary sm:inline">
                {providerLabel}
              </span>
            )}
            <span className="sm:hidden">Connected</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {providerLabel && (
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {providerLabel} bağlı
            </DropdownMenuLabel>
          )}
          <DropdownMenuItem onClick={handleCopyAddress}>
            <Copy className="mr-2 h-4 w-4" />
            Adresi kopyala
          </DropdownMenuItem>
          {refCode && (
            <DropdownMenuItem onClick={handleCopyRefCode}>
              <Tag className="mr-2 h-4 w-4" />
              Ref kodunu kopyala ({refCode})
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect}>
            <LogOut className="mr-2 h-4 w-4" />
            Bağlantıyı kes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

    return (
      <>
        <Button
          type="button"
          variant="accent"
          size="md"
          className="gap-1 px-4 font-semibold"
          onClick={() => setModalOpen(true)}
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </Button>

      <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
              <Button
                variant="outline"
                className="h-12 w-full justify-start gap-3 border-border-subtle bg-surface text-text-primary hover:bg-surface-muted"
                onClick={() => handleConnect('metamask')}
              >
              <Wallet className="h-5 w-5" />
              <span>MetaMask</span>
            </Button>
              <Button
                variant="outline"
                className="h-12 w-full justify-start gap-3 border-border-subtle bg-surface text-text-primary hover:bg-surface-muted"
                onClick={() => handleConnect('trust')}
              >
              <Smartphone className="h-5 w-5" />
              <span>Trust Wallet</span>
            </Button>
              <Button
                variant="outline"
                className="h-12 w-full justify-start gap-3 border-border-subtle bg-surface text-text-primary hover:bg-surface-muted"
                onClick={() => handleConnect('email')}
              >
              <Mail className="h-5 w-5" />
              <span>Mail ile giriş</span>
            </Button>
            <div className="space-y-2 border-t pt-4">
              <Label
                htmlFor="referral-code"
                className="text-xs font-semibold uppercase"
              >
                Ref kodu
              </Label>
              <Input
                id="referral-code"
                placeholder="nop12345"
                value={referralInput}
                onChange={(event) => setReferralInput(event.target.value)}
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Kodunuz mutlaka <span className="font-semibold">nop</span> ile
                başlamalı ve toplam 8 karakter olmalıdır.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
