import React from 'react';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import DataView from '../components/ui/DataView';

export default function DataPage() {
  return (
    <Layout>
      <Head>
        <title>ClickUp Verileri - Data Sayfası</title>
        <meta name="description" content="RED ve GREY workspace'lerindeki ClickUp verilerini görüntüleyin" />
      </Head>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sayfa Başlığı */}
        <div className="mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ClickUp Verileri</h1>
              <p className="mt-2 text-sm text-gray-700">
                RED ve GREY workspace&apos;lerindeki tüm in-progress task&apos;ları görüntüleyin
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  <span>In Progress</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                  <span>Development</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                  <span>Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bilgi Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-medium text-sm">R</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">RED Workspace</dt>
                    <dd className="text-lg font-medium text-gray-900">Aktif Projeler</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium text-sm">G</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">GREY Workspace</dt>
                    <dd className="text-lg font-medium text-gray-900">Aktif Projeler</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Toplam</dt>
                    <dd className="text-lg font-medium text-gray-900">In-Progress Tasks</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kullanım Rehberi */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Nasıl Kullanılır?</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Workspace&apos;lere tıklayarak space&apos;leri görüntüleyin</li>
                  <li>Space&apos;lere tıklayarak list&apos;leri açın</li>
                  <li>List&apos;lere tıklayarak sadece in-progress olan task&apos;ları görün</li>
                  <li>Her task kartında ID, isim, status ve öncelik bilgileri yer alır</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Ana Data Görünümü */}
        <DataView className="mb-8" />

        {/* Footer Bilgisi */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Veriler ClickUp API&apos;den gerçek zamanlı olarak çekilmektedir. 
            Sayfa yenilendikçe güncel veriler görüntülenir.
          </p>
        </div>
      </div>
    </Layout>
  );
}