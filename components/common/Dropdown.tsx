import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ReactNode } from "react";

interface DropdownOption {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}

interface DropdownProps {
  trigger: ReactNode;
  options: DropdownOption[];
}

export function Dropdown({ trigger, options }: DropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          className="min-w-[240px] max-h-[320px] overflow-y-auto rounded-xl border border-[#2A2D32] bg-[#1C1F24] p-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm z-[100] will-change-[transform,opacity]" 
          align="end"
          sideOffset={8}
          collisionPadding={16}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#2A2D32 #1C1F24'
          }}
        >
          {options.map((option, index) => (
            <DropdownMenu.Item
              key={index}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#A9B0B7] hover:text-white hover:bg-[#2A2D32] focus-visible:outline-none focus:bg-[#2A2D32] transition-all duration-200 select-none"
              onClick={option.onClick}
            >
              <span className="w-4 h-4 flex items-center justify-center shrink-0">{option.icon}</span>
              <span className="flex-1">{option.label}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
