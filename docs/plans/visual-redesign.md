# Visual Redesign Plan — "Washi & Ink"

> **Purpose:** actionable plan to give the Japanese AI Tutor a professional, cohesive visual identity without changing the tech stack (vanilla HTML/CSS/JS, no build tools, no framework) and without restructuring the HTML into shared components.
>
> **Status:** ready for implementation · **Date:** 2026-08-30 · **Scope:** design system + light HTML cleanup · **Direction (user-approved):** Japanese-inspired professional.

---

## 1. Design goals

1. **Credible, not flashy.** The current neon-gradient "AI-SaaS" look reads as a demo. The target reads as a polished product you'd trust with your data — relevant for a privacy-focused thesis project.
2. **One identity, two themes.** Today the app has three unrelated palettes (see audit). The redesign has exactly one hue family — **vermillion** on **warm neutrals** — expressed as *Washi* (light) and *Sumi* (dark).
3. **Japanese-ness through restraint, not decoration.** Vermillion accent (hanko seal), ink-toned text, a Mincho serif used sparingly for the wordmark/Japanese display type, static kana watermark — not emoji flags and floating animated characters.
4. **Accessible by default.** WCAG AA contrast, visible focus states, reduced-motion support.
5. **Shippable at every phase.** The plan is phased so the app stays working after each phase (Phase 1 alone fixes an existing color bug).

---

## 2. Current-state audit (evidence)

| # | Issue | Evidence |
|---|-------|----------|
| A1 | **Dark theme renders an accidental hybrid palette.** `light-theme.css` defines `body.dark-theme` variables that override `style.css :root` (body-level specificity wins) with *different* values (`--background:#0f172a` vs `#0a0e1a`, `--surface:#1e293b` vs `#141824`, `--accent:#f59e0b` amber vs `#06b6d4` cyan). Every page loads both files and the body always carries a theme class, so the override is always active in dark mode. | `frontend/light-theme.css:46-62`, `frontend/style.css:9-45` |
| A2 | Three coexisting palettes: indigo/cyan dark (`style.css`), red/white light (`light-theme.css`), flat Bootstrap-blue review dashboard (`review-dashboard.css` — `#3498db`, `#2ecc71`, `#e74c3c`, white cards). | `style.css:11-15`, `light-theme.css:9-13`, `review-dashboard.css:41-104` |
| A3 | Gradient overuse: 54 `linear-gradient`s across the CSS (15 in `style.css`, 19 in `light-theme.css`, 10 in `landing.css`, 8 in `notebook.css`, 2 in `review-dashboard.css`), plus animated "shine" sweeps on buttons and gradient-clipped text on titles. | `style.css:133-140` (shine `::before`), `login.html:79-85` (gradient text) |
| A4 | Neon glow shadows (`--shadow-glow`, `--shadow-glow-accent`) and scale/translate hover effects everywhere. | `style.css:38-39`, `review-dashboard.css:23-26,51-54` |
| A5 | ~350 lines of inline `<style>` duplicated per auth page, with hardcoded indigo (`rgba(99,102,241,…)` focus rings) that ignores the light theme's red. | `login.html:30-386`, `register.html`, `forgot-password.html`, `reset-password.html`, `verify-email.html` |
| A6 | Emoji as UI chrome: 🇯🇵 as logo/home link, 🤖📚🌐💬📝🎯 feature icons, 👤✨🚀 quick-start icons. No icon set, **no favicon**, no logo file. | `index.html:34,80-112`, header in `chat.html`/`notebook.html` |
| A7 | Theme toggle inconsistencies: absent on all 5 auth pages; `settings.html` has a second, separate `#darkModeToggle`; notebook positions the button differently (`notebook.css` `right:60px` vs `style.css` `right:16px`); landing page uses its own inline toggle script; no `prefers-color-scheme` fallback; sun icon drawn with white strokes (invisible on light backgrounds). | `index.html:15-29,192-230`, `js/ui-utils.js:34-71` |
| A8 | Landing page: three competing CTA rows, two back-to-back "quick start" sections with overlapping content, `v1.5` footer badge contradicting every other version reference, and placeholder footer links using `onclick="alert(…)"`. | `index.html:41-61,117-176,179-189` |
| A9 | Dead/duplicated CSS: malformed `.theme-toggle-button` block (references undefined `--sidebar-bg`), two duplicate `@media (max-width:768px)` blocks, `fadeIn`/`slideUp`/`slideIn` keyframes defined 2–3× across files (16 keyframes total). | `style.css:991-1129,~1905-1919`, `style.css:1427/2549`, `notebook.css:636` |
| A10 | Typo'd class names in production markup: `stat-nuber`, `chedule-card`. | `notebook.html` |
| A11 | Font loaded via CSS `@import` inside `style.css` (blocks parallel downloads); no CJK font configured — Japanese text falls back to system fonts. | `style.css:1` |
| A12 | Review dashboard is permanently light-styled (white cards) even in dark mode. | `review-dashboard.css:41-49` |

---

## 3. Design language: "Washi & Ink"

**Mood:** calm paper, precise ink, one vermillion seal-stamp accent. Quiet surfaces, hairline borders, generous whitespace, typography-led hierarchy.

- **Washi (light theme):** warm off-white paper, ink-black text, vermillion interactive elements. Feels like a well-printed textbook.
- **Sumi (dark theme):** warm charcoal (no blue cast — the current `#0a0e1a` is very blue), warm-white text, brighter vermillion. Feels like ink on stone.
- **Signature details:** vermillion "hanko" buttons (ink text on vermillion in dark mode — like a stamped seal); Mincho serif for the wordmark and Japanese display lines only; a single static kana watermark on landing/auth backgrounds.

---

## 4. Design tokens

New file **`frontend/tokens.css`** — the single source of truth. `style.css` keeps layout/components but references only these variables. `light-theme.css` is **deleted** (its `body.dark-theme` block is the A1 bug).

### 4.1 Color

**Base — dark theme "Sumi" (default, on `:root`):**

| Token | Value | Use |
|---|---|---|
| `--bg` | `#141518` | page background |
| `--surface` | `#1B1D21` | sidebar, cards, bubbles |
| `--surface-2` | `#232529` | hover, raised inputs |
| `--surface-3` | `#2C2E33` | pressed, nested chips |
| `--border` | `#2E3136` | hairline borders |
| `--border-strong` | `#3D4046` | focused borders, dividers |
| `--text-1` | `#F0EEE9` | primary text (warm white) |
| `--text-2` | `#B3B0A8` | secondary text |
| `--text-3` | `#807D75` | muted/meta text |
| `--accent` | `#E05843` | vermillion — buttons, links, active states (4.9:1 on `--bg` ✓) |
| `--accent-hover` | `#E96F5C` | hover step |
| `--accent-contrast` | `#1F120E` | text on vermillion fills (5.7:1 ✓) — the "ink on seal" look |
| `--accent-subtle` | `rgba(224,88,67,0.14)` | user chat bubble, chips, selected items |
| `--success` / `--success-subtle` | `#4CAF82` / `rgba(76,175,130,0.14)` | status |
| `--warning` / `--warning-subtle` | `#E2B341` / `rgba(226,179,65,0.14)` | status |
| `--error` / `--error-subtle` | `#F28671` / `rgba(242,134,113,0.14)` | errors, destructive |
| `--overlay` | `rgba(10,11,13,0.55)` | modal backdrop |
| `--shadow-1` | `0 1px 2px rgba(0,0,0,0.25)` | cards |
| `--shadow-2` | `0 12px 32px rgba(0,0,0,0.45)` | modals, dropdowns |

**Light theme "Washi" (`body.light-theme` overrides — the *only* place theme switching happens):**

| Token | Value | Notes |
|---|---|---|
| `--bg` | `#FAF9F7` | warm paper, never pure white |
| `--surface` | `#FFFFFF` | cards, sidebar |
| `--surface-2` | `#F4F2EE` | hover, inputs |
| `--surface-3` | `#ECE9E3` | pressed, nested |
| `--border` | `#E4E1DA` | hairline |
| `--border-strong` | `#D4D0C7` | |
| `--text-1` | `#26231F` | sumi ink |
| `--text-2` | `#5D5952` | |
| `--text-3` | `#8F8A80` | |
| `--accent` | `#C1272D` | 5.4:1 on `--bg` ✓ (current light-theme red, kept) |
| `--accent-hover` | `#A81E23` | |
| `--accent-contrast` | `#FFFFFF` | 5.8:1 on vermillion ✓ |
| `--accent-subtle` | `#F9E9E7` | |
| `--success` / `--success-subtle` | `#1F7A4D` / `#E3F2EA` | |
| `--warning` / `--warning-subtle` | `#9A6700` / `#FBF3DD` | |
| `--error` / `--error-subtle` | `#B3261E` / `#F9E5E3` | |
| `--overlay` | `rgba(38,35,31,0.45)` | |
| `--shadow-1` | `0 1px 2px rgba(38,35,31,0.06)` | |
| `--shadow-2` | `0 12px 32px rgba(38,35,31,0.14)` | |

Rules:
- No component CSS may contain raw hex colors (exception: none — status tints are tokens too).
- Accent = **interactive** only (buttons, links, active tab, focus). Error = validation/destructive only. Never fill a destructive button with the accent.
- Gradients are removed entirely. The only permitted "fill flourish" is `--accent-subtle`.

### 4.2 Typography

Fonts loaded once in each page's `<head>` (replaces the CSS `@import`, fixes A11):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Shippori+Mincho:wght@600&display=swap" rel="stylesheet">
```

| Token | Value |
|---|---|
| `--font-body` | `'Inter', 'Noto Sans JP', -apple-system, 'Segoe UI', sans-serif` |
| `--font-display` | `'Shippori Mincho', 'Noto Serif JP', serif` — wordmark + Japanese display lines **only** |
| `--font-mono` | `'Monaco','Menlo','Consolas',monospace` (unchanged) |

| Step | Size / line-height | Weight | Use |
|---|---|---|---|
| `--text-xs` | 12px / 1.4 | 500 | meta, timestamps, badges |
| `--text-sm` | 13px / 1.5 | 400 | dense UI, sidebar history |
| `--text-base` | 14px / 1.6 | 400 | body default (chat, forms) |
| `--text-md` | 16px / 1.6 | 400 | inputs, landing copy |
| `--text-lg` | 18px / 1.5 | 600 | card titles |
| `--text-xl` | 22px / 1.35 | 600 | page titles |
| `--text-2xl` | 28px / 1.25 | 700 | section hero |
| `--text-hero` | 48px / 1.15 | 700 | landing H1 only |

Letter-spacing: `-0.01em` on ≥22px headings, `0.02em` on 12px uppercase labels. `Noto Sans JP` gives consistent Japanese glyph metrics in chat and notebook vocabulary cards.

### 4.3 Spacing, radii, z-index, motion

```css
--space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
--space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

--radius-xs: 4px;  /* chips, badges */
--radius-sm: 6px;  /* inputs, small buttons */
--radius-md: 10px; /* buttons, dropdowns */
--radius-lg: 14px; /* cards, modals, message bubbles */
--radius-full: 999px;

--z-dropdown: 100; --z-sticky: 200; --z-overlay: 300;
--z-modal: 400; --z-toast: 500;   /* replaces ad-hoc z-index: 10000 */

--transition-fast: 120ms ease-out;   /* hover, focus */
--transition-base: 180ms ease-out;   /* modals, drawer, theme swap */
```

Motion rules: transitions animate `color/background-color/border-color/opacity/box-shadow` only. No `transform: scale()` hovers, no shine sweeps, no infinite ambient animations. `@media (prefers-reduced-motion: reduce)` disables all transitions/animations except opacity fades.

---

## 5. Theme architecture (fixes A1, A7)

1. **Single source of truth:** `tokens.css` defines Sumi on `:root`, Washi on `body.light-theme`. There is no `body.dark-theme` variable block anywhere — deleting `light-theme.css` removes the conflict (A1) *and* the duplicate toggle styling.
2. **Init order:** every page gets `tokens.css` first, then page CSS. Each page also gets a tiny inline head script that sets `document.body.classList` from `localStorage.theme` **before** first paint (avoids the current flash-of-wrong-theme):
   ```html
   <script>document.body.classList.add((localStorage.getItem('theme') || 'dark') + '-theme');</script>
   ```
3. **`js/ui-utils.js` changes:**
   - `initializeTheme()`: if `localStorage.theme` is unset, use `matchMedia('(prefers-color-scheme: light)')` instead of hardcoding `dark` (keep `'dark'` default when the API is unavailable). Keep the `'theme'` localStorage key — existing users keep their preference.
   - `toggleTheme()` stays the one mutation point (swap class + persist + update icon).
4. **One toggle, everywhere:** the same header toggle button (sprite icons, `aria-pressed`, fixed `right` position from `style.css` — remove the `notebook.css` override) is added to all 5 auth pages and the landing page; the landing's inline script is deleted in favor of `ui-utils.js`. `settings.html`'s `#darkModeToggle` calls the same `toggleTheme()` so the two controls can't desync.
5. **Icon swap fix:** sun/moon icons from the sprite use `currentColor` (no white strokes — fixes the invisible sun on light backgrounds, A7).

---

## 6. Component specifications

Every component: current problem → target treatment.

### 6.1 Buttons (`style.css`)
- **Primary:** solid `--accent`, text `--accent-contrast`, `--radius-md`, height 36px (40px large), no border, no `::before` shine, hover = `--accent-hover`, active = `--surface-3` edge. No `translateY`/`scale`.
- **Secondary:** `--surface` bg + 1px `--border` + `--text-1`; hover: `--surface-2`.
- **Ghost:** transparent, `--text-2`, hover `--surface-2`. Used for icon-only actions (copy, regenerate, delete).
- **Danger:** `--error` text/border on `--error-subtle`; filled `--error` only for confirm dialogs.
- Focus: `outline: 2px solid --accent; outline-offset: 2px` via `:focus-visible`.
- Landing CTAs (`.btn-primary/.btn-cta/.btn-secondary`): 44px height, one primary + one secondary per section max (see 6.9).

### 6.2 Inputs & forms
- Inputs/selects/textareas: `--surface-2` bg (light theme) / `--surface` (dark), 1px `--border`, `--radius-sm`, `--text-md`. Focus: border `--accent` + `0 0 0 3px --accent-subtle` ring — replaces the hardcoded indigo rings in auth pages (A5).
- Labels: `--text-sm` 500 weight, 4px gap. Error text: `--text-xs` in `--error` under the field.
- Auth forms: extracted into **`frontend/auth.css`** shared by the 5 auth pages — one `.auth-container` (centered, static kana watermark at 4% opacity, no floating animation), one `.auth-card` (`--surface`, 1px `--border`, `--radius-lg`, `--shadow-2`, **no `backdrop-filter`**), shared `.form-input`, `.password-toggle`, `.remember-me`, alert banners. Gradient `.auth-title` → plain `--text-1` with the app logo mark above it.

### 6.3 Header & sidebar
- Header: flat `--surface`, 56px, single bottom hairline `--border`. Remove the gradient banner and the 🇯🇵 emoji link → logo mark (SVG) + "日本語 AI Tutor" wordmark (Mincho, 15px) linking home. Right side: model selector, export, theme toggle — consistent order on every page.
- Sidebar: 272px, `--surface`, hairline right border. "New chat" = primary button (no shine); "AI Doc Gen" = secondary; notebook link = secondary with sprite icon. History items: `--text-sm`, hover `--surface-2`, active `--accent-subtle` + 2px `--accent` left indicator (replaces gradient highlight).

### 6.4 Chat
- User bubble: `--accent-subtle` bg, 1px `--border`, `--radius-lg` with 4px tail corner, `--text-1`. Remove gradient + glow.
- Assistant bubble: `--surface` + hairline border. Error bubble: `--error-subtle` + `--error` text.
- `.message-meta`: `--text-xs` `--text-3`; actions are ghost icon buttons that appear on hover (opacity 0 → 1, keyboard-focusable).
- Empty state: Mincho Japanese greeting line in `--accent` + Inter heading in `--text-1` (replaces gradient-clipped H3, A3), suggestion chips as `--surface-2` pills.
- Input area: single `--surface` bar with hairline border; internet/advanced-RAG toggles become labeled switches (`--text-xs` label + track using `--accent` when on — replaces the hardcoded `#4CAF50` green toggle).

### 6.5 Modals & overlays
- Backdrop: `--overlay` (no blur). Modal: `--surface`, `--radius-lg`, `--shadow-2`, max-width 480px, title `--text-lg`, actions right-aligned (secondary + primary). One shared `.modal` implementation replaces the current per-feature overlay classes where feasible without JS changes (keep class names, restyle only).

### 6.6 Notebook (`notebook.css`)
- Tab nav: text tabs with 2px `--accent` underline indicator; active `--text-1` 600, inactive `--text-2`. Removes the pill/gradient tabs.
- Vocabulary cards: `--surface` + hairline, `--radius-lg`; Japanese term 18px (Noto Sans JP), romaji `--text-sm` `--text-3`, meaning `--text-base`. Type badge: `--surface-3` chip, `--text-xs`.
- **JLPT level badges — single-hue ramp** (replaces the current five unrelated colors): N5 `--accent-subtle`/`--text-2` → N1 solid `--accent`/`--accent-contrast`, three tint steps between. Readable in both themes.
- Stat cards & charts: numbers 28px 600 `--text-1` (no gradient text), labels `--text-xs` uppercase `--text-3`; chart bars/lines use `--accent` with `--border` gridlines.
- Form groups follow 6.2. Fix class typos `stat-nuber` → `stat-number`, `chedule-card` → `schedule-card` (grep `frontend/js/*.js` for references first; rename in both places atomically).

### 6.7 Review dashboard (`review-dashboard.css` — full token conversion, fixes A2/A12)
- Stat cards: `--surface`, hairline border, `--radius-lg`, 3px left border in the semantic token (`--accent`/`--success`/`--warning`/`--error`); hover: border-color strengthens, **no translateY**. Numbers 28px 600 `--text-1`; labels `--text-xs` uppercase `--text-3`. Works in dark mode by construction.
- `.refresh-btn` joins the standard secondary button. `.stat-box` list rows: hairline dividers, `--text-sm`.
- SM-2 stats/leech panels follow the same card treatment with `--success`/`--warning`/`--error` left borders.

### 6.8 Toasts & notifications
- `--surface` bg + hairline + `--shadow-2`, 3px left border in the status token, `--text-sm`, auto-dismiss; replaces glow-styled toasts and the inline-`style.cssText` notification built in `ui-utils.js` (move those inline styles into a `.toast--info/--success/--error` class).

### 6.9 Landing page (`landing.css` + `index.html`)
- **Hero:** eyebrow label `AI-POWERED JAPANESE LEARNING` (12px uppercase, `--text-3`), H1 48px `--text-1` ("Japanese AI Tutor"), Japanese subtitle in Mincho `--accent`, one description line, **two CTAs**: *Get Started* (primary → register) + *Sign In* (secondary); "Try as guest" becomes a plain text link beneath. Removes the 3-button row (A8).
- Background: remove `floating-character` animation, sparkles and `titleGlow`; keep **one static kana column** ("あいうえお" vertical, Mincho, 4% opacity, `writing-mode: vertical-rl`) — identity without motion.
- Features: 3×2 grid; each card gets a 40px sprite icon in an `--accent-subtle` rounded square (replaces emoji, A6), h3 `--text-lg`, p `--text-sm` `--text-2`.
- Merge the two quick-start sections into **one** "Ready to begin?" 3-step strip (numbered 1-2-3 chips in `--accent-subtle`).
- Footer: real links (User Guide `docs/guides/user-guide.md` → served path or `#` removed entirely — ship only links that work), version badge **removed** (CHANGELOG is the source of truth). No `onclick="alert()"`.
- Delete the inline theme script (use shared `ui-utils.js` + head init script).

### 6.10 Settings & profile pages
- Settings groups: `--surface` cards with hairline dividers per row (label + control). The appearance row's `#darkModeToggle` becomes a proper labeled switch calling `toggleTheme()` (see §5). Danger zone (delete account) separated with `--error-subtle` panel.

---

## 7. Icon system & brand assets (fixes A6)

1. **`frontend/icons.svg`** — one SVG sprite (24×24 viewBox, `fill="currentColor"`, stroke icons at 1.75px). Icons: `logo, sun, moon, send, plus, notebook, book, export, globe, search, user, settings, chevron-down, chevron-right, trash, edit, check, x, refresh, menu`. Usage: `<svg class="icon"><use href="icons.svg#send"/></svg>` (same-origin external sprite; works in all evergreen browsers).
2. **Emoji policy:** UI chrome (buttons, nav, headers, feature cards) uses sprite icons only. Emoji may remain *inside user-facing content* (chat suggestions, empty-state copy) where they read as content, not decoration.
3. **Favicon:** `frontend/favicon.svg` — vermillion (`#C1272D`) rounded square, white 日 glyph, Mincho-style strokes. Link in all pages: `<link rel="icon" type="image/svg+xml" href="favicon.svg">`.
4. **Logo mark:** same 日 tile at 24px inline SVG (duplicated inline in header/auth/landing rather than sprite, so it inherits nothing from surrounding CSS) + wordmark "日本語 AI Tutor" in `--font-display` 15px.
5. Deduplicate the sun/moon/send/arrow SVG paths currently copy-pasted into every HTML file.

---

## 8. Page-by-page edit list

| Page | CSS | HTML |
|---|---|---|
| `index.html` | `landing.css` rework (§6.9) | hero restructure, merge quick-starts, remove floating kana + inline theme script + `v1.5` badge + alert links, icons, favicon, fonts `<link>`, tokens.css |
| `login.html` / `register.html` / `forgot-password.html` / `reset-password.html` / `verify-email.html` | extract inline `<style>` → `auth.css` (§6.2) | remove inline style blocks + floating kana, add theme toggle, logo, favicon, fonts, tokens.css |
| `chat.html` | `style.css` (§6.1–6.5, 6.8) | header logo/toggle swap, icon swap, favicon, fonts, tokens.css, head init script |
| `guest-chat.html` | same as chat | same + remove 2 stray inline styles |
| `notebook.html` | `notebook.css` + `review-dashboard.css` (§6.6–6.7) | tab markup unchanged, badge/icon swap, class typo fixes, favicon, fonts, tokens.css |
| `profile.html` | `style.css` | icons, favicon, fonts, tokens.css |
| `settings.html` | `style.css` (§6.10) | sync `#darkModeToggle` with `toggleTheme()`, favicon, fonts, tokens.css |

**CSS file operations:** add `tokens.css`, `auth.css`, `icons.svg`, `favicon.svg`; delete `light-theme.css` (remove its `<link>` from all 11 pages); rewrite `style.css` (remove `:root` block, dead `.theme-toggle-button`, duplicate `@media` blocks, dedupe keyframes to one `fadeIn`/`slideUp`/`spin` set, remove `@import` line); token-convert `notebook.css`, `review-dashboard.css`, `landing.css`.

---

## 9. Accessibility bar

- **Contrast (target AA ≥ 4.5:1 body, ≥ 3:1 large text/UI):** verified pairs — `--text-1/2` on `--bg`/`--surface` both themes; `--accent` as text on `--bg` (4.9:1 dark, 5.4:1 light); `--accent-contrast` on `--accent` (5.7:1 dark, 5.8:1 light); `--text-3` used only for ≥12px non-essential meta (exempt-ish, still ≥4.5:1 on both `--bg`s: dark `#807D75` on `#141518` ≈ 4.6:1, light `#8F8A80` on `#FAF9F7` ≈ 3.4:1 — **bump light `--text-3` to `#7A756C` (4.6:1) during implementation**).
- **Focus:** every interactive element gets `:focus-visible` (2px `--accent` outline, 2px offset). Modals trap focus; ESC closes (verify existing JS, add if missing).
- **Motion:** `prefers-reduced-motion: reduce` → transitions ≤opacity, no transforms.
- **Targets:** ≥44×44px for primary actions (buttons, toggles, icon buttons get 32px visual in 40px hit area).
- **Semantics:** theme toggle exposes `aria-pressed`; icon-only buttons get `aria-label`; switches are `<button role="switch" aria-checked>`; toasts use `role="status"`/`role="alert"`.
- Verification: browser DevTools contrast checker per pair + axe DevTools scan on each page in both themes.

---

## 10. Implementation phases

Each phase ends with the app shippable. Estimated effort assumes careful manual CSS work (no build tools).

| Phase | Content | Files | Risk |
|---|---|---|---|
| **P1 Tokens & theme fix** | Create `tokens.css`; swap `<link>` order in all 11 pages (tokens first, drop `light-theme.css`); delete `body.dark-theme` conflict; head init script; favicon. Fixes the live dark-mode bug (A1) immediately. App looks different-but-consistent. | `tokens.css`, 11× HTML heads, delete `light-theme.css` | Low |
| **P2 Core components** | `style.css` migration: buttons, inputs, header, sidebar, chat, modals, toasts; remove dead CSS + dup keyframes + `@import`; `ui-utils.js` theme fallback + toast classes. | `style.css`, `ui-utils.js`, `app-init.js` | Medium (largest file) |
| **P3 Notebook & review** | Token-convert `notebook.css` + `review-dashboard.css`; tabs, badges ramp, stat cards; class typo renames (grep JS first). | `notebook.css`, `review-dashboard.css`, `notebook.html`, `js/notebook-api.js`, `js/review-dashboard.js` | Medium |
| **P4 Auth pages** | Create `auth.css`; strip inline `<style>` from 5 pages; add theme toggle + logo; static kana watermark. | `auth.css`, 5× auth HTML | Low |
| **P5 Landing** | `landing.css` + `index.html` restructure per §6.9. | `landing.css`, `index.html` | Low |
| **P6 Icons & brand** | `icons.svg` sprite, favicon already in P1 (finalize mark), replace emoji chrome, dedupe inline SVGs. | `icons.svg`, most HTML files | Low |
| **P7 A11y & QA sweep** | Focus states audit, aria attributes, contrast measurements, reduced-motion, QA matrix below; fix leftovers. | all | Low |

Suggested order note: P1 alone is worth shipping if time is short — it resolves the hybrid-palette bug and unifies hue.

---

## 11. QA checklist (run per phase, full pass in P7)

For **each of the 11 pages × both themes**:

- [ ] No raw hex colors rendered (visual sniff: one accent hue everywhere)
- [ ] Text meets AA (spot-check: meta text, buttons, badges, placeholders)
- [ ] Theme toggles persist across reload and navigation between pages
- [ ] Focus ring visible on all buttons/inputs/links (tab through)
- [ ] No console errors; no missing CSS files (404s)
- [ ] Mobile 375px: sidebar overlays, inputs usable, tables scroll

Page-specific: chat (send/regenerate/export icons, markdown code blocks, long Japanese strings wrap correctly with Noto Sans JP); notebook (5 tabs, badge ramp N5→N1, review dashboard in **dark** mode); auth (5 pages incl. password toggle + error states); landing (hero CTAs, no animations after reduced-motion).

---

## 12. Out of scope / future work

- Extracting the repeated header/sidebar markup into a shared JS-injected component (would remove ~200 lines/page of duplication — worth it, but explicitly excluded from this pass).
- Any framework/build-tool migration; the Flutter demo in `demo_frontend_and_testing/`; backend changes; content/copywriting beyond the landing page structure fixes.
- A "system" theme option (auto light/dark following OS) — the `prefers-color-scheme` groundwork from §5 makes this a ~10-line addition later.
