import React, { useState, useEffect } from 'react';

// Интерфейс для сотрудника
interface Staff {
  id: string;
  _id?: string;
  name: string;
  email: string;
  hasPrivileges: boolean;
  createdAt: string;
}

// Интерфейс для формы добавления нового сотрудника
interface NewStaffFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// API функции для работы с персоналом
const getAllStaff = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/staff', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch staff list');
  }
  
  return response.json();
};

const updateStaffPrivileges = async (staffId: string, grantPrivileges: boolean) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/staff/${staffId}/privileges`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ grantPrivileges })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update privileges');
  }
  
  return response.json();
};

const deleteStaffMember = async (staffId: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/staff/${staffId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete staff member');
  }
  
  return response.json();
};

const createStaffMember = async (staffData: { name: string; email: string; password: string }) => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/staff', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(staffData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create staff member');
  }
  
  return response.json();
};

const StaffManagement: React.FC = () => {
  // Состояние для списка сотрудников
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Текущий авторизованный пользователь (для проверки возможности удаления)
  const [currentUser, setCurrentUser] = useState<{id: string} | null>(null);
  
  // Состояние для формы добавления нового сотрудника
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newStaffData, setNewStaffData] = useState<NewStaffFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Получение ID сотрудника (поддержка разных форматов)
  const getStaffId = (staff: Staff) => staff.id || staff._id || '';

  // Загрузка текущего пользователя
  useEffect(() => {
    // Получаем информацию о текущем пользователе из localStorage
    const userStr = localStorage.getItem('user');
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  // Загрузка списка сотрудников
  const loadStaffList = async () => {
    setLoading(true);
    setError(null);
    try {
      const staffData = await getAllStaff();
      console.log('Loaded staff data:', staffData);
      setStaffList(staffData);
    } catch (err: any) {
      console.error('Error loading staff:', err);
      
      if (err.message?.includes('привилегий')) {
        setError('A staff access key is required to view and manage staff');
      } else {
        setError(`Failed to load staff list: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffList();
  }, []);

  // Обработка изменения ввода в форме
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStaffData(prev => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку поля при изменении
    if (formErrors[name]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Валидация формы
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!newStaffData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!newStaffData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newStaffData.email)) {
      errors.email = 'Enter a valid email';
    }
    
    if (!newStaffData.password) {
      errors.password = 'Password is required';
    } else if (newStaffData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    
    if (newStaffData.password !== newStaffData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add new staff member
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const { confirmPassword, ...staffData } = newStaffData;
      const response = await createStaffMember(staffData);
      
      // Добавляем в локальный список
      const newStaff: Staff = {
        id: response.staff.id,
        _id: response.staff.id,
        name: response.staff.name,
        email: response.staff.email,
        hasPrivileges: response.staff.hasPrivileges || false,
        createdAt: response.staff.createdAt || new Date().toISOString()
      };
      
      setStaffList(prev => [newStaff, ...prev]);
      
      // Сбрасываем форму
      setNewStaffData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      
      setShowAddForm(false);
      setSuccessMessage(`Staff member ${response.staff.name} added successfully`);
    } catch (err: any) {
      console.error('Error adding staff:', err);
      setError(`Failed to add staff member: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Удаление сотрудника
  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!window.confirm(`Are you sure you want to delete staff member ${staffName}? This action cannot be undone.`)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await deleteStaffMember(staffId);
      
      // Обновляем локальный список
      setStaffList(prev => prev.filter(staff => getStaffId(staff) !== staffId));
      
      setSuccessMessage(`Staff member ${staffName} deleted successfully`);
    } catch (err: any) {
      console.error('Error deleting staff:', err);
      setError(`Failed to delete staff member: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Обновление привилегий сотрудника
  const handleTogglePrivileges = async (staffId: string, staffName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'revoke' : 'grant';
    
    if (!window.confirm(`Are you sure you want to ${action} privileges for staff member ${staffName}?`)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await updateStaffPrivileges(staffId, !currentStatus);
      
      // Обновляем локальный список
      setStaffList(prev => 
        prev.map(staff => 
          getStaffId(staff) === staffId
            ? { ...staff, hasPrivileges: response.hasPrivileges } 
            : staff
        )
      );
      
      setSuccessMessage(`Staff privileges for ${staffName} successfully ${currentStatus ? 'revoked' : 'granted'}`);
    } catch (err: any) {
      console.error('Error updating staff privileges:', err);
      setError(`Failed to update privileges: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-white">Staff management</h2>
      
      {/* Сообщения об ошибках и успешных операциях */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 shadow-sm">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium">Error</h3>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 shadow-sm">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium">Success</h3>
              <div className="mt-1 text-sm">{successMessage}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Кнопка добавления нового сотрудника */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg mb-6 transition-colors duration-200 shadow-sm"
        >
          Add staff member
        </button>
      )}
      
      {/* Форма добавления нового сотрудника */}
      {showAddForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6 shadow-sm border">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Add new staff member</h3>
          
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name:</label>
              <input
                type="text"
                name="name"
                value={newStaffData.name}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                  formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder="Enter staff member name"
              />
              {formErrors.name && (
                <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
              <input
                type="email"
                name="email"
                value={newStaffData.email}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                  formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder="email@example.com"
              />
              {formErrors.email && (
                <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
              <input
                type="password"
                name="password"
                value={newStaffData.password}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                  formErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder="Minimum 6 characters"
              />
              {formErrors.password && (
                <p className="text-red-600 text-xs mt-1">{formErrors.password}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password confirmation:</label>
              <input
                type="password"
                name="confirmPassword"
                value={newStaffData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                  formErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder="Repeat password"
              />
              {formErrors.confirmPassword && (
                <p className="text-red-600 text-xs mt-1">{formErrors.confirmPassword}</p>
              )}
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 shadow-sm"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add staff member'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 shadow-sm"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Список сотрудников */}
      {loading && !showAddForm ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading staff list...</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration date
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Privileges
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
              </tr>
            </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {staffList.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-lg font-medium">Staff list is empty</p>
                        <p className="text-sm">Add the first staff member to get started</p>
                      </div>
                  </td>
                </tr>
              ) : (
                staffList.map(staff => (
                    <tr key={getStaffId(staff)} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{staff.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                      {formatDate(staff.createdAt)}
                        </div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          staff.hasPrivileges 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                          {staff.hasPrivileges ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Yes
                            </>
                          ) : (
                            'No'
                          )}
                      </span>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        {/* Отключаем возможность удалить себя или изменить свои привилегии */}
                          {currentUser?.id !== getStaffId(staff) && (
                          <>
                            <button
                              onClick={() => handleTogglePrivileges(
                                  getStaffId(staff), 
                                staff.name,
                                staff.hasPrivileges
                              )}
                                className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                                staff.hasPrivileges
                                    ? 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:ring-yellow-500'
                                    : 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500'
                              }`}
                              disabled={loading}
                            >
                              {staff.hasPrivileges ? 'Revoke' : 'Grant'}
                            </button>
                            
                            <button
                                onClick={() => handleDeleteStaff(getStaffId(staff), staff.name)}
                                className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                              disabled={loading}
                            >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              Delete
                            </button>
                          </>
                        )}
                        
                          {currentUser?.id === getStaffId(staff) && (
                            <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-md">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            Current user
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
      
      {/* Информационный блок */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Privilege information</h3>
        <p className="text-sm text-blue-700">
          Staff members with granted privileges can manage team members and staff roster.
          To receive privileges, enter a special access key in the user profile.
        </p>
      </div>
    </div>
  );
};

export default StaffManagement; 
