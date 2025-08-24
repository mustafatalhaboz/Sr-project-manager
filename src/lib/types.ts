export interface Project {
  id: string;
  name: string;
  clickupListId: string;
  description: string;
  techStack: string[];
  aiContext: string;
  spaceName?: string;
  folderName?: string;
  displayName?: string;
  projectType?: string;
}

export interface RequestData {
  text: string;
  projectId: string;
  clickupListId: string; // Seçilen board'un gerçek ID'si
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'bug' | 'feature' | 'improvement' | 'question';
}

// ClickUp API'den gelen list verisi
export interface ClickUpListData {
  id: string;
  name: string;
  spaceName: string;
  folderName: string | null;
  displayName: string;
}

export interface AIAnalysisResult {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: string;
  technicalRequirements: string[];
  acceptanceCriteria: string[];
  tags: string[];
  assignee?: string;
  dueDate?: string;
}

export interface ClickUpTask {
  id: string;
  name: string;
  description: string;
  priority: number;
  status: string;
  url: string;
}

export interface ValidationData {
  request: RequestData;
  analysis: AIAnalysisResult;
  project: Project;
}

export type WorkflowStep = 'request' | 'processing' | 'validation';

export interface ProcessingState {
  currentStep: number;
  totalSteps: number;
  message: string;
  progress: number;
}

// ClickUp Workspace ve Space interface'leri
export interface ClickUpSpace {
  id: string;
  name: string;
  private: boolean;
  color?: string;
  avatar?: string;
}

export interface ClickUpWorkspace {
  id: string;
  name: string;
  spaces: ClickUpSpace[];
}

// Status bilgisini içeren task interface'i
export interface ClickUpTaskWithStatus {
  id: string;
  name: string;
  description?: string;
  status: {
    id: string;
    status: string;
    color: string;
    type: string;
    orderindex: number;
  };
  priority: {
    id: string;
    priority: string;
    color: string;
    orderindex: number;
  } | null;
  tags: string[];
  list: {
    id: string;
    name: string;
  };
  folder?: {
    id: string;
    name: string;
  };
  space: {
    id: string;
    name: string;
  };
  assignees: Array<{
    id: string;
    username: string;
    email: string;
  }>;
  due_date?: string;
  start_date?: string;
  time_estimate?: number;
}

// Workspace verilerini gruplandıran interface
export interface WorkspaceData {
  workspaceName: string;
  spaces: Array<{
    spaceName: string;
    lists: Array<{
      listId: string;
      listName: string;
      folderName?: string;
      inProgressTasks: ClickUpTaskWithStatus[];
    }>;
  }>;
}
