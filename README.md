# Folioboard — Visual Board & Notes for Creative Work

A web application designed for organizing creative projects, moodboards, brainstorms, and design systems visually on an infinite canvas.

Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Vite**.

---

## ✨ Features

- **Infinite Canvas & Navigation:**
  - Smooth pan & zoom (mouse drag, wheel, pinch, and zoom controls from 25% to 250%).
  - Folioboard signature dot-grid background with snap-to-grid toggle (20px grid).
  - Marquee box selection (`Shift + Drag`) to select and move multiple elements together.

- **Creative Element Tools (Left Dock):**
  - 📝 **Notes:** Sticky notes with customizable fonts (Serif/Sans), sizes, and colors.
  - ☁️ **Media & Uploads:** Image and video cards with aspect-ratio preservation, captions, video playback, and lightbox preview.
  - 📎 **Files & Documents:** Attachment cards with file format badges and instant download.
  - 🔗 **Links:** Rich bookmarks with domain pills, titles, descriptions, and one-click external navigation.
  - ✅ **To-Do / Checklists:** Progress bar tracking, strikethrough animations, and completion confetti.
  - 📁 **Nested Sub-Boards:** Sub-boards that allow infinite hierarchical navigation with breadcrumbs.
  - 🗂️ **Columns:** Column stacks to group related cards together vertically.
  - 🎨 **Color Swatches:** Curated color swatches with one-click hex copying and custom color picker.
  - ✏️ **Sketches:** In-card freehand drawing canvas with multiple pen colors and stroke sizes.

- **Interactive Connections (Lines & Arrows):**
  - Smooth cubic Bezier connector curves with directional arrowheads.
  - 4 directional connection anchors (top, right, bottom, left) on every card.
  - Midpoint editable labels and click-to-delete support.

- **Context Floating Action Bar:**
  - Appears right above selected elements.
  - Quick pastel color palette swatches, duplication (`Ctrl+D`), layering (z-index), and deletion (`Del`).

- **Local-First & Data Portability:**
  - Auto-saved state via `localStorage`.
  - Global quick search across all cards with `⌘K` / `Ctrl+K`.
  - Export to formatted **Markdown** (`.md`), full **JSON** backup, or Print to PDF.
  - Preloaded templates: *Brand Identity & Moodboard*, *Film Storyboard*, and *Blank Canvas*.

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/hariharan-uiux/folioboard.git
cd folioboard

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm run preview
```

---

## 🛠️ Architecture

- `src/types/folioboard.ts`: Data types for canvas elements, boards, connections, and state models.
- `src/components/Canvas.tsx`: Infinite board viewport transformer, drag & drop, selection, and connectors.
- `src/components/Sidebar.tsx`: Folioboard tool dock with draggable element handles.
- `src/components/Header.tsx`: Breadcrumb trail, search trigger, theme switcher, and export controls.
- `src/components/ConnectionLines.tsx`: SVG Bezier curve engine with anchors and markers.
- `src/components/FloatingToolbar.tsx`: Contextual card action bar.
- `src/components/elements/*`: Individual renderers for Notes, Images/Videos, Links, Tasks, Boards, Colors, Sketches, Columns, and Files.
- `src/utils/storage.ts`: Local-first persistence, JSON backup/restore, and Markdown document generation.
- `src/utils/templates.ts`: Preloaded creative project templates.

---

## 📄 License
MIT
