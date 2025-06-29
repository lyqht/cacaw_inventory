# cacaw_inventory

> _A retro-themed app for collectors to organize, identify, and manage their collections with AI-powered tools and offline-first storage._

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-4.x-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-4.x-blue?logo=vite)

---

## 📚 Table of Contents

- [Features](#-features)
- [Demo](#-demo)
- [Key Features](#key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Design System](#-design-system)
- [Key Services](#-key-services)
- [User Experience](#-user-experience)
- [Development Setup](#-development-setup)
- [License](#-license)
- [How to Contribute](#-how-to-contribute)
- [FAQ / Troubleshooting](#-faq--troubleshooting)
- [Community & Contact](#-community--contact)

---

## 🎯 Features

![](./CACAW%20USER%20JOURNEY%20MAP.png)

- **Collection Management:** Organize, tag, and track collectibles with detailed information and photos.
- **AI-Powered Detection:** Instantly identify collectibles and extract details from photos using computer vision.
- **Data Persistence:** Securely store, export, and back up your collection data locally for offline access.
- **User Experience:** Enjoy a retro pixel art interface with smooth, responsive, and intuitive navigation.

---

## 🖼️ Demo

> _Screenshots and GIFs coming soon!_

---

### **Key Features**

1. **Multi-View Navigation**
   - Capture Page (AI-powered item detection)
   - Folders Page (collection organization)
   - Items Page (detailed item management)
   - Settings Page (user preferences)
2. **Data Management**
   - **Folders**: Organize collections by type (trading cards, action figures, etc.)
   - **Items**: Detailed collectible records with metadata
   - **Images**: Photo storage and processing
   - **AI Detection**: Automated item identification
3. **Storage System**
   - **IndexedDB** via Dexie.js for local storage
   - Data export/import capabilities
   - Image compression and optimization

---

## 🛠️ Tech Stack

### **Frontend Framework**

- **React 18** with TypeScript
- **Vite** as the build tool and dev server
- **Tailwind CSS** for styling with custom retro theme

### **State Management**

- **Zustand** for global state management
- **Dexie.js** (IndexedDB wrapper) for local data persistence

### **UI/UX**

- **Lucide React** for icons
- Custom pixel art theme with retro aesthetics
- Responsive design with mobile-first approach

---

## 📁 Project Structure

### **Core Architecture**

```
src/
├── components/     # Reusable UI components
├── pages/         # Main application views
├── services/      # Business logic and external APIs
├── stores/        # State management
├── types/         # TypeScript type definitions
└── App.tsx        # Main application component
```

---

## 🛠️ Design System

### **Retro Pixel Theme**

- Custom color palette with light/dark themes
- Pixel-perfect spacing and animations
- Retro typography (Press Start 2P, Pixelify Sans)
- Custom animations (bird-hop, pixel-pulse, etc.)

### **Component Architecture**

- Modular component design
- Reusable UI components (Button, Card, Modal, etc.)
- Consistent styling patterns
- Accessibility considerations

---

## 🔧 Key Services

1. **Storage Service**: IndexedDB local storage
2. **AI Detection Service**: Gemini Computer vision for item identification
3. **Image Search Service**: Openverse for royalty-free and legal images

---

## 🛠️ User Experience

- **Responsive design** for mobile and desktop
- **Smooth animations** and pixel-perfect interactions
- **Error boundaries** for robust error handling

---

## 🚀 Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd cacaw_inventory

# Install dependencies
npm install

# (Automatic) Remove Fingerprint icon from lucide-react to prevent ad blocker issues
# This is handled by a postinstall script. If you see issues with missing icons, see FAQ below.

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:ui` - Run tests with UI

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ❓ FAQ / Troubleshooting

**Q: Why do I see errors about 'fingerprint.js' being blocked or missing in development?**
A: Some ad blockers or privacy extensions block files with 'fingerprint' in the name, which can break icon imports from lucide-react. This project includes a postinstall script that automatically removes the Fingerprint icon from lucide-react after install. If you still see issues, try disabling your ad blocker for localhost or re-run `npm install` to ensure the script runs.

**Q: How do I reset my local data?**
A: Clear your browser's IndexedDB storage for this site.

**Q: Why isn't AI detection working?**
A: Make sure your API key is set up in the Settings page and you have a stable internet connection.
