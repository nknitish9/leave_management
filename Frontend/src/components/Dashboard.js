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
        pendingLeaves: leaves.filter((l) => l.status === 'pending').length,
        approvedLeaves: leaves.filter((l) => l.status === 'approved').length,
        rejectedLeaves: leaves.filter((l) => l.status === 'rejected').length
      });

      setRecentLeaves(leaves.slice(0, 4));
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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
      await api.put(`/users/${selectedUserId}/leave-balance`, payload);
      setBalanceMessage('Leave balance updated successfully.');
    } catch (error) {
      setBalanceMessage(error.response?.data?.message || 'Failed to update leave balance.');
    } finally {
      setSavingBalance(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {getGreeting()}, {user?.name} <span className="wave">👋</span>
          </h1>
          <p className="page-subtitle">
            {user?.role === 'admin'
              ? 'Here’s an overview of all leave requests across your organization.'
              : 'Here’s a snapshot of your leave requests and balance.'}
          </p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div>
            <span>Total Leaves</span>
            <strong>{stats.totalLeaves}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">⏳</div>
          <div>
            <span>Pending</span>
            <strong>{stats.pendingLeaves}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div>
            <span>Approved</span>
            <strong>{stats.approvedLeaves}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">❌</div>
          <div>
            <span>Rejected</span>
            <strong>{stats.rejectedLeaves}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Recent Leave Requests</h2>
            <Link to="/leaves" className="text-link">
              View All →
            </Link>
          </div>
          <div className="panel-body">
            {recentLeaves.length === 0 ? (
              <div className="empty-state">No leave requests yet.</div>
            ) : (
              recentLeaves.map((leave) => (
                <div key={leave._id} className="leave-row">
                  <div className="leave-badges">
                    <span className={`badge type ${leave.leaveType}`}>{leave.leaveType}</span>
                    <span className={`badge status ${leave.status}`}>{leave.status}</span>
                  </div>
                  <div className="leave-main">
                    <div className="leave-title">
                      {user?.role === 'admin' ? leave.user?.name || 'Employee' : user?.name}
                    </div>
                    <div className="leave-reason-text">{leave.reason}</div>
                    <div className="leave-meta">
                      {formatDate(leave.startDate)} — {formatDate(leave.endDate)} ·{' '}
                      {leave.numberOfDays} day(s)
                    </div>
                  </div>
                  <div className="leave-date">Applied {formatDate(leave.appliedAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="side-panel">
          {user?.role === 'employee' && (
            <div className="panel">
              <div className="panel-header">
                <h2>Leave Balance</h2>
              </div>
              <div className="panel-body">
                {['sick', 'casual', 'annual'].map((type) => (
                  <div key={type} className="balance-row">
                    <div className="balance-label">
                      <span className="balance-name">
                        {type.charAt(0).toUpperCase() + type.slice(1)} Leave
                      </span>
                      <span className="balance-value">{user?.leaveBalance?.[type] ?? 0}</span>
                    </div>
                    <div className="balance-bar">
                      <div
                        className={`balance-fill ${type}`}
                        style={{ width: `${Math.min(100, (user?.leaveBalance?.[type] ?? 0) * 5)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link to="/apply-leave" className="panel apply-card">
            <div className="apply-icon">➕</div>
            <div>
              <h3>Apply for Leave</h3>
              <p>Submit a new leave request</p>
            </div>
            <span className="apply-arrow">→</span>
          </Link>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="panel">
          <div className="panel-header">
            <h2>Set Employee Leave Balance</h2>
          </div>
          <div className="panel-body">
            <form className="admin-form" onSubmit={handleBalanceSubmit}>
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
              {balanceMessage && <div className="admin-balance-message">{balanceMessage}</div>}
              <div className="admin-actions">
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={savingBalance || users.length === 0}
                >
                  {savingBalance ? 'Saving...' : 'Save Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
