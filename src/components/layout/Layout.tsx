import React from 'react';
import Head from 'next/head';
import { WorkflowStep } from '@/lib/types';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  currentStep?: WorkflowStep;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'Müşteri Talep Yönetim Sistemi',
  description = 'AI destekli müşteri talep analizi ve proje yönetimi',
  currentStep
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Müşteri Talep Yönetimi
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  AI Destekli Analiz Sistemi
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 text-center text-sm text-gray-500">
              © 2024 Müşteri Talep Yönetim Sistemi - AI Destekli Proje Yönetimi
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout;
