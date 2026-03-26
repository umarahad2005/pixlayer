---
name: Design System (Stitch MCP)
description: PIXLAYER design tokens, Stitch MCP integration for generating UI screens and applying design systems
---

# Design System — Stitch MCP Integration

## PIXLAYER Design Tokens

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `px-bg` | `#0D0D0F` | Main background |
| `px-surface` | `#141416` | Panels, cards, modals |
| `px-surface-elevated` | `#1A1A1E` | Hover states on panels |
| `px-border` | `#1E1E22` | All borders |
| `px-accent` | `#6C63FF` | Primary accent (electric indigo) |
| `px-accent-hover` | `#8B85FF` | Accent hover state |
| `px-accent-glow` | `rgba(108, 99, 255, 0.15)` | Glow effects around accent elements |
| `px-text` | `#E4E4E7` | Primary text |
| `px-text-muted` | `#71717A` | Secondary/muted text |
| `px-success` | `#22C55E` | Success states |
| `px-warning` | `#F59E0B` | Warning states |
| `px-error` | `#EF4444` | Error states |

### Typography
| Font | Family | Usage |
|------|--------|-------|
| Syne | `'Syne', sans-serif` | Display headings, hero text |
| JetBrains Mono | `'JetBrains Mono', monospace` | UI labels, tool names, badges, code |
| Inter | `'Inter', sans-serif` | Body text, descriptions, form inputs |

### Spacing & Shape
- Border radius: `2px` (sharp, minimal rounding — NOT rounded-corner bloat)
- Panel borders: `1px solid #1E1E22`
- Transitions: `all 150ms ease`
- Shadows: Minimal. Use `0 4px 24px rgba(0,0,0,0.5)` for modals only

## Using Stitch MCP

### Step 1: Create a Stitch Project
```
Tool: mcp_StitchMCP_create_project
Args: { title: "PIXLAYER" }
```
Save the returned `projectId` for all subsequent calls.

### Step 2: Create a Design System
```
Tool: mcp_StitchMCP_create_design_system
Args: {
  projectId: "<projectId>",
  designSystem: {
    displayName: "PIXLAYER Dark",
    colorPalette: {
      primary: "#6C63FF",
      preset: "CUSTOM"
    },
    typography: {
      fontFamily: "Inter"
    },
    shape: {
      cornerRadius: "SHARP"
    },
    appearance: {
      lightModeBackgroundColor: "#0D0D0F",
      darkModeBackgroundColor: "#0D0D0F"
    },
    designMd: "Dark premium creative tool UI. Obsidian backgrounds, electric indigo accents. Sharp edges, no rounded corners. Monospaced labels. Think Figma meets Linear."
  }
}
```

### Step 3: Update & Apply Design System
After creation, immediately call `update_design_system` to display it, then `apply_design_system` to apply to screens.

### Step 4: Generate Screens
```
Tool: mcp_StitchMCP_generate_screen_from_text
Args: {
  projectId: "<projectId>",
  prompt: "PIXLAYER landing page - dark premium SaaS. Hero: 'From flat AI output to layered design file. Instantly.' CTA buttons: 'Start for Free' (indigo), 'See how it works' (ghost). Dark #0D0D0F background, #6C63FF accent.",
  deviceType: "DESKTOP"
}
```

### Screen Generation Prompts by Page

#### Landing Page
```
PIXLAYER landing page. Dark SaaS (#0D0D0F bg). Hero section with large Syne font heading "From flat AI output to layered design file. Instantly." Subtitle in Inter: "Upload any AI-generated image. Our AI segments it into layers. Export as SVG, PSD, or Figma." Two CTA buttons: "Start for Free" (filled #6C63FF) and "See how it works" (outlined ghost). Features grid below showing 3 cards: Segment, Inpaint, Export.
```

#### Dashboard
```
PIXLAYER dashboard. Dark bg #0D0D0F. Top bar with user greeting "Welcome back, [Name]" and plan badge. Credits indicator (circular progress). Grid of recent project cards with thumbnails and metadata. "New Project" button with + icon. Upgrade CTA card for free users.
```

#### Editor
```
PIXLAYER editor. 3-panel layout. Left: Layer panel (240px, dark #141416) with layer list items showing thumbnails, eye/lock icons, drag handles. Center: Canvas area with image on checkerboard pattern. Right: Properties panel (260px) showing image metadata and inpainting options. Top bar with logo, project name, tool toggles, export button.
```

## CSS Variables (global.css)
```css
:root {
  --px-bg: #0D0D0F;
  --px-surface: #141416;
  --px-surface-elevated: #1A1A1E;
  --px-border: #1E1E22;
  --px-accent: #6C63FF;
  --px-accent-hover: #8B85FF;
  --px-accent-glow: rgba(108, 99, 255, 0.15);
  --px-text: #E4E4E7;
  --px-text-muted: #71717A;
  --px-success: #22C55E;
  --px-warning: #F59E0B;
  --px-error: #EF4444;
  --px-font-display: 'Syne', sans-serif;
  --px-font-mono: 'JetBrains Mono', monospace;
  --px-font-body: 'Inter', sans-serif;
  --px-radius: 2px;
  --px-transition: all 150ms ease;
}
```
