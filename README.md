# Pramu Talks - Official Dr. Prasada Murthy Archive

Pramu Talks is a premium digital portal designed to archive and showcase the lifetime work of **Dr. Prasada Murthy**—a Nandi Award-winning journalist, scholar, and poet. The application serves as a bridge between the revolutionary literature of the 1940s-60s (Sri Sri's era) and the modern world of digital media and ethics.

## 🌟 Key Features

### 1. Research Lab Intelligence
An AI-powered academic assistant grounded in the **Gemini 3 Flash** engine.
- **Web Grounding**: Utilizes real-time Google Search retrieval to analyze modern news and literary trends.
- **Source Citations**: Automatically provides direct links to external sources used in analysis.
- **Rich Formatting**: Beautifully rendered markdown responses with hierarchical headers and bold highlights.

### 2. High-Performance Media Pipeline
A scalable, binary-first management system for high-quality assets.
- **Firebase Storage Migration**: All images, PDFs, and audio files are stored as binary objects, bypassing Firestore document limits.
- **Smart Compression Engine**: Automatic client-side resizing (Max 1600px) and JPEG compression (85%) ensures 5x faster uploads without sacrificing visual fidelity.
- **PDF & Audio Hosting**: Integrated viewers for primary texts (Max 10MB) and audiobooks (Max 20MB).

### 3. Creator Studio (Modern Admin Portal)
A partitioned management suite designed for organizational efficiency.
- **Drag-and-Drop Reordering**: Intuitive manual sorting for the Awards Gallery and Media Moments using native HTML5 drag-and-drop logic.
- **Home Editor**: A dedicated space for managing landing page headings, philosophy sections, and the "Nandi Award" hero feature.
- **Live Manager**: A dynamic entry manager that adapts its display based on whether you are editing videos or archive entries.

### 4. Smart YouTube Synchronization
- **System-Level Sync**: "Refresh YouTube Feed" tool moved to System Settings to prevent accidental triggers while managing content.
- **Firestore Caching**: Syncs the latest channel activity to Firestore to protect API quotas and ensure instant page loads for public visitors.

### 5. Security & Access
- **The Gatekeeper**: A non-intrusive "triple-click" logic on the brand icon acts as a secret gateway for administrators.
- **Passkey Protection**: Secure login portal for accessing sensitive research and management tools.
- **Firebase Auth**: Robust authentication infrastructure ensuring secure Firestore and Storage interactions.

## 🛡️ Administrative Security Setup
To prevent unauthorized access, ensure your Firebase Security Rules are correctly configured for both Firestore and Storage.

### Firestore Rules
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/pramu-talks-v2/public/data/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == "YOUR_COPIED_UID_HERE";
    }
  }
}
```

### Storage Rules
```javascript
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == "YOUR_COPIED_UID_HERE";
    }
  }
}
```
*Note: You can find your **Device UID** in the Creator Studio > System Settings section.*

## 🎨 Design & Experience

### Aesthetics & Theme
- **Circadian Theming**: Automatic dark/light mode transitions based on the user's local time (e.g., shifts to Dark Theme at 6 PM).
- **Dynamic Nandi Hero**: A high-impact stacked card layout for the Nandi Award, featuring floating badges and high-contrast typography.
- **Glassmorphism**: Subtle backdrop blurs and semi-transparent layers for a premium feel.

### User Interaction
- **Micro-Animations**: Zoom-in transitions, hover-scale effects, and pulse indicators for active admin states.
- **Responsive Layouts**: Custom-built mobile navigation drawer and "No-Scrollbar" horizontally scrolling galleries.

## ⚙️ Technical Architecture

- **Engine**: React 19 + Vite.
- **Intelligence**: Google Gemini 3 Flash.
- **Database**: Firebase Firestore.
- **Cloud Storage**: Firebase Storage (Binary).
- **Styling**: Tailwind CSS 4.0.
- **Icons**: Lucide React.

## 📦 Getting Started

1. **Prerequisites**:
   - Node.js (v18+)
   - A Google AI Studio API Key (Gemini API)
   - A Firebase Project with Firestore, Storage, and Authentication enabled.

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
