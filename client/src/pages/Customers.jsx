import { useState, useEffect, useCallback, useRef } from 'react';
import { customerService } from '../services/customerService';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const isFirstSearch = useRef(true);
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
  });

  const [creditData, setCreditData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const fetchCustomers = useCallback(async (query = '', isInitialLoad = false) => {
    if (isInitialLoad) {
      setInitialLoading(true);
    } else {
      setSearchLoading(true);
    }
    
    try {
      const data = await customerService.getAll({ search: query });
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
      setCustomers([]);
    } finally {
      if (isInitialLoad) {
        setInitialLoading(false);
      } else {
        setSearchLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCustomers('', true); // Initial load
  }, [fetchCustomers]);

  // Debounced search effect - only update searchQuery if inputValue actually changed
  const prevInputValue = useRef('');
  useEffect(() => {
    if (inputValue === prevInputValue.current) return;
    
    const debounceTimer = setTimeout(() => {
      setSearchQuery(inputValue);
      prevInputValue.current = inputValue;
    }, 500); // Increased debounce to 500ms for better performance

    return () => clearTimeout(debounceTimer);
  }, [inputValue]);

  // Trigger search when searchQuery changes (skip first run to avoid duplicate initial load)
  useEffect(() => {
    if (isFirstSearch.current) {
      isFirstSearch.current = false;
      return;
    }
    fetchCustomers(searchQuery, false); // Search operation
  }, [searchQuery, fetchCustomers]);

  const handleClearSearch = () => {
    setInputValue('');
    setSearchQuery('');
  };

  const handleOpenModal = () => {
    setFormData({
      name: '',
      mobile: '',
      address: '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleOpenCreditModal = (customer) => {
    setSelectedCustomer(customer);
    setCreditData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setShowCreditModal(true);
  };

  const handleCloseCreditModal = () => {
    setShowCreditModal(false);
    setSelectedCustomer(null);
  };

  const handleOpenPaymentModal = (customer) => {
    setSelectedCustomer(customer);
    setPaymentData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedCustomer(null);
  };

  const handleExportToExcel = async () => {
    try {
      const blob = await customerService.exportToExcel();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'customers.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreditChange = (e) => {
    setCreditData({
      ...creditData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePaymentChange = (e) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await customerService.create(formData);
      toast.success('Customer added successfully!');
      handleCloseModal();
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCredit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await customerService.addCredit(selectedCustomer._id, creditData);
      toast.success('Credit added successfully!');
      handleCloseCreditModal();
      fetchCustomers();
    } catch (error) {
      console.error('Error adding credit:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await customerService.addPayment(selectedCustomer._id, paymentData);
      toast.success('Payment added successfully!');
      handleClosePaymentModal();
      fetchCustomers();
    } catch (error) {
      console.error('Error adding payment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await customerService.delete(deleteConfirm.id);
      toast.success('Customer deleted successfully!');
      setDeleteConfirm({ isOpen: false, id: null });
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
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

  if (initialLoading) {
    return <Loading fullScreen />;
  }

  const totalOutstanding = customers.reduce((sum, customer) => sum + (customer.balance || 0), 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800">Customer Credit</h1>
          <p className="text-gray-600 text-sm md:text-sm mt-1">Manage customer credits and payments</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={handleExportToExcel}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Excel
          </Button>
          <Button onClick={handleOpenModal}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Customer
          </Button>
        </div>
      </div>

      {/* Total Outstanding Card */}
      <Card>
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 mb-2">Total Outstanding Balance</p>
          <p className="text-3xl font-semibold text-yellow-600">{formatCurrency(totalOutstanding)}</p>
        </div>
      </Card>

      {/* Search */}
      <Card title={`Search Customer ${inputValue ? `(Typing: "${inputValue}")` : searchQuery ? `(Searching: "${searchQuery}")` : ''}`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by name or mobile... (searches automatically)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="mb-0 flex-1"
          />
          <div className="flex gap-2 sm:gap-3">
            {(inputValue || searchQuery) && (
              <Button onClick={handleClearSearch} variant="secondary" className="flex-1 sm:flex-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </Button>
            )}
          </div>
        </div>
        {inputValue && inputValue !== searchQuery && (
          <p className="text-sm text-gray-600 mt-2">
            Searching for customers matching "{inputValue}"...
          </p>
        )}
        {searchQuery && inputValue === searchQuery && !searchLoading && (
          <p className="text-sm text-green-600 mt-2">
            ✓ Showing results for "{searchQuery}"
          </p>
        )}
        {searchLoading && (
          <p className="text-sm text-blue-600 mt-2">
            🔍 Searching...
          </p>
        )}
      </Card>

      {/* Customers List */}
      {customers.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title="No Customers"
            description="Start by adding your first customer"
            action={<Button onClick={handleOpenModal}>Add Customer</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {customers.map((customer) => {
            const balance = customer.balance || 0;
            const hasPendingBalance = balance > 0;

            return (
              <Card key={customer._id} className={hasPendingBalance ? 'border-2 border-yellow-300' : ''}>
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base md:text-lg font-medium text-gray-800">{customer.name}</h3>
                          {hasPendingBalance && (
                            <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </div>
                        {customer.mobile && (
                          <p className="text-xs md:text-sm text-gray-600">📱 {customer.mobile}</p>
                        )}
                        {customer.address && (
                          <p className="text-xs md:text-sm text-gray-500 mt-1">📍 {customer.address}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs md:text-sm text-gray-600 mb-1">Balance</p>
                        <p className={`text-lg md:text-xl font-semibold ${hasPendingBalance ? 'text-yellow-600' : 'text-green-600'}`}>
                          {formatCurrency(balance)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm pt-3 border-t">
                      <div>
                        <p className="text-gray-500">Total Credit</p>
                        <p className="font-medium text-gray-700">{formatCurrency(customer.totalCredit || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Paid</p>
                        <p className="font-medium text-gray-700">{formatCurrency(customer.totalPaid || 0)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full lg:w-auto lg:flex-row lg:items-start">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenCreditModal(customer)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Credit
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenPaymentModal(customer)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Add Payment
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteConfirm({ isOpen: true, id: customer._id })}
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

      {/* Add Customer Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title="Add New Customer">
        <form onSubmit={handleSubmit}>
          <Input
            label="Customer Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter customer name"
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Enter phone number"
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter address (optional)"
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              Add Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Credit Modal */}
      <Modal
        isOpen={showCreditModal}
        onClose={handleCloseCreditModal}
        title={`Add Credit - ${selectedCustomer?.name}`}
      >
        <form onSubmit={handleAddCredit}>
          <Input
            label="Date"
            type="date"
            name="date"
            value={creditData.date}
            onChange={handleCreditChange}
            required
          />

          <Input
            label="Credit Amount"
            type="number"
            name="amount"
            value={creditData.amount}
            onChange={handleCreditChange}
            placeholder="Enter credit amount"
            required
            min="0"
            step="0.01"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={creditData.description}
              onChange={handleCreditChange}
              placeholder="Additional notes (optional)"
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button type="button" variant="secondary" onClick={handleCloseCreditModal}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              Add Credit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={handleClosePaymentModal}
        title={`Add Payment - ${selectedCustomer?.name}`}
      >
        <form onSubmit={handleAddPayment}>
          <Input
            label="Date"
            type="date"
            name="date"
            value={paymentData.date}
            onChange={handlePaymentChange}
            required
          />

          <Input
            label="Payment Amount"
            type="number"
            name="amount"
            value={paymentData.amount}
            onChange={handlePaymentChange}
            placeholder="Enter payment amount"
            required
            min="0"
            step="0.01"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={paymentData.description}
              onChange={handlePaymentChange}
              placeholder="Additional notes (optional)"
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button type="button" variant="secondary" onClick={handleClosePaymentModal}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              Add Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        loading={submitting}
      />
    </div>
  );
};

export default Customers;
