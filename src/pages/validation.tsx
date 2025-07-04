import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { ValidationData } from '../lib/types';
import ValidationView from '../components/ui/ValidationView';
import StepIndicator from '../components/ui/StepIndicator';

export default function Validation() {
  const router = useRouter();
  const [validationData, setValidationData] = useState<ValidationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    const { data: dataString } = router.query;

    if (!dataString) {
      setError('Analiz sonuçları bulunamadı. Lütfen analiz sürecini tekrar başlatın.');
      setIsLoading(false);
      return;
    }

    try {
      // Parse validation data
      const parsedData = JSON.parse(dataString as string) as ValidationData;
      
      // Validate the parsed data
      if (!parsedData.request || !parsedData.analysis || !parsedData.project) {
        setError('Geçersiz veri formatı. Lütfen analiz sürecini tekrar başlatın.');
        setIsLoading(false);
        return;
      }

      setValidationData(parsedData);
      setIsLoading(false);
    } catch (err) {
      console.error('Validation data parsing error:', err);
      setError('Analiz sonuçları ayrıştırılamadı. Lütfen tekrar deneyin.');
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <StepIndicator currentStep="validation" />
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Sonuçlar hazırlanıyor...</p>
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <StepIndicator currentStep="validation" />
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
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!validationData) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Sonuç Doğrulama - Müşteri Talep Yönetimi</title>
        <meta name="description" content="AI analiz sonuçlarını doğrulayın ve ClickUp task'ı oluşturun" />
      </Head>
      
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <StepIndicator currentStep="validation" />
        </div>
        
        <ValidationView data={validationData} />
      </div>
    </>
  );
}