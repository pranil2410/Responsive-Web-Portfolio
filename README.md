# Dynamic Career Portfolio Platform

A premium, production-ready, polymorphic professional portfolio platform designed for **Pranil Belge** to host multiple career tracks (initially Software Developer, Data Analyst, and GenAI / AI Engineer) under a single web application.

🚀 **Live Link**: [https://career-portfolio-sigma.vercel.app](https://career-portfolio-sigma.vercel.app)  
📊 **Repository**: [Responsive-Web-Portfolio](https://github.com/pranil2410/Responsive-Web-Portfolio)

---

## ✨ Features

- **Apple-Inspired Premium Design**: A modern dark-mode layout featuring custom glassmorphism, glowing accents, smooth hover animations, and fully responsive grid adjustments.
- **Dynamic Polymorphic Layouts**:
  - **Software Developer**: Integrates directly with the GitHub API to showcase active repositories, stars, and language tags.
  - **Data Analyst**: Embeds interactive BI dashboards (Power BI / Tableau previews) alongside detailed business case studies.
  - **GenAI / AI Engineer**: Embeds an interactive **Prompt Engineering Sandbox** (allowing users to simulate prompts with typewriter feedback) and showcases visual AI system diagrams (RAG, agent workflows).
- **Recruiter Comparison Matrix**: A side-by-side comparison table (stacked on mobile) enabling recruiters to filter and compare skills, experiences, projects, and certifications across different roles.
- **ATS Suitability Scanner**: Matches external job descriptions (JDs) against profile assets to compute suitability scores and highlight keywords.
- **Global Search**: Instantly indexes and filters across skills, certifications, projects, and experience descriptions across all registered profiles.
- **Database & Offline Fallback**: Driven by Supabase backend operations, falling back automatically to local storage if credentials are absent.
- **SEO Ready**: Injects page-specific meta titles, structured JSON-LD (Person schema), and descriptions.

---

## 🛠️ Technology Stack

- **Framework**: React 19 (TypeScript)
- **Bundler & Tooling**: Vite 8
- **Styling**: Tailwind CSS v4, Lucide React (Icons)
- **Animations**: Framer Motion 12
- **Backend & Database**: Supabase JS Client
- **Routing**: React Router DOM 7

---

## 📈 Architecture & How to Scale

The platform is engineered around a **polymorphic engine** that reads configurations dynamically. You can add unlimited new roles (e.g., Python Developer, Data Scientist, ML Engineer, Business Analyst, etc.) **without writing any React code**:

1. Create a new JSON file under `src/data/roles/` (e.g., `python-developer.json`).
2. Follow the structure of existing JSON configs (specifying `id`, `name`, `title`, `summary`, `skills`, `projects`, `experience`, `certifications`, etc.).
3. Save the file.
4. **Vite's eager glob loader** (`import.meta.glob('/src/data/roles/*.json')` inside `src/utils/roleLoader.ts`) will automatically register the profile at build time:
   - A career card will appear on the landing page.
   - The role will be selectable in the Navbar dropdown.
   - The comparison columns will appear in the Recruiter Matrix.
   - The global search bar will instantly index its content.

---

## 💻 Local Development Setup

To run the application locally:

### 1. Clone the repository
```bash
git clone https://github.com/pranil2410/Responsive-Web-Portfolio.git
cd Responsive-Web-Portfolio
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the Vite dev server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for production
```bash
npm run build
```
The compiled, production-ready static assets will be outputted to the `dist/` directory.

---

## 📄 License
MIT License. Created by Pranil Belge.
