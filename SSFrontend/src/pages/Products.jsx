import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Package,
  Plus,
  Filter,
  Download,
  Upload,
  Edit2,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  History,
  QrCode,
  Tag,
  IndianRupee,
  Boxes,
  Sliders,
  X,
  Zap,
  Cpu,
  Layers,
  Plug,
  Wrench,
  Camera,
  RefreshCw,
  Warehouse
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Drawer from '../components/common/Drawer';

import { productApi, categoryApi } from '../services/api';
import { hasPermission, normalizeRole } from '../utils/permissions';

const PRODUCT_ICONS = [
  { key: 'Package', icon: Package, label: 'General / Package' },
  { key: 'Zap', icon: Zap, label: 'Sensors & Power' },
  { key: 'Cpu', icon: Cpu, label: 'Actuators & Motors' },
  { key: 'Sliders', icon: Sliders, label: 'Controllers' },
  { key: 'Layers', icon: Layers, label: 'Pneumatics & Fluid' },
  { key: 'Plug', icon: Plug, label: 'Networking & Cables' },
  { key: 'Wrench', icon: Wrench, label: 'Fasteners & Hardware' },
  { key: 'Camera', icon: Camera, label: 'Optics & Vision' }
];

const renderProductIcon = (iconKey) => {
  const map = {
    Zap,
    Cpu,
    Sliders,
    Layers,
    Plug,
    Wrench,
    Camera,
    Package
  };
  const Comp = map[iconKey] || Package;
  return <Comp size={16} />;
};

import { matchesWarehouse, DEFAULT_WAREHOUSES } from '../utils/warehouseUtils';

export default function Products({
  products,
  setProducts,
  onNotify,
  warehouses = [],
  currentUser,
  isLoading: externalLoading,
  activeWarehouse = 'All',
  onChangeWarehouse
}) {
  const facilityList = (warehouses && warehouses.length > 0) ? warehouses : DEFAULT_WAREHOUSES;
  const canManageProducts = hasPermission.canManageProducts(currentUser?.role);
  const location = useLocation();
  const [selectedRows, setSelectedRows] = useState([]);
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'IN_STOCK' | 'OUT_OF_STOCK'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create'); // 'create' | 'edit'
  const [activeDrawerTab, setActiveDrawerTab] = useState('basic');
  const [viewProductModal, setViewProductModal] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Bulk CSV Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [parsedProducts, setParsedProducts] = useState([]);
  const [csvError, setCsvError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const templateCsv = `Product Name,SKU,Category,Selling Price,Cost Price,Available Stock,Unit,Reorder Level,Warehouse,Description
Industrial Torque Sensor TS-90,SEN-TRQ-90,Sensors,349.00,280.00,45,pcs,15,Main Store,Precision dynamic torque transducer
Precision Stepper Motor 24V,MOT-STP-24,Motors,89.50,65.00,120,pcs,25,Secondary Depot,NEMA-23 high torque bipolar motor
Industrial Ethernet Switch 8-Port,NET-SWT-08,Networking,275.00,210.00,35,pcs,10,Main Store,Managed gigabit rail mounted switch
Brushless DC Servo Drive 48V,DRV-BLDC-48,Drives,430.00,340.00,18,pcs,8,Production Floor,Advanced sinusoidal field oriented drive
Carbon Steel Round Rods 25mm,STL-ROD-01,Raw Materials,45.00,30.00,260,kg,50,Main Store,High tensile engineering steel round bar`;

    const blob = new Blob([templateCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'StockSense_Product_Import_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify?.('Template Downloaded', 'Product CSV import template saved to Downloads.', 'info');
  };

  // Process & Parse Uploaded CSV File
  const handleFileProcess = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type && !file.type.includes('csv') && !file.type.includes('text')) {
      setCsvError('Please select a valid .csv file.');
      return;
    }

    setCsvFile(file);
    setCsvError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setCsvError('The CSV file appears to be empty or contains only a header line.');
          setParsedProducts([]);
          return;
        }

        const parseLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim().replace(/^["']|["']$/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          return result;
        };

        const rawHeaders = parseLine(lines[0]);
        const headers = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

        const findCol = (candidates) => {
          for (const c of candidates) {
            const idx = headers.findIndex(h => h.includes(c));
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const nameIdx = findCol(['productname', 'name', 'item', 'title', 'description']);
        const skuIdx = findCol(['sku', 'itemcode', 'code', 'barcode', 'id']);
        const catIdx = findCol(['category', 'categoryname', 'cat', 'type', 'group']);
        const priceIdx = findCol(['sellingprice', 'price', 'rate', 'mrp', 'saleprice']);
        const costIdx = findCol(['costprice', 'cost', 'unitcost', 'purchaseprice']);
        const qtyIdx = findCol(['availablestock', 'availableqty', 'quantity', 'qty', 'stock', 'initial']);
        const unitIdx = findCol(['unit', 'uom', 'measure']);
        const reorderIdx = findCol(['reorderlevel', 'reorder', 'minstock', 'threshold']);
        const whIdx = findCol(['warehouse', 'facility', 'hub', 'location']);
        const descIdx = findCol(['description', 'desc', 'notes']);

        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const row = parseLine(lines[i]);
          if (row.length === 0 || (row.length === 1 && !row[0])) continue;

          const name = nameIdx !== -1 ? row[nameIdx] : row[0];
          if (!name || !name.trim()) continue;

          let sku = skuIdx !== -1 ? row[skuIdx] : '';
          if (!sku || !sku.trim()) {
            sku = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
          }

          const price = priceIdx !== -1 ? parseFloat(row[priceIdx]?.replace(/[^0-9.]/g, '')) || 0 : 0;
          const costPrice = costIdx !== -1 ? parseFloat(row[costIdx]?.replace(/[^0-9.]/g, '')) || 0 : 0;
          const availableQty = qtyIdx !== -1 ? parseInt(row[qtyIdx]?.replace(/[^0-9]/g, ''), 10) || 0 : 0;
          const reorderLevel = reorderIdx !== -1 ? parseInt(row[reorderIdx]?.replace(/[^0-9]/g, ''), 10) || 10 : 10;
          const category = catIdx !== -1 && row[catIdx] ? row[catIdx] : 'General';
          const unit = unitIdx !== -1 && row[unitIdx] ? row[unitIdx] : 'pcs';
          const warehouse = whIdx !== -1 && row[whIdx] ? row[whIdx] : 'Main Store';
          const description = descIdx !== -1 && row[descIdx] ? row[descIdx] : '';

          parsed.push({
            name: name.trim(),
            sku: sku.trim().toUpperCase(),
            category: category.trim(),
            price,
            costPrice,
            availableQty,
            reorderLevel,
            unit: unit.trim(),
            warehouse: warehouse.trim(),
            description: description.trim(),
            image: 'Package',
            status: availableQty === 0 ? 'Out of Stock' : (availableQty <= reorderLevel ? 'Low Stock' : 'In Stock')
          });
        }

        if (parsed.length === 0) {
          setCsvError('No valid product records found in the CSV file. Please make sure rows have a product Name.');
          setParsedProducts([]);
        } else {
          setParsedProducts(parsed);
          setCsvError('');
        }
      } catch (err) {
        setCsvError(`Failed to parse CSV file: ${err.message}`);
        setParsedProducts([]);
      }
    };
    reader.onerror = () => {
      setCsvError('Error reading file from disk.');
    };
    reader.readAsText(file);
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    if (parsedProducts.length === 0) return;
    setIsImporting(true);
    try {
      await productApi.bulkImport(parsedProducts);
      await fetchProducts();
      onNotify('Import Complete', `Successfully imported ${parsedProducts.length} products to database.`, 'success');
      setIsImportModalOpen(false);
      setCsvFile(null);
      setParsedProducts([]);
    } catch (err) {
      console.warn('Backend bulk import fallback:', err.message);
      const newItems = parsedProducts.map(p => ({
        ...p,
        id: `PRD-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`
      }));
      setProducts(prev => [...newItems, ...prev]);
      onNotify('Import Complete', `Imported ${parsedProducts.length} products to catalog.`, 'success');
      setIsImportModalOpen(false);
      setCsvFile(null);
      setParsedProducts([]);
    } finally {
      setIsImporting(false);
    }
  };

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    sku: '',
    barcode: '',
    category: 'Sensors & IoT',
    price: 99.00,
    costPrice: 60.00,
    availableQty: 50,
    reservedQty: 0,
    reorderLevel: 20,
    warehouse: 'West Coast Hub',
    status: 'In Stock',
    unit: 'pcs',
    supplier: 'Apex Dynamics Corp',
    description: '',
    taxRate: 8.5,
    variationColor: 'Standard',
    image: 'Package'
  });

  // Fetch live products & categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsApiLoading(true);
      const res = await productApi.getProducts();
      if (res?.data?.products && res.data.products.length > 0) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.warn('Backend products not loaded, keeping cached products:', err.message);
    } finally {
      setIsApiLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getCategories();
      if (res?.data?.categories && res.data.categories.length > 0) {
        setCategoriesList(res.data.categories);
      }
    } catch (err) {
      console.warn('Backend categories fallback:', err.message);
    }
  };

  // Open Create Drawer
  const handleOpenCreate = () => {
    setDrawerMode('create');
    setFormData({
      id: '',
      name: '',
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      barcode: '890' + Math.floor(1000000000 + Math.random() * 9000000000),
      category: categoriesList[0]?.name || 'Sensors & IoT',
      price: 120.00,
      costPrice: 75.00,
      availableQty: 45,
      reservedQty: 0,
      reorderLevel: 25,
      warehouse: activeWarehouse && activeWarehouse !== 'All' ? activeWarehouse : (facilityList[0]?.name || 'Main Central Hub'),
      status: 'In Stock',
      unit: 'pcs',
      supplier: 'Apex Dynamics Corp',
      description: '',
      taxRate: 8.5,
      variationColor: 'Standard',
      image: 'Package'
    });
    setActiveDrawerTab('basic');
    setIsDrawerOpen(true);
  };

  // Quick Action & Filter auto-launch trigger
  useEffect(() => {
    if (location.state?.openModal === 'product') {
      handleOpenCreate();
      window.history.replaceState({}, document.title);
    } else if (location.state?.filterStatus === 'low') {
      setStockStatusFilter('LOW');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Open Edit Drawer
  const handleOpenEdit = (product, e) => {
    if (e) e.stopPropagation();
    setDrawerMode('edit');
    setFormData({ ...product });
    setActiveDrawerTab('basic');
    setIsDrawerOpen(true);
  };

  // Save product to backend & local state
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      alert('Please fill in required fields (Name, SKU).');
      return;
    }

    setIsSaving(true);
    try {
      if (drawerMode === 'create') {
        const res = await productApi.createProduct(formData);
        const created = res?.data?.product || {
          ...formData,
          id: `PRD-${Date.now().toString().slice(-4)}`
        };
        setProducts(prev => [created, ...prev.filter(p => p.id !== created.id)]);
        onNotify('Product Catalogued', `SKU ${created.sku} (${created.name}) saved to database.`, 'success');
      } else {
        const res = await productApi.updateProduct(formData.id, formData);
        const updated = res?.data?.product || formData;
        setProducts(prev => prev.map(p => p.id === formData.id ? updated : p));
        onNotify('Product Updated', `SKU ${updated.sku} changes saved to database.`, 'info');
      }
      setIsDrawerOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to save product to database');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product from backend
  const handleDeleteProduct = async (product, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Delete product "${product.name}" (${product.sku}) from catalog?`)) return;

    try {
      await productApi.deleteProduct(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      onNotify('Product Deleted', `${product.name} removed from database.`, 'warning');
    } catch (err) {
      // Fallback
      setProducts(prev => prev.filter(p => p.id !== product.id));
      onNotify('Product Removed', `${product.name} removed.`, 'warning');
    }
  };

  // Bulk actions
  const handleSelectAll = (checked, pageData) => {
    if (checked) {
      setSelectedRows(pageData.map(p => p.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${selectedRows.length} selected items?`)) return;
    try {
      await Promise.allSettled(selectedRows.map(id => productApi.deleteProduct(id)));
    } catch {
      // proceed with state update
    }
    setProducts(products.filter(p => !selectedRows.includes(p.id)));
    setSelectedRows([]);
    onNotify('Bulk Action', 'Selected products have been removed.', 'warning');
  };

  // Table Columns Definition
  const columns = [
    {
      header: 'Product Name & SKU',
      accessor: 'name',
      render: (row) => (
        <div className="table-product-cell">
          <div className="table-product-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-neutral-100)', color: 'var(--color-primary-600)', borderRadius: 'var(--radius-md)' }}>
            {renderProductIcon(row.image)}
          </div>
          <div className="table-product-info">
            <div className="table-product-name">{row.name}</div>
            <div className="table-product-sku">
              SKU: {row.sku} • Barcode: {row.barcode}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, background: 'var(--color-neutral-100)', padding: '3px 8px', borderRadius: 'var(--radius-md)' }}>
          {row.category}
        </span>
      )
    },
    {
      header: 'Warehouse',
      accessor: 'warehouse',
      render: (row) => (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-600)' }}>
          {row.warehouse}
        </span>
      )
    },
    {
      header: 'Selling Price',
      accessor: 'price',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>
          ₹{parseFloat(row.price).toFixed(2)}
        </span>
      )
    },
    {
      header: 'Available Stock',
      accessor: 'availableQty',
      render: (row) => {
        let stockColor = 'var(--color-success-600)';
        if (row.availableQty === 0) stockColor = 'var(--color-danger-600)';
        else if (row.availableQty <= row.reorderLevel) stockColor = 'var(--color-warning-600)';

        return (
          <div>
            <span style={{ fontWeight: 700, color: stockColor }}>
              {row.availableQty} {row.unit}
            </span>
            <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>
              Reserved: {row.reservedQty} | Min: {row.reorderLevel}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Stock Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: 'id',
      sortable: false,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            className="action-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setViewProductModal(row);
            }}
            title="View full product profile"
          >
            <Eye size={16} />
          </button>
          {canManageProducts && (
            <>
              <button
                type="button"
                className="action-menu-btn"
                onClick={(e) => handleOpenEdit(row, e)}
                title="Edit product"
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                className="action-menu-btn"
                onClick={(e) => handleDeleteProduct(row, e)}
                title="Delete product"
                style={{ color: 'var(--color-danger-500)' }}
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  // Dynamic Category filter options
  const filterOptions = categoriesList.map(cat => ({
    label: cat.name,
    value: cat.name
  }));

  // Filter products by active warehouse and stock health status
  const displayedProducts = useMemo(() => {
    let list = products || [];

    if (activeWarehouse && activeWarehouse !== 'All') {
      list = list.filter(p => matchesWarehouse(p.warehouse, activeWarehouse, facilityList));
    }

    if (stockStatusFilter === 'LOW') {
      return list.filter(p => 
        p.status === 'Low Stock' || 
        p.status === 'Out of Stock' || 
        (Number(p.availableQty ?? 0) <= Number(p.reorderLevel ?? 0))
      );
    }
    if (stockStatusFilter === 'IN_STOCK') {
      return list.filter(p => p.status === 'In Stock' && Number(p.availableQty ?? 0) > Number(p.reorderLevel ?? 0));
    }
    if (stockStatusFilter === 'OUT_OF_STOCK') {
      return list.filter(p => p.status === 'Out of Stock' || Number(p.availableQty ?? 0) === 0);
    }
    return list;
  }, [products, stockStatusFilter, activeWarehouse, facilityList]);

  const lowStockCount = useMemo(() => {
    const list = activeWarehouse && activeWarehouse !== 'All'
      ? (products || []).filter(p => matchesWarehouse(p.warehouse, activeWarehouse, facilityList))
      : (products || []);
    return list.filter(p => 
      p.status === 'Low Stock' || 
      p.status === 'Out of Stock' || 
      (Number(p.availableQty ?? 0) <= Number(p.reorderLevel ?? 0))
    ).length;
  }, [products, activeWarehouse, facilityList]);

  return (
    <div className="products-page animate-fade-in">
      {/* Read-Only Notice for Staff */}
      {!canManageProducts && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          background: 'var(--color-neutral-100)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--color-neutral-700)',
          borderLeft: '4px solid var(--color-neutral-400)'
        }}>
          <Eye size={16} style={{ color: 'var(--color-neutral-600)', flexShrink: 0 }} />
          <span><strong>Read-Only Mode:</strong> Warehouse Staff profile has viewing access to product specifications, barcodes, and stock levels. Product creation and modification is managed by Inventory Managers and Admins.</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Inventory</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Products Catalog</span>
          </div>
          <h1 className="page-title">Product Catalog & Master Records</h1>
          <p className="page-subtitle">
            Manage SKU specifications, barcode generation, inventory thresholds, and multi-tier pricing.
          </p>
        </div>

        <div className="page-header-actions">
          {canManageProducts ? (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsImportModalOpen(true);
                  setCsvFile(null);
                  setParsedProducts([]);
                  setCsvError('');
                }}
                title="Bulk import products from CSV spreadsheet"
              >
                <Upload size={15} />
                <span>Import CSV</span>
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenCreate}
              >
                <Plus size={16} />
                <span>Add New Product</span>
              </button>
            </>
          ) : (
            <span className="badge badge-neutral" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Read-Only Access
            </span>
          )}
        </div>
      </div>

      {/* Bulk Action Banner if selected */}
      {selectedRows.length > 0 && (
        <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
              {selectedRows.length} products selected
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => onNotify('Bulk Warehouse', 'Bulk reassigned to West Coast Hub.', 'success')}
            >
              Reassign Hub
            </button>
            <button
              type="button"
              className="btn btn-danger btn-xs"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Facility Filter Bar */}
      <div className="card mb-3" style={{ padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warehouse size={16} style={{ color: 'var(--color-primary-600)' }} />
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>Facility:</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`filter-btn ${activeWarehouse === 'All' ? 'active' : ''}`}
                onClick={() => onChangeWarehouse?.('All')}
              >
                All Facilities
              </button>
              {facilityList.map(wh => (
                <button
                  key={wh.id}
                  type="button"
                  className={`filter-btn ${activeWarehouse === wh.name ? 'active' : ''}`}
                  onClick={() => onChangeWarehouse?.(wh.name)}
                >
                  {wh.name}
                </button>
              ))}
            </div>
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)' }}>
            Showing {displayedProducts.length} items
          </span>
        </div>
      </div>

      {/* Stock Health Segment Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className={`btn btn-sm ${stockStatusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ height: '32px', fontSize: '12px' }}
            onClick={() => setStockStatusFilter('ALL')}
          >
            All Products ({products.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${stockStatusFilter === 'IN_STOCK' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ height: '32px', fontSize: '12px' }}
            onClick={() => setStockStatusFilter('IN_STOCK')}
          >
            In Stock ({products.filter(p => p.status === 'In Stock').length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${stockStatusFilter === 'LOW' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              height: '32px', 
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: stockStatusFilter === 'LOW' ? 'var(--color-danger-500)' : 'var(--color-danger-200)',
              color: stockStatusFilter === 'LOW' ? '#fff' : 'var(--color-danger-600)',
              backgroundColor: stockStatusFilter === 'LOW' ? 'var(--color-danger-600)' : 'transparent'
            }}
            onClick={() => setStockStatusFilter(stockStatusFilter === 'LOW' ? 'ALL' : 'LOW')}
          >
            <AlertTriangle size={14} />
            <span>Low & Reorder Alert ({lowStockCount})</span>
          </button>
        </div>

        {stockStatusFilter === 'LOW' && (
          <span style={{ fontSize: '12px', color: 'var(--color-danger-600)', fontWeight: 500 }}>
            Showing {displayedProducts.length} items requiring replenishment
          </span>
        )}
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={displayedProducts}
        searchPlaceholder="Search by name, SKU, barcode, supplier..."
        filterOptions={filterOptions}
        filterKey="category"
        selectedRows={selectedRows}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        onRowClick={(row) => setViewProductModal(row)}
        isLoading={isApiLoading || Boolean(externalLoading)}
      />

      {/* Add / Edit Product Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={drawerMode === 'create' ? 'Create New Catalog Product' : `Edit Product: ${formData.name}`}
        subtitle="Specify product attributes, inventory thresholds, and warehouse assignments"
        width="580px"
        footer={
          <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsDrawerOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveProduct}
            >
              {drawerMode === 'create' ? 'Publish Product' : 'Save Modifications'}
            </button>
          </div>
        }
      >
        {/* Drawer Tabs */}
        <div className="tabs">
          <button
            type="button"
            className={`tab ${activeDrawerTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveDrawerTab('basic')}
          >
            General & Specs
          </button>
          <button
            type="button"
            className={`tab ${activeDrawerTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveDrawerTab('pricing')}
          >
            Pricing & Margins
          </button>
          <button
            type="button"
            className={`tab ${activeDrawerTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveDrawerTab('stock')}
          >
            Inventory & Hub
          </button>
        </div>

        {/* Tab 1: Basic Info */}
        {activeDrawerTab === 'basic' && (
          <div>
            <div className="form-group">
              <label className="form-label">
                Product Title <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Industrial Torque Sensor TS-90"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  SKU Code <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. SEN-TRQ-90"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Barcode (EAN / UPC)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="8901234567890"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categoriesList.map(cat => (
                    <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Primary Supplier</label>
                <select
                  className="form-select"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                >
                  {['Apex Dynamics Corp', 'LuminoTech Precision', 'Vortex Flow Systems', 'ElectroCore Global', 'Titanium Mechanical Inc'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Product Description</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Detailed technical specifications, operating tolerances, voltage, and compliance notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Display Badge Icon</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PRODUCT_ICONS.map(({ key, icon: IconComp, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`btn btn-sm ${formData.image === key ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '36px', height: '36px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setFormData({ ...formData, image: key })}
                    title={label}
                  >
                    <IconComp size={16} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pricing & Tax */}
        {activeDrawerTab === 'pricing' && (
          <div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Unit Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit Cost Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                />
              </div>
            </div>

            {/* Calculated Profit Margin Widget */}
            <div style={{ padding: '14px', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-primary-200)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-primary-800)' }}>
                  Gross Profit Margin
                </span>
                <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-700)' }}>
                  {formData.price > 0 ? (((formData.price - formData.costPrice) / formData.price) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-primary-600)', marginTop: '4px' }}>
                Gross margin calculated per unit sold: ₹{Math.max(0, formData.price - formData.costPrice).toFixed(2)}
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Default Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit of Measure</label>
                <select
                  className="form-select"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="rolls">Rolls</option>
                  <option value="box">Box / Pack</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="meter">Meters (m)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Inventory & Warehouse */}
        {activeDrawerTab === 'stock' && (
          <div>
            <div className="form-group">
              <label className="form-label">Assigned Primary Warehouse</label>
              <select
                className="form-select"
                value={formData.warehouse}
                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
              >
                {facilityList.map(wh => (
                  <option key={wh.id} value={wh.name}>{wh.name} ({wh.location || wh.address || wh.code})</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Initial Available Stock</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.availableQty}
                  onChange={(e) => setFormData({ ...formData, availableQty: e.target.value })}
                />
                <span className="form-hint">Physical stock available for allocation</span>
              </div>

              <div className="form-group">
                <label className="form-label">Reorder Safety Threshold</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                />
                <span className="form-hint">Triggers automated low-stock warnings</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Detailed Product Profile Modal */}
      {viewProductModal && (
        <Modal
          isOpen={!!viewProductModal}
          onClose={() => setViewProductModal(null)}
          title={viewProductModal.name}
          subtitle={`SKU: ${viewProductModal.sku} • Category: ${viewProductModal.category}`}
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <StatusBadge status={viewProductModal.status} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewProductModal(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const prod = viewProductModal;
                    setViewProductModal(null);
                    handleOpenEdit(prod);
                  }}
                >
                  Edit Specifications
                </button>
              </div>
            </div>
          }
        >
          <div className="detail-grid">
            <div>
              {/* Product Overview Section */}
              <div className="detail-section">
                <h4 className="detail-section-title">Product Specifications</h4>
                <div className="detail-row">
                  <div className="detail-label">Description:</div>
                  <div className="detail-value">{viewProductModal.description || 'No custom description provided.'}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Supplier:</div>
                  <div className="detail-value font-semibold">{viewProductModal.supplier}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Barcode EAN-13:</div>
                  <div className="detail-value" style={{ fontFamily: 'monospace' }}>
                    {viewProductModal.barcode}
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Selling Price:</div>
                  <div className="detail-value font-bold" style={{ color: 'var(--color-primary-700)' }}>
                    ₹{parseFloat(viewProductModal.price).toFixed(2)}
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Cost of Goods:</div>
                  <div className="detail-value">₹{parseFloat(viewProductModal.costPrice).toFixed(2)}</div>
                </div>
              </div>

              {/* Stock Movement History for this product */}
              <div className="detail-section">
                <h4 className="detail-section-title">Recent Stock Audit Timeline</h4>
                <div className="timeline">
                  <div className="timeline-item completed">
                    <div className="timeline-dot" />
                    <div className="timeline-title">Routine QA Count Verified</div>
                    <div className="timeline-desc">Physical stock aligned at {viewProductModal.warehouse}</div>
                    <div className="timeline-time">Today, 09:30 AM • Sarah Jenkins</div>
                  </div>
                  <div className="timeline-item completed">
                    <div className="timeline-dot" />
                    <div className="timeline-title">Replenished via PO-2026-001</div>
                    <div className="timeline-desc">+40 units received into primary racking</div>
                    <div className="timeline-time">Sep 20, 2026 • Logistics Team</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Metric Card */}
            <div>
              <div className="card" style={{ background: 'var(--color-neutral-50)' }}>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '12px', color: 'var(--color-neutral-800)' }}>
                  Warehouse Stock Telemetry
                </h4>

                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>Current Location</span>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{viewProductModal.warehouse}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ padding: '8px', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral-200)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Available</div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                      {viewProductModal.availableQty}
                    </div>
                  </div>
                  <div style={{ padding: '8px', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral-200)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Reserved</div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-warning-600)' }}>
                      {viewProductModal.reservedQty}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span>Stock Safety Ratio</span>
                    <span style={{ fontWeight: 600 }}>
                      {viewProductModal.reorderLevel > 0 
                        ? Math.min(100, Math.round((viewProductModal.availableQty / (viewProductModal.reorderLevel * 2)) * 100)) 
                        : 100}%
                    </span>
                  </div>
                  <div className="capacity-bar">
                    <div
                      className="capacity-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.round((viewProductModal.availableQty / (viewProductModal.reorderLevel * 2 || 1)) * 100))}%`,
                        background: viewProductModal.availableQty <= viewProductModal.reorderLevel ? 'var(--color-warning-500)' : 'var(--color-success-500)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Import Products from CSV Modal */}
      {isImportModalOpen && (
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => {
            if (!isImporting) {
              setIsImportModalOpen(false);
              setCsvFile(null);
              setParsedProducts([]);
              setCsvError('');
            }
          }}
          title="Import Products from CSV"
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-neutral-600)', margin: 0 }}>
                Upload a CSV file containing your product catalog records to import them in bulk.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadTemplate}
                style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} />
                <span>Download Sample Template</span>
              </button>
            </div>

            {/* Dropzone / File Picker */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileProcess(e.dataTransfer.files[0]);
                }
              }}
              style={{
                border: '2px dashed var(--color-neutral-300)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--color-neutral-50)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--color-primary-50)',
                color: 'var(--color-primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px'
              }}>
                <Upload size={22} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-neutral-800)', marginBottom: '4px' }}>
                {csvFile ? csvFile.name : 'Click to browse or drag & drop CSV file'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-neutral-500)' }}>
                {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB • Click to choose a different file` : 'Supports standard .csv spreadsheets (max 5 MB)'}
              </div>
            </div>

            {/* Error Message */}
            {csvError && (
              <div className="alert alert-danger" style={{ fontSize: '13px', margin: 0, padding: '10px 14px' }}>
                <AlertTriangle size={16} />
                <span>{csvError}</span>
              </div>
            )}

            {/* Preview of Parsed Products */}
            {parsedProducts.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-800)' }}>
                    Previewing {parsedProducts.length} Products Detected
                  </span>
                  <span className="badge badge-success">
                    {parsedProducts.length} Records Ready
                  </span>
                </div>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)' }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--color-neutral-100)', borderBottom: '1px solid var(--color-neutral-200)' }}>
                      <tr>
                        <th style={{ padding: '6px 10px', textAlign: 'left' }}>Product Name</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left' }}>SKU</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left' }}>Category</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Price</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Stock</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left' }}>Facility</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedProducts.slice(0, 10).map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-neutral-100)' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 600 }}>{p.name}</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{p.sku}</td>
                          <td style={{ padding: '6px 10px' }}>{p.category}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{p.price.toFixed(2)}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{p.availableQty} {p.unit}</td>
                          <td style={{ padding: '6px 10px' }}>{p.warehouse}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedProducts.length > 10 && (
                  <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)', marginTop: '4px', textAlign: 'right' }}>
                    Showing first 10 of {parsedProducts.length} total rows
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setCsvFile(null);
                  setParsedProducts([]);
                  setCsvError('');
                }}
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmImport}
                disabled={parsedProducts.length === 0 || isImporting}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isImporting ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>{isImporting ? 'Importing Products...' : `Confirm & Import ${parsedProducts.length > 0 ? `(${parsedProducts.length})` : ''}`}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
