import { useState, useEffect, useCallback, useRef } from 'react';
import { farmerService } from '../services/farmerService';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

const Farmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerData, setLedgerData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const isFirstSearch = useRef(true);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    village: '',
  });

  const [purchaseData, setPurchaseData] = useState({
    variety: '',
    boxType: '5',
    boxQuantity: '',
    ratePerBox: '',
    paymentGiven: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Calculate purchase totals
  const totalKg = purchaseData.boxQuantity && purchaseData.boxType
    ? Number(purchaseData.boxQuantity) * Number(purchaseData.boxType)
    : 0;
  const totalCost = purchaseData.boxQuantity && purchaseData.ratePerBox
    ? Number(purchaseData.boxQuantity) * Number(purchaseData.ratePerBox)
    : 0;
  const pendingAmount = totalCost - (Number(purchaseData.paymentGiven) || 0);

  const fetchFarmers = useCallback(async (query = '', isInitialLoad = false) => {
    if (isInitialLoad) {
      setInitialLoading(true);
    } else {
      setSearchLoading(true);
    }

    try {
      const data = await farmerService.getAll({ search: query });
      setFarmers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error('Failed to load farmers');
      setFarmers([]);
    } finally {
      if (isInitialLoad) {
        setInitialLoading(false);
      } else {
        setSearchLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchFarmers('', true); // Initial load
  }, [fetchFarmers]);

  // Debounced search effect - only update searchQuery if inputValue actually changed
  const prevInputValue = useRef('');
  useEffect(() => {
    if (inputValue === prevInputValue.current) return;

    const debounceTimer = setTimeout(() => {
      setSearchQuery(inputValue);
      prevInputValue.current = inputValue;
    }, 500); // 500ms debounce for smooth experience

    return () => clearTimeout(debounceTimer);
  }, [inputValue]);

  // Trigger search when searchQuery changes (skip first run to avoid duplicate initial load)
  useEffect(() => {
    if (isFirstSearch.current) {
      isFirstSearch.current = false;
      return;
    }
    fetchFarmers(searchQuery, false); // Search operation
  }, [searchQuery, fetchFarmers]);

  const handleOpenModal = () => {
    setFormData({
      name: '',
      mobile: '',
      village: '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleOpenPurchaseModal = (farmer) => {
    setSelectedFarmer(farmer);
    setPurchaseData({
      variety: '',
      boxType: '5',
      boxQuantity: '',
      ratePerBox: '',
      paymentGiven: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowPurchaseModal(true);
  };

  const handleClosePurchaseModal = () => {
    setShowPurchaseModal(false);
    setSelectedFarmer(null);
  };

  const handleOpenPaymentModal = (farmer) => {
    setSelectedFarmer(farmer);
    setPaymentData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedFarmer(null);
  };

  const handleExportToExcel = async () => {
    try {
      const blob = await farmerService.exportToExcel();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'farmers.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Farmer export failed. Please try again.');
    }
  };

  const handleCloseLedgerModal = () => {
    setShowLedgerModal(false);
    setSelectedFarmer(null);
    setLedgerData(null);
  };

  const handleOpenLedgerModal = async (farmer) => {
    setSelectedFarmer(farmer);
    try {
      const data = await farmerService.getLedger(farmer._id);
      setLedgerData(data);
      setShowLedgerModal(true);
    } catch (error) {
      toast.error('Failed to load ledger data');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePurchaseChange = (e) => {
    setPurchaseData({
      ...purchaseData,
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
      await farmerService.create(formData);
      toast.success('Farmer added successfully!');
      handleCloseModal();
      fetchFarmers(searchQuery);
    } catch (error) {
      console.error('Error saving farmer:', error);
      toast.error(error.response?.data?.message || 'Failed to add farmer');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        farmerId: selectedFarmer._id,
        variety: purchaseData.variety,
        boxType: Number(purchaseData.boxType),
        boxQuantity: Number(purchaseData.boxQuantity),
        ratePerBox: Number(purchaseData.ratePerBox),
        paymentGiven: Number(purchaseData.paymentGiven) || 0,
        date: purchaseData.date,
      };

      await farmerService.createPurchase(payload);
      toast.success('Purchase recorded successfully!');
      handleClosePurchaseModal();
      fetchFarmers(searchQuery);
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast.error(error.response?.data?.message || 'Failed to record purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await farmerService.makePayment(selectedFarmer._id, paymentData);
      toast.success('Payment recorded successfully!');
      handleClosePaymentModal();
      fetchFarmers(searchQuery);
    } catch (error) {
      console.error('Error making payment:', error);
      toast.error(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await farmerService.delete(deleteConfirm.id);
      toast.success('Farmer deleted successfully!');
      setDeleteConfirm({ isOpen: false, id: null });
      fetchFarmers(searchQuery);
    } catch (error) {
      console.error('Error deleting farmer:', error);
      toast.error(error.response?.data?.message || 'Failed to delete farmer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearSearch = () => {
    setInputValue('');
    setSearchQuery('');
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

  if (initialLoading) {
    return <Loading fullScreen />;
  }

  const totalPendingPayment = farmers.reduce((sum, farmer) => sum + (farmer.pendingPayment || 0), 0);
  const totalBoxes5 = farmers.reduce((sum, farmer) => sum + (farmer.totalBoxes5 || 0), 0);
  const totalBoxes10 = farmers.reduce((sum, farmer) => sum + (farmer.totalBoxes10 || 0), 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800">Farmer Management</h1>
          <p className="text-gray-600 text-sm md:text-sm mt-1">Track farmer purchases and payments</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={handleExportToExcel}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Farmers
          </Button>
          <Button onClick={handleOpenModal}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Farmer
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card title={`Search Farmers ${inputValue ? `(Typing: "${inputValue}")` : searchQuery ? `(Searching: "${searchQuery}")` : ''}`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by name, mobile, or village... (searches automatically)"
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
            Searching for farmers matching "{inputValue}"...
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4">
        <Card>
          <div className="text-center py-3 md:py-4">
            <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">5kg Boxes</p>
            <p className="text-xl md:text-2xl font-semibold text-emerald-600">{totalBoxes5}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center py-3 md:py-4">
            <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">10kg Boxes</p>
            <p className="text-xl md:text-2xl font-semibold text-blue-600">{totalBoxes10}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center py-3 md:py-4">
            <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">Pending Payment</p>
            <p className="text-xl md:text-2xl font-semibold text-red-600">{formatCurrency(totalPendingPayment)}</p>
          </div>
        </Card>
      </div>

      {/* Farmers List */}
      {farmers.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title="No Farmers"
            description="Start by adding your first farmer"
            action={<Button onClick={handleOpenModal}>Add Farmer</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {farmers.map((farmer) => {
            const hasPending = farmer.pendingPayment > 0;

            return (
              <Card key={farmer._id} className={hasPending ? 'border-2 border-red-300' : ''}>
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base md:text-lg font-medium text-gray-800">{farmer.name}</h3>
                          {hasPending && (
                            <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Pending
                            </span>
                          )}
                        </div>
                        {farmer.mobile && (
                          <p className="text-xs md:text-sm text-gray-600">📱 {farmer.mobile}</p>
                        )}
                        {farmer.village && (
                          <p className="text-xs md:text-sm text-gray-500 mt-1">📍 {farmer.village}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs md:text-sm text-gray-600 mb-1">Pending</p>
                        <p className={`text-lg md:text-xl font-semibold ${hasPending ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(farmer.pendingPayment || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm pt-3 border-t">
                      <div>
                        <p className="text-gray-500">5kg Boxes</p>
                        <p className="font-medium text-gray-700">{farmer.totalBoxes5 || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">10kg Boxes</p>
                        <p className="font-medium text-gray-700">{farmer.totalBoxes10 || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Purchase</p>
                        <p className="font-medium text-gray-700">{formatCurrency(farmer.totalPurchaseAmount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Paid</p>
                        <p className="font-medium text-gray-700">{formatCurrency(farmer.totalPaymentGiven || 0)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full lg:w-auto lg:flex-row lg:items-start">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenPurchaseModal(farmer)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Purchase
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenPaymentModal(farmer)}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={!farmer.pendingPayment || farmer.pendingPayment <= 0}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Pay
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenLedgerModal(farmer)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Ledger
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteConfirm({ isOpen: true, id: farmer._id })}
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

      {/* Add Farmer Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title="Add New Farmer">
        <form onSubmit={handleSubmit}>
          <Input
            label="Farmer Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter farmer name"
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Enter phone number"
          />

          <Input
            label="Village"
            type="text"
            name="village"
            value={formData.village}
            onChange={handleChange}
            placeholder="Enter village name"
          />

          <div className="flex gap-3 justify-end mt-6">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              Add Farmer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Purchase Modal */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={handleClosePurchaseModal}
        title={`Record Purchase - ${selectedFarmer?.name}`}
      >
        <form onSubmit={handlePurchaseSubmit}>
          <Input
            label="Date"
            type="date"
            name="date"
            value={purchaseData.date}
            onChange={handlePurchaseChange}
            required
          />

          <Input
            label="Variety"
            type="text"
            name="variety"
            value={purchaseData.variety}
            onChange={handlePurchaseChange}
            placeholder="Enter mango variety"
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Box Type <span className="text-red-500">*</span>
            </label>
            <select
              name="boxType"
              value={purchaseData.boxType}
              onChange={handlePurchaseChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="5">5 kg</option>
              <option value="10">10 kg</option>
            </select>
          </div>

          <Input
            label="Number of Boxes"
            type="number"
            name="boxQuantity"
            value={purchaseData.boxQuantity}
            onChange={handlePurchaseChange}
            placeholder="Enter number of boxes"
            required
            min="1"
            step="1"
          />

          <Input
            label="Rate per Box (₹)"
            type="number"
            name="ratePerBox"
            value={purchaseData.ratePerBox}
            onChange={handlePurchaseChange}
            placeholder="Enter rate per box"
            required
            min="1"
            step="1"
          />

          <Input
            label="Payment Given (₹)"
            type="number"
            name="paymentGiven"
            value={purchaseData.paymentGiven}
            onChange={handlePurchaseChange}
            placeholder="Enter payment amount"
            min="0"
            step="0.01"
          />

          {/* Calculation Preview */}
          {purchaseData.boxQuantity && purchaseData.ratePerBox && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Kg:</span>
                <span className="font-semibold">{totalKg} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Cost:</span>
                <span className="font-semibold">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-600">Pending Amount:</span>
                <span className={`font-bold ${pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(pendingAmount)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-6">
            <Button type="button" variant="secondary" onClick={handleClosePurchaseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              Record Purchase
            </Button>
          </div>
        </form>
      </Modal>

      {/* Make Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={handleClosePaymentModal}
        title={`Make Payment - ${selectedFarmer?.name}`}
      >
        <form onSubmit={handlePaymentSubmit}>
          {selectedFarmer && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Pending Payment:</span>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(selectedFarmer.pendingPayment || 0)}
                </span>
              </div>
            </div>
          )}

          <Input
            label="Date"
            type="date"
            name="date"
            value={paymentData.date}
            onChange={handlePaymentChange}
            required
          />

          <Input
            label="Payment Amount (₹)"
            type="number"
            name="amount"
            value={paymentData.amount}
            onChange={handlePaymentChange}
            placeholder="Enter payment amount"
            required
            min="0"
            max={selectedFarmer?.pendingPayment || 0}
            step="0.01"
          />

          <div className="flex gap-3 justify-end mt-6">
            <Button type="button" variant="secondary" onClick={handleClosePaymentModal}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ledger Modal */}
      <Modal
        isOpen={showLedgerModal}
        onClose={handleCloseLedgerModal}
        title={`Purchase Ledger - ${selectedFarmer?.name}`}
        size="large"
      >
        {ledgerData ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">5kg Boxes</p>
                  <p className="font-bold text-lg">{ledgerData.summary.totalBoxes5}</p>
                </div>
                <div>
                  <p className="text-gray-600">10kg Boxes</p>
                  <p className="font-bold text-lg">{ledgerData.summary.totalBoxes10}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Purchase</p>
                  <p className="font-bold text-lg">{formatCurrency(ledgerData.summary.totalPurchaseAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Paid</p>
                  <p className="font-bold text-lg text-green-600">{formatCurrency(ledgerData.summary.totalPaymentGiven)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Pending</p>
                  <p className="font-bold text-lg text-red-600">{formatCurrency(ledgerData.summary.pendingPayment)}</p>
                </div>
              </div>
            </div>

            {/* Ledger Entries */}
            <div className="max-h-96 overflow-y-auto">
              {ledgerData.ledger && ledgerData.ledger.length > 0 ? (
                <div className="space-y-3">
                  {ledgerData.ledger.map((entry) => (
                    <div key={entry._id} className="bg-white border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{entry.variety}</p>
                          <p className="text-sm text-gray-500">{formatDate(entry.date)}</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                          {entry.boxType}kg Box
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Boxes</p>
                          <p className="font-semibold">{entry.boxQuantity}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Kg</p>
                          <p className="font-semibold">{entry.totalKg} kg</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Rate/Box</p>
                          <p className="font-semibold">{formatCurrency(entry.ratePerBox)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Cost</p>
                          <p className="font-semibold">{formatCurrency(entry.totalCost)}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <div className="text-sm">
                          <span className="text-gray-500">Payment: </span>
                          <span className="font-semibold text-green-600">{formatCurrency(entry.paymentGiven)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Pending: </span>
                          <span className="font-semibold text-red-600">{formatCurrency(entry.pendingAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No purchase records found</p>
              )}
            </div>
          </div>
        ) : (
          <Loading />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Farmer"
        message="Are you sure you want to delete this farmer? This action cannot be undone."
        loading={submitting}
      />
    </div>
  );
};

export default Farmers;
