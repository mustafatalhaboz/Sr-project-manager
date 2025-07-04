import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { RequestData, Project } from '@/lib/types';
import { getProjectById } from '@/lib/projects';
import ProcessingView from '@/components/ui/ProcessingView';
import StepIndicator from '@/components/ui/StepIndicator';

export default function Processing() {
  const router = useRouter();
  const [requestData, setRequestData] = useState<RequestData | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    const { request: requestString, projectId } = router.query;

    if (!requestString || !projectId) {
      setError('Gerekli bilgiler bulunamadı. Lütfen talep formunu doldurun.');
      setIsLoading(false);
      return;
    }

    try {
      // Parse request data
      const parsedRequest = JSON.parse(requestString as string) as RequestData;
      setRequestData(parsedRequest);

      // Get project info
      const projectInfo = getProjectById(projectId as string);
      if (!projectInfo) {
        setError('Proje bulunamadı. Lütfen geçerli bir proje seçin.');
        setIsLoading(false);
        return;
      }
      setProject(projectInfo);

      setIsLoading(false);
    } catch (err) {
      console.error('Request parsing error:', err);
      setError('Talep bilgileri ayrıştırılamadı. Lütfen tekrar deneyin.');
      setIsLoading(false);
    }
  }, [router.isReady, router.query]);

  const handleBack = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Yükleniyor... - Müşteri Talep Yönetimi</title>
        </Head>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <StepIndicator currentStep="processing" />
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Hata - Müşteri Talep Yönetimi</title>
        </Head>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <StepIndicator currentStep="processing" />
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Hata</h2>
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
        </div>
      </>
    );
  }

  if (!requestData || !project) {
    return null;
  }

  return (
    <>
      <Head>
        <title>AI Analizi - Müşteri Talep Yönetimi</title>
        <meta name="description" content="AI destekli müşteri talep analizi devam ediyor" />
      </Head>
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <StepIndicator currentStep="processing" />
        </div>
        
        <ProcessingView 
          requestData={requestData} 
          project={project}
        />
      </div>
    </>
  );
}
