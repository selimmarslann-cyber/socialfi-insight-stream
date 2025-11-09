import { useState } from 'react';
import { Wallet, Copy, LogOut, CheckCircle } from 'lucide-react';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWalletStore } from '@/lib/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const WalletConnectButton = () => {
  const { connected, address, connect, disconnect } = useWalletStore();
  const [isModalOpen, setModalOpen] = useState(false);

  const handleConnect = (provider: string) => {
    if (provider === 'metamask') {
      const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0aB12';
      connect(mockAddress, 324);
      toast.success('Wallet connected successfully');
      setModalOpen(false);
    }
  };

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.info('Wallet disconnected');
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
            <span className="sm:hidden">Connected</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDisconnect}>
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
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

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => handleConnect('metamask')}
            >
              <Wallet className="h-5 w-5" />
              <span>MetaMask</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              disabled
            >
              <Wallet className="h-5 w-5" />
              <span>WalletConnect</span>
              <span className="ml-auto text-xs text-muted-foreground">Soon</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              disabled
            >
              <Wallet className="h-5 w-5" />
              <span>Phantom</span>
              <span className="ml-auto text-xs text-muted-foreground">Soon</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
