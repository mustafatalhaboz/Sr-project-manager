import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Send, AlertCircle, FileText, Tag, Clock } from 'lucide-react';
import { Project, RequestData } from '@/lib/types';
import ProjectSelector from './ProjectSelector';
import { getProjects } from '@/lib/projects';

interface RequestFormProps {
  className?: string;
}

const RequestForm: React.FC<RequestFormProps> = ({ className = '' }) => {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [requestText, setRequestText] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [type, setType] = useState<'bug' | 'feature' | 'improvement' | 'question'>('feature');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projects = getProjects();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProject) {
      setError('Lütfen bir proje seçin');
      return;
    }

    if (!requestText.trim()) {
      setError('Lütfen talep açıklamasını girin');
      return;
    }

    if (requestText.trim().length < 10) {
      setError('Talep açıklaması en az 10 karakter olmalıdır');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData: RequestData = {
        text: requestText.trim(),
        projectId: selectedProject.id,
        priority,
        type
      };

      // Processing sayfasına yönlendir
      router.push({
        pathname: '/processing',
        query: {
          request: JSON.stringify(requestData),
          projectId: selectedProject.id
        }
      });
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800';
      case 'feature': return 'bg-blue-100 text-blue-800';
      case 'improvement': return 'bg-purple-100 text-purple-800';
      case 'question': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Yeni Müşteri Talebi
          </h2>
          <p className="text-gray-600">
            Talebinizi açıklayın ve AI analizi için gerekli bilgileri sağlayın
          </p>
        </div>

        {error && (
          <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <ProjectSelector
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={setSelectedProject}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Talep Açıklaması
          </label>
          <textarea
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="Talebinizi detaylı olarak açıklayın..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            disabled={isSubmitting}
          />
          <div className="mt-1 text-sm text-gray-500">
            {requestText.length}/500 karakter
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-2" />
              Talep Türü
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              disabled={isSubmitting}
            >
              <option value="feature">Yeni Özellik</option>
              <option value="bug">Hata Düzeltme</option>
              <option value="improvement">İyileştirme</option>
              <option value="question">Soru</option>
            </select>
            <div className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(type)}`}>
                {type === 'feature' && 'Yeni Özellik'}
                {type === 'bug' && 'Hata Düzeltme'}
                {type === 'improvement' && 'İyileştirme'}
                {type === 'question' && 'Soru'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Öncelik
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              disabled={isSubmitting}
            >
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
              <option value="urgent">Acil</option>
            </select>
            <div className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
                {priority === 'low' && 'Düşük'}
                {priority === 'medium' && 'Orta'}
                {priority === 'high' && 'Yüksek'}
                {priority === 'urgent' && 'Acil'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !selectedProject || !requestText.trim()}
            className={`flex items-center px-6 py-3 rounded-md font-medium transition-all duration-200 ${
              isSubmitting || !selectedProject || !requestText.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Gönderiliyor...
              </div>
            ) : (
              <div className="flex items-center">
                <Send className="w-4 h-4 mr-2" />
                AI Analizi Başlat
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestForm;
