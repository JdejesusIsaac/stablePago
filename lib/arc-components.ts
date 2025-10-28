/**
 * Arc Network Component Presets
 * Pre-built Tailwind class combinations for consistent Arc Network styling
 * 
 * Usage:
 * import { arcButton, arcCard } from '@/lib/arc-components';
 * <button className={arcButton.primary}>Click me</button>
 */

/**
 * BUTTON COMPONENTS
 */
export const arcButton = {
  // Primary action button with pink glow
  primary: `
    bg-primary hover:bg-primary-hover
    text-primary-foreground
    rounded-xl px-6 py-3.5
    font-semibold text-base
    transition-all duration-200 ease-smooth
    shadow-glow-primary shadow-primary-glow/40
    hover:shadow-glow-primary-lg hover:scale-105
    active:scale-100
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
  `.trim().replace(/\s+/g, ' '),

  // Secondary action button with cyan outline
  secondary: `
    bg-transparent
    border-2 border-secondary
    text-secondary hover:text-secondary-foreground
    hover:bg-secondary
    rounded-xl px-6 py-3.5
    font-semibold text-base
    transition-all duration-200 ease-smooth
    hover:shadow-glow-secondary hover:scale-105
    active:scale-100
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim().replace(/\s+/g, ' '),

  // Ghost button (minimal style)
  ghost: `
    bg-transparent
    text-text-secondary hover:text-text-primary
    hover:bg-surface-elevated
    rounded-xl px-4 py-2
    font-medium text-base
    transition-all duration-200 ease-smooth
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim().replace(/\s+/g, ' '),

  // Danger/destructive button
  danger: `
    bg-error hover:bg-error/80
    text-white
    rounded-xl px-6 py-3.5
    font-semibold text-base
    transition-all duration-200 ease-smooth
    shadow-glow-primary shadow-error-glow/40
    hover:shadow-glow-primary-lg hover:scale-105
    active:scale-100
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim().replace(/\s+/g, ' '),

  // Icon button
  icon: `
    bg-surface-elevated hover:bg-surface-hover
    border border-border hover:border-border-hover
    rounded-xl p-3
    transition-all duration-200 ease-smooth
    hover:scale-110
    active:scale-100
  `.trim().replace(/\s+/g, ' '),

  // Small button variant
  small: `
    bg-primary hover:bg-primary-hover
    text-primary-foreground
    rounded-lg px-4 py-2
    font-semibold text-sm
    transition-all duration-200 ease-smooth
    hover:scale-105
    active:scale-100
  `.trim().replace(/\s+/g, ' '),
};

/**
 * CARD COMPONENTS
 */
export const arcCard = {
  // Standard card with gradient background
  default: `
    bg-gradient-card
    border border-border
    rounded-2xl
    shadow-card
    backdrop-blur-sm
    p-6
  `.trim().replace(/\s+/g, ' '),

  // Elevated card with stronger shadow
  elevated: `
    bg-surface-elevated
    border border-border-hover
    rounded-2xl
    shadow-surface-elevated
    p-6
  `.trim().replace(/\s+/g, ' '),

  // Interactive card with hover effects
  interactive: `
    bg-gradient-card
    border border-border hover:border-border-hover
    rounded-2xl
    shadow-card
    backdrop-blur-sm
    p-6
    transition-all duration-200 ease-smooth
    hover:scale-[1.02]
    cursor-pointer
  `.trim().replace(/\s+/g, ' '),

  // Card with primary glow
  glowPrimary: `
    bg-gradient-card
    border border-border
    rounded-2xl
    shadow-card
    backdrop-blur-sm
    p-6
    relative overflow-hidden
    before:absolute before:inset-0
    before:bg-gradient-to-br before:from-primary/10 before:to-transparent
    before:opacity-0 hover:before:opacity-100
    before:transition-opacity before:duration-300
    before:pointer-events-none
  `.trim().replace(/\s+/g, ' '),

  // Card with secondary glow
  glowSecondary: `
    bg-gradient-card
    border border-border
    rounded-2xl
    shadow-card
    backdrop-blur-sm
    p-6
    relative overflow-hidden
    before:absolute before:inset-0
    before:bg-gradient-to-br before:from-secondary/10 before:to-transparent
    before:opacity-0 hover:before:opacity-100
    before:transition-opacity before:duration-300
    before:pointer-events-none
  `.trim().replace(/\s+/g, ' '),

  // Compact card
  compact: `
    bg-surface-elevated
    border border-border
    rounded-xl
    p-4
  `.trim().replace(/\s+/g, ' '),
};

/**
 * BALANCE WIDGET COMPONENTS
 */
export const arcBalance = {
  // Container
  container: `
    flex flex-col items-start
    w-full md:w-auto
  `.trim().replace(/\s+/g, ' '),

  // Label
  label: `
    mb-2
    text-sm font-semibold uppercase tracking-wider
    text-text-secondary
  `.trim().replace(/\s+/g, ' '),

  // Amount display
  amount: `
    text-5xl font-bold tracking-tight
    text-text-primary
  `.trim().replace(/\s+/g, ' '),

  // Currency
  currency: `
    text-xl font-medium
    text-text-secondary
  `.trim().replace(/\s+/g, ' '),

  // Performance indicator (positive)
  performancePositive: `
    text-sm
    text-positive
    font-medium
  `.trim().replace(/\s+/g, ' '),

  // Performance indicator (negative)
  performanceNegative: `
    text-sm
    text-negative
    font-medium
  `.trim().replace(/\s+/g, ' '),
};

/**
 * TRANSACTION LIST COMPONENTS
 */
export const arcTransaction = {
  // Transaction list container
  list: `
    w-full space-y-2
  `.trim().replace(/\s+/g, ' '),

  // Individual transaction item
  item: `
    group
    flex items-center gap-4
    p-4
    rounded-xl
    bg-surface-elevated
    border border-border hover:border-border-hover
    transition-all duration-200
    hover:scale-[1.01]
  `.trim().replace(/\s+/g, ' '),

  // Icon container (outgoing)
  iconOutgoing: `
    flex h-12 w-12 items-center justify-center
    rounded-xl
    bg-error/10 border border-error/30
    group-hover:bg-error/20
    transition-all duration-200
  `.trim().replace(/\s+/g, ' '),

  // Icon container (incoming)
  iconIncoming: `
    flex h-12 w-12 items-center justify-center
    rounded-xl
    bg-success/10 border border-success/30
    group-hover:bg-success/20
    transition-all duration-200
  `.trim().replace(/\s+/g, ' '),

  // Address text
  address: `
    text-sm font-semibold font-mono
    text-text-primary
  `.trim().replace(/\s+/g, ' '),

  // Timestamp text
  timestamp: `
    text-xs
    text-text-muted
  `.trim().replace(/\s+/g, ' '),

  // Amount (outgoing)
  amountOutgoing: `
    text-lg font-bold
    text-negative
  `.trim().replace(/\s+/g, ' '),

  // Amount (incoming)
  amountIncoming: `
    text-lg font-bold
    text-positive
  `.trim().replace(/\s+/g, ' '),

  // Token symbol
  tokenSymbol: `
    text-xs font-medium
    text-text-muted
  `.trim().replace(/\s+/g, ' '),
};

/**
 * INPUT COMPONENTS
 */
export const arcInput = {
  // Standard input field
  default: `
    bg-surface-elevated
    border border-border
    text-text-primary placeholder:text-text-muted
    rounded-xl px-4 py-3
    focus:border-primary focus:ring-2 focus:ring-primary/20
    focus:outline-none
    transition-all duration-200
  `.trim().replace(/\s+/g, ' '),

  // Large input (for amounts)
  large: `
    bg-surface-elevated
    border border-border
    text-text-primary placeholder:text-text-muted
    rounded-xl px-4 py-4
    text-2xl font-semibold
    focus:border-primary focus:ring-2 focus:ring-primary/20
    focus:outline-none
    transition-all duration-200
  `.trim().replace(/\s+/g, ' '),

  // Input with error
  error: `
    bg-surface-elevated
    border-2 border-error
    text-text-primary placeholder:text-text-muted
    rounded-xl px-4 py-3
    focus:border-error focus:ring-2 focus:ring-error/20
    focus:outline-none
    transition-all duration-200
  `.trim().replace(/\s+/g, ' '),

  // Label for input
  label: `
    block mb-2
    text-sm font-medium
    text-text-secondary
  `.trim().replace(/\s+/g, ' '),

  // Helper text
  helper: `
    mt-1
    text-xs
    text-text-muted
  `.trim().replace(/\s+/g, ' '),

  // Error message
  errorMessage: `
    mt-1
    text-xs
    text-error
  `.trim().replace(/\s+/g, ' '),
};

/**
 * BADGE COMPONENTS
 */
export const arcBadge = {
  // Active status badge
  active: `
    rounded-xl
    bg-success/20 border border-success/30
    px-3 py-1.5
    text-xs font-bold uppercase tracking-wide
    text-success
  `.trim().replace(/\s+/g, ' '),

  // Inactive status badge
  inactive: `
    rounded-xl
    bg-text-muted/20 border border-text-muted/30
    px-3 py-1.5
    text-xs font-bold uppercase tracking-wide
    text-text-muted
  `.trim().replace(/\s+/g, ' '),

  // Pending status badge
  pending: `
    rounded-xl
    bg-warning/20 border border-warning/30
    px-3 py-1.5
    text-xs font-bold uppercase tracking-wide
    text-warning
  `.trim().replace(/\s+/g, ' '),

  // Error status badge
  error: `
    rounded-xl
    bg-error/20 border border-error/30
    px-3 py-1.5
    text-xs font-bold uppercase tracking-wide
    text-error
  `.trim().replace(/\s+/g, ' '),

  // Info badge
  info: `
    rounded-xl
    bg-secondary/20 border border-secondary/30
    px-3 py-1.5
    text-xs font-bold uppercase tracking-wide
    text-secondary
  `.trim().replace(/\s+/g, ' '),

  // Coming soon badge
  comingSoon: `
    rounded-xl
    bg-surface-elevated border border-border
    px-3 py-2
    text-xs font-bold uppercase tracking-wide
    text-text-secondary
  `.trim().replace(/\s+/g, ' '),
};

/**
 * MODAL COMPONENTS
 */
export const arcModal = {
  // Modal overlay
  overlay: `
    fixed inset-0
    bg-background/80
    backdrop-blur-sm
    z-40
    animate-in fade-in duration-200
  `.trim().replace(/\s+/g, ' '),

  // Modal container
  container: `
    fixed inset-0
    z-50
    flex items-center justify-center
    p-4
    animate-in fade-in zoom-in-95 duration-200
  `.trim().replace(/\s+/g, ' '),

  // Modal content
  content: `
    w-full max-w-lg
    bg-gradient-card
    border border-border
    rounded-2xl
    shadow-surface-elevated
    p-6
    max-h-[90vh] overflow-y-auto
  `.trim().replace(/\s+/g, ' '),

  // Modal header
  header: `
    flex items-center justify-between
    mb-6
    pb-4
    border-b border-border
  `.trim().replace(/\s+/g, ' '),

  // Modal title
  title: `
    text-2xl font-bold tracking-tight
    text-text-primary
  `.trim().replace(/\s+/g, ' '),

  // Modal body
  body: `
    space-y-4
  `.trim().replace(/\s+/g, ' '),

  // Modal footer
  footer: `
    flex items-center justify-end gap-3
    mt-6 pt-4
    border-t border-border
  `.trim().replace(/\s+/g, ' '),
};

/**
 * LOADING COMPONENTS
 */
export const arcLoading = {
  // Spinner
  spinner: `
    h-12 w-12
    animate-spin
    rounded-full
    border-4 border-primary/30 border-t-primary
  `.trim().replace(/\s+/g, ' '),

  // Small spinner
  spinnerSmall: `
    h-6 w-6
    animate-spin
    rounded-full
    border-2 border-primary/30 border-t-primary
  `.trim().replace(/\s+/g, ' '),

  // Skeleton (for text)
  skeleton: `
    animate-pulse
    bg-surface-elevated
    rounded
  `.trim().replace(/\s+/g, ' '),

  // Skeleton (for cards)
  skeletonCard: `
    animate-pulse
    bg-surface-elevated
    rounded-2xl
    h-32
  `.trim().replace(/\s+/g, ' '),
};

/**
 * DELEGATION CARD COMPONENTS
 */
export const arcDelegation = {
  // Stat card container
  statCard: `
    rounded-xl
    bg-surface-elevated border border-border
    p-4
    hover:border-success/30
    transition-all duration-200
  `.trim().replace(/\s+/g, ' '),

  // Stat label
  statLabel: `
    text-xs font-semibold uppercase tracking-wide
    text-text-muted
    mb-1
  `.trim().replace(/\s+/g, ' '),

  // Stat value
  statValue: `
    text-2xl font-bold
    text-text-primary
  `.trim().replace(/\s+/g, ' '),

  // Icon container (active)
  iconActive: `
    flex h-14 w-14 items-center justify-center
    rounded-2xl
    bg-gradient-to-br from-success/20 to-success/5
    border border-success/30
    shadow-glow-secondary
  `.trim().replace(/\s+/g, ' '),

  // Icon container (setup)
  iconSetup: `
    flex h-14 w-14 items-center justify-center
    rounded-2xl
    bg-gradient-to-br from-primary/20 to-primary/5
    border border-primary/30
    shadow-glow-primary shadow-primary-glow/40
  `.trim().replace(/\s+/g, ' '),
};

/**
 * TYPOGRAPHY COMPONENTS
 */
export const arcTypography = {
  // Page heading
  h1: `
    text-4xl font-bold tracking-tight
    text-text-primary
  `.trim().replace(/\s+/g, ' '),

  // Section heading
  h2: `
    text-2xl font-bold tracking-tight
    text-text-primary
  `.trim().replace(/\s+/g, ' '),

  // Subsection heading
  h3: `
    text-xl font-bold tracking-tight
    text-text-primary
  `.trim().replace(/\s+/g, ' '),

  // Card heading
  h4: `
    text-lg font-bold
    text-text-primary
  `.trim().replace(/\s+/g, ' '),

  // Body text
  body: `
    text-base
    text-text-secondary
    leading-relaxed
  `.trim().replace(/\s+/g, ' '),

  // Small text
  small: `
    text-sm
    text-text-muted
  `.trim().replace(/\s+/g, ' '),

  // Caption
  caption: `
    text-xs
    text-text-muted
  `.trim().replace(/\s+/g, ' '),

  // Label (uppercase)
  label: `
    text-sm font-semibold uppercase tracking-wider
    text-text-secondary
  `.trim().replace(/\s+/g, ' '),
};

/**
 * DROPDOWN COMPONENTS
 */
export const arcDropdown = {
  // Dropdown trigger
  trigger: `
    bg-surface-elevated hover:bg-surface-hover
    border border-border hover:border-border-hover
    rounded-xl p-3
    transition-all duration-200
    hover:scale-105
    shadow-glow-secondary
  `.trim().replace(/\s+/g, ' '),

  // Dropdown menu
  menu: `
    min-w-[200px]
    bg-surface-elevated
    border border-border
    rounded-xl
    shadow-surface-elevated
    p-2
    backdrop-blur-arc
  `.trim().replace(/\s+/g, ' '),

  // Dropdown item
  item: `
    flex items-center gap-3
    px-4 py-3
    rounded-lg
    text-sm font-medium
    text-text-secondary hover:text-text-primary
    hover:bg-surface-hover
    transition-all duration-200
    cursor-pointer
  `.trim().replace(/\s+/g, ' '),

  // Dropdown divider
  divider: `
    h-px
    bg-border
    my-2
  `.trim().replace(/\s+/g, ' '),
};

/**
 * UTILITY CLASSES
 */
export const arcUtils = {
  // Backdrop blur
  backdrop: `
    backdrop-blur-arc
    bg-surface/80
  `.trim().replace(/\s+/g, ' '),

  // Divider
  divider: `
    border-t border-border
  `.trim().replace(/\s+/g, ' '),

  // Container
  container: `
    w-full max-w-5xl
    mx-auto
  `.trim().replace(/\s+/g, ' '),

  // Section spacing
  section: `
    space-y-8
  `.trim().replace(/\s+/g, ' '),
};

/**
 * Helper function to combine class names
 * Usage: cn(arcButton.primary, 'mt-4', isActive && 'opacity-50')
 */
export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

