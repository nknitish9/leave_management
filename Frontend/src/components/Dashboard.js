import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [balanceForm, setBalanceForm] = useState({ sick: 0, casual: 0, annual: 0 });
  const [savingBalance, setSavingBalance] = useState(false);
  const [balanceMessage, setBalanceMessage] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/leaves');
      const leaves = response.data.data;

      setStats({
        totalLeaves: leaves.length,
        pendingLeaves: leaves.filter(l => l.status === 'pending').length,
        approvedLeaves: leaves.filter(l => l.status === 'approved').length,
        rejectedLeaves: leaves.filter(l => l.status === 'rejected').length
      });

      setRecentLeaves(leaves.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      const userList = response.data.data || [];
      setUsers(userList);
      if (userList.length === 0) {
        setSelectedUserId('');
      } else if (!selectedUserId) {
        const first = userList[0];
        setSelectedUserId(first._id);
        setBalanceForm({
          sick: first.leaveBalance?.sick ?? 0,
          casual: first.leaveBalance?.casual ?? 0,
          annual: first.leaveBalance?.annual ?? 0
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setBalanceMessage(
        error.response?.data?.message || 'Failed to load users. Please try again.'
      );
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user?.role, fetchUsers]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleUserChange = (e) => {
    const id = e.target.value;
    setSelectedUserId(id);
    const selected = users.find((u) => u._id === id);
    if (selected) {
      setBalanceForm({
        sick: selected.leaveBalance?.sick ?? 0,
        casual: selected.leaveBalance?.casual ?? 0,
        annual: selected.leaveBalance?.annual ?? 0
      });
    }
  };

  const handleBalanceChange = (e) => {
    const { name, value } = e.target;
    setBalanceForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBalanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      setBalanceMessage('Please select a user.');
      return;
    }
    setSavingBalance(true);
    setBalanceMessage('');
    try {
      const payload = {
        sick: Number(balanceForm.sick),
        casual: Number(balanceForm.casual),
        annual: Number(balanceForm.annual)
      };
      const response = await api.put(`/users/${selectedUserId}/leave-balance`, payload);
      const updated = response.data.data;
      setUsers((prev) =>
        prev.map((u) => (u._id === updated.id ? { ...u, leaveBalance: updated.leaveBalance } : u))
      );
      setBalanceMessage('Leave balance updated successfully.');
    } catch (error) {
      setBalanceMessage(error.response?.data?.message || 'Failed to update leave balance.');
    } finally {
      setSavingBalance(false);
    }
  };

  if (loading) {
    return <div className="dashboard"><h1>Loading...</h1></div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name}!</h1>
          <p className="dashboard-subtitle">
            {user?.role === 'admin' 
              ? 'Manage all leave applications and team requests' 
              : 'Track your leave balance and applications'}
          </p>
        </div>
        <Link to="/apply-leave" className="btn-primary">
          ➕ Apply for Leave
        </Link>
      </div>

      {/* Leave Balance Cards */}
      {user?.role === 'employee' && (
        <div className="balance-section">
          <h2>Your Leave Balance</h2>
          <div className="balance-cards">
            <div className="balance-card sick">
              <div className="balance-icon">🤒</div>
              <div className="balance-info">
                <h3>Sick Leave</h3>
                <div className="balance-count">{user?.leaveBalance?.sick || 0}</div>
                <p>days remaining</p>
              </div>
            </div>

            <div className="balance-card casual">
              <div className="balance-icon">☀️</div>
              <div className="balance-info">
                <h3>Casual Leave</h3>
                <div className="balance-count">{user?.leaveBalance?.casual || 0}</div>
                <p>days remaining</p>
              </div>
            </div>

            <div className="balance-card annual">
              <div className="balance-icon">🏖️</div>
              <div className="balance-info">
                <h3>Annual Leave</h3>
                <div className="balance-count">{user?.leaveBalance?.annual || 0}</div>
                <p>days remaining</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-section">
        <h2>{user?.role === 'admin' ? 'Leave Statistics' : 'Your Leave Statistics'}</h2>
        <div className="stats-cards">
          <div className="stat-card total">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>Total Applications</h3>
              <div className="stat-count">{stats.totalLeaves}</div>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <h3>Pending</h3>
              <div className="stat-count">{stats.pendingLeaves}</div>
            </div>
          </div>

          <div className="stat-card approved">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>Approved</h3>
              <div className="stat-count">{stats.approvedLeaves}</div>
            </div>
          </div>

          <div className="stat-card rejected">
            <div className="stat-icon">❌</div>
            <div className="stat-info">
              <h3>Rejected</h3>
              <div className="stat-count">{stats.rejectedLeaves}</div>
            </div>
          </div>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="admin-balance-section">
          <h2>Set Employee Leave Balance</h2>
          <form className="admin-balance-form" onSubmit={handleBalanceSubmit}>
            <div className="form-group">
              <label>Employee</label>
              {users.length === 0 ? (
                <div className="admin-balance-message">No employees found.</div>
              ) : (
                <select value={selectedUserId} onChange={handleUserChange}>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email}){u.role ? ` - ${u.role}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="admin-balance-row">
              <div className="form-group">
                <label>Sick Leave</label>
                <input
                  type="number"
                  name="sick"
                  min="0"
                  value={balanceForm.sick}
                  onChange={handleBalanceChange}
                  disabled={users.length === 0}
                />
              </div>
              <div className="form-group">
                <label>Casual Leave</label>
                <input
                  type="number"
                  name="casual"
                  min="0"
                  value={balanceForm.casual}
                  onChange={handleBalanceChange}
                  disabled={users.length === 0}
                />
              </div>
              <div className="form-group">
                <label>Annual Leave</label>
                <input
                  type="number"
                  name="annual"
                  min="0"
                  value={balanceForm.annual}
                  onChange={handleBalanceChange}
                  disabled={users.length === 0}
                />
              </div>
            </div>
            {balanceMessage && (
              <div className="admin-balance-message">{balanceMessage}</div>
            )}
            <div className="admin-balance-actions">
              <button className="btn-primary" type="submit" disabled={savingBalance || users.length === 0}>
                {savingBalance ? 'Saving...' : 'Save Balance'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Leaves */}
      <div className="recent-section">
        <div className="recent-header">
          <h2>Recent Leave Applications</h2>
          <Link to="/leaves" className="view-all-link">
            View All →
          </Link>
        </div>

        {recentLeaves.length === 0 ? (
          <div className="no-data">
            <h3>No leave applications yet</h3>
            <p>Apply for your first leave to see it here!</p>
          </div>
        ) : (
          <div className="recent-table">
            <table>
              <thead>
                <tr>
                  {user?.role === 'admin' && <th>Employee</th>}
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLeaves.map((leave) => (
                  <tr key={leave._id}>
                    {user?.role === 'admin' && (
                      <td>
                        {leave.user?.name || 'N/A'}
                        <br />
                        <small style={{ color: '#666' }}>{leave.user?.department}</small>
                      </td>
                    )}
                    <td>
                      <span className="leave-type-badge">{leave.leaveType}</span>
                    </td>
                    <td>{formatDate(leave.startDate)}</td>
                    <td>{formatDate(leave.endDate)}</td>
                    <td>{leave.numberOfDays}</td>
                    <td>
                      <span className={`status-badge status-${leave.status}`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
