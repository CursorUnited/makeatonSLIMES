# Design

<!-- impeccable:design-schema 1 -->

## World

Odoo-style Operate admin software (back office) plus a plain-language consumer portal, extended with an Airtable-influenced structural language: rounded, airy cards, colorful categorical tag chips for metadata (taxes, variants, line attributes), pill-shaped filter/segment controls, and dense, clean grid tables with a sticky header and tabular-numeric alignment. Restrained color strategy — neutrals plus the pinned purple accent for primary actions and state; the Airtable influence shows up in structure and the *categorical* tag palette, not by diluting the pinned brand color's job as the one primary-action color.

## Palette — light (established, pinned)

| Token | Hex | Use |
| --- | --- | --- |
| `primary-700` | `#714B67` | Primary actions, active nav, links, current status-bar step — **pinned brand color, never replaced** |
| `primary-800` | `#5A3B52` | Primary hover/pressed |
| `primary-50` | `#F6F1F5` | Active nav background, selected row (light mode) |
| `gray-900` / `gray-600` / `gray-300` / `gray-50` | `#111827` / `#4B5563` / `#D1D5DB` / `#F9FAFB` | Body text / secondary text / borders / page background |
| `success` / `warning` / `danger` / `info` (`-700`/`-50`) | per UI_UX_SPEC §4.1 | Status semantics only — never decorative |

## Palette — dark (new, this pass)

Tailwind `darkMode: 'class'`, toggled by a `ThemeToggle` in the top bar, persisted to `localStorage('theme')`, defaulting to the user's OS preference on first visit only.

| Surface | Light | Dark |
| --- | --- | --- |
| Page background | `gray-50` | `gray-950` (`#0A0E14`, custom — darker than Tailwind's stock 950 for a calmer admin-at-night feel) |
| Card / table surface | `white` | `gray-900` (`#121826`, custom) |
| Second surface (sidebar, topbar) | `white` | `gray-900` with a 1px `gray-800` border, slightly distinct from content cards |
| Border | `gray-200`/`gray-300` | `gray-800` (`#232B3D`, custom) |
| Body text | `gray-900` | `gray-100` |
| Secondary text | `gray-600` | `gray-400` |
| Primary action | `primary-700` solid | `primary-700` solid, unchanged — already ≥4.5:1 on `gray-900` |
| Active nav / selected row | `primary-50` solid | `primary-700` at 15% opacity (`bg-primary-700/15`), text `primary-300`-equivalent (`#C9A8C0`, custom) for contrast on dark |
| Status badge tints | `success-50`/`warning-50`/etc solid | same hue at 15–20% opacity over the dark surface, text lightened to the `-300` step of that hue so it still passes 4.5:1 |

All dark values ship as named Tailwind colors (`darkbg`, `darksurface`, `darkborder`, `primary.300`) in `tailwind.config.js`, not raw hex in components, so the palette stays swappable from one file.

## Categorical tag chips (new, Airtable-influenced)

A small rotating palette for *metadata*, distinct from the *status* semantic colors above — used for tax chips, variant attribute chips, discount-scope chips, filter pills: teal, amber, blue, pink, violet-gray (5 hues, each a `{bg, text}` pair, light and dark variants). Deterministically assigned by hashing the chip's label so the same tax/attribute always renders the same color across the app. Never used for status (status keeps its fixed semantic color) — this palette is for "which kind of thing is this," not "what state is this in."

## Type

Inter (already loaded), one family, fixed rem scale (no fluid/clamp sizing — this is Operate software, not a marketing page), per UI_UX_SPEC §4.2 sizes unchanged.

## Components — structural additions this pass

- **Card**: default corner radius raised from `rounded-lg` (8px) to `rounded-xl` (12px) on top-level page cards (not nested elements) — the Airtable-ish airier edge. Nested cards still refused (craft-floor ban).
- **Pill filter / segmented control**: new small component for list quick-filters (e.g. invoice status tabs) — rounded-full buttons in a row, active one filled `primary-700`/dark `primary-700`, inactive ones bordered neutral. Replaces plain text-link tabs where the spec called for "tabs."
- **Tag chip**: new small component rendering the categorical palette above, `rounded-full px-2 py-0.5 text-xs font-medium`.
- **DataTable**: header row gets a sticky position on scroll, and a slightly denser `gray-50`/dark `gray-900` tint distinguishing it from body rows more clearly than the previous flat style.
- **Onboarding spotlight tour**: new `OnboardingTour` component — dims the page (backdrop with a cut-out around the target element via a clip-path or layered overlay), a positioned tooltip card (reuses `Card`) with step text, Back/Next/Skip, a progress dots row, keyboard (Esc to skip, arrow keys to step), focus-trapped, completion tracked in `localStorage` per role so it never repeats uninvited; replayable from a "?" help-menu entry in the top bar.

## Motion

150–250ms on state transitions (existing convention, unchanged). Tour step transitions: 200ms ease-out on the spotlight cutout moving between targets. Theme toggle: instant (no cross-fade — a themed toggle that visibly animates every color on the page reads as a loading flash, not a delight).

## FINISH

Unreviewed and undocumented is unfinished; this extension ends with: `vite build` clean, the design hook's findings resolved or consciously accepted, dark mode exercised on every retrofitted screen, and this file kept current with what shipped.
