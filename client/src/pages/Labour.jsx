import { useState, useEffect } from 'react';
import { labourService } from '../services/labourService';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

const Labour = () => {
  const [labours, setLabours] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLabour, setEditingLabour] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workerName: '',
    phoneNumber: '',
    hoursWorked: '',
    ratePerHour: '',
    description: '',
  });

  const fetchLabours = async () => {
    setLoading(true);
    try {
      const [laboursData, pendingData] = await Promise.all([
        labourService.getAll(),
        labourService.getPending(),
      ]);
      setLabours(Array.isArray(laboursData) ? laboursData : []);
      setPendingTotal(pendingData?.totalPending || 0);
    } catch (error) {
      console.error('Error fetching labour data:', error);
      toast.error('Failed to load labour data');
      setLabours([]);
      setPendingTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabours();
  }, []);

  const handleOpenModal = (labour = null) => {
    if (labour) {
      setEditingLabour(labour);
      setFormData({
        date: labour.workDate?.split('T')[0] || '',
        workerName: labour.workerName || '',
        phoneNumber: labour.phoneNumber || '',
        hoursWorked: labour.hoursWorked || '',
        ratePerHour: labour.ratePerHour || '',
        description: labour.notes || '',
      });
    } else {
      setEditingLabour(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        workerName: '',
        phoneNumber: '',
        hoursWorked: '',
        ratePerHour: '',
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLabour(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.workerName.trim()) {
        toast.error('Please enter worker name');
        setSubmitting(false);
        return;
      }
      if (!formData.hoursWorked || formData.hoursWorked <= 0) {
        toast.error('Please enter valid hours worked');
        setSubmitting(false);
        return;
      }
      if (!formData.ratePerHour || formData.ratePerHour <= 0) {
        toast.error('Please enter valid rate per hour');
        setSubmitting(false);
        return;
      }

      // Convert data types
      const labourData = {
        ...formData,
        hoursWorked: Number(formData.hoursWorked),
        ratePerHour: Number(formData.ratePerHour),
      };

      if (editingLabour) {
        await labourService.update(editingLabour._id, labourData);
        toast.success('Labour updated successfully!');
      } else {
        await labourService.create(labourData);
        toast.success('Labour added successfully!');
      }
      handleCloseModal();
      fetchLabours();
    } catch (error) {
      console.error('Error saving labour:', error);
      toast.error(error.response?.data?.message || 'Failed to save labour entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await labourService.markAsPaid(id);
      toast.success('Marked as paid successfully!');
      fetchLabours();
    } catch (error) {
      console.error('Error marking as paid:', error);
      const errorMessage = error.response?.data?.message || 'Failed to mark as paid';
      
      // If it's already paid, show success and refresh
      if (errorMessage.includes('already marked as paid')) {
        toast.success('Already marked as paid!');
        fetchLabours();
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await labourService.delete(deleteConfirm.id);
      toast.success('Labour deleted successfully!');
      setDeleteConfirm({ isOpen: false, id: null });
      fetchLabours();
    } catch (error) {
      console.error('Error deleting labour:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800">Labour Management</h1>
          <p className="text-gray-600 text-sm md:text-sm mt-1">Track worker wages and payments</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Labour
        </Button>
      </div>

      {/* Pending Total Card */}
      <Card>
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 mb-2">Total Pending Wages</p>
          <p className="text-3xl font-semibold text-orange-600">{formatCurrency(pendingTotal)}</p>
        </div>
      </Card>

      {/* Labour List */}
      {labours.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title="No Labour Entries"
            description="Start tracking by adding your first labour entry"
            action={<Button onClick={() => handleOpenModal()}>Add Labour</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {labours.map((labour) => {
            return (
              <Card key={labour._id}>
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-base md:text-lg font-medium text-gray-800 truncate">{labour.workerName}</h3>
                          <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            labour.isPaid 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {labour.isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-500">{formatDate(labour.workDate)}</p>
                        {labour.phoneNumber && (
                          <p className="text-xs md:text-sm text-gray-600 mt-1">📱 {labour.phoneNumber}</p>
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xl md:text-2xl font-semibold text-gray-800">{formatCurrency(Number(labour.wage) || 0)}</p>
                        <p className="text-xs md:text-sm text-gray-500">
                          {labour.hoursWorked && labour.ratePerHour
                            ? `${Number(labour.hoursWorked) || 0}h @ ${formatCurrency(Number(labour.ratePerHour) || 0)}/h`
                            : 'Wage details not available'
                          }
                        </p>
                      </div>
                    </div>

                    {labour.notes && (
                      <p className="text-xs md:text-sm text-gray-600 mt-2">{labour.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 w-full lg:w-auto lg:flex-row lg:items-start">
                    {!labour.isPaid && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleMarkAsPaid(labour._id)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mark Paid
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenModal(labour)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteConfirm({ isOpen: true, id: labour._id })}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingLabour ? 'Edit Labour' : 'Add New Labour'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

          <Input
            label="Worker Name"
            type="text"
            name="workerName"
            value={formData.workerName}
            onChange={handleChange}
            placeholder="Enter worker name"
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Enter phone number"
          />

          <Input
            label="Hours Worked"
            type="number"
            name="hoursWorked"
            value={formData.hoursWorked}
            onChange={handleChange}
            placeholder="Enter hours worked"
            required
            min="0"
            step="0.5"
          />

          <Input
            label="Rate Per Hour"
            type="number"
            name="ratePerHour"
            value={formData.ratePerHour}
            onChange={handleChange}
            placeholder="Enter rate per hour"
            required
            min="0"
            step="0.01"
          />

          {/* Wage Calculation Preview */}
          {formData.hoursWorked && formData.ratePerHour && (
            <div className="bg-emerald-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Wage:</span>
                <span className="text-lg font-bold text-emerald-600">
                  {formatCurrency(Number(formData.hoursWorked) * Number(formData.ratePerHour))}
                </span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Work details (optional)"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              {editingLabour ? 'Update Labour' : 'Add Labour'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Labour"
        message="Are you sure you want to delete this labour entry? This action cannot be undone."
        loading={submitting}
      />
    </div>
  );
};

export default Labour;
