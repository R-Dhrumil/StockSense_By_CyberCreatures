import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  DollarSign,
  Scale,
  Barcode,
  Bell,
  CheckCircle2,
  Save,
  RotateCcw,
  Sliders,
  Shield
} from 'lucide-react';

export default function Settings({ onNotify }) {
  const [activeTab, setActiveTab] = useState('company');

  // Company Profile State
  const [companyProfile, setCompanyProfile] = useState({
    legalName: 'CyberCreatures Mechatronics Ltd.',
    tradeName: 'StockSense Automation',
    taxId: 'US-EIN-94-8219410',
    email: 'ops@stocksense.io',
    phone: '+1 (510) 844-9000',
    address: '100 Innovation Way, Suite 400, Oakland, CA 94607, USA',
    fiscalYearEnd: 'December 31'
  });

  // Financial & Tax State
  const [financials, setFinancials] = useState({
    currency: 'USD ($)',
    valuationMethod: 'FIFO (First-In, First-Out)',
    defaultTaxRate: 8.5,
    pricesIncludeTax: false,
    roundingPrecision: '2 Decimal Places'
  });

  // Units of Measure
  const [uomList, setUomList] = useState([
    { id: '1', code: 'pcs', name: 'Pieces', type: 'Quantity', baseUnit: 'Yes' },
    { id: '2', code: 'kg', name: 'Kilograms', type: 'Weight', baseUnit: 'Yes' },
    { id: '3', code: 'm', name: 'Meters', type: 'Length', baseUnit: 'Yes' },
    { id: '4', code: 'box', name: 'Standard Carton Box', type: 'Package', baseUnit: 'No' },
    { id: '5', code: 'roll', name: '50m Reel / Roll', type: 'Length', baseUnit: 'No' },
    { id: '6', code: 'L', name: 'Liters', type: 'Volume', baseUnit: 'Yes' }
  ]);

  // Barcode & SKU settings
  const [barcodes, setBarcodes] = useState({
    standard: 'EAN-13 (Standard European/International)',
    skuPrefix: 'SEN-',
    skuAutoGenerate: true,
    barcodePrintSize: 'Label 50x25mm (Thermal)',
    enableScanOnPick: true
  });

  // Notifications & Thresholds
  const [notifications, setNotifications] = useState({
    lowStockEmailAlerts: true,
    outOfStockUrgentSms: true,
    dailyDigestReport: true,
    autoDraftReplenishPo: true,
    safetyStockMultiplier: 1.25
  });

  const handleSaveAll = (e) => {
    e.preventDefault();
    onNotify('Settings Saved', 'System configuration updated successfully.', 'success');
  };

  return (
    <div className="settings-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Administration</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>System Settings</span>
          </div>
          <h1 className="page-title">Enterprise System Configuration</h1>
          <p className="page-subtitle">
            Configure entity profile, valuation cost rules, measurement standards, barcode rules, and automated alerts.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveAll}
          >
            <Save size={16} />
            <span>Save All Preferences</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          Company Profile
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'financial' ? 'active' : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          Currency & Valuation
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'uom' ? 'active' : ''}`}
          onClick={() => setActiveTab('uom')}
        >
          Units of Measure (UoM)
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'barcode' ? 'active' : ''}`}
          onClick={() => setActiveTab('barcode')}
        >
          Barcode & SKU Generation
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Notifications & Thresholds
        </button>
      </div>

      {/* TAB 1: Company Profile */}
      {activeTab === 'company' && (
        <div className="card">
          <h3 className="settings-section-title">Legal Entity & Primary Headquarters</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Corporate Legal Name</label>
              <input
                type="text"
                className="form-input"
                value={companyProfile.legalName}
                onChange={(e) => setCompanyProfile({ ...companyProfile, legalName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Operating Brand / Trading Name</label>
              <input
                type="text"
                className="form-input"
                value={companyProfile.tradeName}
                onChange={(e) => setCompanyProfile({ ...companyProfile, tradeName: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tax ID / VAT Registration</label>
              <input
                type="text"
                className="form-input"
                value={companyProfile.taxId}
                onChange={(e) => setCompanyProfile({ ...companyProfile, taxId: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fiscal Year End</label>
              <select
                className="form-select"
                value={companyProfile.fiscalYearEnd}
                onChange={(e) => setCompanyProfile({ ...companyProfile, fiscalYearEnd: e.target.value })}
              >
                <option value="December 31">December 31 (Calendar Year)</option>
                <option value="March 31">March 31 (UK / Commonwealth Standard)</option>
                <option value="June 30">June 30 (Mid-Year)</option>
                <option value="September 30">September 30 (US Federal)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Official Headquarters Address</label>
            <input
              type="text"
              className="form-input"
              value={companyProfile.address}
              onChange={(e) => setCompanyProfile({ ...companyProfile, address: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Corporate Invoicing Email</label>
              <input
                type="email"
                className="form-input"
                value={companyProfile.email}
                onChange={(e) => setCompanyProfile({ ...companyProfile, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Operations Hotline Phone</label>
              <input
                type="text"
                className="form-input"
                value={companyProfile.phone}
                onChange={(e) => setCompanyProfile({ ...companyProfile, phone: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Financial & Valuation */}
      {activeTab === 'financial' && (
        <div className="card">
          <h3 className="settings-section-title">Valuation Standards & Currency Rules</h3>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Inventory Valuation Methodology</div>
              <div className="settings-row-desc">
                Governs how cost of goods sold (COGS) and closing stock values are computed for tax reporting.
              </div>
            </div>
            <select
              className="form-select"
              style={{ width: '300px' }}
              value={financials.valuationMethod}
              onChange={(e) => setFinancials({ ...financials, valuationMethod: e.target.value })}
            >
              <option value="FIFO (First-In, First-Out)">FIFO (First-In, First-Out) [GAAP / IFRS]</option>
              <option value="Weighted Average Cost (WAC)">Weighted Average Cost (WAC)</option>
              <option value="LIFO (Last-In, First-Out)">LIFO (Last-In, First-Out) [US GAAP Only]</option>
            </select>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Base Reporting Currency</div>
              <div className="settings-row-desc">
                Primary functional currency for all ledger balances and consolidated reports.
              </div>
            </div>
            <select
              className="form-select"
              style={{ width: '220px' }}
              value={financials.currency}
              onChange={(e) => setFinancials({ ...financials, currency: e.target.value })}
            >
              <option value="USD ($)">USD — United States Dollar ($)</option>
              <option value="INR (₹)">INR — Indian Rupee (₹)</option>
              <option value="EUR (€)">EUR — Eurozone (€)</option>
              <option value="GBP (£)">GBP — British Pound (£)</option>
              <option value="CAD ($)">CAD — Canadian Dollar ($)</option>
            </select>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Standard Sales Tax Rate (%)</div>
              <div className="settings-row-desc">
                Applied to default commercial sales orders unless customer exemption certificate is recorded.
              </div>
            </div>
            <div style={{ width: '140px' }}>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={financials.defaultTaxRate}
                onChange={(e) => setFinancials({ ...financials, defaultTaxRate: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Units of Measure */}
      {activeTab === 'uom' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Authorized Units of Measure</h3>
              <p className="card-subtitle">Defined standard packaging and discrete item measurements</p>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Full Name</th>
                <th>Classification</th>
                <th>Base Metric</th>
              </tr>
            </thead>
            <tbody>
              {uomList.map((unit) => (
                <tr key={unit.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{unit.code}</td>
                  <td className="font-semibold">{unit.name}</td>
                  <td>{unit.type}</td>
                  <td>
                    <span className={`badge ${unit.baseUnit === 'Yes' ? 'badge-success' : 'badge-neutral'}`}>
                      {unit.baseUnit === 'Yes' ? 'Primary Standard' : 'Derived Pack'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: Barcode & SKU */}
      {activeTab === 'barcode' && (
        <div className="card">
          <h3 className="settings-section-title">Optical Barcode & SKU Auto-Increment Rules</h3>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Default Barcode Symbology</div>
              <div className="settings-row-desc">
                Standard format used when generating scanner labels for warehouse shelving and packaging.
              </div>
            </div>
            <select
              className="form-select"
              style={{ width: '280px' }}
              value={barcodes.standard}
              onChange={(e) => setBarcodes({ ...barcodes, standard: e.target.value })}
            >
              <option value="EAN-13 (Standard European/International)">EAN-13 (International Retail)</option>
              <option value="Code-128 (High-Density Industrial)">Code-128 (High-Density Industrial)</option>
              <option value="QR Code (ISO/IEC 18004)">2D QR Matrix Code</option>
              <option value="UPC-A (North American Standard)">UPC-A (North American Standard)</option>
            </select>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Automatic SKU Counter Prefix</div>
              <div className="settings-row-desc">Default prefix appended when generating new item records.</div>
            </div>
            <input
              type="text"
              className="form-input"
              style={{ width: '160px' }}
              value={barcodes.skuPrefix}
              onChange={(e) => setBarcodes({ ...barcodes, skuPrefix: e.target.value })}
            />
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Mandatory Barcode Verification on Pick</div>
              <div className="settings-row-desc">
                Forces warehouse mobile terminals to scan each SKU barcode before clearing dispatch order.
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={barcodes.enableScanOnPick}
                onChange={(e) => setBarcodes({ ...barcodes, enableScanOnPick: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      )}

      {/* TAB 5: Notifications & Automation */}
      {activeTab === 'alerts' && (
        <div className="card">
          <h3 className="settings-section-title">Automated Telemetry & Replenishment Triggers</h3>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Instant Low Stock Alert Broadcasts</div>
              <div className="settings-row-desc">
                Send real-time webhook push & email when an SKU dips below its designated safety threshold.
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={notifications.lowStockEmailAlerts}
                onChange={(e) => setNotifications({ ...notifications, lowStockEmailAlerts: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Automated Draft Replenishment PO</div>
              <div className="settings-row-desc">
                When stock reaches 0, autonomously stage a Draft PO to the registered primary supplier.
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={notifications.autoDraftReplenishPo}
                onChange={(e) => setNotifications({ ...notifications, autoDraftReplenishPo: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Daily 08:00 AM Warehouse Executive Digest</div>
              <div className="settings-row-desc">
                Deliver daily summary email of pending inbound POs, unpicked sales orders, and stockout risks.
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={notifications.dailyDigestReport}
                onChange={(e) => setNotifications({ ...notifications, dailyDigestReport: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
