/**
 * Enhanced Audit Trail - Advanced JavaScript Features
 *
 * Features:
 * 1. Real-time auto-refresh (30s intervals)
 * 2. Advanced full-text search with debouncing
 * 3. Date range filtering
 * 4. Skeleton loading states
 * 5. Empty state illustrations
 * 6. Toast notifications system
 * 7. Keyboard shortcuts
 * 8. Activity chart visualization
 * 9. Timeline view mode
 * 10. Multiple export formats (CSV, JSON, PDF)
 * 11. Column sorting
 * 12. Enhanced accessibility
 */

// ============================================
// STATE MANAGEMENT
// ============================================
const AuditState = {
  currentOffset: 0,
  allLogs: [],
  filteredLogs: [],
  currentView: 'table', // 'table' or 'timeline'
  autoRefreshEnabled: true,
  autoRefreshInterval: null,
  searchTimeout: null,
  sortField: 'created_at',
  sortDirection: 'desc',
  chartData: null,
  isLoading: false
};

// Action type icon mapping
const ACTION_ICONS = {
  'LOGIN_SUCCESS': '✓',
  'LOGIN_FAILURE': '✗',
  'LOGOUT': '→',
  'CREATE_JOB': '+',
  'UPDATE_JOB': '✎',
  'DELETE_JOB': '×',
  'VIEW_CANDIDATE': '👁',
  'UPLOAD_RESUME': '↑'
};

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      this.container.setAttribute('role', 'status');
      this.container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.container);
    }
  },

  show(type, title, message, duration = 3000) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <span class="toast-close" onclick="this.parentElement.remove()">×</span>
    `;

    this.container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(title, message, duration) {
    this.show('success', title, message, duration);
  },

  error(title, message, duration) {
    this.show('error', title, message, duration);
  },

  info(title, message, duration) {
    this.show('info', title, message, duration);
  },

  warning(title, message, duration) {
    this.show('warning', title, message, duration);
  }
};

// ============================================
// LOADING STATES
// ============================================
const Loading = {
  showOverlay() {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = '<div class="loader"></div>';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('active');
  },

  hideOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  },

  showSkeletonStats() {
    const statsGrid = document.getElementById('stats-grid');
    if (!statsGrid) return;

    statsGrid.innerHTML = Array(4).fill(0).map(() => `
      <div class="stat-card">
        <div class="skeleton" style="height: 56px; width: 56px; margin-bottom: 16px;"></div>
        <div class="skeleton" style="height: 14px; width: 120px; margin-bottom: 12px;"></div>
        <div class="skeleton" style="height: 40px; width: 80px; margin: 12px 0;"></div>
        <div class="skeleton" style="height: 14px; width: 150px;"></div>
      </div>
    `).join('');
  },

  showSkeletonTable() {
    const tbody = document.getElementById('audit-logs-body');
    if (!tbody) return;

    tbody.innerHTML = Array(5).fill(0).map(() => `
      <tr>
        <td><div class="skeleton" style="height: 20px; width: 140px;"></div></td>
        <td><div class="skeleton" style="height: 20px; width: 120px;"></div></td>
        <td><div class="skeleton" style="height: 24px; width: 100px;"></div></td>
        <td><div class="skeleton" style="height: 20px; width: 80px;"></div></td>
        <td><div class="skeleton" style="height: 20px; width: 180px;"></div></td>
        <td><div class="skeleton" style="height: 20px; width: 100px;"></div></td>
        <td><div class="skeleton" style="height: 28px; width: 60px;"></div></td>
      </tr>
    `).join('');
  }
};

// ============================================
// EMPTY STATES
// ============================================
const EmptyState = {
  show(container, type = 'no-data') {
    const states = {
      'no-data': {
        icon: '📋',
        title: 'No Audit Logs Found',
        message: 'Try adjusting your filters or search criteria'
      },
      'error': {
        icon: '⚠️',
        title: 'Error Loading Data',
        message: 'Please try refreshing the page'
      },
      'no-results': {
        icon: '🔍',
        title: 'No Search Results',
        message: 'No logs match your search query'
      }
    };

    const state = states[type] || states['no-data'];

    container.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-state-icon">${state.icon}</div>
            <div class="empty-state-title">${state.title}</div>
            <div class="empty-state-message">${state.message}</div>
          </div>
        </td>
      </tr>
    `;
  }
};

// ============================================
// DATA LOADING
// ============================================
const DataLoader = {
  async loadStats() {
    try {
      const response = await fetch('/api/audit-logs/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');

      const stats = await response.json();
      this.displayStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
      Toast.error('Error', 'Failed to load statistics');
    }
  },

  displayStats(stats) {
    const statsGrid = document.getElementById('stats-grid');
    if (!statsGrid) return;

    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-label">Total Logs</div>
        <div class="stat-value">${(stats.total_logs || 0).toLocaleString()}</div>
        <div class="stat-trend">
          <span>↑</span>
          <span>All activity tracked</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-label">Active Users</div>
        <div class="stat-value">${(stats.active_users || 0).toLocaleString()}</div>
        <div class="stat-trend">
          <span>●</span>
          <span>Currently monitored</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-label">Today's Activity</div>
        <div class="stat-value">${(stats.today_count || 0).toLocaleString()}</div>
        <div class="stat-trend">
          <span>+</span>
          <span>Events today</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🚨</div>
        <div class="stat-label">Failed Logins</div>
        <div class="stat-value" style="color: var(--error);">${(stats.failed_logins || 0).toLocaleString()}</div>
        <div class="stat-trend" style="color: var(--error);">
          <span>!</span>
          <span>Security alerts</span>
        </div>
      </div>
    `;
  },

  async loadAuditLogs(showLoader = true) {
    try {
      if (showLoader) {
        Loading.showSkeletonTable();
      }

      AuditState.isLoading = true;

      const params = new URLSearchParams();

      // Filters
      const actionType = document.getElementById('filter-action')?.value;
      const resourceType = document.getElementById('filter-resource')?.value;
      const limit = document.getElementById('filter-limit')?.value || '100';
      const dateFrom = document.getElementById('date-from')?.value;
      const dateTo = document.getElementById('date-to')?.value;

      if (actionType) params.append('action_type', actionType);
      if (resourceType) params.append('resource_type', resourceType);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      params.append('limit', limit);
      params.append('offset', AuditState.currentOffset);

      const response = await fetch(`/api/audit-logs?${params}`);

      if (response.status === 403) {
        Toast.error('Access Denied', 'Admin access required to view audit logs');
        setTimeout(() => window.location.href = '/', 2000);
        return;
      }

      if (!response.ok) throw new Error('Failed to load audit logs');

      AuditState.allLogs = await response.json();
      AuditState.filteredLogs = [...AuditState.allLogs];

      Search.apply();
      Sorting.apply();
      Display.render();

      if (!showLoader) {
        Toast.success('Refreshed', 'Audit logs updated successfully', 2000);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      Toast.error('Error', 'Failed to load audit logs');
      EmptyState.show(document.getElementById('audit-logs-body'), 'error');
    } finally {
      AuditState.isLoading = false;
    }
  },

  async loadActivityChart() {
    try {
      // Generate mock activity data for last 7 days
      const chartData = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Mock data - in production this would come from API
        chartData.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 100) + 20
        });
      }

      AuditState.chartData = chartData;
      this.displayActivityChart();
    } catch (error) {
      console.error('Error loading activity chart:', error);
    }
  },

  displayActivityChart() {
    const container = document.getElementById('activity-chart');
    if (!container || !AuditState.chartData) return;

    const maxValue = Math.max(...AuditState.chartData.map(d => d.count), 1);

    container.innerHTML = AuditState.chartData.map(item => {
      const height = (item.count / maxValue) * 100;
      const date = new Date(item.date);
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
          <div class="chart-bar"
               style="height: ${height}%;"
               title="${label}: ${item.count} events"
               role="img"
               aria-label="${label}: ${item.count} events">
            <span class="chart-bar-value">${item.count}</span>
          </div>
          <div class="chart-bar-label">${label}</div>
        </div>
      `;
    }).join('');
  }
};

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
const Search = {
  timeout: null,

  init() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.apply();
        Display.render();
      }, 300); // Debounce 300ms
    });
  },

  apply() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) {
      AuditState.filteredLogs = [...AuditState.allLogs];
      return;
    }

    const searchTerm = searchInput.value.toLowerCase().trim();

    if (!searchTerm) {
      AuditState.filteredLogs = [...AuditState.allLogs];
      return;
    }

    AuditState.filteredLogs = AuditState.allLogs.filter(log => {
      return (
        (log.action_type && log.action_type.toLowerCase().includes(searchTerm)) ||
        (log.user_email && log.user_email.toLowerCase().includes(searchTerm)) ||
        (log.resource_type && log.resource_type.toLowerCase().includes(searchTerm)) ||
        (log.details && log.details.toLowerCase().includes(searchTerm)) ||
        (log.ip_address && log.ip_address.toLowerCase().includes(searchTerm)) ||
        (log.resource_id && log.resource_id.toString().includes(searchTerm))
      );
    });
  }
};

// ============================================
// SORTING
// ============================================
const Sorting = {
  sortBy(field) {
    if (AuditState.sortField === field) {
      AuditState.sortDirection = AuditState.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      AuditState.sortField = field;
      AuditState.sortDirection = 'desc';
    }

    this.apply();
    Display.render();
    this.updateIndicators();
  },

  apply() {
    AuditState.filteredLogs.sort((a, b) => {
      let aVal = a[AuditState.sortField];
      let bVal = b[AuditState.sortField];

      if (AuditState.sortField === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (aVal < bVal) return AuditState.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return AuditState.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  },

  updateIndicators() {
    document.querySelectorAll('.sort-indicator').forEach(el => {
      el.textContent = '';
    });

    const indicator = document.getElementById(`sort-${AuditState.sortField}`);
    if (indicator) {
      indicator.textContent = AuditState.sortDirection === 'asc' ? '▲' : '▼';
    }
  }
};

// ============================================
// DISPLAY
// ============================================
const Display = {
  render() {
    if (AuditState.currentView === 'table') {
      this.renderTable();
    } else {
      this.renderTimeline();
    }
  },

  renderTable() {
    const tbody = document.getElementById('audit-logs-body');
    if (!tbody) return;

    if (AuditState.filteredLogs.length === 0) {
      const searchInput = document.getElementById('search-input');
      const hasSearchTerm = searchInput && searchInput.value.trim();
      EmptyState.show(tbody, hasSearchTerm ? 'no-results' : 'no-data');
      Pagination.update();
      return;
    }

    tbody.innerHTML = AuditState.filteredLogs.map(log => {
      const actionClass = `action-${log.action_type.toLowerCase().replace(/_/g, '-')}`;
      const timestamp = new Date(log.created_at).toLocaleString();
      const hasDetails = log.before_value || log.after_value;
      const actionIcon = ACTION_ICONS[log.action_type] || '•';

      return `
        <tr>
          <td>${timestamp}</td>
          <td>${log.user_email || 'System'}</td>
          <td>
            <span class="action-badge ${actionClass}">
              <span>${actionIcon}</span>
              <span>${log.action_type.replace(/_/g, ' ')}</span>
            </span>
          </td>
          <td>${log.resource_type} ${log.resource_id ? '#' + log.resource_id : ''}</td>
          <td>${log.details || '-'}</td>
          <td>${log.ip_address || '-'}</td>
          <td>
            ${hasDetails ? `<button class="details-btn" onclick="Modal.showDetails(${this.escapeJSON(log)})" aria-label="View details">View</button>` : '-'}
          </td>
        </tr>
      `;
    }).join('');

    Pagination.update();
  },

  renderTimeline() {
    const container = document.getElementById('timeline-view');
    if (!container) return;

    if (AuditState.filteredLogs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">No Audit Logs Found</div>
          <div class="empty-state-message">Try adjusting your filters or search criteria</div>
        </div>
      `;
      return;
    }

    container.innerHTML = AuditState.filteredLogs.map(log => {
      const actionClass = `action-${log.action_type.toLowerCase().replace(/_/g, '-')}`;
      const timestamp = new Date(log.created_at);
      const timeString = timestamp.toLocaleTimeString();
      const dateString = timestamp.toLocaleDateString();
      const actionIcon = ACTION_ICONS[log.action_type] || '•';

      return `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <div>
                <span class="action-badge ${actionClass}">
                  <span>${actionIcon}</span>
                  <span>${log.action_type.replace(/_/g, ' ')}</span>
                </span>
              </div>
              <div class="timeline-time">${dateString} ${timeString}</div>
            </div>
            <p><strong>User:</strong> ${log.user_email || 'System'}</p>
            <p><strong>Resource:</strong> ${log.resource_type} ${log.resource_id ? '#' + log.resource_id : ''}</p>
            ${log.details ? `<p><strong>Details:</strong> ${log.details}</p>` : ''}
            ${log.ip_address ? `<p><strong>IP:</strong> ${log.ip_address}</p>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  escapeJSON(obj) {
    return JSON.stringify(obj).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
  },

  switchView(view) {
    AuditState.currentView = view;

    const tableBtn = document.getElementById('view-table-btn');
    const timelineBtn = document.getElementById('view-timeline-btn');
    const tableView = document.getElementById('table-view');
    const timelineView = document.getElementById('timeline-view');

    if (tableBtn) tableBtn.classList.remove('active');
    if (timelineBtn) timelineBtn.classList.remove('active');

    if (view === 'table') {
      if (tableBtn) tableBtn.classList.add('active');
      if (tableView) tableView.style.display = 'block';
      if (timelineView) timelineView.classList.remove('active');
    } else {
      if (timelineBtn) timelineBtn.classList.add('active');
      if (tableView) tableView.style.display = 'none';
      if (timelineView) timelineView.classList.add('active');
    }

    this.render();
  }
};

// ============================================
// PAGINATION
// ============================================
const Pagination = {
  update() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    const limit = parseInt(document.getElementById('filter-limit')?.value || '100');
    const currentPage = Math.floor(AuditState.currentOffset / limit) + 1;
    const hasMore = AuditState.allLogs.length === limit;
    const totalShown = AuditState.filteredLogs.length;

    pagination.innerHTML = `
      <button onclick="Pagination.previous()" ${AuditState.currentOffset === 0 ? 'disabled' : ''} aria-label="Previous page">
        ← Previous
      </button>
      <span>Page ${currentPage} • ${totalShown} records</span>
      <button onclick="Pagination.next()" ${!hasMore ? 'disabled' : ''} aria-label="Next page">
        Next →
      </button>
    `;
  },

  previous() {
    const limit = parseInt(document.getElementById('filter-limit')?.value || '100');
    if (AuditState.currentOffset >= limit) {
      AuditState.currentOffset -= limit;
      DataLoader.loadAuditLogs();
    }
  },

  next() {
    const limit = parseInt(document.getElementById('filter-limit')?.value || '100');
    if (AuditState.allLogs.length === limit) {
      AuditState.currentOffset += limit;
      DataLoader.loadAuditLogs();
    }
  }
};

// ============================================
// MODAL
// ============================================
const Modal = {
  showDetails(log) {
    const modal = document.getElementById('details-modal');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;

    let html = `
      <div class="modal-info">
        <div class="modal-info-grid">
          <div class="modal-info-item">
            <div class="modal-info-label">Action Type</div>
            <div class="modal-info-value">${log.action_type}</div>
          </div>
          <div class="modal-info-item">
            <div class="modal-info-label">User</div>
            <div class="modal-info-value">${log.user_email || 'System'}</div>
          </div>
          <div class="modal-info-item">
            <div class="modal-info-label">Timestamp</div>
            <div class="modal-info-value">${new Date(log.created_at).toLocaleString()}</div>
          </div>
          <div class="modal-info-item">
            <div class="modal-info-label">IP Address</div>
            <div class="modal-info-value">${log.ip_address || 'N/A'}</div>
          </div>
          <div class="modal-info-item" style="grid-column: 1 / -1;">
            <div class="modal-info-label">User Agent</div>
            <div class="modal-info-value" style="word-break: break-word;">${log.user_agent || 'N/A'}</div>
          </div>
        </div>
      </div>
    `;

    if (log.before_value && log.after_value) {
      html += `
        <div class="diff-container">
          <div class="diff-section">
            <h4>📄 Before</h4>
            <pre>${JSON.stringify(log.before_value, null, 2)}</pre>
          </div>
          <div class="diff-section">
            <h4>📄 After</h4>
            <pre>${JSON.stringify(log.after_value, null, 2)}</pre>
          </div>
        </div>
      `;
    } else if (log.before_value) {
      html += `
        <div class="diff-section">
          <h4>🗑️ Deleted Data</h4>
          <pre>${JSON.stringify(log.before_value, null, 2)}</pre>
        </div>
      `;
    } else if (log.after_value) {
      html += `
        <div class="diff-section">
          <h4>✨ Created Data</h4>
          <pre>${JSON.stringify(log.after_value, null, 2)}</pre>
        </div>
      `;
    }

    content.innerHTML = html;
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
  },

  close() {
    const modals = ['details-modal', 'shortcuts-modal'];
    modals.forEach(id => {
      const modal = document.getElementById(id);
      if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  },

  showShortcuts() {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) {
      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');
    }
  }
};

// ============================================
// AUTO-REFRESH
// ============================================
const AutoRefresh = {
  start() {
    if (AuditState.autoRefreshInterval) {
      clearInterval(AuditState.autoRefreshInterval);
    }

    AuditState.autoRefreshInterval = setInterval(() => {
      DataLoader.loadAuditLogs(false);
      DataLoader.loadStats();
      DataLoader.loadActivityChart();
    }, 30000); // 30 seconds
  },

  stop() {
    if (AuditState.autoRefreshInterval) {
      clearInterval(AuditState.autoRefreshInterval);
      AuditState.autoRefreshInterval = null;
    }
  },

  toggle() {
    AuditState.autoRefreshEnabled = !AuditState.autoRefreshEnabled;

    const icon = document.getElementById('auto-refresh-icon');
    const text = document.getElementById('auto-refresh-text');

    if (AuditState.autoRefreshEnabled) {
      this.start();
      if (icon) icon.textContent = '▶️';
      if (text) text.textContent = 'Auto';
      Toast.info('Auto-refresh Enabled', 'Data will refresh every 30 seconds', 2000);
    } else {
      this.stop();
      if (icon) icon.textContent = '⏸️';
      if (text) text.textContent = 'Auto';
      Toast.info('Auto-refresh Disabled', 'Manual refresh only', 2000);
    }
  },

  manual() {
    const btn = document.getElementById('refresh-btn');
    const icon = document.getElementById('refresh-icon');

    if (btn) btn.classList.add('refreshing');

    Promise.all([
      DataLoader.loadAuditLogs(false),
      DataLoader.loadStats(),
      DataLoader.loadActivityChart()
    ]).finally(() => {
      if (btn) btn.classList.remove('refreshing');
    });
  }
};

// ============================================
// EXPORT FUNCTIONS
// ============================================
const Export = {
  toCSV() {
    if (AuditState.filteredLogs.length === 0) {
      Toast.warning('No Data', 'No data available to export');
      return;
    }

    try {
      const headers = ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Details', 'IP Address'];
      const rows = AuditState.filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.user_email || 'System',
        log.action_type,
        log.resource_type,
        log.resource_id || '',
        (log.details || '').replace(/"/g, '""'),
        log.ip_address || ''
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      this.download(csv, 'text/csv', 'csv');
      Toast.success('Export Successful', `Exported ${AuditState.filteredLogs.length} records to CSV`);
    } catch (error) {
      console.error('Export error:', error);
      Toast.error('Export Failed', 'Failed to export CSV file');
    }
  },

  toJSON() {
    if (AuditState.filteredLogs.length === 0) {
      Toast.warning('No Data', 'No data available to export');
      return;
    }

    try {
      const json = JSON.stringify(AuditState.filteredLogs, null, 2);
      this.download(json, 'application/json', 'json');
      Toast.success('Export Successful', `Exported ${AuditState.filteredLogs.length} records to JSON`);
    } catch (error) {
      console.error('Export error:', error);
      Toast.error('Export Failed', 'Failed to export JSON file');
    }
  },

  toPDF() {
    if (AuditState.filteredLogs.length === 0) {
      Toast.warning('No Data', 'No data available to export');
      return;
    }

    Toast.info('PDF Export', 'Generating PDF... This may take a moment');

    try {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (!printWindow) {
        Toast.error('Popup Blocked', 'Please allow popups for PDF export');
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Audit Trail Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
            h1 { color: #1e293b; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
            .meta { color: #64748b; margin-bottom: 20px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border: 1px solid #e2e8f0; font-size: 12px; }
            th { background: #f1f5f9; font-weight: 600; }
            tr:nth-child(even) { background: #f9fafb; }
            .action-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
            }
            .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 11px; }
            @media print {
              body { padding: 10px; }
              h1 { font-size: 18px; }
            }
          </style>
        </head>
        <body>
          <h1>🔍 Audit Trail Report</h1>
          <div class="meta">
            <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
            <strong>Total Records:</strong> ${AuditState.filteredLogs.length}<br>
            <strong>Generated By:</strong> Custom Workforce Solutions<br>
            <strong>Report Type:</strong> Comprehensive Audit Log
          </div>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              ${AuditState.filteredLogs.map(log => `
                <tr>
                  <td>${new Date(log.created_at).toLocaleString()}</td>
                  <td>${log.user_email || 'System'}</td>
                  <td><span class="action-badge">${log.action_type.replace(/_/g, ' ')}</span></td>
                  <td>${log.resource_type} ${log.resource_id ? '#' + log.resource_id : ''}</td>
                  <td>${log.details || '-'}</td>
                  <td>${log.ip_address || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            Custom Workforce Solutions - Audit Trail Report<br>
            Confidential and Proprietary Information
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

      printWindow.onload = function() {
        printWindow.print();
        Toast.success('PDF Ready', 'Print dialog opened for PDF export');
      };
    } catch (error) {
      console.error('PDF export error:', error);
      Toast.error('Export Failed', 'Failed to generate PDF');
    }
  },

  download(content, mimeType, extension) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${extension}`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
const Keyboard = {
  init() {
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in an input field
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      switch(e.key) {
        case '/':
          e.preventDefault();
          document.getElementById('search-input')?.focus();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          AutoRefresh.manual();
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          AutoRefresh.toggle();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          Display.switchView('table');
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          Display.switchView('timeline');
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          Export.toCSV();
          break;
        case '?':
          e.preventDefault();
          Modal.showShortcuts();
          break;
        case 'Escape':
          Modal.close();
          break;
      }
    });
  }
};

// ============================================
// FILTERS
// ============================================
const Filters = {
  init() {
    const filters = ['filter-action', 'filter-resource', 'filter-limit', 'date-from', 'date-to'];
    filters.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => this.apply());
      }
    });
  },

  apply() {
    AuditState.currentOffset = 0;
    DataLoader.loadAuditLogs();
  }
};

// ============================================
// INITIALIZATION
// ============================================
async function initializeAuditTrail() {
  // Show initial loading states
  Loading.showSkeletonStats();
  Loading.showSkeletonTable();

  // Initialize components
  Search.init();
  Filters.init();
  Keyboard.init();
  Toast.init();

  // Load data
  await Promise.all([
    DataLoader.loadStats(),
    DataLoader.loadAuditLogs(true),
    DataLoader.loadActivityChart()
  ]);

  // Start auto-refresh if enabled
  if (AuditState.autoRefreshEnabled) {
    AutoRefresh.start();
  }

  // Update sort indicators
  Sorting.updateIndicators();

  // Show welcome message
  Toast.info('Audit Trail Loaded', 'Auto-refresh enabled (30s intervals)', 2000);

  // Setup click outside modal
  window.onclick = function(event) {
    const detailsModal = document.getElementById('details-modal');
    const shortcutsModal = document.getElementById('shortcuts-modal');

    if (event.target === detailsModal) {
      Modal.close();
    }
    if (event.target === shortcutsModal) {
      Modal.close();
    }
  };
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  AutoRefresh.stop();
});

// Export for global access
window.AuditTrail = {
  Toast,
  Loading,
  DataLoader,
  Search,
  Sorting,
  Display,
  Pagination,
  Modal,
  AutoRefresh,
  Export,
  Keyboard,
  Filters
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAuditTrail);
} else {
  initializeAuditTrail();
}
