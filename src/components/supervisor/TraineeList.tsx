import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mockUsers } from '../../data/mockData';
import { Search } from 'lucide-react';

export function TraineeList() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  
  const trainees = mockUsers.filter(u => u.role === 'trainee');
  const filteredTrainees = trainees.filter(trainee =>
    trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h3>{t('supervisor.traineeList.title')}</h3>
        <p className="text-gray-600 mt-1">{t('supervisor.traineeList.description')}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('supervisor.traineeList.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-gray-700">{t('supervisor.table.name')}</th>
              <th className="px-6 py-3 text-left text-gray-700">{t('supervisor.table.email')}</th>
              <th className="px-6 py-3 text-left text-gray-700">{t('supervisor.table.joined')}</th>
              <th className="px-6 py-3 text-left text-gray-700">{t('supervisor.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTrainees.map((trainee) => (
              <tr key={trainee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white">
                      {trainee.name.charAt(0)}
                    </div>
                    <span className="text-gray-900">{trainee.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{trainee.email}</td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(trainee.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                    {t('supervisor.traineeList.viewProfile')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-gray-600">
        {t('supervisor.traineeList.showing', { shown: filteredTrainees.length, total: trainees.length })}
      </div>
    </div>
  );
}
