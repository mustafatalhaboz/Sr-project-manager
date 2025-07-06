import { Project, ClickUpListData } from './types';
import { fetchWorkspaceLists } from './clickup';


// Cache for projects
let cachedProjects: Project[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Convert ClickUp list to Project interface
export function mapClickUpListToProject(list: ClickUpListData): Project {
  return {
    id: list.id,
    name: list.name,
    clickupListId: list.id,
    description: `${list.spaceName} projesi`,
    techStack: ["Next.js", "React", "TypeScript"], // Default tech stack
    aiContext: "Bu proje için teknik analiz ve görev yönetimi yap",
    spaceName: list.spaceName,
    folderName: list.folderName,
    displayName: list.displayName
  };
}

export async function getProjects(signal?: AbortSignal): Promise<Project[]> {
  // Check cache first
  const now = Date.now();
  if (cachedProjects && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedProjects;
  }

  try {
    // Fetch from ClickUp API
    const clickUpLists = await fetchWorkspaceLists(signal);
    
    // Check if request was aborted before processing
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }
    
    const projects = clickUpLists.map(mapClickUpListToProject);
    
    // Update cache only if request wasn't aborted
    if (!signal?.aborted) {
      cachedProjects = projects;
      cacheTimestamp = now;
    }
    
    return projects;
  } catch (error) {
    // Don't log abort errors
    if (error instanceof Error && error.message === 'Request aborted') {
      throw error;
    }
    
    console.error('ClickUp API\'den projeler alınamadı:', error);
    
    // Throw error instead of using fallback - force user to fix API connection
    throw new Error('ClickUp API bağlantısı başarısız. Lütfen API ayarlarınızı kontrol edin.');
  }
}

// Sync version for backward compatibility (returns cached data)
export function getProjectsSync(): Project[] {
  return cachedProjects || [];
}

export function getProjectById(id: string): Project | undefined {
  const currentProjects = cachedProjects || [];
  return currentProjects.find(project => project.id === id);
}

export function getProjectByName(name: string): Project | undefined {
  const currentProjects = cachedProjects || [];
  return currentProjects.find(project => project.name === name);
}

export function searchProjects(query: string): Project[] {
  const searchTerm = query.toLowerCase();
  const currentProjects = cachedProjects || [];
  return currentProjects.filter(project =>
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

export async function getProjectOptions(): Promise<{ value: string; label: string }[]> {
  const projects = await getProjects();
  return projects.map(project => ({
    value: project.id,
    label: project.displayName || project.name
  }));
}

// Clear cache function for manual refresh
export function clearProjectsCache(): void {
  cachedProjects = null;
  cacheTimestamp = 0;
}
