# Pramu Talks - Official Dr. Prasada Murthy Archive

Pramu Talks is a premium digital portal designed to archive and showcase the lifetime work of **Dr. Prasada Murthy**—a Nandi Award-winning journalist, scholar, and poet. The application serves as a bridge between the revolutionary literature of the 1940s-60s (Sri Sri's era) and the modern world of digital media and ethics.

## 🌟 Key Features

### 1. Research Lab Intelligence
An AI-powered academic assistant grounded in the **Gemini 3 Flash** engine.
- **Web Grounding**: Utilizes real-time Google Search retrieval to analyze modern news and literary trends.
- **Source Citations**: Automatically provides direct links to external sources used in analysis.
- **Rich Formatting**: Beautifully rendered markdown responses with hierarchical headers and bold highlights.

### 2. Media Upload & Storage
Secure, scalable file management integrated directly into the archive.
- **PDF Hosting**: Direct PDF upload for "Book" entries (Max 10MB), allowing users to read primary texts directly.
- **Audio Streaming**: Narrator-ready audio upload for "Audiobook" entries (Max 20MB).
- **Firebase Storage Integration**: Utilizes industry-standard cloud storage to ensure high-speed delivery and data integrity.

### 3. Creator Studio (Modern Admin Portal)
A partitioned management suite designed for organizational efficiency.
- **Archive Studio**: Full CRUD operations for books, essays, and reviews with integrated media uploaders.
- **Home Editor**: A dedicated space for managing landing page headings, philosophy sections, and the "Media Moments" gallery.
- **Video Manager**: Context-aware tool for curating the "Trending Now" playlist.
- **Contextual Live Manager**: A dynamic entry manager that adapts its display based on whether you are editing videos or archive entries.

### 4. Smart YouTube Synchronization
- **System-Level Sync**: "Refresh YouTube Feed" tool moved to System Settings to prevent accidental triggers while managing content.
- **Firestore Caching**: Syncs the latest channel activity to Firestore to protect API quotas and ensuring instant page loads for public visitors.

### 5. Security & Access
- **The Gatekeeper**: A non-intrusive "triple-click" logic on the brand icon acts as a secret gateway for administrators.
- **Passkey Protection**: Secure login portal for accessing sensitive research and management tools.
- **Firebase Auth**: Robust authentication infrastructure ensuring secure Firestore and Storage interactions.

### 🛡️ Admin UID & Server-Side Security
To prevent unauthorized database access, use your unique **Admin UID** to lock down Firestore:
1.  Navigate to **Creator Studio > System Settings**.
2.  Copy your **Device UID** from the "Security & Identity" section.
3.  In your **Firebase Console**, update your Security Rules to only allow writes from your specific UID:
    ```javascript
    service cloud.firestore {
      match /databases/{database}/documents {
        match /artifacts/pramu-talks-v2/public/data/{document=**} {
          allow read: if true;
          allow write: if request.auth.uid == "YOUR_COPIED_UID_HERE";
        }
      }
    }
    ```

## 🎨 Design & Experience

### Aesthetics & Theme
- **Global Dark Theme Support**: The entire platform, including the administrative Live Manager, follows a unified theme system.
- **Circadian Theming**: Automatic dark/light mode transitions based on the user's local time (e.g., shifts to Dark Theme at 6 PM).
- **Glassmorphism**: Subtle backdrop blurs and semi-transparent layers for a premium, state-of-the-art feel.

### User Interaction
- **Micro-Animations**: Zoom-in transitions, hover-scale effects, and pulse indicators for active admin states.
- **Responsive Navigation**: A custom-built mobile navigation drawer and "No-Scrollbar" horizontally scrolling moments gallery.

## ⚙️ Technical Architecture

- **Engine**: React 19 + Vite.
- **Intelligence**: Google Gemini 3 Flash.
- **Database**: Firebase Firestore.
- **Cloud Storage**: Firebase Storage.
- **Styling**: Tailwind CSS 4.0.
- **Icons**: Lucide React.
- **Markdown**: React-Markdown for AI and text rendering.

## 📦 Getting Started

1. **Prerequisites**:
   - Node.js (v18+)
   - A Google AI Studio API Key (Gemini API)
   - A Firebase Project with Firestore, Storage, and Anonymous Auth enabled.

2. **Environment Setup**:
   Paste your configuration into the `myFirebaseConfig` and `geminiApiKey` variables at the top of `App.jsx`, or use the **System Settings** in the Studio to override keys at runtime.

3. **Development**:
   ```bash
   npm install
   npm run dev
   ```

---
**"Literature is not just words on a page; it is the heartbeat of society."**
© 2026 Pramu Talks. All rights reserved.
