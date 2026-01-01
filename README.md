# Singularity

A WebGPU-powered black hole visualization built with Three.js.

## About

This is a real-time 3D visualization of a black hole with gravitational lensing effects, accretion disk, and a space environment. It uses Three.js's WebGPU renderer and TSL (Three.js Shading Language) for advanced shader effects.

## Features

- Realistic black hole with ray-marched rendering
- Dynamic accretion disk with temperature-based colors
- Gravitational lensing effects
- Interactive camera controls
- Post-processing effects (bloom, etc.)
- Debug panel for tweaking parameters
- Responsive design

## Requirements

- Node.js (v16+)
- WebGPU-compatible browser:
  - Chrome/Edge 113+
  - Firefox Nightly (experimental)
  - Safari Technology Preview (experimental)

Check WebGPU support at [webgpureport.org](https://webgpureport.org/)

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will run at `https://localhost:5173`

## Available Scripts

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run build-dev        # Build with dev settings
npm run staging          # Run in staging mode
npm run production       # Run in production mode
```

## Tech Stack

- **Three.js** (v0.180.0) - WebGPU renderer
- **Vite** (v5.4.21) - Build tool
- **GSAP** - Animations
- **Tweakpane** - Debug UI
- **TSL** - Three.js Shading Language

## Project Structure

```
src/
├── Experience/
│   ├── Worlds/
│   │   └── MainWorld/
│   │       ├── BlackHole.js      # Black hole implementation
│   │       ├── Camera.js         # Camera setup
│   │       └── Environment.js    # Lighting & skybox
│   ├── Utils/                    # Helper utilities
│   ├── Materials/                # Custom materials
│   ├── Experience.js             # Main app class
│   ├── Renderer.js               # WebGPU renderer
│   └── Sources.js                # Asset manifest
├── script.js                     # Entry point
└── index.html

static/
├── models/                       # 3D models
└── textures/                     # Textures & HDR maps
```

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome 113+ | ✅ Supported |
| Edge 113+ | ✅ Supported |
| Firefox Nightly | ⚠️ Experimental |
| Safari TP | ⚠️ Experimental |

## Debug Mode

Press `~` key to toggle the debug panel where you can:
- Adjust black hole parameters
- Tweak post-processing effects
- Monitor performance (FPS, memory)
- Modify lighting and environment

## Building

```bash
# Production build
npm run build

# Output will be in dist/ folder
```

Deploy the `dist/` folder to any static hosting service (Netlify, Vercel, GitHub Pages, etc.)

## License

MIT