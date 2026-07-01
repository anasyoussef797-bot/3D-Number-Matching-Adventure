# Game #5: 3D Number Matching Adventure 🇪🇬

This is a complete, production-ready educational 3D game built for **Impact Hub Egypt's Educational Games Collection** (specifically curated for preschoolers aged 3–6).

The game allows children to master number matching and counting by pairing displayed numerals with actual quantities of responsive 3D items (Apples, Stars, Balloons, Toy Blocks, Fish, Cars, Trees) placed on floating 3D islands.

---

## 🌟 Key Features

1. **Stunning Low-Poly 3D Graphics**: Built using Three.js with soft shadows, drifting clouds, and sparkling ambient stars.
2. **Secure Multilingual Audio Engine**: Native voice pronunciation of numbers and level instructions in:
   - **Arabic** (Egyptian locale with full RTL alignment)
   - **English** (LTR)
   - **French** (LTR)
   - **German** (LTR)
3. **No Punishments (Preschool Oriented)**: Friendly wobble/shake physical feedback on incorrect selections, ensuring continuous encouragement.
4. **Postcard Screenshot Exporter**: Allows parents/children to capture their achievements, compositing the WebGL canvas with custom level details for easy sharing.
5. **Fluid Mobile-First Layout**: Fully adaptive responsive design supporting both Portrait and Landscape orientations on iOS, Android, and Desktop targets.

---

## 🚀 How to Run the Applet

### 1. Local Development (Vite + React)
Install standard dependencies and boot the local HMR dev server:
```bash
npm install
npm run dev
```

### 2. Compiling the Production Build
Bundle the client assets into optimized static builds:
```bash
npm run build
```

---

## 📦 Next.js & Vercel Portability

This project has been designed with complete modularity so it can be deployed immediately to **Vercel** or **GitHub** as a Next.js App Router project. All required Next.js structure configurations are fully generated inside the `/nextjs/` export folder.

### Next.js File Layout mapping:
- `/nextjs/page.tsx` -> Main route entry (Drop-in into `/app/page.tsx`)
- `/nextjs/layout.tsx` -> Root document container (Drop-in into `/app/layout.tsx`)
- `/nextjs/next.config.js` -> Config parameters (Drop-in into root `/next.config.js`)
- `/nextjs/globals.css` -> Global Tailwind settings (Drop-in into `/app/globals.css`)
- `/nextjs/tailwind.config.ts` -> Theme extensions (Drop-in into root `/tailwind.config.ts`)
