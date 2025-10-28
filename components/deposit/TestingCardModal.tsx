import Image from "next/image";
import { CopyWrapper } from "../common/CopyWrapper";

export function TestingCardModal() {
  return (
    <div className="max-w-112 fixed top-6 z-20 w-[calc(100%-32px)] space-y-3 rounded-2xl bg-[#1C1F24] border border-[#2A2D32] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] lg:right-6 lg:w-[419px]">
      <div className="flex items-center gap-3 text-lg font-semibold text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A2D32]">
          <Image src="/credit-card-outline.svg" alt="Credit Card" width={20} height={20} style={{ filter: 'invert(1)' }} />
        </div>
        <span>Test payments</span>
      </div>
      <p className="text-[#A9B0B7] text-sm">
        Use the following test card to complete your payment
      </p>
      <div>
        <div className="w-full">
          <div className="flex items-center justify-between gap-2 rounded-xl border-2 border-[#2A2D32] bg-[#0B0C10] py-3 pl-4 pr-2">
            <span className="text-base font-mono font-semibold text-white tracking-wider">4242 4242 4242 4242</span>
            <CopyWrapper
              toCopy="4242 4242 4242 4242"
              className="rounded-lg border border-[#2A2D32] hover:border-[#00F0FF] bg-[#1C1F24] hover:bg-[#2A2D32] px-4 py-2 text-xs font-medium transition-all duration-200 text-[#A9B0B7] hover:text-white"
              iconPosition="right"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
