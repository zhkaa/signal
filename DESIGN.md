---
version: alpha
name: Signal
description: A clear research desk for YouTube creators, with a light editorial landing page.
colors:
  primary: '#2459e0'
  ink: '#25292e'
  muted: '#646c7b'
  background: '#f5f6f8'
  surface: '#ffffff'
  border: '#dce1e9'
  sky: '#eaf1ff'
  danger: '#b72e40'
  success: '#16734b'
typography:
  sans:
    fontFamily: 'Geologica Variable, Arial, sans-serif'
  mono:
    fontFamily: 'ui-monospace, monospace'
rounded:
  DEFAULT: '12px'
  card: '24px'
  pill: '999px'
spacing:
  page-max: '1200px'
  section-gap: '88px'
components:
  button:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.surface}'
    rounded: '{rounded.DEFAULT}'
  field:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
  panel:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
  divider:
    backgroundColor: '{colors.border}'
  dialog:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
  mutedText:
    textColor: '{colors.muted}'
  selection:
    backgroundColor: '{colors.sky}'
    textColor: '{colors.primary}'
  error:
    textColor: '{colors.danger}'
  success:
    textColor: '{colors.success}'
---

# Signal Design System

## Overview

Creative North Star: REG.RU's Geologica typography, calm grey page canvas and clear graphite actions, adapted to a YouTube research desk. Audience: Russian and English speaking creators planning videos on desktop and mobile. Hybrid register: `/` explains the product; auth and `/app/*` prioritize task clarity. No Japan market scope.

The memorable signature is a frosted magnifying glass over a coral play tile and blue analysis bars. Keep this expression on the public landing and auth illustration; working tools remain quiet. Avoid neon green, dark dashboard templates and fabricated performance graphs. The requested redesign intentionally replaces the previous Skillfactory-inspired green identity.

Token ownership model B: `src/client/styles/tokens.css` is canonical. This document mirrors it; `main.css` consumes it and the build copies both to public CSS. Colors map to identically named `--primary`, `--ink`, `--muted`, `--background`, `--surface`, `--border`, `--sky`, `--danger`, `--success`. Typography maps to `--font`; radii to `--radius`, `--radius-card`, `--radius-pill`; spacing to `--page-max`, `--section-gap`.

## Colors

White panels sit on cool grey. Blue denotes selection and research actions; graphite public CTAs carry emphasis. Red is reserved for errors and irreversible deletion. Success is green with text. Charts must represent returned data, never invented growth. Light theme only; forced colors must preserve system focus and scrollbars.

## Typography

Locally hosted OFL Geologica, as verified on REG.RU on 2026-10-14. Latin and Cyrillic share the family. Body 15px/1.6, controls 14px/1.4, landing display clamp 38–64px/1.08 with restrained weight 550. App heading 32px/1.2, secondary heading 22px/1.3. Numeric values use tabular figures. Brand wordmark uses Geologica 650.

## Layout

Landing maximum 1200px, 32px side gutters, 88px section gaps. App sidebar 240px, natural document scrolling, content max 1200px. Under 900px navigation becomes an inline disclosure, not a modal drawer. Under 600px gutters reduce to 20px, grids become single column, tables retain horizontal scrolling. Media has intrinsic dimensions; controls reserve pending geometry.

## Elevation & Depth

Prefer tonal backgrounds and 1px borders. Only the illustration annotations, auth form and dialogs use a subtle shadow. No backdrop blur on routine panels. Native modal dialog top layer owns inert background.

## Shapes

Controls 12px, panels 24px, small tags pill shaped. Buttons at least 44px high. Icon containers 44px square, filled with a low contrast contextual tint.

## Components

Buttons share solid brand, solid neutral, outline and ghost emphasis. Hover changes tone; focus uses visible 3px blue outline; disabled uses explicit grey background, readable text and not-allowed cursor, busy preserves size. Inputs are 48px high with text labels, help and app validation. Search uses explicit submit to avoid costly automatic YouTube queries.

Navigation links use URL-backed routes and aria-current. Tables use semantic markup, 12-record server pages and horizontal overflow. The shared live status region owns success, persistent inline region owns errors. Passwords are masked with a localized reveal button. Native selects are accepted for three content types with platform popup ownership. Native HTML dialog owns delete confirmation, cancel focus, Escape and focus restoration.

Iconography: local Lucide sprite, 20px default and 24px cards, stroke 1.8, no invented raster icons. Google provider uses an identifiable G mark and text.

Motion: short 160ms state transitions; a spinner only during requests. Honor reduced motion globally. No perpetual decorative animation. Language changes localize copy, titles, accessible names and Intl dates/numbers; user-created content preserves its language.

## Do's and Don'ts

- Do explain research with concrete creator tasks and limitations.
- Do reuse controls, error handling and spacing on every tool.
- Don't display demo fixtures as a real account or real YouTube data.
- Don't hide authorization failures behind an empty dashboard.
