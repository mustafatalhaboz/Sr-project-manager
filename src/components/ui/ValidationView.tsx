import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  CheckCircle, 
  Edit, 
  ArrowLeft, 
  ExternalLink, 
  Clock, 
  Tag, 
  User,
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { ValidationData, AIAnalysisResult } from '@/lib/types';
import { createTask } from '@/lib/clickup';
import { refineAnalysis } from '@/lib/openai';

interface ValidationViewProps {
  data: ValidationData;
  className?: string;
}

const ValidationView: React.FC<ValidationViewProps> = ({ data, className = '' }) => {
  const router = useRouter();
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [taskUrl, setTaskUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysisResult>(data.analysis);

  const handleApprove = async () => {
    setIsCreatingTask(true);
    setError(null);

    try {
      const task = await createTask(currentAnalysis, data.project);
      setTaskUrl(task.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Task oluşturulamadı');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleRefine = async () => {
    if (!feedback.trim()) {
      setError('Lütfen geri bildirim girin');
      return;
    }

    setIsRefining(true);
    setError(null);

    try {
      const refinedAnalysis = await refineAnalysis(currentAnalysis, feedback, data.project);
      setCurrentAnalysis(refinedAnalysis);
      setFeedback('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analiz düzenlenemedi');
    } finally {
      setIsRefining(false);
    }
  };

  const handleBack = () => {
    router.push('/');
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Acil';
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return priority;
    }
  };

  if (taskUrl) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Task Başarıyla Oluşturuldu!
          </h2>
          <p className="text-gray-600 mb-6">
            ClickUp'ta yeni task oluşturuldu ve ekibinize atandı.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={taskUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              ClickUp'ta Görüntüle
            </a>
            <button
              onClick={handleBack}
              className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Yeni Talep
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          AI Analiz Sonuçları
        </h2>
        <p className="text-gray-600">
          Analiz sonuçlarını inceleyin ve gerekirse düzenleyin
        </p>
      </div>

      {error && (
        <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol taraf - Orijinal Talep */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Orijinal Talep</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Proje:</span>
                <p className="font-medium">{data.project.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Talep:</span>
                <p className="text-sm">{data.request.text}</p>
              </div>
              <div className="flex gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(data.request.priority)}`}>
                  {getPriorityLabel(data.request.priority)}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {data.request.type}
                </span>
              </div>
            </div>
          </div>

          {/* Geri Bildirim Formu */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              <Edit className="w-4 h-4 inline mr-2" />
              Analizi Düzenle
            </h3>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Analizi nasıl düzenlenmesini istiyorsunuz?"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={handleRefine}
              disabled={isRefining || !feedback.trim()}
              className={`mt-2 flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                isRefining || !feedback.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRefining ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Düzenleniyor...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Yeniden Analiz Et
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sağ taraf - AI Analiz Sonuçları */}
        <div className="space-y-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">AI Analiz Sonuçları</h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Başlık:</span>
                <p className="font-medium">{currentAnalysis.title}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Açıklama:</span>
                <p className="text-sm">{currentAnalysis.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Kategori:</span>
                  <p className="font-medium">{currentAnalysis.category}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Tahmini Süre:</span>
                  <p className="font-medium">{currentAnalysis.estimatedTime}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(currentAnalysis.priority)}`}>
                  <Clock className="w-3 h-3 mr-1" />
                  {getPriorityLabel(currentAnalysis.priority)}
                </span>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Teknik Gereksinimler:</span>
                <ul className="text-sm mt-1 space-y-1">
                  {currentAnalysis.technicalRequirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Kabul Kriterleri:</span>
                <ul className="text-sm mt-1 space-y-1">
                  {currentAnalysis.acceptanceCriteria.map((criteria, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {criteria}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Etiketler:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {currentAnalysis.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alt butonlar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mt-8">
        <button
          onClick={handleBack}
          className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </button>
        
        <button
          onClick={handleApprove}
          disabled={isCreatingTask}
          className={`flex items-center justify-center px-6 py-3 rounded-md font-medium transition-colors ${
            isCreatingTask
              ? 'bg-green-300 text-green-700 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isCreatingTask ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Task Oluşturuluyor...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Onayla ve Task Oluştur
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ValidationView;
