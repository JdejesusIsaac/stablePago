import Image from "next/image";
import { WalletBalance } from "./WalletBallance";
import { ArrowsRightLeftIcon, WalletIcon, PaperAirplaneIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { Dropdown } from "../common/Dropdown";
import { useState } from "react";
import { WalletDetails } from "./WalletDetails";
import { useWallet, useAuth } from "@crossmint/client-sdk-react-ui";
import { WarningModal } from "./WarningModal";
import { DelegationManager } from "../delegation/DelegationManager";
import { DelegationSetup } from "../delegation/DelegationSetup";

interface DashboardSummaryProps {
  onDepositClick: () => void;
  onSendClick: () => void;
  onWithdrawClick: () => void;
  onCreateWalletClick: () => void;
  onCreateTelegramWalletClick: () => void;
}

export function DashboardSummary({ onDepositClick, onSendClick, onWithdrawClick, onCreateWalletClick, onCreateTelegramWalletClick }: DashboardSummaryProps) {
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [showDelegationManager, setShowDelegationManager] = useState(false);
  const [showDelegationSetup, setShowDelegationSetup] = useState(false);
  const { wallet } = useWallet();
  const { user } = useAuth();
  const [openWarningModal, setOpenWarningModal] = useState(false);
  
  const dropdownOptions = [
    {
      icon: <UserPlusIcon className="h-4 w-4" />,
      label: "Create Wallet for Email",
      onClick: () => {
        onCreateWalletClick();
      },
    },
    {
      icon: <PaperAirplaneIcon className="h-4 w-4" />,
      label: "Create Telegram Wallet",
      onClick: () => {
        onCreateTelegramWalletClick();
      },
    },
    {
      icon: <ArrowsRightLeftIcon className="h-4 w-4" />,
      label: "Withdraw to Bank",
      onClick: () => {
        onWithdrawClick();
      },
    },
    {
      icon: <WalletIcon className="h-4 w-4" />,
      label: "Wallet Details",
      onClick: () => {
        setShowWalletDetails(true);
      },
    },
  ];

  const dropdownTrigger = (
    <button className="bg-surface-elevated hover:bg-border-hover border border-border rounded-xl p-3 transition-all duration-200 hover:scale-105 glow-secondary">
      <Image src="/dots-vertical.svg" alt="Settings" width={20} height={20} />
    </button>
  );

  return (
    <div className="card-arc w-full max-w-5xl p-6 mb-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Balance Section with Arc Glow */}
        <div className="flex-1 w-full md:w-auto">
          <WalletBalance />
        </div>
        
        {/* Action Buttons - Arc Network Style */}
        <div className="flex w-full md:w-auto items-center gap-3">
          {/* Deposit Button with Primary Glow */}
          <button
            onClick={onDepositClick}
            className="btn-primary flex-1 md:flex-initial flex items-center justify-center gap-2 glow-primary"
          >
            <span className="text-lg">+</span>
            <span>Deposit</span>
          </button>
          
          {/* Send Button with Secondary Style */}
          <button
            type="button"
            className="btn-secondary flex-1 md:flex-initial flex items-center justify-center gap-2"
            onClick={onSendClick}
          >
            <Image src="/arrow-up-right-icon-white.svg" alt="Send" width={20} height={20} />
            <span>Send</span>
          </button>
          
          {/* Menu Dropdown with Arc Styling */}
          <Dropdown trigger={dropdownTrigger} options={dropdownOptions} />
        </div>
      </div>
      
      <WalletDetails onClose={() => setShowWalletDetails(false)} open={showWalletDetails} />
      <WarningModal open={openWarningModal} onClose={() => setOpenWarningModal(false)} />
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
    </div>
  );
}
