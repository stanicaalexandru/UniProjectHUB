import type { Locale } from "@/i18n";
import type { ProjectType } from "@/types";

// Sabloane de proiect: etapele se creeaza automat, cu termene la X zile de la creare.
// Textele se salveaza in proiect in limba aleasa de utilizator in momentul crearii.
type Text = Record<Locale, string>;
export type ProjectTemplate = {
  id: string; icon: string; color: string; type: ProjectType;
  name: Text; description: Text;
  milestones: { title: Text; description: Text; days: number }[];
  technologies: string[]; tags: string[];
};

const m = (roTitle: string, enTitle: string, roDesc: string, enDesc: string, days: number) =>
  ({ title: { ro: roTitle, en: enTitle }, description: { ro: roDesc, en: enDesc }, days });

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "licenta-info", icon: "🎓", color: "from-blue-600 to-blue-800", type: "bachelor_thesis",
    name: { ro: "Licență Informatică", en: "Computer Science thesis" },
    description: { ro: "Șablon complet pentru o lucrare de licență", en: "Complete template for a bachelor thesis" },
    milestones: [
      m("Documentare și analiză", "Research & analysis", "Studiul literaturii, analiza cerințelor", "Literature review, requirements analysis", 30),
      m("Proiectarea arhitecturii", "Architecture design", "Diagrame UML, schema bazei de date", "UML diagrams, database schema", 60),
      m("Implementare backend", "Backend implementation", "API REST, autentificare", "REST API, authentication", 120),
      m("Implementare frontend", "Frontend implementation", "Interfața cu utilizatorul", "User interface", 150),
      m("Testare", "Testing", "Teste unitare și de integrare", "Unit and integration tests", 175),
      m("Documentație", "Documentation", "Documentația tehnică", "Technical documentation", 200),
    ],
    technologies: ["React", "Node.js", "PostgreSQL", "TypeScript"], tags: ["licenta", "informatica"],
  },
  {
    id: "licenta-electronica", icon: "⚡", color: "from-amber-500 to-orange-600", type: "bachelor_thesis",
    name: { ro: "Licență Electronică", en: "Electronics thesis" },
    description: { ro: "Șablon pentru proiecte hardware/software", en: "Template for hardware/software projects" },
    milestones: [
      m("Studiu bibliografic", "Literature study", "Analiza literaturii", "Literature analysis", 25),
      m("Proiectare hardware", "Hardware design", "Schema electronică", "Circuit schematic", 60),
      m("Implementare firmware", "Firmware implementation", "Programarea microcontrolerului", "Microcontroller programming", 110),
      m("Interfață software", "Software interface", "Aplicația de control", "Control application", 150),
      m("Testare", "Testing", "Măsurători, calibrare", "Measurements, calibration", 175),
      m("Documentație", "Documentation", "Memoriul tehnic", "Technical report", 200),
    ],
    technologies: ["Arduino", "C/C++", "Python"], tags: ["licenta", "electronica"],
  },
  {
    id: "cercetare", icon: "🔬", color: "from-purple-600 to-violet-700", type: "research",
    name: { ro: "Proiect de cercetare", en: "Research project" },
    description: { ro: "Șablon pentru cercetare academică", en: "Template for academic research" },
    milestones: [
      m("Definirea problemei", "Problem definition", "Identificarea direcției de cercetare", "Identifying the research gap", 20),
      m("Studiul literaturii", "Literature review", "Analiză sistematică", "Systematic review", 50),
      m("Metodologie", "Methodology", "Proiectarea experimentelor", "Experimental design", 80),
      m("Implementare", "Implementation", "Rularea experimentelor", "Running the experiments", 130),
      m("Analiza rezultatelor", "Results analysis", "Interpretarea datelor", "Data interpretation", 160),
      m("Redactare", "Writing", "Articolul științific", "Scientific paper", 200),
    ],
    technologies: ["Python", "TensorFlow", "LaTeX"], tags: ["cercetare", "academic"],
  },
  {
    id: "aplicatie-mobila", icon: "📱", color: "from-green-500 to-emerald-600", type: "bachelor_thesis",
    name: { ro: "Aplicație mobilă", en: "Mobile app" },
    description: { ro: "Șablon pentru o aplicație mobilă", en: "Template for a mobile application" },
    milestones: [
      m("Analiză și machete", "Analysis & wireframes", "Cercetarea utilizatorilor", "User research", 25),
      m("Arhitectură", "Architecture setup", "Sistemul de design", "Design system", 45),
      m("Funcționalități de bază", "Core features", "Autentificare, navigare", "Authentication, navigation", 100),
      m("Backend și API", "Backend & API", "Server, bază de date", "Server, database", 140),
      m("Testare", "Testing", "Teste pe dispozitive", "Device testing", 170),
      m("Publicare", "Release", "Publicarea în magazine", "Store release", 200),
    ],
    technologies: ["React Native", "Firebase", "TypeScript"], tags: ["mobile", "android", "ios"],
  },
  {
    id: "open-source", icon: "🌐", color: "from-teal-500 to-cyan-600", type: "open_source",
    name: { ro: "Proiect open source", en: "Open source project" },
    description: { ro: "Șablon pentru un proiect open source", en: "Template for an open source project" },
    milestones: [
      m("Definirea conceptului", "Concept definition", "RFC, cazuri de utilizare", "RFC, use cases", 15),
      m("Configurarea depozitului", "Repository setup", "CI/CD, GitHub Actions", "CI/CD, GitHub Actions", 30),
      m("Implementarea nucleului", "Core implementation", "Funcționalitățile principale", "Main features", 90),
      m("Testare", "Testing", "Suita de teste", "Test suite", 130),
      m("Documentație", "Documentation", "README, documentația API", "README, API docs", 160),
      m("Lansare", "Release", "Publicarea pachetului", "Package publishing", 180),
    ],
    technologies: ["TypeScript", "Jest", "GitHub Actions"], tags: ["open-source"],
  },
  {
    id: "industrial", icon: "🏭", color: "from-slate-600 to-slate-800", type: "industrial",
    name: { ro: "Proiect industrial", en: "Industry project" },
    description: { ro: "Șablon pentru proiecte cu industria", en: "Template for projects with industry partners" },
    milestones: [
      m("Analiza cerințelor", "Requirements analysis", "Întâlniri cu partenerii", "Stakeholder meetings", 20),
      m("Propunere tehnică", "Technical proposal", "Demonstrator (POC)", "Proof of concept", 40),
      m("Dezvoltare MVP", "MVP development", "Funcționalitățile minime", "Minimum features", 100),
      m("Iterații", "Iterations", "Sprinturi", "Sprints", 150),
      m("Testare QA", "QA testing", "Testare de acceptanță", "User acceptance testing", 175),
      m("Punere în producție", "Deployment", "Instalare în producție", "Production deployment", 200),
    ],
    technologies: ["Java", "Spring Boot", "Docker"], tags: ["industrial"],
  },
];
