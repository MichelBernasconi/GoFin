# GoFin Best Practices

## 🏛️ Architecture
- **Component Driven**: Split UI into small, reusable components in `src/components/`.
- **Logic Separation**: Keep heavy data processing in the Rust backend (`src-tauri/src/lib.rs`).
- **State Management**: Use React hooks (`useState`, `useEffect`) for local state; keep the main state in `App.jsx` and pass via props.

## 💻 Coding Style (Frontend)
- **Styling**: Use global CSS variables and classes defined in `index.css`. **NEVER** use inline `style={{...}}` objects for layout or complex design; reserve them only for purely dynamic values (like position or colors driven by data).
- **Naming Consistency**: Use `camelCase` for all frontend variables and standard names across components (e.g., use `startDate` and `endDate` everywhere, avoid `start` or `date_start`).
- **Safety**: Always use the `formatCurrency` and `formatDate` utilities to ensure consistent presentation across all views.
- **Constants**: Store all static data, initial states, and dropdown options in `src/utils/constants.js`.

## 🦀 Backend (Rust)
- **Precision**: Always use `rust_decimal` for financial calculations. NEVER use `f64` for money logic.
- **Error Handling**: Use `Result<T, String>` for all Tauri commands to provide clear feedback to the UI.
- **Memory**: Keep large datasets in the backend as much as possible; send only what's needed for visualization to the frontend.

## 🧪 Strategy Development
- **Modularity**: Design strategies to be parameterizable (e.g., input periods, thresholds).
- **Standards**: Follow the standard formats (Rust modules, Python/Backtrader classes) to ensure portability.
