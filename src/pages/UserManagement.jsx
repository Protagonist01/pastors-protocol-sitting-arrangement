import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth-context';

export function UserManagement() {
  const { profile: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get all users from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Get all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');

      if (profileError) throw profileError;

      // Merge user data with profile data
      const mergedUsers = authUsers.users.map(user => {
        const profile = profiles?.find(p => p.id === user.id) || null;
        return {
          id: user.id,
          email: user.email,
          name: profile?.name || user.user_metadata?.full_name || 'Unknown',
          role: profile?.role || 'protocol',
          created_at: user.created_at
        };
      });

      setUsers(mergedUsers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, newRole) => {
    setSaving(userId);
    setError('');
    setSuccess('');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      setSuccess(`Role updated successfully`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="page-container">
        <p style={{ color: '#ef4444' }}>Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage user roles and permissions</p>
        </div>
        <button className="btn btn-outline" onClick={fetchUsers} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <p className="auth-error" style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>}
      {success && <p className="auth-error" style={{ color: '#22c55e', marginBottom: 16 }}>{success}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {users.map(user => (
            <div key={user.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, color: '#e2f0e6' }}>{user.name}</div>
                <div style={{ fontSize: 13, color: '#4f6b56' }}>{user.email}</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  className="input"
                  style={{ width: 'auto', padding: '6px 12px' }}
                  value={user.role}
                  onChange={(e) => updateRole(user.id, e.target.value)}
                  disabled={saving === user.id || user.id === currentUser?.id}
                >
                  <option value="protocol">Protocol (View Only)</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                
                {saving === user.id && <span style={{ color: '#c9a84c' }}>Saving...</span>}
                {user.id === currentUser?.id && (
                  <span style={{ fontSize: 11, color: '#4f6b56' }}>(You)</span>
                )}
              </div>
            </div>
          ))}
          
          {users.length === 0 && (
            <p style={{ color: '#4f6b56' }}>No users found.</p>
          )}
        </div>
      )}
    </div>
  );
}
