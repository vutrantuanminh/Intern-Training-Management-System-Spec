import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Course, Subject } from '../../types';
import { mockUsers } from '../../data/mockData';
import { Plus, Trash2 } from 'lucide-react';

interface CreateCourseModalProps {
  onClose: () => void;
  onCourseCreated: (course: Course) => void;
  creatorId: string;
}

export function CreateCourseModal({ onClose, onCourseCreated, creatorId }: CreateCourseModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trainerId: '',
  });
  const [subjects, setSubjects] = useState<Array<{ name: string; description: string }>>([
    { name: '', description: '' }
  ]);

  const trainers = mockUsers.filter(u => u.role === 'trainer');

  const handleAddSubject = () => {
    setSubjects([...subjects, { name: '', description: '' }]);
  };

  const handleRemoveSubject = (index: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index));
    }
  };

  const handleSubjectChange = (index: number, field: 'name' | 'description', value: string) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (subjects.some(s => !s.name.trim())) {
      alert(t('supervisor.createCourse.subjectsValidation'));
      return;
    }

    const newCourse: Course = {
      id: `course${Date.now()}`,
      name: formData.name,
      description: formData.description,
      creatorId,
      trainerId: formData.trainerId || undefined,
      status: 'not_started',
      createdAt: new Date(),
    };

    onCourseCreated(newCourse);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
        <div className="p-6 border-b border-gray-200">
          <h3>{t('supervisor.createCourse.title')}</h3>
          <p className="text-gray-600 mt-1">{t('supervisor.createCourse.note')}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Course Details */}
          <div className="space-y-4">
            <h4>{t('supervisor.createCourse.infoTitle')}</h4>
            
            <div>
              <label className="block text-gray-700 mb-2">{t('supervisor.createCourse.courseNameLabel')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">{t('supervisor.createCourse.descriptionLabel')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">{t('supervisor.createCourse.assignTrainerLabel')}</label>
              <select
                value={formData.trainerId}
                onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">{t('supervisor.createCourse.selectTrainerPlaceholder')}</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name} ({trainer.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subjects */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4>{t('supervisor.createCourse.subjectsTitle')}</h4>
              <button
                type="button"
                onClick={handleAddSubject}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
              >
                <Plus className="w-4 h-4" />
                {t('supervisor.createCourse.addSubject')}
              </button>
            </div>

            <div className="space-y-4">
              {subjects.map((subject, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{t('supervisor.createCourse.subjectLabel')} {index + 1}</span>
                    {subjects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">{t('supervisor.createCourse.subjectNameLabel')}</label>
                    <input
                      type="text"
                      value={subject.name}
                      onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={t('supervisor.createCourse.subjectPlaceholder')}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">{t('supervisor.createCourse.subjectDescriptionLabel')}</label>
                    <textarea
                      value={subject.description}
                      onChange={(e) => handleSubjectChange(index, 'description', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={2}
                      placeholder={t('supervisor.createCourse.subjectDescriptionPlaceholder')}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              {t('supervisor.createCourse.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {t('supervisor.createCourse.createButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
