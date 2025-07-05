import { Project } from './types';

const projectsData = {
  "projects": [
    {
      "id": "ecommerce",
      "name": "E-commerce Web Sitesi",
      "clickupListId": "123456789",
      "description": "Ana e-commerce platformu",
      "techStack": ["Next.js", "React", "TailwindCSS"],
      "aiContext": "Bu e-commerce projesi için bug fix ve feature request analizleri yap"
    },
    {
      "id": "blog",
      "name": "Kurumsal Blog",
      "clickupListId": "987654321",
      "description": "İçerik yönetim sistemi",
      "techStack": ["Next.js", "Sanity", "Vercel"],
      "aiContext": "Blog ve CMS projeleri için teknik analiz yap"
    },
    {
      "id": "dashboard",
      "name": "Admin Dashboard",
      "clickupListId": "555666777",
      "description": "Yönetim paneli uygulaması",
      "techStack": ["Next.js", "React", "Chart.js"],
      "aiContext": "Dashboard ve admin panel projeleri için teknik analiz yap"
    }
  ]
};

export function getProjects(): Project[] {
  return projectsData.projects;
}

export function getProjectById(id: string): Project | undefined {
  return projectsData.projects.find(project => project.id === id);
}

export function getProjectByName(name: string): Project | undefined {
  return projectsData.projects.find(project => project.name === name);
}

export function searchProjects(query: string): Project[] {
  const searchTerm = query.toLowerCase();
  return projectsData.projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm) ||
    project.description.toLowerCase().includes(searchTerm) ||
    project.techStack.some(tech => tech.toLowerCase().includes(searchTerm))
  );
}

export function validateProject(project: Project): boolean {
  return !!(
    project.id &&
    project.name &&
    project.clickupListId &&
    project.description &&
    project.techStack &&
    project.techStack.length > 0 &&
    project.aiContext
  );
}

export function getProjectOptions(): { value: string; label: string }[] {
  return projectsData.projects.map(project => ({
    value: project.id,
    label: project.name
  }));
}
