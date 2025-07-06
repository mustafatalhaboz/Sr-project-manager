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
