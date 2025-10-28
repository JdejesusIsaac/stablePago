# 🎨 Arc Network Component Usage Guide

Complete guide for using the Arc Network component presets in your StablePago dashboard.

---

## 📦 Installation

### Step 1: Tailwind Configuration
The `tailwind.config.ts` file has been created with Arc Network's design tokens:

```ts
// tailwind.config.ts is ready to use!
// It includes:
// - Color palette (primary, secondary, surface, etc.)
// - Custom shadows and glows
// - Arc-specific animations
// - Extended spacing and typography
```

### Step 2: Enable Dark Mode
Add `class="dark"` to your root HTML element:

```tsx
// app/layout.tsx
<html lang="en" className="dark">
  <body>{children}</body>
</html>
```

### Step 3: Import Component Presets
```tsx
import { arcButton, arcCard, arcBalance } from '@/lib/arc-components';
```

---

## 🎯 Component Presets

### 1. **Buttons** (`arcButton`)

#### Primary Button
```tsx
<button className={arcButton.primary}>
  Deposit Funds
</button>
```
**Use for:** Main CTAs, deposit, confirm, submit actions

#### Secondary Button
```tsx
<button className={arcButton.secondary}>
  Send Money
</button>
```
**Use for:** Secondary actions, cancel, view details

#### Ghost Button
```tsx
<button className={arcButton.ghost}>
  Learn More
</button>
```
**Use for:** Tertiary actions, navigation links

#### Danger Button
```tsx
<button className={arcButton.danger}>
  Revoke Access
</button>
```
**Use for:** Destructive actions, delete, revoke

#### Icon Button
```tsx
<button className={arcButton.icon}>
  <DotsVerticalIcon />
</button>
```
**Use for:** Menu triggers, action icons

#### Small Button
```tsx
<button className={arcButton.small}>
  Quick Action
</button>
```
**Use for:** Compact spaces, inline actions

---

### 2. **Cards** (`arcCard`)

#### Default Card
```tsx
<div className={arcCard.default}>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>
```
**Use for:** Standard containers, sections

#### Elevated Card
```tsx
<div className={arcCard.elevated}>
  <p>Important content</p>
</div>
```
**Use for:** Highlighted content, stats

#### Interactive Card
```tsx
<div className={arcCard.interactive}>
  <p>Click me!</p>
</div>
```
**Use for:** Clickable cards, navigation items

#### Card with Primary Glow
```tsx
<div className={arcCard.glowPrimary}>
  <h3>Special Offer</h3>
</div>
```
**Use for:** Important announcements, promotions

#### Card with Secondary Glow
```tsx
<div className={arcCard.glowSecondary}>
  <h3>Active Feature</h3>
</div>
```
**Use for:** Active states, success messages

---

### 3. **Balance Widget** (`arcBalance`)

Complete balance display component:

```tsx
<div className={arcBalance.container}>
  <span className={arcBalance.label}>Your Balance</span>
  <div className="flex items-baseline gap-2">
    <span className={arcBalance.amount}>$1,234.56</span>
    <span className={arcBalance.currency}>USD</span>
  </div>
  <div className="mt-2 flex items-center gap-2">
    <span className={arcBalance.performancePositive}>+2.5%</span>
    <span className="text-text-muted">vs last week</span>
  </div>
</div>
```

#### For Negative Performance
```tsx
<span className={arcBalance.performanceNegative}>-1.2%</span>
```

---

### 4. **Transaction List** (`arcTransaction`)

Complete transaction item:

```tsx
<ul className={arcTransaction.list}>
  {transactions.map((tx) => (
    <li key={tx.id} className={arcTransaction.item}>
      {/* Icon */}
      <div className={tx.isOutgoing 
        ? arcTransaction.iconOutgoing 
        : arcTransaction.iconIncoming
      }>
        <ArrowIcon />
      </div>
      
      {/* Details */}
      <div className="flex-1">
        <div className={arcTransaction.address}>
          {tx.address}
        </div>
        <div className={arcTransaction.timestamp}>
          {tx.timestamp}
        </div>
      </div>
      
      {/* Amount */}
      <div className="text-right">
        <div className={tx.isOutgoing 
          ? arcTransaction.amountOutgoing 
          : arcTransaction.amountIncoming
        }>
          {tx.isOutgoing ? '-' : '+'}{tx.amount}
        </div>
        <div className={arcTransaction.tokenSymbol}>
          {tx.token}
        </div>
      </div>
    </li>
  ))}
</ul>
```

---

### 5. **Input Fields** (`arcInput`)

#### Standard Input
```tsx
<div>
  <label className={arcInput.label}>
    Email Address
  </label>
  <input
    type="email"
    className={arcInput.default}
    placeholder="you@example.com"
  />
  <p className={arcInput.helper}>
    We'll never share your email
  </p>
</div>
```

#### Large Amount Input
```tsx
<input
  type="number"
  className={arcInput.large}
  placeholder="0.00"
/>
```

#### Input with Error
```tsx
<div>
  <input
    type="text"
    className={arcInput.error}
    placeholder="Invalid input"
  />
  <p className={arcInput.errorMessage}>
    This field is required
  </p>
</div>
```

---

### 6. **Badges** (`arcBadge`)

#### Status Badges
```tsx
{/* Active */}
<span className={arcBadge.active}>✓ Active</span>

{/* Inactive */}
<span className={arcBadge.inactive}>Inactive</span>

{/* Pending */}
<span className={arcBadge.pending}>⏳ Pending</span>

{/* Error */}
<span className={arcBadge.error}>✗ Failed</span>

{/* Info */}
<span className={arcBadge.info}>ℹ New</span>

{/* Coming Soon */}
<span className={arcBadge.comingSoon}>Coming Soon</span>
```

---

### 7. **Modal** (`arcModal`)

Complete modal structure:

```tsx
{isOpen && (
  <>
    {/* Overlay */}
    <div 
      className={arcModal.overlay}
      onClick={onClose}
    />
    
    {/* Modal Container */}
    <div className={arcModal.container}>
      <div className={arcModal.content}>
        {/* Header */}
        <div className={arcModal.header}>
          <h2 className={arcModal.title}>
            Modal Title
          </h2>
          <button onClick={onClose}>×</button>
        </div>
        
        {/* Body */}
        <div className={arcModal.body}>
          <p>Modal content goes here</p>
        </div>
        
        {/* Footer */}
        <div className={arcModal.footer}>
          <button className={arcButton.ghost}>
            Cancel
          </button>
          <button className={arcButton.primary}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  </>
)}
```

---

### 8. **Loading States** (`arcLoading`)

#### Spinner
```tsx
<div className="flex justify-center">
  <div className={arcLoading.spinner} />
</div>
```

#### Small Spinner
```tsx
<div className={arcLoading.spinnerSmall} />
```

#### Skeleton Loaders
```tsx
{/* Text skeleton */}
<div className={arcLoading.skeleton} style={{ width: '200px', height: '20px' }} />

{/* Card skeleton */}
<div className={arcLoading.skeletonCard} />
```

---

### 9. **Delegation Cards** (`arcDelegation`)

#### Stat Card
```tsx
<div className={arcDelegation.statCard}>
  <div className={arcDelegation.statLabel}>Daily Limit</div>
  <div className={arcDelegation.statValue}>$50</div>
</div>
```

#### Icon Containers
```tsx
{/* Active state */}
<div className={arcDelegation.iconActive}>
  <ShoppingBagIcon className="h-7 w-7 text-success" />
</div>

{/* Setup state */}
<div className={arcDelegation.iconSetup}>
  <ShoppingBagIcon className="h-7 w-7 text-primary" />
</div>
```

---

### 10. **Typography** (`arcTypography`)

```tsx
{/* Page Heading */}
<h1 className={arcTypography.h1}>Dashboard</h1>

{/* Section Heading */}
<h2 className={arcTypography.h2}>Recent Activity</h2>

{/* Subsection */}
<h3 className={arcTypography.h3}>Settings</h3>

{/* Card Title */}
<h4 className={arcTypography.h4}>Quick Actions</h4>

{/* Body Text */}
<p className={arcTypography.body}>
  This is regular body text with proper line height.
</p>

{/* Small Text */}
<p className={arcTypography.small}>
  Additional information
</p>

{/* Caption */}
<p className={arcTypography.caption}>
  Last updated 5 minutes ago
</p>

{/* Label */}
<span className={arcTypography.label}>Account</span>
```

---

### 11. **Dropdown** (`arcDropdown`)

```tsx
<div className="relative">
  {/* Trigger */}
  <button className={arcDropdown.trigger}>
    <DotsIcon />
  </button>
  
  {/* Menu (shown when open) */}
  {isOpen && (
    <div className={arcDropdown.menu}>
      <button className={arcDropdown.item}>
        <EditIcon />
        Edit
      </button>
      
      <div className={arcDropdown.divider} />
      
      <button className={arcDropdown.item}>
        <DeleteIcon />
        Delete
      </button>
    </div>
  )}
</div>
```

---

### 12. **Utilities** (`arcUtils`)

```tsx
{/* Backdrop Effect */}
<div className={arcUtils.backdrop}>
  Content with glassmorphism
</div>

{/* Divider */}
<hr className={arcUtils.divider} />

{/* Container */}
<div className={arcUtils.container}>
  Centered content, max-width 5xl
</div>

{/* Section Spacing */}
<div className={arcUtils.section}>
  <Component1 />
  <Component2 />
  <Component3 />
</div>
```

---

## 🔧 Advanced Usage

### Combining Classes with `cn()` Helper

```tsx
import { arcButton, cn } from '@/lib/arc-components';

// Combine preset with custom classes
<button className={cn(
  arcButton.primary,
  'mt-4',
  isLoading && 'opacity-50',
  isDisabled && 'cursor-not-allowed'
)}>
  Submit
</button>
```

### Conditional Styling
```tsx
const buttonClass = isLoading 
  ? arcButton.secondary 
  : arcButton.primary;

<button className={buttonClass}>
  {isLoading ? 'Loading...' : 'Submit'}
</button>
```

### Extending Presets
```tsx
// Create custom variants
const myCustomButton = cn(
  arcButton.primary,
  'w-full',
  'text-lg'
);

<button className={myCustomButton}>
  Full Width Large Button
</button>
```

---

## 🎨 Color System Reference

### Direct Color Usage (Tailwind Classes)

```tsx
// Text colors
<span className="text-text-primary">Primary text</span>
<span className="text-text-secondary">Secondary text</span>
<span className="text-text-muted">Muted text</span>

// Background colors
<div className="bg-background">Page background</div>
<div className="bg-surface">Card surface</div>
<div className="bg-surface-elevated">Elevated surface</div>

// Border colors
<div className="border border-border">Default border</div>
<div className="border border-border-hover">Hover border</div>

// Accent colors
<span className="text-primary">Primary accent</span>
<span className="text-secondary">Secondary accent</span>
<span className="text-success">Success (cyan)</span>
<span className="text-error">Error (pink)</span>
<span className="text-warning">Warning (orange)</span>

// Transaction colors
<span className="text-positive">+123.45</span>
<span className="text-negative">-67.89</span>
```

---

## 🚀 Migration from Old Styles

### Before (Old Tailwind)
```tsx
<button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2">
  Click me
</button>
```

### After (Arc Presets)
```tsx
<button className={arcButton.primary}>
  Click me
</button>
```

### Before (Custom Card)
```tsx
<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
  Content
</div>
```

### After (Arc Card)
```tsx
<div className={arcCard.default}>
  Content
</div>
```

---

## 📊 Complete Example: Dashboard Summary

```tsx
import { 
  arcCard, 
  arcButton, 
  arcBalance, 
  arcDropdown,
  cn 
} from '@/lib/arc-components';

export function DashboardSummary() {
  return (
    <div className={arcCard.default}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Balance Section */}
        <div className={arcBalance.container}>
          <span className={arcBalance.label}>Your Balance</span>
          <div className="flex items-baseline gap-2">
            <span className={arcBalance.amount}>$1,234.56</span>
            <span className={arcBalance.currency}>USD</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={arcBalance.performancePositive}>+2.5%</span>
            <span className="text-sm text-text-muted">vs last week</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className={arcButton.primary}>
            + Deposit
          </button>
          <button className={arcButton.secondary}>
            Send
          </button>
          <button className={arcDropdown.trigger}>
            <DotsIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 Best Practices

### DO ✅
- Use presets for consistent styling
- Combine presets with `cn()` helper
- Follow Arc color conventions (pink = primary, cyan = secondary)
- Use appropriate button variants
- Maintain responsive spacing

### DON'T ❌
- Override preset colors directly
- Mix light and dark theme colors
- Use green/blue for primary actions (use pink)
- Skip hover states on interactive elements
- Use arbitrary shadow values

---

## 🐛 Troubleshooting

### Classes Not Applying
**Issue:** Preset classes don't apply styles
**Solution:** Ensure Tailwind config is imported and JIT mode is enabled

### Colors Look Different
**Issue:** Colors don't match Arc Network
**Solution:** Verify dark mode is enabled (`html.dark`)

### Hover Effects Not Working
**Issue:** Hover states don't show
**Solution:** Check `transition-all duration-200` is included

---

## 📚 Additional Resources

- **Tailwind CSS Docs**: https://tailwindcss.com
- **Arc Network Design**: Study Arc's official UI
- **Color Contrast**: Use WebAIM contrast checker

---

**Created**: January 28, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅

