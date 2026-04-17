# Conversation Log — Legal Calculator Integration

Date: 2026-04-17
Project: `budongsan-v2`

## User Intent Summary
- Recreate and refine `/legal` UI/UX based on provided HTML reference.
- Integrate docs content into `/legal`.
- Remove unnecessary sandbox/security monitoring expansions.
- Upgrade to 살집-style layout similar to `/commission`.
- Improve SEO text, FAQ, structured data, and readability.
- Add/reset UX improvements and header navigation link to `/legal`.

## Major Changes Completed

### 1) Legal page implementation and structure
- Built and refined legal calculator page and components.
- Kept form/result/save/basis flows functioning.
- Refined right-side result panel behavior to avoid left column shrink after calculate.

### 2) Removed unnecessary sandbox/security features (per user request)
- Removed sandbox/profile switching flow.
- Removed security event API/UI and related ops pages.
- Removed proxy/middleware-based sandbox blocking.

### 3) Docs integration into `/legal`
- Embedded docs content (`413`) into `/legal`.
- Removed direct `/docs/413` page rendering and set docs detail redirect to `/legal`.
- Simplified docs page as integrated 안내.

### 4) SEO upgrades
- Improved `/legal` metadata copy.
- Added/updated JSON-LD for WebApplication, Article, FAQ, Breadcrumb.
- Added CTR title variants (A/B/C) via `LEGAL_SEO_VARIANT`.
- Synced FAQ UI and FAQ JSON-LD from one shared source:
  - `components/legal/legalFaqData.ts`

### 5) UX improvements
- Added “원상복귀” action and state reset behavior.
- Simplified/tuned form validation feedback.
- Reworked result display to commission-like readability:
  - summary card + compact detailed table.
- Reworked save section UI with richer cards and inline feedback states.

### 6) Header navigation
- Added `/legal` link beside `/commission` in global header.

## Key File Touchpoints
- `app/legal/page.tsx`
- `app/legal/LegalPageClient.tsx`
- `components/legal/*`
- `components/docs/DocsArticlePage.tsx`
- `components/GlobalHeader.tsx`
- `lib/legal/*`
- `styles/legal/*`
- `styles/docs/docs.css`
- `app/docs/page.tsx`
- `app/docs/[id]/page.tsx`

## Final User-Specific Requests Addressed
- Removed specific UI blocks (emoji, history block, attachment links, docs CTA link) as requested.
- Rephrased duplicated intro copy and finally merged intro tabs into one combined guidance block.
- Improved basis explanation formatting for readability and SEO-friendly structure.

## Note
This file is a condensed conversation/task log saved per request.
