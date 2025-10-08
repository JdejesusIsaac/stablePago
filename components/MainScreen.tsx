import Image from "next/image";
import { useState } from "react";
import { DepositModal } from "@/components/deposit";
import { SendFundsModal } from "@/components/send-funds";
// import { WithdrawModal } from "@/components/withdraw/WithdrawModal"; // Real version (needs Circle + Supabase)
import { DemoWithdrawModal as WithdrawModal } from "@/components/withdraw/DemoWithdrawModal"; // Demo version (no backend needed)
import { ActivityFeed } from "@/components/ActivityFeed";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import { NewProducts } from "./NewProducts";
import { DashboardSummary } from "./dashboard-summary";
import { DelegationCard } from "./dashboard-summary/DelegationCard";
import { DelegationManager } from "./delegation/DelegationManager";
import { DelegationSetup } from "./delegation/DelegationSetup";
import { CreateWalletModal } from "./CreateWalletModal";

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
  const { logout } = useAuth();

  return (
    <div className="flex h-full w-full items-center justify-center gap-2 px-3 py-8">
      <div className="h-full w-full max-w-5xl">
        <div className="mb-2 flex h-14 w-full max-w-5xl items-center justify-between px-2">
          <Image src="/logo.png" alt="Logo" width={54} height={54} />
          <div className="ml-2 text-xl font-medium">Dashboard</div>
          <button onClick={logout} className="text-secondary flex items-center gap-1 text-base">
            Logout
            <Image src="/logout-icon.svg" alt="Logout" width={24} height={24} />
          </button>
        </div>
        <DashboardSummary
          onDepositClick={() => setShowDepositModal(true)}
          onSendClick={() => setShowSendModal(true)}
          onWithdrawClick={() => setShowWithdrawModal(true)}
          onCreateWalletClick={() => setShowCreateWalletModal(true)}
        />
        
        {/* Delegation Card - Prominently displayed */}
        <div className="mb-6 w-full max-w-5xl px-2">
          <DelegationCard
            onManageClick={() => setShowDelegationManager(true)}
            onSetupClick={() => setShowDelegationSetup(true)}
          />
        </div>

        <NewProducts />
        <ActivityFeed onDepositClick={() => setShowDepositModal(true)} />
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
      </div>
    </div>
  );
}
