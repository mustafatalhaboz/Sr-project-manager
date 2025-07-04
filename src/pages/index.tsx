import React from 'react';
import Head from 'next/head';
import RequestForm from '../components/ui/RequestForm';
import StepIndicator from '../components/ui/StepIndicator';

export default function Home() {
  return (
    <>
      <Head>
        <title>Müşteri Talep Yönetimi - Ana Sayfa</title>
        <meta name="description" content="AI destekli müşteri talep analizi ve proje yönetimi sistemi" />
      </Head>
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <StepIndicator currentStep="request" />
        </div>
        
        <RequestForm />
      </div>
    </>
  );
}