import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  SlidersHorizontal,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { downloadPdfReport, downloadExcelReport } from '../../utils/exportUtils';

export default function DataTable({
  columns = [],
  data = [],
  searchPlaceholder = 'Search records...',
  filterOptions = [],
  filterKey = '',
  onRowClick,
  actionButton,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  isLoading = false,
  emptyMessage = 'No records found matching your criteria.'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filtered & Sorted Data
  const processedData = useMemo(() => {
    let result = [...data];

    // Filter by search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(item => {
        return Object.values(item).some(val => 
          String(val).toLowerCase().includes(q)
        );
      });
    }

    // Filter by dropdown/tab filter
    if (activeFilter !== 'ALL' && filterKey) {
      result = result.filter(item => {
        const itemVal = String(item[filterKey] || '').toLowerCase();
        return itemVal === activeFilter.toLowerCase();
      });
    }

    // Sorting
    if (sortField) {
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortOrder === 'asc' 
          ? strA.localeCompare(strB) 
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [data, searchTerm, activeFilter, filterKey, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  const handleSort = (field) => {
    if (!field) return;
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExportPDF = async () => {
    if (!processedData.length) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const exportCols = columns.filter(c => c.header && c.accessor).map(c => ({
      header: c.header,
      accessor: c.accessor
    }));

    await downloadPdfReport({
      title: 'StockSense Inventory Data Report',
      subtitle: `Filtered Records: ${processedData.length} entries | Generated: ${new Date().toLocaleDateString()}`,
      columns: exportCols,
      data: processedData,
      filename: `StockSense_Export_${dateStr}.pdf`
    });
  };

  const handleExportExcel = async () => {
    if (!processedData.length) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const exportCols = columns.filter(c => c.header && c.accessor).map(c => ({
      header: c.header,
      accessor: c.accessor
    }));

    await downloadExcelReport({
      title: 'StockSense Inventory Data Report',
      sheetName: 'Exported Records',
      columns: exportCols,
      data: processedData,
      filename: `StockSense_Export_${dateStr}.xlsx`
    });
  };

  return (
    <div className="table-container">
      {/* Table Toolbar */}
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          {/* Search box */}
          <div className="table-search">
            <Search size={16} className="table-search-icon" />
            <input
              type="text"
              className="table-search-input"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Optional Filter Pills */}
          {filterOptions.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`filter-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => { setActiveFilter('ALL'); setCurrentPage(1); }}
              >
                All
              </button>
              {filterOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`filter-btn ${activeFilter === opt.value ? 'active' : ''}`}
                  onClick={() => { setActiveFilter(opt.value); setCurrentPage(1); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="table-toolbar-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportPDF}
              title="Download filtered records as PDF"
            >
              <FileText size={14} />
              <span>Export PDF</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportExcel}
              title="Download filtered records as Excel (.xlsx)"
            >
              <FileSpreadsheet size={14} />
              <span>Export Excel</span>
            </button>
          </div>
          {actionButton}
        </div>
      </div>

      {/* Main Table Content */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {onSelectAll && (
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    className="table-checkbox"
                    checked={paginatedData.length > 0 && selectedRows.length === paginatedData.length}
                    onChange={(e) => onSelectAll(e.target.checked, paginatedData)}
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={col.accessor || idx}
                  className={sortField === col.accessor ? 'sorted' : ''}
                  onClick={() => col.sortable !== false && handleSort(col.accessor)}
                  style={{ cursor: col.sortable !== false ? 'pointer' : 'default', width: col.width }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <span className="sort-icon">
                        {sortField === col.accessor && sortOrder === 'desc' ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronUp size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {onSelectRow && <td><div className="skeleton" style={{ width: 18, height: 18 }} /></td>}
                  {columns.map((_, colIdx) => (
                    <td key={colIdx}>
                      <div className="skeleton skeleton-text" style={{ width: `${60 + (colIdx % 3) * 15}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectAll ? 1 : 0)} style={{ textAlign: 'center', padding: '48px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--color-neutral-400)' }}>
                    <SlidersHorizontal size={36} strokeWidth={1.5} />
                    <div style={{ fontWeight: 600, color: 'var(--color-neutral-700)', fontSize: 'var(--font-size-md)' }}>
                      No Records Found
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', maxWidth: '340px' }}>
                      {emptyMessage}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => {
                const isSelected = selectedRows.includes(row.id);
                return (
                  <tr
                    key={row.id || rowIdx}
                    onClick={() => onRowClick && onRowClick(row)}
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {onSelectRow && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectRow(row.id, e.target.checked)}
                          aria-label={`Select row ${row.id}`}
                        />
                      </td>
                    )}
                    {columns.map((col, cIdx) => (
                      <td key={col.accessor || cIdx} data-label={col.header}>
                        {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="table-footer">
        <div>
          Showing <span className="font-semibold">{processedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
          <span className="font-semibold">{Math.min(currentPage * pageSize, processedData.length)}</span> of{' '}
          <span className="font-semibold">{processedData.length}</span> results
        </div>

        <div className="table-pagination">
          <button
            type="button"
            className="table-page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            aria-label="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            // Only show reasonable number of page numbers
            if (totalPages > 6 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
              return null;
            }
            return (
              <button
                key={pageNum}
                type="button"
                className={`table-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            type="button"
            className="table-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            aria-label="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
