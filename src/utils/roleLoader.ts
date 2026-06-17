// Utility to dynamically load role JSON configurations using Vite glob imports
const roleModules = import.meta.glob("/src/data/roles/*.json", { eager: true });

export interface Skill {
  name: string;
  category: string;
  level: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  image: string;
  github: string;
  demo: string;
  achievements?: string[];
  problemSolved?: string;
  learnings?: string;
}

export interface Experience {
  role: string;
  company: string;
  period: string;
  description: string;
  achievements?: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
}

export interface Hackathon {
  name: string;
  project: string;
  prize?: string;
  description?: string;
}

export interface RoleConfig {
  id: string;
  name: string;
  title: string;
  roleIcon: string;
  summary: string;
  meta: {
    title: string;
    description: string;
    keywords?: string[];
  };
  skills: Skill[];
  projects: Project[];
  experience?: Experience[];
  certifications?: Certification[];
  hackathons?: Hackathon[];
  // Data Analyst specifics
  dashboardGallery?: Array<{
    title: string;
    platform: string;
    embedUrl: string;
    description: string;
    screenshot?: string;
    metrics?: Array<{ label: string; value: string }>;
    chartData?: number[];
  }>;
  caseStudies?: Array<{
    title: string;
    background: string;
    methodology: string;
    results: string;
  }>;
  // GenAI specifics
  promptShowcase?: Array<{
    name: string;
    systemPrompt: string;
    userInput: string;
    output: string;
    concept: string;
  }>;
  workflows?: Array<{
    title: string;
    description: string;
    steps: Array<{
      name: string;
      detail: string;
    }>;
  }>;
}

/**
 * Returns all parsed role configurations, merging any local storage overrides
 */
export const getRoles = (): RoleConfig[] => {
  const roles: RoleConfig[] = [];
  for (const path in roleModules) {
    const module = roleModules[path] as any;
    // Default export or module root
    const data = module.default || module;
    if (data && data.id) {
      const overrideKey = `portfolio_role_override_${data.id}`;
      const localOverride = localStorage.getItem(overrideKey);
      if (localOverride) {
        try {
          roles.push(JSON.parse(localOverride) as RoleConfig);
          continue;
        } catch (e) {
          console.error("Failed to parse override for role", data.id, e);
        }
      }
      roles.push(data as RoleConfig);
    }
  }
  return roles;
};

/**
 * Returns a specific role configuration by ID
 */
export const getRoleById = (id: string): RoleConfig | undefined => {
  const allRoles = getRoles();
  return allRoles.find((role) => role.id === id);
};
