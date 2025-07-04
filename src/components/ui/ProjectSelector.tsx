import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Folder } from 'lucide-react';
import { Project } from '../../lib/types';

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  onProjectSelect: (project: Project) => void;
  className?: string;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProject,
  onProjectSelect,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleProjectClick = (project: Project) => {
    onProjectSelect(project);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Proje Seçin
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <div className="flex items-center">
            <Folder className="w-5 h-5 text-gray-400 mr-3" />
            {selectedProject ? (
              <div>
                <span className="font-medium text-gray-900">{selectedProject.name}</span>
                <span className="text-gray-600 text-sm ml-2">
                  ({selectedProject.techStack.join(', ')})
                </span>
              </div>
            ) : (
              <span className="text-gray-600">Bir proje seçin...</span>
            )}
          </div>
          <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {projects.map((project) => (
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
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-gray-500">{project.description}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {project.techStack.join(', ')}
                    </div>
                  </div>
                </div>
              </button>
            ))}
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