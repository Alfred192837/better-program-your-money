# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Better Program Your Money — WeChat Mini Program for personal income/expense tracking. Local storage only (`wx.setStorageSync`), single user, no cloud backend.

## Key Architecture

- **Data layer**: `utils/storage.js` — all CRUD on bills and categories. All pages read/write through this module. Keys: `"bills"` (Array), `"categories"` ({expense: [], income: []}).
- **Utility layer**: `utils/util.js` — date formatting, amount formatting, stats calculation, CSV generation.
- **Pages**: 5 pages, 3 tabs (index/statistics/settings). Add and Search are non-tab pages pushed onto nav stack.
- **Edit bills**: Long-press → action sheet → Edit/Delete. Editor shares `pages/add/` with query param `?id=xxx`.

## BillRecord Schema

```js
{ id: number, type: 0|1, category: string, amount: number, date: "YYYY-MM-DD", note: string, createdAt: number }
```

## Theme Colors

- Primary/Income: `#07C160` · Expense: `#E74C3C` · Background: `#F5F5F5` · Card: `#FFFFFF` · Text primary: `#333333` · Text secondary: `#999999`

## Key Decisions

- Amount: required, > 0, max 2 decimal places
- Category: free text input with autocomplete from existing categories
- Date: future dates allowed
- Note: optional, no char limit
- List performance: infinite scroll, 50 records per batch via `scroll-view` + `bindscrolltolower`
- No budget tracking, no cloud sync, no charts library (CSS-only bars for stats)
- Empty states: centered emoji + description text + optional action button (see plan for per-page details)

## Non-Goals

Cloud sync, budget, multi-currency, data import, third-party chart libs, auth, i18n.
