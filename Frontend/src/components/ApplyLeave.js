import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const leaveTypeOptions = [
  { key: 'sick', label: 'Sick Leave', icon: '🤒' },
  { key: 'casual', label: 'Casual Leave', icon: '☀️' },
  { key: 'annual', label: 'Annual Leave', icon: '🏖️' }
];

const ApplyLeave = () => {
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leaveDays, setLeaveDays] = useState(0);

  const { user, updateUserBalance } = useAuth();
  const navigate = useNavigate();

  const calculateLeaveDays = useCallback(() => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    setLeaveDays(diffDays);
  }, [formData.startDate, formData.endDate]);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      calculateLeaveDays();
    }
  }, [formData.startDate, formData.endDate, calculateLeaveDays]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const selectLeaveType = (type) => {
    setFormData({
      ...formData,
      leaveType: type
    });
  };

  const validateForm = () => {
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      setError('All fields are required');
      return false;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end < start) {
      setError('End date cannot be before start date');
      return false;
    }

    const balance = user?.leaveBalance?.[formData.leaveType] || 0;
    if (leaveDays > balance) {
      setError(
        `Insufficient leave balance. You have ${balance} ${formData.leaveType} leave(s) remaining.`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const leaveData = {
        ...formData,
        numberOfDays: leaveDays
      };

      await api.post('/leaves', leaveData);

      const newBalance = {
        ...user.leaveBalance,
        [formData.leaveType]: user.leaveBalance[formData.leaveType] - leaveDays
      };
      updateUserBalance(newBalance);

      navigate('/leaves');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to apply for leave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apply-leave">
      <div className="page-header">
        <button className="back-link" type="button" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <h1 className="page-title">Apply for Leave</h1>
        <p className="page-subtitle">Fill in the details below to submit your leave request.</p>
      </div>

      <div className="panel form-panel">
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Leave Type</label>
            <div className="leave-type-grid">
              {leaveTypeOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`leave-type-card ${formData.leaveType === option.key ? 'active' : ''}`}
                  onClick={() => selectLeaveType(option.key)}
                >
                  <span className="leave-type-icon">{option.icon}</span>
                  <span className="leave-type-label">{option.label}</span>
                  <span className="leave-type-meta">
                    {user?.leaveBalance?.[option.key] ?? 0} days left
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {leaveDays > 0 && (
            <div className="leave-days-info">
              <strong>Total Leave Days: {leaveDays}</strong>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reason">Reason</label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              placeholder="Briefly describe your reason for leave..."
              rows="4"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeave;
