# 🚀 AGENT_FRONTEND.md

## Frontend Development Rules (React + Tailwind + shadcn)

---

# 🧠 PURPOSE

This document ensures:

- Consistent UI across all contributors
- Predictable structure for developers and AI agents
- Scalable component architecture
- Smooth collaboration with minimal conflicts

👉 This is a **guideline + contract** between:

- Developers 👨‍💻
- AI agents 🤖

---

# ⚙️ TECH STACK (LOCKED)

- React (Vite)
- Tailwind CSS
- shadcn/ui
- (Optional) Framer Motion

❌ Do not introduce additional UI frameworks or styling systems.

---

# 🎨 DESIGN SYSTEM

## 1. Global Theme Tokens (SOURCE OF TRUTH)

All visual styling must derive from global tokens.

```css
:root {
  --primary: 262 83% 58%;
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --card: 222 47% 14%;
  --muted: 215 20% 65%;
  --accent: 262 83% 70%;
  --radius: 12px;
}
```

---

## 🎯 RULES

### ✅ DO

- Use semantic tokens (primary, background, etc.)
- Keep spacing and layout consistent
- Extend tokens carefully if needed

### ❌ AVOID

- Hardcoding colors like `bg-blue-500`
- Mixing multiple design styles
- Creating visually inconsistent components

---

## 💡 EXAMPLE

✅ Good:

```tsx
<div className="bg-background text-foreground">
```

❌ Bad:

```tsx
<div className="bg-blue-500 text-white">
```

---

# 🧩 COMPONENT SYSTEM (VERY IMPORTANT)

## 2. Base UI Layer → `/components/ui`

- Generated using shadcn
- Contains reusable UI primitives

Examples (not exhaustive):

- Buttons
- Cards
- Inputs
- Dialogs
- Dropdowns
- Forms
- Tabs
- Alerts

👉 Think of these as **building blocks**, not final UI.

---

## 🧠 HOW TO USE SHADCN COMPONENTS

### PRINCIPLE:

> Do not reinvent — reuse and compose

---

### ✅ CORRECT USAGE

```tsx
import { Button } from "@/components/ui/button";

<Button>Submit</Button>;
```

---

### ❌ WRONG USAGE

```tsx
<button className="bg-purple-500 px-4 py-2 rounded">Submit</button>
```

---

## 🔄 EXTENDING COMPONENTS (IMPORTANT)

Instead of modifying base components directly:

### ✅ Wrap or compose

```tsx
import { Card } from "@/components/ui/card";

export function InfoCard({ children }) {
  return <Card className="p-4">{children}</Card>;
}
```

---

## 🚫 AVOID

- Editing shadcn core files unnecessarily
- Creating duplicate UI patterns
- Mixing raw HTML with existing components inconsistently

---

# 🧱 SHARED COMPONENTS LAYER

## Location:

```bash
/components/shared/
```

---

## PURPOSE

- Combine UI primitives into reusable patterns
- Maintain consistency across pages
- Avoid duplication

---

## EXAMPLES

- Layout wrappers
- Navigation bars
- Reusable sections
- Feature blocks

---

## 💡 EXAMPLE

```tsx
import { Card } from "@/components/ui/card";

export function FeatureBlock({ title, description }) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted">{description}</p>
    </Card>
  );
}
```

---

## RULE

👉 If something is reused 2+ times → move to shared components

---

# 🧱 LAYOUT SYSTEM

## PRINCIPLES

- Separate layout from content
- Maintain consistent spacing
- Use reusable layout wrappers

---

## EXAMPLE

```tsx
export function PageLayout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="p-6">{children}</main>
    </div>
  );
}
```

---

## USAGE

```tsx
<PageLayout>
  <Dashboard />
</PageLayout>
```

---

# 🎬 ANIMATION GUIDELINES

## TOOL

- Framer Motion

---

## RULES

- Enhance UX, not distract
- Keep animations consistent across app
- Wrap components instead of modifying them

---

## EXAMPLE

```tsx
import { motion } from "framer-motion";

<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
  <Card />
</motion.div>;
```

---

## ❌ AVOID

- Random animation styles
- Overuse of motion effects
- Performance-heavy animations

---

# 🌌 ADVANCED UI (CANVAS / EFFECTS)

## ALLOWED

- Canvas backgrounds
- Particle effects
- Visual enhancements

---

## RULES

- Must stay in background layer
- Must not interfere with UI usability
- Must be lightweight

---

## EXAMPLE STRUCTURE

```tsx
<div className="relative">
  <CanvasEffect />

  <div className="relative z-10">
    <MainUI />
  </div>
</div>
```

---

# 📁 PROJECT STRUCTURE

```bash
frontend/
  src/
    components/
      ui/
      shared/

    pages/

    hooks/

    services/

    lib/

    styles/
      globals.css

    App.tsx
    main.tsx
```

---

# 📄 RESPONSIBILITIES

## components/ui/

- Base UI primitives (shadcn)

## components/shared/

- Reusable compositions

## pages/

- Page-level implementations

## services/

- API logic

---

# 🔗 API RULES

## PRINCIPLE

Separate UI from data logic.

---

## EXAMPLE

```ts
// services/api.ts
export async function fetchData() {
  return fetch("/api/data").then((res) => res.json());
}
```

---

## ❌ AVOID

- API calls inside JSX
- Mixing UI + business logic

---

# 🌿 TEAM WORKFLOW

## BRANCHING

```bash
main
 └── dev
      ├── feature/*
```

---

# 🤖 AI AGENT GUIDELINES

## ALWAYS PROVIDE CONTEXT

- This file
- Project structure
- Existing components

---

## AI SHOULD

- Reuse components
- Follow patterns
- Respect tokens
- Maintain consistency

---

## AI SHOULD NOT

- Create new design systems
- Ignore shared components
- Introduce inconsistencies

---

# 🏆 SUCCESS CRITERIA

- UI feels like ONE product
- No visual inconsistencies
- Easy to extend
- Clean and understandable codebase

---

# 🔥 FINAL NOTE

This is a **living system**.

👉 Extend when needed
👉 But never break consistency

---
