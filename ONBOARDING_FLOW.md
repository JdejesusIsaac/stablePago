# StablePago Onboarding Flow

## Overview

The StablePago onboarding flow seamlessly guides users from the landing page through authentication to the dashboard, all styled with the Arc Network dark theme.

---

## 🎯 User Journey

### 1. **Landing Page** (`/` or `/landing`)

**Route**: Root (`/`) automatically redirects to `/landing`

**Purpose**: Marketing page to introduce StablePago and capture waitlist signups

**Key Features**:
- ✅ Hero section with animated gradient text
- ✅ Feature cards (4 key features)
- ✅ "Why It Matters" section with benefits
- ✅ Waitlist signup form
- ✅ Partners/Technology section
- ✅ Full footer with navigation
- ✅ Mobile-responsive with hamburger menu
- ✅ "Launch App" CTA button in navigation

**CTA Actions**:
- Primary: "Join Wait-List" → Scrolls to waitlist form
- Secondary: "Launch App" → Navigates to `/home`

---

### 2. **Authentication Flow** (`/home`)

**Route**: `/home`

**Purpose**: Handle Crossmint authentication and wallet initialization

**States**:

#### a) Loading State
```typescript
// Shows when wallet/auth is initializing
- Dark background (#0B0C10)
- Spinning pink loader
- "Loading your wallet..." message
```

#### b) Not Logged In
```typescript
// Triggers Crossmint login modal automatically
- Crossmint embedded auth UI appears
- User can sign in with:
  - Google OAuth
  - Email (passwordless)
```

#### c) Logged In
```typescript
// User has authenticated and wallet is ready
- Redirects to MainScreen (dashboard)
- Full access to all features
```

---

### 3. **Dashboard** (via `/home` after auth)

**Component**: `MainScreen`

**Purpose**: Main application interface for wallet operations

**Features**:
- ✅ Wallet balance display
- ✅ Deposit/Send/Withdraw buttons
- ✅ Telegram Shopping Bot delegation
- ✅ Activity feed
- ✅ Coming Soon features
- ✅ Logout functionality

---

## 🎨 Styling Consistency

All pages use the **Arc Network Design System**:

### Color Palette
- Background: `#0B0C10`
- Surface: `#121417`
- Primary (Pink): `#FF005C`
- Secondary (Cyan): `#00F0FF`
- Text: `#FFFFFF` / `#A9B0B7`

### Typography
- Font Family: Inter, Satoshi
- Weights: 400 (normal), 600 (semibold), 700 (bold)

### Components
- Buttons: Rounded (`16px`), with hover glow effects
- Cards: `card-arc` class with elevated surface
- Inputs: Dark background with cyan focus ring
- Modals: Backdrop blur with dark surface

---

## 🔄 Route Structure

```
/                     → Redirects to /landing
├── /landing          → Marketing/landing page
├── /home             → Auth handler + Dashboard
└── /home/page.tsx    → Wrapper for HomeContent
```

---

## 🔐 Authentication Logic

### Crossmint Integration

**File**: `components/Login.tsx`

```typescript
const { login, status } = useAuth();

useEffect(() => {
  if (status === "logged-out") {
    login(); // Automatically triggers Crossmint modal
  }
}, [login, status]);
```

**Flow**:
1. User clicks "Launch App" on landing page
2. Browser navigates to `/home`
3. `HomeContent` checks auth status
4. If not logged in, `Login` component triggers Crossmint modal
5. User authenticates via Google or Email
6. Crossmint creates embedded wallet
7. Dashboard loads with wallet address

---

## 📱 Mobile Responsiveness

### Landing Page
- ✅ Hamburger menu for navigation on mobile
- ✅ Stacked sections on small screens
- ✅ Touch-friendly button sizes
- ✅ Responsive typography scaling

### Dashboard
- ✅ Mobile-optimized card layouts
- ✅ Dropdown menus with touch support
- ✅ Responsive wallet balance display

---

## 🚀 Deployment Notes

### Environment Variables Required

```env
# Crossmint
NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Circle
CIRCLE_API_KEY=...
CIRCLE_ENTITY_SECRET=...

# Telegram (optional)
TELEGRAM_BOT_TOKEN=...

# ElevenLabs (optional)
ELEVENLABS_API_KEY=...
```

### Build Command
```bash
pnpm install
pnpm build
```

### Development
```bash
pnpm dev
# Server starts on http://localhost:3000
```

---

## 🎯 Key Improvements Made

### 1. **Unified Design System**
- All components use Arc Network colors
- Consistent button styles across pages
- Unified typography and spacing

### 2. **Seamless Routing**
- Root redirects to landing
- Clear path from marketing to app
- No broken auth states

### 3. **Enhanced UX**
- Loading states with branded spinners
- Mobile navigation menu
- Click-outside-to-close modals
- Smooth transitions and animations

### 4. **Better Metadata**
- Updated page title and description
- SEO-friendly landing page structure
- Proper semantic HTML

---

## 🔧 Customization Guide

### Update Landing Page Content

**File**: `app/landing/page.tsx`

- Modify headlines in Hero section
- Update feature cards content
- Change waitlist form fields
- Edit footer links

### Update Brand Colors

**File**: `app/globals.css`

```css
:root {
  --primary: #FF005C;     /* Change pink accent */
  --secondary: #00F0FF;   /* Change cyan accent */
  --background: #0B0C10;  /* Change background */
}
```

### Modify Auth Behavior

**File**: `app/home.tsx`

- Customize loading message
- Change redirect logic after login
- Update error handling

---

## ✅ Testing Checklist

- [ ] Landing page loads at root URL
- [ ] "Launch App" button navigates to `/home`
- [ ] Crossmint modal appears for unauthenticated users
- [ ] User can sign in with Google
- [ ] User can sign in with Email
- [ ] Dashboard loads after successful auth
- [ ] Wallet balance displays correctly
- [ ] All buttons maintain Arc styling
- [ ] Mobile menu works on small screens
- [ ] Waitlist form captures email and country
- [ ] Modal close-on-click-outside works

---

## 📞 Support

For questions or issues with the onboarding flow:
- Check Crossmint docs: https://docs.crossmint.com
- Review Supabase Auth: https://supabase.com/docs/guides/auth
- Contact: info@stablepago.com

---

**Last Updated**: October 28, 2025  
**Version**: 2.0 (Arc Network Theme)

