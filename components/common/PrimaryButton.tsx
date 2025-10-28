export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="bg-[#FF005C] hover:bg-[#CC0049] text-white mt-8 w-full rounded-xl py-3.5 text-lg font-semibold transition-all duration-200 shadow-[0_0_12px_rgba(255,0,92,0.4)] hover:shadow-[0_0_20px_rgba(255,0,92,0.4)] hover:scale-[1.02] active:scale-100 disabled:cursor-not-allowed disabled:bg-[#2A2D32] disabled:text-[#6B7280] disabled:shadow-none disabled:hover:scale-100"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
