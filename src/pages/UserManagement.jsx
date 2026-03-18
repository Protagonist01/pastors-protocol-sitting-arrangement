import { useState } from 'react';
import { useAuth } from '../components/auth-context';
import { api } from '../services/apiClient';
import { Loader, RoleTag } from '../components/UI';
import { Header } from '../components/Header';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function UserManagement() {
  const { profile: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all users via FastAPI (not Supabase directly)
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users/');
      return data;
    },
    enabled: currentUser?.role === 'admin',
  });

  // Update role via FastAPI
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      const { data } = await api.patch(`/users/${userId}/role`, { role: newRole });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccess('Role updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(err.response?.data?.detail || err.message || 'Failed to update role');
    },
    onSettled: () => setSaving(null),
  });

  const updateRole = (userId, newRole) => {
    setSaving(userId);
    setError('');
    setSuccess('');
    updateRoleMutation.mutate({ userId, newRole });
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div>
        <Header />
        <div className="page-container">
          <p style={{ color: '#ef4444' }}>Access denied. Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="page-container fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Access Control</h1>
            <p className="page-subtitle">Manage user roles and permissions</p>
          </div>
        </div>

        {error && <p style={{ color: '#ef4444', marginBottom: 16, fontSize: 13, padding: 8, background: '#ef444422', borderRadius: 6 }}>{error}</p>}
        {success && <p style={{ color: '#22c55e', marginBottom: 16, fontSize: 13, padding: 8, background: '#22c55e22', borderRadius: 6 }}>{success}</p>}

        {isLoading ? (
          <Loader text="Loading users..." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {users.map(user => (
              <div key={user.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#e2f0e6' }}>{user.full_name || 'Unnamed'}</div>
                  <div style={{ fontSize: 13, color: '#4f6b56' }}>
                    <RoleTag role={user.role} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Admin cannot demote themselves — per AGENT_CONTEXT.md §3.4 */}
                  {user.id === currentUser?.id ? (
                    <span style={{ fontSize: 12, color: '#4f6b56', padding: '6px 12px' }}>You (cannot change own role)</span>
                  ) : (
                    <select
                      className="input"
                      style={{ width: 'auto', padding: '6px 12px' }}
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value)}
                      disabled={saving === user.id}
                    >
                      <option value="protocol">Protocol (View Only)</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  
                  {saving === user.id && <span style={{ color: '#c9a84c', fontSize: 12 }}>Saving...</span>}
                </div>
              </div>
            ))}
            
            {users.length === 0 && (
              <p style={{ color: '#4f6b56' }}>No users found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
