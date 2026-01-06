import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    applyFilters();
  }, [filters, leaves]);

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

  const applyFilters = () => {
    let filtered = [...leaves];

    if (filters.status !== 'all') {
      filtered = filtered.filter(leave => leave.status === filters.status);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(leave => leave.leaveType === filters.type);
    }

    setFilteredLeaves(filtered);
  };

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
    return <div className="leave-list"><h1>Loading...</h1></div>;
  }

  return (
    <div className="leave-list">
      <h1>{user?.role === 'admin' ? 'All Leave Applications' : 'My Leave Applications'}</h1>

      {/* Filters */}
      <div className="leave-filters">
        <div className="filter-group">
          <label>Filter by Status</label>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Type</label>
          <select name="type" value={filters.type} onChange={handleFilterChange}>
            <option value="all">All Types</option>
            <option value="sick">Sick Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="annual">Annual Leave</option>
          </select>
        </div>
      </div>

      {/* Leave Cards */}
      {filteredLeaves.length === 0 ? (
        <div className="no-leaves">
          <h2>No leave applications found</h2>
          <p>Try adjusting your filters or apply for a new leave.</p>
        </div>
      ) : (
        filteredLeaves.map((leave) => (
          <div key={leave._id} className="leave-card">
            <div className="leave-header">
              <div>
                <div className="leave-type">{leave.leaveType} Leave</div>
                {user?.role === 'admin' && leave.user && (
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                    {leave.user.name} ({leave.user.email})
                  </div>
                )}
              </div>
              <span className={`leave-status status-${leave.status}`}>
                {leave.status.toUpperCase()}
              </span>
            </div>

            <div className="leave-details">
              <div className="detail-item">
                <strong>Start Date:</strong> {formatDate(leave.startDate)}
              </div>
              <div className="detail-item">
                <strong>End Date:</strong> {formatDate(leave.endDate)}
              </div>
              <div className="detail-item">
                <strong>Duration:</strong> {leave.numberOfDays} day(s)
              </div>
              <div className="detail-item">
                <strong>Applied On:</strong> {formatDate(leave.appliedAt)}
              </div>
            </div>

            <div className="leave-reason">
              <strong>Reason:</strong> {leave.reason}
            </div>

            {leave.comments && (
              <div className="leave-reason">
                <strong>Admin Comments:</strong> {leave.comments}
              </div>
            )}

            {/* Actions */}
            <div className="leave-actions">
              {user?.role === 'admin' && leave.status === 'pending' && (
                <>
                  <button
                    className="btn-approve"
                    onClick={() => handleUpdateStatus(leave._id, 'approved')}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleUpdateStatus(leave._id, 'rejected')}
                  >
                    ✗ Reject
                  </button>
                </>
              )}

              {user?.role !== 'admin' && leave.status === 'pending' && (
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(leave._id)}
                >
                  🗑 Delete
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