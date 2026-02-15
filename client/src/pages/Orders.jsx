import { useState, useEffect, useCallback, useRef } from 'react';
import { orderService } from '../services/orderService';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentUpdating, setPaymentUpdating] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const isFirstSearch = useRef(true);

  // Export controls
  const [exportPreset, setExportPreset] = useState('All');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportSort, setExportSort] = useState('createdAt:desc');

  const [formData, setFormData] = useState({
    customerName: '',
    customerMobile: '',
    address: '',
    boxSize: '5kg',
    boxPrice: '',
    boxQuantity: '',
    paymentStatus: 'Pending',
  });

  const fetchOrders = useCallback(async (query = '', isInitialLoad = false) => {
    if (isInitialLoad) {
      setInitialLoading(true);
    } else {
      setSearchLoading(true);
    }
    
    try {
      const data = await orderService.getAll({
        search: query,
        paymentStatus: statusFilter,
      });
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      if (isInitialLoad) {
        setInitialLoading(false);
      } else {
        setSearchLoading(false);
      }
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders('', true); // Initial load
  }, [fetchOrders]);

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
    fetchOrders(searchQuery, false); // Search operation
  }, [searchQuery, fetchOrders]);

  // Trigger search only when statusFilter actually changes (avoid duplicate runs)
  const prevStatusRef = useRef(statusFilter);
  useEffect(() => {
    if (prevStatusRef.current !== statusFilter) {
      // statusFilter changed -> fetch with current searchQuery
      fetchOrders(searchQuery, false);
      prevStatusRef.current = statusFilter;
    }
  }, [statusFilter, searchQuery, fetchOrders]);

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Immediately trigger search on Enter
      setSearchQuery(inputValue);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      customerName: '',
      customerMobile: '',
      address: '',
      boxSize: '5kg',
      boxPrice: '',
      boxQuantity: '',
      paymentStatus: 'Pending',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const formatDateISO = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getPresetRange = (preset) => {
    const today = new Date();
    let start, end;
    if (preset === 'Today') {
      start = new Date(today); start.setHours(0,0,0,0);
      end = new Date(today); end.setHours(23,59,59,999);
    } else if (preset === 'ThisWeek') {
      const day = today.getDay(); // 0 (Sun) - 6 (Sat)
      const diffToMon = (day + 6) % 7; // days since Monday
      start = new Date(today); start.setDate(today.getDate() - diffToMon); start.setHours(0,0,0,0);
      end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
    } else if (preset === 'ThisMonth') {
      start = new Date(today.getFullYear(), today.getMonth(), 1); start.setHours(0,0,0,0);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0); end.setHours(23,59,59,999);
    } else if (preset === 'ThisYear') {
      start = new Date(today.getFullYear(), 0, 1); start.setHours(0,0,0,0);
      end = new Date(today.getFullYear(), 11, 31); end.setHours(23,59,59,999);
    } else return null;
    return { startDate: formatDateISO(start), endDate: formatDateISO(end) };
  };

  const handleExportToExcel = async () => {
    try {
      const params = {};

      if (exportPreset && exportPreset !== 'All' && exportPreset !== 'Custom') {
        const range = getPresetRange(exportPreset);
        if (range) {
          params.startDate = range.startDate;
          params.endDate = range.endDate;
        }
      } else if (exportPreset === 'Custom') {
        if (exportStartDate) params.startDate = exportStartDate;
        if (exportEndDate) params.endDate = exportEndDate;
      }

      if (exportSort) {
        const [sortBy, sortOrder] = exportSort.split(':');
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
      }

      const blob = await orderService.exportToExcel(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'orders.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleOpenEditModal = (order) => {
    setSelectedOrder(order);
    setFormData({
      customerName: order.customerName,
      customerMobile: order.customerMobile,
      address: order.address,
      boxSize: order.boxSize,
      boxPrice: order.boxPrice.toString(),
      boxQuantity: order.boxQuantity.toString(),
      paymentStatus: order.paymentStatus,
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedOrder(null);
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
      await orderService.create({
        ...formData,
        boxPrice: Number(formData.boxPrice),
        boxQuantity: Number(formData.boxQuantity),
      });
      toast.success('Order created successfully!');
      handleCloseModal();
      fetchOrders(searchQuery, false);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await orderService.update(selectedOrder._id, {
        ...formData,
        boxPrice: Number(formData.boxPrice),
        boxQuantity: Number(formData.boxQuantity),
      });
      toast.success('Order updated successfully!');
      handleCloseEditModal();
      fetchOrders(searchQuery, false);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error.response?.data?.message || 'Failed to update order');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentUpdate = async (orderId, newStatus) => {
    setPaymentUpdating(orderId);
    try {
      await orderService.updatePaymentStatus(orderId, newStatus);
      toast.success(`Order marked as ${newStatus.toLowerCase()}!`);
      fetchOrders(searchQuery, false);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(error.response?.data?.message || 'Failed to update payment status');
    } finally {
      setPaymentUpdating(null);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await orderService.delete(deleteConfirm.id);
      toast.success('Order deleted successfully!');
      setDeleteConfirm({ isOpen: false, id: null });
      fetchOrders(searchQuery, false);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(error.response?.data?.message || 'Failed to delete order');
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateTotal = () => {
    const price = Number(formData.boxPrice) || 0;
    const quantity = Number(formData.boxQuantity) || 0;
    return price * quantity;
  };

  if (initialLoading) {
    return <Loading fullScreen />;
  }

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const paidOrders = orders.filter((order) => order.paymentStatus === 'Paid').length;
  const pendingOrders = orders.filter((order) => order.paymentStatus === 'Pending').length;

  // Group orders by customer mobile
  const groupedOrders = orders.reduce((groups, order) => {
    const mobile = order.customerMobile;
    if (!groups[mobile]) {
      groups[mobile] = {
        customerName: order.customerName,
        customerMobile: mobile,
        address: order.address,
        orders: [],
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
      };
    }
    groups[mobile].orders.push(order);
    groups[mobile].totalAmount += order.totalAmount;
    if (order.paymentStatus === 'Paid') {
      groups[mobile].paidAmount += order.totalAmount;
    } else {
      groups[mobile].pendingAmount += order.totalAmount;
    }
    return groups;
  }, {});

  const customerGroups = Object.values(groupedOrders);

  if (initialLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800">Order Management</h1>
          <p className="text-gray-600 text-sm md:text-sm mt-1">Manage customer orders</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
          <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
            <Select
              name="exportPreset"
              value={exportPreset}
              onChange={(e) => setExportPreset(e.target.value)}
              options={[
                { value: 'All', label: 'All dates' },
                { value: 'Today', label: 'Today' },
                { value: 'ThisWeek', label: 'This week' },
                { value: 'ThisMonth', label: 'This month' },
                { value: 'ThisYear', label: 'This year' },
                { value: 'Custom', label: 'Custom range' },
              ]}
              className="w-full md:w-40"
            />

            {exportPreset === 'Custom' && (
              <div className="flex gap-2 w-full md:w-auto">
                <Input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="w-full md:w-40" />
                <Input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="w-full md:w-40" />
              </div>
            )}

            <Select
              name="exportSort"
              value={exportSort}
              onChange={(e) => setExportSort(e.target.value)}
              options={[
                { value: 'createdAt:desc', label: 'Date (new → old)' },
                { value: 'createdAt:asc', label: 'Date (old → new)' },
                { value: 'totalAmount:desc', label: 'Total (high → low)' },
                { value: 'totalAmount:asc', label: 'Total (low → high)' },
                { value: 'invoiceNumber:asc', label: 'Invoice (asc)' },
                { value: 'invoiceNumber:desc', label: 'Invoice (desc)' },
              ]}
              className="w-full md:w-48"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={handleExportToExcel} className="w-full sm:w-auto">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to Excel
            </Button>
            <Button onClick={handleOpenModal} className="w-full sm:w-auto">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Order
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-4">
        <Card>
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-2xl font-semibold text-emerald-600">{totalOrders}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-2xl font-semibold text-blue-600">{formatCurrency(totalRevenue)}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-1">Paid Orders</p>
            <p className="text-2xl font-semibold text-green-600">{paidOrders}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
            <p className="text-2xl font-semibold text-yellow-600">{pendingOrders}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card title="Filter Orders">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Input
              placeholder="Search by customer name or mobile number..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="mb-0"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
              </div>
            )}
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mb-0"
            options={[
              { value: 'All', label: 'All Status' },
              { value: 'Paid', label: 'Paid' },
              { value: 'Pending', label: 'Pending' },
            ]}
          />
        </div>
      </Card>

      {/* Orders List */}
      {customerGroups.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            }
            title="No Orders"
            description="Start by adding your first order"
            action={<Button onClick={handleOpenModal}>Add Order</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {customerGroups.map((customer) => (
            <Card key={customer.customerMobile} className="overflow-hidden">
              {/* Customer Header */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <h3 className="text-lg font-medium text-gray-800">
                          👤 {customer.customerName}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium">
                          📱 {customer.customerMobile}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {customer.orders.length} Order{customer.orders.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-gray-600">📍 {customer.address}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-emerald-600 font-semibold">
                        Total: {formatCurrency(customer.totalAmount)}
                      </span>
                      <span className="text-green-600">
                        Paid: {formatCurrency(customer.paidAmount)}
                      </span>
                      <span className="text-yellow-600">
                        Pending: {formatCurrency(customer.pendingAmount)}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      // Pre-fill form with customer's data
                      setFormData({
                        customerName: customer.customerName,
                        customerMobile: customer.customerMobile,
                        address: customer.address,
                        boxSize: '5kg',
                        boxPrice: '',
                        boxQuantity: '',
                        paymentStatus: 'Pending',
                      });
                      setShowModal(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Order
                  </Button>
                </div>
              </div>

              {/* Customer Orders */}
              <div className="divide-y divide-gray-100">
                {customer.orders.map((order) => (
                  <div
                    key={order._id}
                    className={`p-4 ${order.paymentStatus === 'Pending' ? 'bg-yellow-50' : 'bg-green-50'}`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs sm:text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded whitespace-nowrap">
                            📄 {order.invoiceNumber || 'N/A'}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                            📅 {formatDate(order.createdAt)}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              order.paymentStatus === 'Paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">Box Size</p>
                            <p className="font-medium text-gray-700">{order.boxSize}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Price/Box</p>
                            <p className="font-medium text-gray-700 truncate">
                              {formatCurrency(order.boxPrice)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Quantity</p>
                            <p className="font-medium text-gray-700">{order.boxQuantity}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Total Amount</p>
                            <p className="font-semibold text-emerald-600 truncate">
                              {formatCurrency(order.totalAmount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full">
                        {order.paymentStatus === 'Pending' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handlePaymentUpdate(order._id, 'Paid')}
                            loading={paymentUpdating === order._id}
                            disabled={paymentUpdating === order._id}
                            className="w-full sm:w-auto sm:flex-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Mark Paid
                          </Button>
                        )}
                        {order.paymentStatus === 'Paid' && (
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handlePaymentUpdate(order._id, 'Pending')}
                            loading={paymentUpdating === order._id}
                            disabled={paymentUpdating === order._id}
                            className="w-full sm:w-auto sm:flex-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Mark Pending
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(order)}
                          className="w-full sm:w-auto sm:flex-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteConfirm({ isOpen: true, id: order._id })}
                          className="w-full sm:w-auto sm:flex-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Order Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title="Add New Order">
        <form onSubmit={handleSubmit}>
          <Input
            label="Customer Name"
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            placeholder="Enter customer name"
            required
          />

          <Input
            label="Customer Mobile"
            type="tel"
            name="customerMobile"
            value={formData.customerMobile}
            onChange={handleChange}
            placeholder="Enter mobile number"
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter delivery address"
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <Select
            label="Box Size"
            name="boxSize"
            value={formData.boxSize}
            onChange={handleChange}
            required
            options={[
              { value: '5kg', label: '5 kg' },
              { value: '10kg', label: '10 kg' },
            ]}
          />

          <Input
            label="Box Price (₹)"
            type="number"
            name="boxPrice"
            value={formData.boxPrice}
            onChange={handleChange}
            placeholder="Enter price per box"
            required
            min="1"
            step="0.01"
          />

          <Input
            label="Box Quantity"
            type="number"
            name="boxQuantity"
            value={formData.boxQuantity}
            onChange={handleChange}
            placeholder="Enter number of boxes"
            required
            min="1"
            step="1"
          />

          <Select
            label="Payment Status"
            name="paymentStatus"
            value={formData.paymentStatus}
            onChange={handleChange}
            required
            options={[
              { value: 'Pending', label: 'Pending' },
              { value: 'Paid', label: 'Paid' },
            ]}
          />

          {/* Total Preview */}
          {formData.boxPrice && formData.boxQuantity && (
            <div className="bg-emerald-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">Total Amount:</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-6">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              Add Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Order Modal */}
      <Modal isOpen={showEditModal} onClose={handleCloseEditModal} title="Edit Order">
        <form onSubmit={handleUpdate}>
          <Input
            label="Customer Name"
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            placeholder="Enter customer name"
            required
          />

          <Input
            label="Customer Mobile"
            type="tel"
            name="customerMobile"
            value={formData.customerMobile}
            onChange={handleChange}
            placeholder="Enter mobile number"
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter delivery address"
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <Select
            label="Box Size"
            name="boxSize"
            value={formData.boxSize}
            onChange={handleChange}
            required
            options={[
              { value: '5kg', label: '5 kg' },
              { value: '10kg', label: '10 kg' },
            ]}
          />

          <Input
            label="Box Price (₹)"
            type="number"
            name="boxPrice"
            value={formData.boxPrice}
            onChange={handleChange}
            placeholder="Enter price per box"
            required
            min="1"
            step="0.01"
          />

          <Input
            label="Box Quantity"
            type="number"
            name="boxQuantity"
            value={formData.boxQuantity}
            onChange={handleChange}
            placeholder="Enter number of boxes"
            required
            min="1"
            step="1"
          />

          <Select
            label="Payment Status"
            name="paymentStatus"
            value={formData.paymentStatus}
            onChange={handleChange}
            required
            options={[
              { value: 'Pending', label: 'Pending' },
              { value: 'Paid', label: 'Paid' },
            ]}
          />

          {/* Total Preview */}
          {formData.boxPrice && formData.boxQuantity && (
            <div className="bg-emerald-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">Total Amount:</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-6">
            <Button type="button" variant="secondary" onClick={handleCloseEditModal}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              Update Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        confirmText="Delete"
        loading={submitting}
      />
    </div>
  );
};

export default Orders;
