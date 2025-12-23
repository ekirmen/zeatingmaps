# State Management Overview

## Redux vs. Zustand

- **Redux** is used for global application state that needs to be shared across many components, especially when actions need to be logged, time‑travel debugging is useful, or the state shape is complex (e.g., authentication, user profile, complex UI flows).
- **Zustand** is used for lightweight, local‑ish state that benefits from a simple API and minimal boilerplate. In this project it powers the **cartStore** (seat selection, product reservation) and the **seatLockStore** (locking logic).

## When to use each

| Situation | Recommended Store |
|-----------|-------------------|
| Global data that many parts of the app read/write (auth, user profile, feature flags) | **Redux** (`src/store/...`)
| Simple, isolated state with occasional persistence (cart, seat locks) | **Zustand** (`src/store/...`)
| Need for middleware, devtools, or complex reducers | **Redux**
| Quick state with no reducers needed | **Zustand**

## Data Flow

1. **Auth** – Redux slice `authSlice` holds the current user and token.
2. **Cart** – Zustand store `cartStore` holds selected seats/products and handles lock timers.
3. **Seat Locks** – Zustand store `seatLockStore` interacts directly with Supabase to lock/unlock seats.
4. **Components** – Use `useSelector`/`useDispatch` for Redux data and `useCartStore`/`useSeatLockStore` for Zustand data.

## Guidelines
- Keep Redux reducers pure and avoid side‑effects; use thunks or sagas for async work.
- Keep Zustand stores small; split into separate files if they grow beyond ~150 lines.
- Document any new store in this file with a short description and usage example.

---
*This document lives in `docs/state.md` and is referenced from the project README.*
