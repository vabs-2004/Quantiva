# AI Context: Quantiva (DRDO / GitHappens)

This document provides a comprehensive overview of the Quantiva project. **Any AI assistant working on this codebase should read this file first** to understand the architecture, tech stack, and coding conventions to avoid breaking existing patterns.

---

## 1. Project Overview

**Name:** Quantiva  
**Organization:** GitHappens 
**Purpose:** An interactive platform for quantum algorithm research, simulation, and experimentation. Users can learn about quantum computing, run quantum circuits, visualize qubits on a Bloch sphere, and execute algorithms using an IBM Qiskit backend.

---

## 2. Tech Stack

### Frontend
- **Core:** React 19, Vite, React Router v7
- **Styling:** Tailwind CSS v4, Vanilla CSS (with extensive CSS Variables)
- **Animations:** Framer Motion
- **Smooth Scrolling:** Lenis (via a custom `useSmoothScroll` hook)
- **3D Visualization:** `@react-three/fiber`, `@react-three/drei` (for Bloch spheres and Quantum Atoms)
- **Code Highlighting/Math:** PrismJS, KaTeX
- **State Management:** React Context API (`AuthContext`, `AlgorithmContext`, `ThemeContext`)

### Backend
- **Core:** Node.js / Express
- **Quantum Execution Environment:** Python, Jupyter Notebooks (`papermill`), IBM Qiskit
- **Execution Flow:** The Express backend receives API requests, spins up a Python process running `papermill` to execute a Qiskit notebook, and returns the output (circuits, measurements, histograms).

---

## 3. Frontend Architecture

The React frontend is structured as follows:

```text
src/
├── components/   # Reusable UI elements (Navbar, Sidebar, Footer, ThemeToggle, etc.)
├── context/      # Global state providers (AuthContext, AlgorithmContext, ThemeContext)
├── data/         # Fallback static data (e.g., algorithms.js)
├── hooks/        # Custom React hooks (e.g., useSmoothScroll.js)
├── layouts/      # Layout wrappers (e.g., MainLayout.jsx for post-login view)
├── pages/        # Route views (LandingPage, Dashboard, AlgorithmPage, Docs, Sandbox, etc.)
├── routes/       # Routing configuration (AppRoutes.jsx)
├── services/     # API client functions (api.js)
├── utils/        # Constants and helpers (constants.js)
├── App.jsx       # Root App component (Providers + Router)
└── index.css     # Global styles & Theme System (CRITICAL)
```

---

## 4. Theming System (CRITICAL)

The application features a robust Dark/Light theme toggle. **You must NEVER use hardcoded Tailwind color utilities for backgrounds, borders, or text (e.g., `bg-gray-900`, `text-blue-500`).**

Instead, **always use the CSS variables defined in `src/index.css`.** The theme is toggled by changing the `data-theme` attribute on the `<html>` tag, which updates the variables.

### Key CSS Variables (Use these via `var(--variable-name)` or style objects):
- **Backgrounds:** `--color-app-base`, `--color-app-surface`, `--color-app-surface-hover`
- **Text:** `--color-app-text-main`, `--color-app-text-muted`, `--color-app-text-light`
- **Accents:** `--color-app-primary`, `--color-app-primary-hover`, `--color-app-accent`
- **Borders/Glass:** `--color-app-border`, `--color-app-glass`

**Example:**
```jsx
// DO NOT DO THIS:
<div className="bg-white dark:bg-gray-900 text-black dark:text-white border-gray-200">...</div>

// DO THIS:
<div style={{ background: "var(--color-app-surface)", color: "var(--color-app-text-main)", border: "1px solid var(--color-app-border)" }}>...</div>
```
There are also utility classes in `index.css` like `.app-glass`, `.app-card-hover`, and `.app-gradient-line` which automatically adapt to the theme.

---

## 5. Routing & Layouts

- **Public Routes:** Landing (`/`), Login (`/login`), Docs (`/docs`), Blogs (`/blogs`), News (`/news`). These pages import the `Navbar` directly and are full-screen.
- **Protected Routes:** Dashboard (`/dashboard`), Algorithm (`/algorithm/:id`), Sandbox (`/sandbox`), Playground (`/playground`). These routes are wrapped in `ProtectedRoute` and `MainLayout` (which contains the `Navbar` and the post-login `Sidebar`).
- **Page Transitions:** Every route component in `AppRoutes.jsx` is wrapped in the `<AnimatedPage>` component to trigger Framer Motion exit/enter transitions.

---

## 6. Algorithm Data Structure

Algorithms are strictly ordered by a "Series" (e.g., Deutsch -> Deutsch-Jozsa -> Bernstein-Vazirani -> Simon's -> Grover's -> Shor's). 
They are **not** grouped by random categories. The exact display order is governed by `ALGORITHM_SERIES_ORDER` in `src/utils/constants.js`.

---

## 7. Commands & Execution

- **Start the Application (Dev):** 
  ```bash
  npm run dev
  ```
  *This uses `concurrently` to launch both the Vite frontend server and the Node backend server simultaneously.*
- **Build the Application:**
  ```bash
  npm run build
  ```

---

## 8. Backend Security & Environment

- **Security Middleware:** The backend uses `helmet` (HTTP headers), `express-rate-limit` (DDoS protection), and `express-mongo-sanitize` (NoSQL injection prevention).
- **Sanitization:** User-submitted HTML content (like blogs and docs) is sanitized server-side using `DOMPurify` to prevent XSS. It is specifically configured to allow safe `iframe` and `video` tags for YouTube embeds.
- **Secrets Management:** All secrets (`JWT_SECRET`, `MONGO_URI`, Cloudinary credentials) are managed via a single `.env` file at the root of the project. The backend `dotenv` config points one level up `({ path: path.join(__dirname, "../.env") })` to load them correctly.

---

## 9. Content Management & Cloudinary

- **Image Uploads:** Blog and Documentation images are uploaded to Cloudinary via the backend `/api/upload` route. The `RichTextEditor` intercepts image drops/clicks and seamlessly uploads them, embedding the returned secure URL.
- **Rich Text Editor:** The application uses a highly customized `ReactQuill` editor. It features three modes: Visual, Markdown, and Live Preview. 
- **KaTeX Integration:** The `MathHTMLContainer` safely renders markdown HTML and executes KaTeX over any text wrapped in `$$ ... $$`. The Live Preview mode of the editor provides accurate real-time rendering of these formulas and the app's dark neon aesthetic.

---

## 10. AI Prompting Guidelines

When building or modifying features:
1. **Check existing contexts:** If a user needs global data, check `AuthContext` or `AlgorithmContext` before fetching manually.
2. **Maintain Theme Integrity:** Refer to Rule #4. Never break the dark/light mode functionality.
3. **Framer Motion:** Use `framer-motion` for micro-interactions (e.g., `whileHover={{ y: -4 }}`, `whileTap={{ scale: 0.95 }}`) on cards and buttons to make the app feel alive and premium.
4. **Routing:** If adding a new page, add it to `AppRoutes.jsx`, wrap it in `<AnimatedPage>`, and determine if it requires `<MainLayout>` (protected) or stands alone (public).
5. **Animations on Scroll:** For long pages, wrap sections in Framer Motion `whileInView` components (or use a custom `AnimatedSection` wrapper) so they fade/slide in dynamically as the user scrolls.
