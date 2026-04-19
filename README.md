# Pramu Talks - Official Dr. Prasada Murthy Archive

Pramu Talks is a premium digital portal designed to archive and showcase the lifetime work of **Dr. Prasada Murthy**—a Nandi Award-winning journalist, scholar, and poet. The application serves as a bridge between the revolutionary literature of the 1940s-60s (Sri Sri's era) and the modern world of digital media and ethics.

## 🌟 Key Features

### 1. Research Lab Intelligence
An AI-powered academic assistant grounded in the **Gemini 3 Flash** engine.
- **Web Grounding**: Utilizes real-time Google Search retrieval to analyze modern news and literary trends.
- **Source Citations**: Automatically provides direct links to external sources used in analysis.
- **Rich Formatting**: Beautifully rendered markdown responses with hierarchical headers and bold highlights.

### 2. Centralized YouTube Synchronization
A quota-protected media engine that keeps the video library up-to-date.
- **Firestore Caching**: Top videos are synced manually to a central Firestore document, allowing public users to view the feed without consuming Gemini API quota.
- **Admin Management**: Only authorized users can trigger a fresh sync from the YouTube channel via the Creator Studio.

### 3. Creator Studio (Admin Portal)
A comprehensive management suite for the archive.
- **Content Management**: Add, edit, or delete books, essays, reviews, and stories.
- **Social Hub**: Centralized configuration for YouTube, Twitter, Facebook, and Instagram handles.
- **Metadata Extraction**: AI-assisted tool to automatically extract titles and thumbnails from provided links.

### 4. Security & Access
- **The Gatekeeper**: A non-intrusive "triple-click" logic on the brand icon acts as a secret gateway for administrators.
- **Passkey Protection**: Secure login modal for accessing sensitive research and management tools.
- **Firebase Auth**: Robust anonymous authentication ensuring secure Firestore interactions.

## 🎨 Design Philosophy

### Aesthetics
- **Slate & Red Palette**: Deep Slate-900 foundations with vibrant Red-600 accents, symbolizing "Poetry in Journalism."
- **Glassmorphism**: Subtle backdrop blurs and semi-transparent layers for a premium, state-of-the-art feel.
- **Typography**: Heavily bold, uppercase headers (Inter/System Sans) for an authoritative, journalistic look.

### User Experience
- **Responsive Navigation**: A custom-built mobile navigation drawer for seamless access across devices.
- **Micro-Animations**: Zoom-in transitions and hover-scale effects to make the interface feel alive and interactive.

## ⚙️ Technical Architecture

- **Engine**: React 19 + Vite (High-performance rendering and HMR).
- **Intelligence**: Google Gemini 3 Flash (`gemini-3-flash-preview`).
- **Database**: Google Cloud Firestore (Serverless document storage).
- **Styling**: Tailwind CSS 4.0 + Vanilla CSS custom utilities.
- **Icons**: Lucide React.
- **Markdown**: React-Markdown for AI response rendering.

## 📦 Getting Started

1. **Prerequisites**:
   - Node.js (v18+)
   - A Google AI Studio API Key (Gemini API)
   - A Firebase Project with Firestore and Anonymous Auth enabled.

2. **Environment Setup**:
   Paste your configuration into the `myFirebaseConfig` and `geminiApiKey` variables at the top of `App.jsx`.

3. **Development**:
   ```bash
   npm install
   npm run dev
   ```

---
**"Literature is not just words on a page; it is the heartbeat of society."**
© 2026 Pramu Talks. All rights reserved.
