import { Project, ClickUpListData } from './types';
import { fetchWorkspaceLists } from './clickup';
import { 
  getProjectsFromDatabase, 
  upsertProject, 
  updateProjectType, 
  needsAnalysis,
  initializeDatabase 
} from './database';
import axios from 'axios';
import OpenAI from 'openai';


// Cache for projects
let cachedProjects: Project[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Convert ClickUp list to Project interface
export function mapClickUpListToProject(list: ClickUpListData, projectType?: string): Project {
  return {
    id: list.id,
    name: list.name,
    clickupListId: list.id,
    description: `${list.spaceName} projesi`,
    techStack: ["Next.js", "React", "TypeScript"], // Default tech stack
    aiContext: "Bu proje için teknik analiz ve görev yönetimi yap",
    spaceName: list.spaceName,
    folderName: list.folderName,
    displayName: list.displayName,
    projectType: projectType || 'Web Uygulaması'
  };
}

// Convert database record to Project interface
export function mapDatabaseToProject(dbProject: any): Project {
  return {
    id: dbProject.id,
    name: dbProject.name,
    clickupListId: dbProject.clickup_list_id,
    description: dbProject.space_name ? `${dbProject.space_name} projesi` : dbProject.name,
    techStack: JSON.parse(dbProject.tech_stack || '["Next.js", "React", "TypeScript"]'),
    aiContext: "Bu proje için teknik analiz ve görev yönetimi yap",
    spaceName: dbProject.space_name,
    folderName: dbProject.folder_name,
    displayName: dbProject.display_name,
    projectType: dbProject.project_type || 'Web Uygulaması'
  };
}

// Analyze project type based on tasks
async function analyzeProjectType(projectName: string, listId: string): Promise<string> {
  try {
    const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';
    
    if (!process.env.CLICKUP_API_TOKEN) {
      console.warn('ClickUp API token missing for analysis');
      return inferProjectTypeFromName(projectName);
    }
    
    // Fetch tasks directly from ClickUp
    const tasksResponse = await axios.get(
      `${CLICKUP_API_URL}/list/${listId}/task`,
      {
        headers: {
          'Authorization': process.env.CLICKUP_API_TOKEN,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        params: {
          page: 0,
          order_by: 'created',
          reverse: true,
          subtasks: false,
          include_closed: true,
          limit: 10
        }
      }
    );
    
    const tasks = tasksResponse.data.tasks || [];
    
    if (tasks.length === 0) {
      return inferProjectTypeFromName(projectName);
    }
    
    // Format tasks for AI analysis
    const formattedTasks = tasks.slice(0, 10).map((task: any) => ({
      id: task.id,
      name: task.name,
      description: task.description || '',
      tags: task.tags?.map((tag: any) => tag.name) || []
    }));
    
    // AI analizi yap - OpenAI direkt call
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key missing for analysis');
      return inferProjectTypeFromName(projectName);
    }
    
    const prompt = `
Bir yazılım projesinin türünü belirlemek için proje adı ve task'larını analiz et.

Proje Adı: ${projectName}

Task'lar:
${formattedTasks.map((task, index) => `
${index + 1}. ${task.name}
   Açıklama: ${task.description?.substring(0, 200) || ''}
   Etiketler: ${task.tags?.join(', ') || ''}
`).join('')}

Bu proje verilerine bakarak, projenin hangi kategoride olduğunu belirle:

Kategoriler:
- "E-ticaret" (online mağaza, ürün yönetimi, sipariş, ödeme)
- "Mobil Uygulama" (iOS/Android uygulama, native, react native)
- "Web Uygulaması" (web tabanlı sistem, SaaS, dashboard)
- "Kurumsal Website" (tanıtım sitesi, blog, şirket web sitesi)
- "CRM/ERP" (müşteri yönetimi, iş süreçleri, enterprise)
- "Oyun" (game development, unity, oyun mekanikleri)
- "API/Backend" (microservices, API, database, server)
- "Mobil Oyun" (mobile game, casual game, puzzle)
- "E-öğrenme" (education, course, learning management)
- "Fintech" (banking, payment, financial services)
- "Sağlık" (healthcare, medical, hospital management)
- "Emlak" (real estate, property management)
- "Sosyal Medya" (social platform, community, messaging)
- "İçerik Yönetimi" (CMS, blog platform, publishing)
- "Lojistik" (shipping, delivery, warehouse management)

Sadece en uygun kategori adını döndür, başka açıklama yapma.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Sen bir yazılım proje kategorilendirme uzmanısın. Proje adı ve task'larına bakarak projenin türünü doğru şekilde belirleyebilirsin."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 50
    });

    const projectType = completion.choices[0].message.content?.trim() || 'Web Uygulaması';
    return projectType;
    
  } catch (error) {
    console.warn(`Project type analizi hatası ${projectName}:`, error);
    return inferProjectTypeFromName(projectName);
  }
}

// Proje adından basit çıkarım
function inferProjectTypeFromName(projectName: string): string {
  const name = projectName.toLowerCase();
  
  if (name.includes('app') || name.includes('mobile') || name.includes('ios') || name.includes('android')) {
    return 'Mobil Uygulama';
  } else if (name.includes('shop') || name.includes('store') || name.includes('ecommerce') || name.includes('e-commerce')) {
    return 'E-ticaret';
  } else if (name.includes('game') || name.includes('oyun')) {
    return 'Oyun';
  } else if (name.includes('api') || name.includes('backend') || name.includes('service')) {
    return 'API/Backend';
  } else if (name.includes('crm') || name.includes('erp')) {
    return 'CRM/ERP';
  } else if (name.includes('blog') || name.includes('website') || name.includes('site')) {
    return 'Kurumsal Website';
  }
  
  return 'Web Uygulaması';
}

export async function getProjects(signal?: AbortSignal): Promise<Project[]> {
  // Check cache first
  const now = Date.now();
  if (cachedProjects && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedProjects;
  }

  try {
    // Initialize database if needed (safe to call multiple times)
    try {
      await initializeDatabase();
    } catch (dbError) {
      console.warn('Database initialization warning:', dbError);
    }

    // 1. Get projects from database
    let dbProjects: Project[] = [];
    try {
      const dbRecords = await getProjectsFromDatabase();
      dbProjects = dbRecords.map(mapDatabaseToProject);
    } catch (dbError) {
      console.warn('Database read warning:', dbError);
    }

    // 2. Get current projects from ClickUp
    const clickUpLists = await fetchWorkspaceLists(signal);
    
    // Check if request was aborted
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }
    
    // 3. Sync database with ClickUp (upsert all ClickUp projects)
    for (const clickupList of clickUpLists) {
      try {
        await upsertProject({
          id: clickupList.id,
          name: clickupList.name,
          clickupListId: clickupList.id,
          spaceName: clickupList.spaceName,
          folderName: clickupList.folderName,
          displayName: clickupList.displayName
        });
      } catch (upsertError) {
        console.warn(`Upsert failed for project ${clickupList.name}:`, upsertError);
      }
    }

    // 4. Get updated projects from database
    try {
      const updatedDbRecords = await getProjectsFromDatabase();
      const projects = updatedDbRecords.map(mapDatabaseToProject);
      
      // 5. Start background analysis for projects that need it
      setTimeout(async () => {
        await analyzeProjectsInBackground(projects);
      }, 1000);
      
      // Update cache
      if (!signal?.aborted) {
        cachedProjects = projects;
        cacheTimestamp = now;
      }
      
      return projects;
    } catch (dbError) {
      console.warn('Final database read failed, using ClickUp data:', dbError);
      // Fallback to ClickUp data
      const projects = clickUpLists.map(list => mapClickUpListToProject(list));
      
      if (!signal?.aborted) {
        cachedProjects = projects;
        cacheTimestamp = now;
      }
      
      return projects;
    }
    
  } catch (error) {
    // Don't log abort errors
    if (error instanceof Error && error.message === 'Request aborted') {
      throw error;
    }
    
    console.error('Project loading error:', error);
    
    // Final fallback: try to return cached or database data
    if (cachedProjects) {
      return cachedProjects;
    }
    
    try {
      const dbRecords = await getProjectsFromDatabase();
      return dbRecords.map(mapDatabaseToProject);
    } catch {
      throw new Error('ClickUp API bağlantısı başarısız ve database erişilemez. Lütfen API ayarlarınızı kontrol edin.');
    }
  }
}

// Background analysis for projects that need it
async function analyzeProjectsInBackground(projects: Project[]): Promise<void> {
  try {
    // Filter projects that need analysis first
    const projectsNeedingAnalysis: Project[] = [];
    
    for (const project of projects) {
      try {
        const needsAnalysisResult = await needsAnalysis(project.id);
        if (needsAnalysisResult) {
          projectsNeedingAnalysis.push(project);
        }
      } catch (error) {
        console.warn(`Analysis check failed for ${project.name}:`, error);
      }
    }
    
    if (projectsNeedingAnalysis.length === 0) {
      console.log('No projects need analysis');
      return;
    }
    
    console.log(`Starting background analysis for ${projectsNeedingAnalysis.length} projects`);
    
    // Process in batches of 3 to avoid overwhelming APIs
    const BATCH_SIZE = 3;
    const batches = chunkArray(projectsNeedingAnalysis, BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} projects)`);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (project) => {
        try {
          console.log(`Analyzing project type for: ${project.name}`);
          
          const projectType = await analyzeProjectType(project.name, project.clickupListId);
          await updateProjectType(project.id, projectType);
          
          console.log(`✅ Project ${project.name} analyzed as: ${projectType}`);
          return { success: true, project: project.name, type: projectType };
        } catch (analysisError) {
          console.warn(`❌ Background analysis failed for ${project.name}:`, analysisError);
          return { success: false, project: project.name, error: analysisError };
        }
      });
      
      // Wait for batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Log batch results
      const successful = batchResults.filter(result => result.status === 'fulfilled').length;
      console.log(`Batch ${batchIndex + 1} completed: ${successful}/${batch.length} successful`);
      
      // Wait 2 seconds between batches to avoid rate limits
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`Background analysis completed for all ${projectsNeedingAnalysis.length} projects`);
    
  } catch (error) {
    console.warn('Background analysis error:', error);
  }
}

// Helper function to chunk array into smaller arrays
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
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
