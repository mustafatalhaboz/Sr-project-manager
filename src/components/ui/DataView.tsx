import React, { useState, useEffect } from 'react';
import { WorkspaceData, ClickUpTaskWithStatus } from '../../lib/types';

interface DataViewProps {
  className?: string;
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export default function DataView({ className = '' }: DataViewProps) {
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null
  });
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const fetchWorkspaceData = async () => {
    setLoadingState({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/clickup/workspace-tasks');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Veri alınamadı');
      }

      const result = await response.json();
      setWorkspaceData(result.data || []);
    } catch (error) {
      console.error('Workspace data fetch error:', error);
      setLoadingState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
      });
    } finally {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const toggleWorkspace = (workspaceName: string) => {
    setExpandedWorkspaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workspaceName)) {
        newSet.delete(workspaceName);
      } else {
        newSet.add(workspaceName);
      }
      return newSet;
    });
  };

  const toggleSpace = (spaceKey: string) => {
    setExpandedSpaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(spaceKey)) {
        newSet.delete(spaceKey);
      } else {
        newSet.add(spaceKey);
      }
      return newSet;
    });
  };

  const toggleList = (listKey: string) => {
    setExpandedLists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listKey)) {
        newSet.delete(listKey);
      } else {
        newSet.add(listKey);
      }
      return newSet;
    });
  };

  const formatPriority = (priority: ClickUpTaskWithStatus['priority']) => {
    if (!priority) return { text: 'No Priority', color: 'bg-gray-100 text-gray-700' };
    
    const priorityMap: { [key: string]: string } = {
      'urgent': 'bg-red-100 text-red-700',
      'high': 'bg-orange-100 text-orange-700',
      'normal': 'bg-yellow-100 text-yellow-700',
      'low': 'bg-green-100 text-green-700'
    };

    return {
      text: priority.priority,
      color: priorityMap[priority.priority.toLowerCase()] || 'bg-gray-100 text-gray-700'
    };
  };

  const TaskCard = ({ task }: { task: ClickUpTaskWithStatus }) => {
    const priorityInfo = formatPriority(task.priority);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-gray-900 flex-1 pr-2">{task.name}</h4>
          <div className="flex items-center space-x-2">
            <span 
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: task.status.color + '20',
                color: task.status.color 
              }}
            >
              {task.status.status}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
              {priorityInfo.text}
            </span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          <span className="font-medium">ID:</span> {task.id}
        </div>

        {task.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{task.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex items-center">
              <span className="mr-1">👤</span>
              <span>{task.assignees.map(a => a.username).join(', ')}</span>
            </div>
          )}
          
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="text-gray-400">+{task.tags.length - 3} more</span>
              )}
            </div>
          )}

          {task.due_date && (
            <div className="flex items-center">
              <span className="mr-1">📅</span>
              <span>{new Date(parseInt(task.due_date)).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loadingState.isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">ClickUp verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (loadingState.error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="ml-3 text-sm font-medium text-red-800">
            Veri Yükleme Hatası
          </h3>
        </div>
        <p className="text-sm text-red-700 mb-4">{loadingState.error}</p>
        <button
          onClick={fetchWorkspaceData}
          className="bg-red-100 text-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (!workspaceData || workspaceData.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <p className="text-gray-600">Henüz veri bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {workspaceData.map((workspace) => (
        <div key={workspace.workspaceName} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleWorkspace(workspace.workspaceName)}
            className="w-full px-6 py-4 text-left bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-between"
          >
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="mr-2">🏢</span>
              {workspace.workspaceName}
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {workspace.spaces.length} space{workspace.spaces.length !== 1 ? 's' : ''}
              </span>
              <svg
                className={`w-5 h-5 transform transition-transform ${
                  expandedWorkspaces.has(workspace.workspaceName) ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {expandedWorkspaces.has(workspace.workspaceName) && (
            <div className="px-6 pb-4">
              {workspace.spaces.map((space) => {
                const spaceKey = `${workspace.workspaceName}-${space.spaceName}`;
                const totalTasks = space.lists.reduce((sum, list) => sum + list.inProgressTasks.length, 0);
                
                return (
                  <div key={spaceKey} className="mt-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSpace(spaceKey)}
                      className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                      <h3 className="font-medium text-gray-800 flex items-center">
                        <span className="mr-2">📁</span>
                        {space.spaceName}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {totalTasks} in-progress task{totalTasks !== 1 ? 's' : ''}
                        </span>
                        <svg
                          className={`w-4 h-4 transform transition-transform ${
                            expandedSpaces.has(spaceKey) ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>

                    {expandedSpaces.has(spaceKey) && (
                      <div className="px-4 pb-3">
                        {space.lists.map((list) => {
                          const listKey = `${spaceKey}-${list.listId}`;
                          
                          return (
                            <div key={listKey} className="mt-3 border border-gray-200 rounded-md overflow-hidden">
                              <button
                                onClick={() => toggleList(listKey)}
                                className="w-full px-3 py-2 text-left bg-gray-25 hover:bg-gray-50 transition-colors flex items-center justify-between"
                              >
                                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                                  <span className="mr-2">📋</span>
                                  {list.folderName && (
                                    <span className="text-gray-500 mr-1">{list.folderName} / </span>
                                  )}
                                  {list.listName}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    {list.inProgressTasks.length} task{list.inProgressTasks.length !== 1 ? 's' : ''}
                                  </span>
                                  <svg
                                    className={`w-3 h-3 transform transition-transform ${
                                      expandedLists.has(listKey) ? 'rotate-90' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </button>

                              {expandedLists.has(listKey) && (
                                <div className="p-3 bg-white space-y-3">
                                  {list.inProgressTasks.map((task) => (
                                    <TaskCard key={task.id} task={task} />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}