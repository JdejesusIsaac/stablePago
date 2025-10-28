import { useBalance } from "../../hooks/useBalance";

export function WalletBalance() {
  const { displayableBalance } = useBalance();
  return (
    <div className="flex w-full flex-col items-start md:w-auto">
      <span className="mb-2 text-sm font-semibold uppercase tracking-wider text-text-secondary">Your balance</span>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-bold tracking-tight text-foreground">${displayableBalance}</span>
        <span className="text-xl font-medium text-text-secondary">USD</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="text-positive">+2.5%</span>
        <span className="text-text-muted">vs last week</span>
      </div>
    </div>
  );
}
