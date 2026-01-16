import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, UserRole } from '../../types';
import { userService } from '../../services/userService';
import { Plus, Search, Edit, Trash2, MoreVertical } from 'lucide-react';
import { EditUserModal } from './EditUserModal';

export function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data } = await userService.getUsers({ limit: 100, isActive: true });
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.fullName || user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Handle both array of strings and array of objects for roles
    const userRole = Array.isArray(user.roles)
      ? (typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0]?.name)
      : user.role;

    const matchesRole = filterRole === 'all' || userRole?.toUpperCase() === filterRole.toUpperCase();
    return matchesSearch && matchesRole;
  });

  const handleDeleteUser = async (userId: string) => {
    if (confirm(t('admin.deleteUserConfirm'))) {
      try {
        await userService.deleteUser(parseInt(userId));
        loadUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert(t('admin.failedDeleteUser'));
      }
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
  };

  const handleUpdateUser = async (updatedUser: any) => {
    try {
      await userService.updateUser(updatedUser.id as any, {
        fullName: updatedUser.name || updatedUser.fullName,
        email: updatedUser.email,
        // role update would need separate endpoint
      });
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      alert(t('admin.failedUpdateUser'));
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'supervisor': return 'bg-blue-100 text-blue-700';
      case 'trainer': return 'bg-green-100 text-green-700';
      case 'trainee': return 'bg-orange-100 text-orange-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3>{t('userManagement')}</h3>
          <p className="text-gray-600 mt-1">{t('manageAllUsersAndRoles')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          {t('addUser')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.searchByNameOrEmail')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
            <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">{t('admin.allRoles')}</option>
            <option value="admin">{t('admin.role.admin')}</option>
            <option value="supervisor">{t('admin.role.supervisor')}</option>
            <option value="trainer">{t('admin.role.trainer')}</option>
            <option value="trainee">{t('admin.role.trainee')}</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-gray-700">{t('admin.table.name')}</th>
              <th className="px-6 py-3 text-left text-gray-700">{t('admin.table.email')}</th>
              <th className="px-6 py-3 text-left text-gray-700">{t('admin.table.role')}</th>
              <th className="px-6 py-3 text-left text-gray-700">{t('admin.table.createdAt')}</th>
              <th className="px-6 py-3 text-left text-gray-700">{t('admin.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => {
              const displayName = user.fullName || user.name || t('admin.unknown');
              const userRole = Array.isArray(user.roles)
                ? (typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0]?.name)
                : (user.role || 'TRAINEE');

              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-900">{displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userRole)}`}>
                      {userRole}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : t('admin.notAvailable')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title={t('editUser')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                        title={t('deleteUser')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-gray-600">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} onSuccess={loadUsers} />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={handleUpdateUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Temp@123', // Default password
    role: 'trainee' as UserRole,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await userService.createUser({
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
        roleNames: [formData.role.toUpperCase() as any],
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || t('admin.failedCreateUser'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h3>{t('admin.createUserTitle')}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">{t('admin.fullName')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">{t('admin.email')}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">{t('admin.password')}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              placeholder={t('admin.passwordPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">{t('admin.roleLabel')}</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="trainee">{t('admin.role.trainee')}</option>
              <option value="trainer">{t('admin.role.trainer')}</option>
              <option value="supervisor">{t('admin.role.supervisor')}</option>
              <option value="admin">{t('admin.role.admin')}</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      disabled={loading}
                    >
                      {t('cancel')}
                    </button>
                    <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? t('admin.creating') : t('admin.createUser')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
