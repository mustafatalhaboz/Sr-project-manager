import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Folder, RefreshCw, AlertCircle } from 'lucide-react';
import { Project } from '../../lib/types';
import { getProjects, clearProjectsCache } from '../../lib/projects';

interface ProjectSelectorProps {
  selectedProject: Project | null;
  onProjectSelect: (project: Project) => void;
  className?: string;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  selectedProject,
  onProjectSelect,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const projectList = await getProjects();
      setProjects(projectList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Projeler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    clearProjectsCache();
    await loadProjects();
  };

  const handleProjectClick = (project: Project) => {
    onProjectSelect(project);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Proje Seçin
        </label>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {error && (
        <div className="flex items-center p-2 mb-2 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="relative w-full bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center">
            <Folder className="w-5 h-5 text-gray-400 mr-3" />
            {isLoading ? (
              <span className="text-gray-600">Projeler yükleniyor...</span>
            ) : selectedProject ? (
              <div>
                <span className="font-medium text-gray-900">
                  {selectedProject.displayName || selectedProject.name}
                </span>
                <span className="text-gray-600 text-sm ml-2">
                  ({selectedProject.techStack.join(', ')})
                </span>
              </div>
            ) : (
              <span className="text-gray-600">Bir proje seçin...</span>
            )}
          </div>
          <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {isLoading ? (
              <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </span>
        </button>

        {isOpen && !isLoading && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {projects.length === 0 ? (
              <div className="px-4 py-2 text-gray-500">
                Proje bulunamadı
              </div>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                    selectedProject?.id === project.id ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                  }`}
                >
                  <div className="flex items-center">
                    <Folder className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">
                        {project.displayName || project.name}
                      </div>
                      <div className="text-sm text-gray-500">{project.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {project.techStack.join(', ')}
                      </div>
                      {project.spaceName && (
                        <div className="text-xs text-blue-600 mt-1">
                          {project.spaceName}
                          {project.folderName && ` / ${project.folderName}`}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {selectedProject && (
        <div className="mt-2 p-3 bg-blue-50 rounded-md">
          <div className="text-sm">
            <div className="font-medium text-blue-900">Seçilen Proje</div>
            <div className="text-blue-700 mt-1">{selectedProject.description}</div>
            <div className="text-blue-600 text-xs mt-1">
              Teknolojiler: {selectedProject.techStack.join(', ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;