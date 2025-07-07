import React, { useState, useEffect } from 'react';
import { Map, Clock, Target, Laugh, TrendingUp, AlertTriangle } from 'lucide-react';

interface TaskData {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: number;
  assignees: string[];
  tags: string[];
  timeEstimate: number;
  projectName: string;
  dueDate: string;
  createdDate: string;
}

interface WorkMapStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  funnyTasks: TaskData[];
  longestTask: TaskData | null;
  shortestTask: TaskData | null;
  mostTaggedTask: TaskData | null;
  urgentWithoutAssignee: TaskData[];
  oldestTask: TaskData | null;
  weekendWarriors: TaskData[];
}

const WorkMapPage: React.FC = () => {
  const [stats, setStats] = useState<WorkMapStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkMap();
  }, []);

  const loadWorkMap = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/work-map');
      if (!response.ok) {
        throw new Error('İş haritası yüklenemedi');
      }
      
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 4: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'URGENT';
      case 2: return 'HIGH';
      case 3: return 'NORMAL';
      case 4: return 'LOW';
      default: return 'NONE';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Map className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">İş haritası yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadWorkMap}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Map className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">ClickUp İş Haritası</h1>
          </div>
          <p className="text-gray-600">
            Projelerinizin task analizi ve komik bulgular
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Toplam Task</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tamamlanan</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
                  <p className="text-xs text-gray-500">
                    {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Geciken</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdueTasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Laugh className="w-8 h-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Komik Task</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.funnyTasks.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Komik/İlginç Bulgular */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Komik Task'lar */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Laugh className="w-6 h-6 text-purple-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Komik Tasklar</h2>
              </div>
              
              {stats.funnyTasks.length > 0 ? (
                <div className="space-y-4">
                  {stats.funnyTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="border-l-4 border-purple-400 bg-purple-50 p-4 rounded">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{task.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                              {task.projectName}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                              {getPriorityLabel(task.priority)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Komik task bulunamadı</p>
              )}
            </div>

            {/* İlginç İstatistikler */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">İlginç Bulgular</h2>
              </div>
              
              <div className="space-y-4">
                {stats.longestTask && (
                  <div className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded">
                    <h3 className="font-medium text-blue-900">En Uzun Task</h3>
                    <p className="text-sm text-blue-700 mt-1">{stats.longestTask.name}</p>
                    <p className="text-xs text-blue-600">Tahmini: {stats.longestTask.timeEstimate}h</p>
                  </div>
                )}

                {stats.mostTaggedTask && (
                  <div className="border-l-4 border-green-400 bg-green-50 p-4 rounded">
                    <h3 className="font-medium text-green-900">En Çok Etiketli</h3>
                    <p className="text-sm text-green-700 mt-1">{stats.mostTaggedTask.name}</p>
                    <p className="text-xs text-green-600">{stats.mostTaggedTask.tags.length} etiket</p>
                  </div>
                )}

                {stats.oldestTask && (
                  <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded">
                    <h3 className="font-medium text-yellow-900">En Eski Task</h3>
                    <p className="text-sm text-yellow-700 mt-1">{stats.oldestTask.name}</p>
                    <p className="text-xs text-yellow-600">
                      {new Date(stats.oldestTask.createdDate).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                )}

                {stats.urgentWithoutAssignee.length > 0 && (
                  <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded">
                    <h3 className="font-medium text-red-900">Acil Ama Sahipsiz</h3>
                    <p className="text-sm text-red-700 mt-1">
                      {stats.urgentWithoutAssignee.length} acil task hiç kimseye atanmamış!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={loadWorkMap}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Map className="w-5 h-5 mr-2" />
            {loading ? 'Yükleniyor...' : 'Haritayı Yenile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkMapPage;