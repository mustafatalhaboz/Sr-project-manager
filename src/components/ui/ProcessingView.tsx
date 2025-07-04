import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Brain, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { RequestData, Project, ProcessingState } from '@/lib/types';
import { analyzeRequest } from '@/lib/openai';

interface ProcessingViewProps {
  requestData: RequestData;
  project: Project;
  className?: string;
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ 
  requestData, 
  project, 
  className = '' 
}) => {
  const router = useRouter();
  const [processingState, setProcessingState] = useState<ProcessingState>({
    currentStep: 1,
    totalSteps: 4,
    message: 'AI analizi başlatılıyor...',
    progress: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const processingSteps = [
    { id: 1, message: 'Talep metni analiz ediliyor...', duration: 2000 },
    { id: 2, message: 'Proje bağlamı değerlendiriliyor...', duration: 1500 },
    { id: 3, message: 'Teknik gereksinimler belirleniyor...', duration: 2500 },
    { id: 4, message: 'Sonuçlar hazırlanıyor...', duration: 1000 }
  ];

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const processAnalysis = async () => {
      try {
        // Her adımı simüle et
        for (let i = 0; i < processingSteps.length; i++) {
          const step = processingSteps[i];
          
          setProcessingState({
            currentStep: step.id,
            totalSteps: processingSteps.length,
            message: step.message,
            progress: ((i + 1) / processingSteps.length) * 100
          });

          // Son adım değilse bekle
          if (i < processingSteps.length - 1) {
            await new Promise(resolve => setTimeout(resolve, step.duration));
          }
        }

        // AI analizi yap
        const analysisResult = await analyzeRequest(requestData, project);
        
        // Başarı durumunu göster
        setProcessingState({
          currentStep: processingSteps.length,
          totalSteps: processingSteps.length,
          message: 'Analiz tamamlandı! Sonuçlar hazırlanıyor...',
          progress: 100
        });

        setIsComplete(true);

        // Validation sayfasına yönlendir
        timeoutId = setTimeout(() => {
          router.push({
            pathname: '/validation',
            query: {
              data: JSON.stringify({
                request: requestData,
                analysis: analysisResult,
                project: project
              })
            }
          });
        }, 1500);

      } catch (err) {
        console.error('AI analiz hatası:', err);
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata oluştu');
        setProcessingState(prev => ({
          ...prev,
          message: 'Analiz sırasında hata oluştu'
        }));
      }
    };

    processAnalysis();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [requestData, project, router, processingSteps]);

  const handleBack = () => {
    router.push('/');
  };

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Analiz Hatası
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="flex items-center justify-center mx-auto px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="text-center">
        <div className="flex justify-center mb-6">
          {isComplete ? (
            <CheckCircle className="w-16 h-16 text-green-500" />
          ) : (
            <div className="relative">
              <Brain className="w-16 h-16 text-blue-500 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isComplete ? 'Analiz Tamamlandı!' : 'AI Analizi Devam Ediyor'}
        </h2>
        
        <p className="text-gray-600 mb-8">
          {processingState.message}
        </p>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Adım {processingState.currentStep} / {processingState.totalSteps}</span>
            <span>{Math.round(processingState.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${processingState.progress}%` }}
            />
          </div>
        </div>

        {/* Processing Steps */}
        <div className="space-y-4 mb-8">
          {processingSteps.map((step) => {
            const isCurrentStep = step.id === processingState.currentStep;
            const isCompleted = step.id < processingState.currentStep || isComplete;

            return (
              <div
                key={step.id}
                className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                  isCurrentStep ? 'bg-blue-50 border border-blue-200' : 
                  isCompleted ? 'bg-green-50 border border-green-200' : 
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted ? 'bg-green-500 text-white' : 
                  isCurrentStep ? 'bg-blue-500 text-white' : 
                  'bg-gray-300 text-gray-600'
                }`}>
                  {isCompleted ? '✓' : step.id}
                </div>
                <div className={`ml-3 text-sm ${
                  isCurrentStep ? 'text-blue-700 font-medium' : 
                  isCompleted ? 'text-green-700' : 
                  'text-gray-500'
                }`}>
                  {step.message}
                </div>
                {isCurrentStep && !isComplete && (
                  <div className="ml-auto">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Project Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Analiz Edilen Proje</h3>
          <div className="text-sm text-gray-600">
            <div className="font-medium">{project.name}</div>
            <div className="text-xs text-gray-500 mt-1">
              {project.techStack.join(', ')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingView;