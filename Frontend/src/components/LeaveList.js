import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LeaveList = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all'
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await api.get('/leaves');
      setLeaves(response.data.data);
      setFilteredLeaves(response.data.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...leaves];

    if (filters.status !== 'all') {
      filtered = filtered.filter((leave) => leave.status === filters.status);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter((leave) => leave.leaveType === filters.type);
    }

    setFilteredLeaves(filtered);
  }, [filters, leaves]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateStatus = async (leaveId, status) => {
    try {
      await api.put(`/leaves/${leaveId}`, { status });
      fetchLeaves();
    } catch (error) {
      console.error('Error updating leave:', error);
      alert(error.response?.data?.message || 'Failed to update leave status');
    }
  };

  const handleDelete = async (leaveId) => {
    if (window.confirm('Are you sure you want to delete this leave application?')) {
      try {
        await api.delete(`/leaves/${leaveId}`);
        fetchLeaves();
      } catch (error) {
        console.error('Error deleting leave:', error);
        alert(error.response?.data?.message || 'Failed to delete leave');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  return (
    <div className="leave-list">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {user?.role === 'admin' ? 'All Leave Requests' : 'My Leave Requests'}
          </h1>
          <p className="page-subtitle">Review and manage leave requests from your team.</p>
        </div>
      </div>

      <div className="filters-row">
        <div className="filters">
          <div className="filter-group">
            <label>Filters:</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <label>&nbsp;</label>
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="all">All Types</option>
              <option value="sick">Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="annual">Annual Leave</option>
            </select>
          </div>
        </div>
        <div className="results-count">{filteredLeaves.length} results</div>
      </div>

      {filteredLeaves.length === 0 ? (
        <div className="empty-state">No leave applications found.</div>
      ) : (
        filteredLeaves.map((leave) => (
          <div key={leave._id} className="leave-card">
            <div className="leave-card-header">
              <div className="leave-badges">
                <span className={`badge type ${leave.leaveType}`}>{leave.leaveType}</span>
                <span className={`badge status ${leave.status}`}>{leave.status}</span>
              </div>
              <div className="leave-user">
                {user?.role === 'admin' && leave.user ? leave.user.name : user?.name}
              </div>
            </div>
            <div className="leave-reason-text">{leave.reason}</div>
            <div className="leave-meta">
              {formatDate(leave.startDate)} — {formatDate(leave.endDate)} · {leave.numberOfDays} day(s)
              <span>Applied: {formatDate(leave.appliedAt)}</span>
            </div>

            <div className="leave-actions">
              {user?.role === 'admin' && leave.status === 'pending' && (
                <>
                  <button
                    className="btn-success"
                    onClick={() => handleUpdateStatus(leave._id, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleUpdateStatus(leave._id, 'rejected')}
                  >
                    Reject
                  </button>
                </>
              )}

              {user?.role !== 'admin' && leave.status === 'pending' && (
                <button className="btn-danger" onClick={() => handleDelete(leave._id)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default LeaveList;
