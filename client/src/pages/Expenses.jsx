import { useState, useEffect, useCallback } from 'react';
import { expenseService } from '../services/expenseService';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

const EXPENSE_CATEGORIES = [
  'Transport',
  'Labour',
  'Rent',
  'Utilities',
  'Maintenance',
  'Supplies',
  'Marketing',
  'Other',
];

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState({ category: '', startDate: '', endDate: '' });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Other',
    amount: '',
    title: '',
  });

  const fetchExpenses = useCallback(async (filterParam) => {
    setLoading(true);
    const fp = filterParam || { category: '', startDate: '', endDate: '' };
    try {
      const [expensesData, summaryData] = await Promise.all([
        expenseService.getAll(fp),
        expenseService.getSummary(fp),
      ]);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setSummary(summaryData || {});
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses(filter);
  }, [fetchExpenses, filter]);

  const handleOpenModal = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'Other',
      amount: '',
      title: '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFilterChange = (e) => {
    const updated = {
      ...filter,
      [e.target.name]: e.target.value,
    };
    setFilter(updated);

    // Immediately apply filter on change (category / date) — safe and instant UX
    fetchExpenses(updated);
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await expenseService.create(formData);
      toast.success('Expense added successfully!');
      handleCloseModal();
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await expenseService.delete(deleteConfirm.id);
      toast.success('Expense deleted successfully!');
      setDeleteConfirm({ isOpen: false, id: null });
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
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
          <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800">Expenses</h1>
          <p className="text-gray-600 text-sm md:text-sm mt-1">Track and manage all business expenses</p>
        </div>
        <Button onClick={handleOpenModal}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </Button>
      </div>

      {/* Summary */}
      <Card title="Total Expenses">
        <div className="text-center py-8">
          <p className="text-3xl font-semibold text-red-600">{formatCurrency(summary?.totalExpenses || 0)}</p>
          <p className="text-gray-600 mt-2">
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
      </Card>

      {/* Filters */}
      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Category"
            name="category"
            value={filter.category}
            onChange={handleFilterChange}
            options={[
              { value: '', label: 'All Categories' },
              ...EXPENSE_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
            ]}
          />
          <Input
            label="Start Date"
            type="date"
            name="startDate"
            value={filter.startDate}
            onChange={handleFilterChange}
          />
          <Input
            label="End Date"
            type="date"
            name="endDate"
            value={filter.endDate}
            onChange={handleFilterChange}
          />
        </div>
      </Card>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title="No Expenses"
            description="Start tracking by adding your first expense"
            action={<Button onClick={handleOpenModal}>Add Expense</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {expenses.map((expense) => (
            <Card key={expense._id}>
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 md:px-3 py-0.5 md:py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {expense.category}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-gray-500">{formatDate(expense.date)}</p>
                    </div>
                    <p className="text-lg md:text-xl font-semibold text-red-600">{formatCurrency(expense.amount)}</p>
                  </div>

                  {expense.title && (
                    <p className="text-xs md:text-sm text-gray-700 mt-2">{expense.title}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full lg:w-auto lg:flex-row lg:items-start">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeleteConfirm({ isOpen: true, id: expense._id })}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title="Add New Expense">
        <form onSubmit={handleSubmit}>
          <Input
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

          <Select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={EXPENSE_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
            required
          />

          <Input
            label="Amount"
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter amount"
            required
            min="0"
            step="0.01"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <textarea
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter expense title"
              rows="3"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              Add Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        loading={submitting}
      />
    </div>
  );
};

export default Expenses;
