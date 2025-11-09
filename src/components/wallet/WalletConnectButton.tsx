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

  const handleModalChange = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setReferralInput(inviterCode ?? '');
    }
  };

const handleConnect = (selectedProvider: 'metamask' | 'trust' | 'email') => {
  const trimmed = referralInput.trim();
  const normalizedRef = trimmed?.trim().toLowerCase();

  // ✅ Referans kodu doğrulama (senin eklediğin kısım)
  if (normalizedRef && !/^nop\d{5}$/i.test(normalizedRef)) {
    toast.error('Ref kodu "nop" ile başlayıp 5 rakamla devam etmelidir.');
    return;
  }

  // ✅ Provider’a göre bağlantı (main branch’ten gelen kısım)
  if (selectedProvider === 'metamask') {
    const mockAddress = '0x74243D5C...7595F0aB12';
    connect(mockAddress, 324);
    toast.success('Wallet connected successfully!');
    setModalOpen(false);
    return;
  }

  if (selectedProvider === 'trust') {
    const trustAddress = '0x3f05a019...FeeA42c35';
    connect(trustAddress, 324);
    toast.success('Wallet connected successfully!');
    setModalOpen(false);
    return;
  }

  if (selectedProvider === 'email') {
    window.location.href = 'mailto:user@nop.network';
  }
};

    }

    const addresses: Record<typeof selectedProvider, string> = {
      metamask: '0x742d35Cc6634C0532925a3b844Bc9e7595f0aB12',
      trust: '0x3fD5a019867d8bB6d1A7f0d9033B4F2F4eAaC345',
      email: 'mail:user@nop.network',
    };

    const label = providerLabels[selectedProvider];

    connect(addresses[selectedProvider], {
      provider: selectedProvider,
      inviterCode: normalizedRef || undefined,
    });

    toast.success(`${label} bağlantısı hazır!`);
    handleModalChange(false);
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
          <Button variant="outline" className="gap-2">
            <CheckCircle className="h-4 w-4 text-positive" />
            <span className="hidden sm:inline">{maskAddress(address)}</span>
            {providerLabel && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
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
      <Button onClick={() => setModalOpen(true)} className="gap-2">
        <Wallet className="h-4 w-4" />
        <span className="hidden sm:inline">Connect Wallet</span>
      </Button>

      <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="h-12 w-full justify-start gap-3"
              onClick={() => handleConnect('metamask')}
            >
              <Wallet className="h-5 w-5" />
              <span>MetaMask</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full justify-start gap-3"
              onClick={() => handleConnect('trust')}
            >
              <Smartphone className="h-5 w-5" />
              <span>Trust Wallet</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full justify-start gap-3"
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
