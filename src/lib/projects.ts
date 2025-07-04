import { Project } from './types';
import projectsData from '../data/projects.json';

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
