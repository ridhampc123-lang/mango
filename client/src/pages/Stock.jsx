import { useState, useEffect } from 'react';
import { stockService } from '../services/stockService';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../utils/helpers';

const Stock = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    boxType: '5',
    totalBoxes: '',
    soldBoxes: '',
    pricePerBox: '',
  });

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const response = await stockService.getAll();
      setStocks(response || []);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const handleOpenModal = (stock = null) => {
    if (stock) {
      setEditingStock(stock);
      setFormData({
        date: stock.date?.split('T')[0] || '',
        supplier: stock.supplier || '',
        boxType: stock.boxType?.toString() || '5',
        totalBoxes: stock.totalBoxes || '',
        soldBoxes: stock.soldBoxes || '',
        pricePerBox: stock.pricePerBox || '',
      });
    } else {
      setEditingStock(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        boxType: '5',
        totalBoxes: '',
        soldBoxes: '',
        pricePerBox: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStock(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.supplier.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    
    if (!formData.totalBoxes || formData.totalBoxes <= 0) {
      toast.error('Total boxes must be greater than 0');
      return;
    }

    setSubmitting(true);

    try {
      if (editingStock) {
        await stockService.update(editingStock._id, formData);
        toast.success('Stock updated successfully!');
      } else {
        await stockService.create(formData);
        toast.success('Stock added successfully!');
      }
      handleCloseModal();
      fetchStocks();
    } catch (error) {
      console.error('Error saving stock:', error);
      toast.error(error.response?.data?.message || 'Failed to save stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await stockService.delete(deleteConfirm.id);
      toast.success('Stock deleted successfully!');
      setDeleteConfirm({ isOpen: false, id: null });
      fetchStocks();
    } catch (error) {
      console.error('Error deleting stock:', error);
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


  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800">Stock Management</h1>
          <p className="text-gray-600 text-sm md:text-sm mt-1">Manage your inventory and stock entries</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Stock
        </Button>
      </div>

      {/* Stock List */}
      {stocks.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
            title="No Stock Entries"
            description="Get started by adding your first stock entry"
            action={<Button onClick={() => handleOpenModal()}>Add Stock</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {stocks.map((stock) => {
            const remainingBoxes = stock.totalBoxes - stock.soldBoxes;
            const totalCost = stock.totalBoxes * stock.pricePerBox;

            return (
              <Card key={stock._id}>
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-medium text-gray-800 truncate">{stock.supplier}</h3>
                        <p className="text-xs md:text-sm text-gray-500">{formatDate(stock.date)}</p>
                      </div>
                      <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-medium whitespace-nowrap self-start ${
                        remainingBoxes > 10 ? 'bg-green-100 text-green-800' :
                        remainingBoxes > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {remainingBoxes} boxes left
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Box Type</p>
                        <p className="font-medium text-gray-700">{stock.boxType}kg</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Total Boxes</p>
                        <p className="font-medium text-gray-700">{stock.totalBoxes}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Sold Boxes</p>
                        <p className="font-medium text-gray-700">{stock.soldBoxes}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Cost/Box</p>
                        <p className="font-medium text-gray-700 truncate">{formatCurrency(stock.pricePerBox)}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-gray-500">Total Cost</p>
                        <p className="font-medium text-gray-700 truncate">{formatCurrency(totalCost)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full lg:w-auto lg:flex-row lg:items-start">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenModal(stock)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteConfirm({ isOpen: true, id: stock._id })}
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
        title={editingStock ? 'Edit Stock' : 'Add New Stock'}
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
            label="Supplier Name"
            type="text"
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            placeholder="Enter supplier name"
            required
          />

          <Select
            label="Box Type"
            name="boxType"
            value={formData.boxType}
            onChange={handleChange}
            options={[
              { value: '5', label: '5kg' },
              { value: '10', label: '10kg' },
            ]}
            required
          />

          <Input
            label="Total Boxes"
            type="number"
            name="totalBoxes"
            value={formData.totalBoxes}
            onChange={handleChange}
            placeholder="Enter total boxes"
            required
            min="0"
          />

          <Input
            label="Sold Boxes"
            type="number"
            name="soldBoxes"
            value={formData.soldBoxes}
            onChange={handleChange}
            placeholder="Enter sold boxes"
            min="0"
          />

          <Input
            label="Price Per Box (Cost)"
            type="number"
            name="pricePerBox"
            value={formData.pricePerBox}
            onChange={handleChange}
            placeholder="Enter cost per box"
            min="0"
            step="0.01"
          />

          <div className="flex gap-3 justify-end mt-6">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              {editingStock ? 'Update Stock' : 'Add Stock'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Stock"
        message="Are you sure you want to delete this stock entry? This action cannot be undone."
        loading={submitting}
      />
    </div>
  );
};

export default Stock;
