import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DepositModal } from "@/components/deposit";
import { SendFundsModal } from "@/components/send-funds";
import { WithdrawModal } from "@/components/withdraw/WithdrawModal";
import { ActivityFeed } from "@/components/ActivityFeed";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import { NewProducts } from "./NewProducts";
import { DashboardSummary } from "./dashboard-summary";
import { DelegationCard } from "./dashboard-summary/DelegationCard";
import { DelegationManager } from "./delegation/DelegationManager";
import { DelegationSetup } from "./delegation/DelegationSetup";
import { CreateWalletModal } from "./CreateWalletModal";
import { CreateTelegramWalletModal } from "./CreateTelegramWalletModal";

interface MainScreenProps {
  walletAddress?: string;
}

export function MainScreen({ walletAddress }: MainScreenProps) {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDelegationManager, setShowDelegationManager] = useState(false);
  const [showDelegationSetup, setShowDelegationSetup] = useState(false);
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);
  const [showCreateTelegramWalletModal, setShowCreateTelegramWalletModal] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/landing");
  };

  return (
    <div className="flex h-full w-full items-center justify-center gap-2 px-3 py-8 relative">
      {/* Arc Network Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'var(--gradient-glow)' }}></div>
      </div>
      
      <div className="h-full w-full max-w-5xl relative z-10">
        {/* Arc Network Header with Backdrop */}
        <div className="mb-6 flex h-16 w-full max-w-5xl items-center justify-between px-4 backdrop-arc rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={48} height={48} className="rounded-xl" />
            <div className="text-2xl font-bold tracking-tight">Dashboard</div>
          </div>
          <button 
            onClick={handleLogout} 
            className="group flex items-center gap-2 text-base text-text-secondary hover:text-primary transition-all duration-200 px-4 py-2 rounded-xl hover:bg-surface-elevated"
          >
            <span className="hidden sm:inline font-medium">Logout</span>
            <Image 
              src="/logout-icon.svg" 
              alt="Logout" 
              width={20} 
              height={20}
              className="group-hover:scale-110 transition-transform"
            />
          </button>
        </div>
        <DashboardSummary
          onDepositClick={() => setShowDepositModal(true)}
          onSendClick={() => setShowSendModal(true)}
          onWithdrawClick={() => setShowWithdrawModal(true)}
          onCreateWalletClick={() => setShowCreateWalletModal(true)}
          onCreateTelegramWalletClick={() => setShowCreateTelegramWalletModal(true)}
        />
        
        {/* Delegation Card - Arc Network Style */}
        <div className="mb-8 w-full max-w-5xl">
          <DelegationCard
            onManageClick={() => setShowDelegationManager(true)}
            onSetupClick={() => setShowDelegationSetup(true)}
          />
        </div>

        <div className="space-y-8">
          <NewProducts />
          <ActivityFeed onDepositClick={() => setShowDepositModal(true)} />
        </div>
        <DepositModal
          open={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          walletAddress={walletAddress || ""}
        />
        <SendFundsModal open={showSendModal} onClose={() => setShowSendModal(false)} />
        <WithdrawModal open={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} />
        
        {/* Delegation Modals */}
        <DelegationManager
          open={showDelegationManager}
          onClose={() => setShowDelegationManager(false)}
          onSetupNew={() => {
            setShowDelegationManager(false);
            setShowDelegationSetup(true);
          }}
        />
        <DelegationSetup
          open={showDelegationSetup}
          onClose={() => setShowDelegationSetup(false)}
          onSuccess={() => {
            setShowDelegationSetup(false);
            setShowDelegationManager(true);
          }}
        />
        
        {/* Create Wallet Modal */}
        <CreateWalletModal
          open={showCreateWalletModal}
          onClose={() => setShowCreateWalletModal(false)}
        />
        <CreateTelegramWalletModal
          open={showCreateTelegramWalletModal}
          onClose={() => setShowCreateTelegramWalletModal(false)}
        />
      </div>
    </div>
  );
}
