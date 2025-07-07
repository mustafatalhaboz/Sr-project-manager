import { sql } from '@vercel/postgres';

export interface ProjectRecord {
  id: string;
  name: string;
  clickup_list_id: string;
  project_type: string;
  tech_stack: string; // JSON string
  space_name: string;
  folder_name: string | null;
  display_name: string;
  last_analyzed: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        clickup_list_id TEXT NOT NULL,
        project_type TEXT DEFAULT 'Web Uygulaması',
        tech_stack TEXT DEFAULT '["Next.js", "React", "TypeScript"]',
        space_name TEXT NOT NULL,
        folder_name TEXT,
        display_name TEXT NOT NULL,
        last_analyzed TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS project_analyses (
        id SERIAL PRIMARY KEY,
        project_id TEXT REFERENCES projects(id),
        analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        task_count INTEGER DEFAULT 0,
        ai_confidence REAL DEFAULT 0.0,
        project_type_detected TEXT NOT NULL,
        tasks_analyzed TEXT DEFAULT '[]'
      );
    `;

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Get all projects from database
export async function getProjectsFromDatabase(): Promise<ProjectRecord[]> {
  try {
    const { rows } = await sql<ProjectRecord>`
      SELECT * FROM projects 
      ORDER BY updated_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Error fetching projects from database:', error);
    throw error;
  }
}

// Get single project by ID
export async function getProjectById(projectId: string): Promise<ProjectRecord | null> {
  try {
    const { rows } = await sql<ProjectRecord>`
      SELECT * FROM projects 
      WHERE id = ${projectId}
      LIMIT 1
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    return null;
  }
}

// Insert or update project
export async function upsertProject(project: {
  id: string;
  name: string;
  clickupListId: string;
  projectType?: string;
  techStack?: string[];
  spaceName: string;
  folderName?: string | null;
  displayName: string;
}): Promise<void> {
  try {
    const techStackJson = JSON.stringify(project.techStack || ["Next.js", "React", "TypeScript"]);
    const projectType = project.projectType || 'Web Uygulaması';

    await sql`
      INSERT INTO projects (
        id, name, clickup_list_id, project_type, tech_stack, 
        space_name, folder_name, display_name, updated_at
      )
      VALUES (
        ${project.id}, ${project.name}, ${project.clickupListId}, ${projectType}, ${techStackJson},
        ${project.spaceName}, ${project.folderName}, ${project.displayName}, CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        clickup_list_id = EXCLUDED.clickup_list_id,
        space_name = EXCLUDED.space_name,
        folder_name = EXCLUDED.folder_name,
        display_name = EXCLUDED.display_name,
        updated_at = CURRENT_TIMESTAMP
    `;
  } catch (error) {
    console.error('Error upserting project:', error);
    throw error;
  }
}

// Update project type after AI analysis
export async function updateProjectType(
  projectId: string, 
  projectType: string, 
  taskCount: number = 0, 
  aiConfidence: number = 0.8,
  tasksAnalyzed: unknown[] = []
): Promise<void> {
  try {
    // Update project table
    await sql`
      UPDATE projects 
      SET 
        project_type = ${projectType},
        last_analyzed = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${projectId}
    `;

    // Insert analysis record
    await sql`
      INSERT INTO project_analyses (
        project_id, task_count, ai_confidence, project_type_detected, tasks_analyzed
      )
      VALUES (
        ${projectId}, ${taskCount}, ${aiConfidence}, ${projectType}, ${JSON.stringify(tasksAnalyzed)}
      )
    `;
  } catch (error) {
    console.error('Error updating project type:', error);
    throw error;
  }
}

// Check if project needs analysis (hasn't been analyzed in last 7 days)
export async function needsAnalysis(projectId: string): Promise<boolean> {
  try {
    const { rows } = await sql`
      SELECT last_analyzed FROM projects 
      WHERE id = ${projectId}
      LIMIT 1
    `;

    if (!rows[0] || !rows[0].last_analyzed) {
      return true; // Never analyzed
    }

    const lastAnalyzed = new Date(rows[0].last_analyzed);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return lastAnalyzed < sevenDaysAgo;
  } catch (error) {
    console.error('Error checking analysis need:', error);
    return true; // If error, assume needs analysis
  }
}

// Get projects that need analysis
export async function getProjectsNeedingAnalysis(): Promise<string[]> {
  try {
    const { rows } = await sql`
      SELECT id FROM projects 
      WHERE last_analyzed IS NULL 
         OR last_analyzed < (CURRENT_TIMESTAMP - INTERVAL '7 days')
    `;
    return rows.map(row => row.id);
  } catch (error) {
    console.error('Error getting projects needing analysis:', error);
    return [];
  }
}

// Delete old analysis records (keep last 10 per project)
export async function cleanupOldAnalyses(): Promise<void> {
  try {
    await sql`
      DELETE FROM project_analyses 
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY analysis_date DESC) as rn
          FROM project_analyses
        ) ranked
        WHERE rn <= 10
      )
    `;
  } catch (error) {
    console.error('Error cleaning up old analyses:', error);
  }
}