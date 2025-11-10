let allRequests = [];
let filterErrorsOnly = true;
let filterDnsErrorsOnly = false;
let acceptableCodes = [200, 204, 304];

// Load requests on startup
document.addEventListener('DOMContentLoaded', () => {
  loadRequests();
  
  // Handle HTTP errors filter
  document.getElementById('filter-errors').addEventListener('change', (e) => {
    filterErrorsOnly = e.target.checked;
    displayRequests();
  });
  
  // Handle DNS errors filter
  document.getElementById('filter-dns-errors').addEventListener('change', (e) => {
    filterDnsErrorsOnly = e.target.checked;
    displayRequests();
  });
  
  // Settings button
  document.getElementById('settings-btn').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });
  
  // Clear button
  document.getElementById('clear-btn').addEventListener('click', () => {
    browser.runtime.sendMessage({ action: 'clearData' }, () => {
      loadRequests();
    });
  });
  
  // Export button
  document.getElementById('export-btn').addEventListener('click', exportToCSV);
  
  // Refresh every 2 seconds
  setInterval(loadRequests, 2000);
});

function loadRequests() {
  browser.runtime.sendMessage({ action: 'getRequests' }, (response) => {
    if (response) {
      allRequests = response.requests || [];
      acceptableCodes = response.acceptableCodes || [200, 204, 304];
      updateAcceptableCodesDisplay();
      updateSummary(response.dnsErrorCount || 0);
      displayRequests();
    }
  });
}

function updateAcceptableCodesDisplay() {
  document.getElementById('acceptable-codes').textContent = 
    acceptableCodes.join(', ');
}

function updateSummary(dnsErrorCount) {
  const errorCount = allRequests.filter(r =>
    !isAcceptableStatus(r.status, r.statusText)
  ).length;
  
  document.getElementById('total-count').textContent = allRequests.length;
  document.getElementById('error-count').textContent = errorCount;
  document.getElementById('dns-error-count').textContent = dnsErrorCount;
}

function isAcceptableStatus(status, statusText) {
  if (status === 'pending') return true;
  // Ignore NS_BINDING_ABORTED (cancelled request)
  if (status === 'ERROR' && statusText === 'NS_BINDING_ABORTED') return true;
  if (status === 'ERROR') return false;
  return acceptableCodes.includes(status);
}

function displayRequests() {
  const container = document.getElementById('requests-container');
  
  let requests = allRequests;
  
  // Filter if necessary
  if (filterErrorsOnly) {
    requests = requests.filter(r => !isAcceptableStatus(r.status, r.statusText));
  } else if (filterDnsErrorsOnly) {
    requests = requests.filter(r =>
      r.dnsStatus === 'invalid' || r.dnsStatus === 'error'
    );
  }
  
  if (requests.length === 0) {
    let message = 'No requests to display';
    if (filterErrorsOnly) {
      message = '✅ No HTTP errors detected!';
    } else if (filterDnsErrorsOnly) {
      message = '✅ No DNS errors detected!';
    }
    container.innerHTML = `<div class="empty-state">${message}</div>`;
    return;
  }
  
  container.innerHTML = requests.map(req => `
    <div class="request-item">
      <div class="request-header">
        <span class="status-badge status-${getStatusClass(req.status)}">
          ${req.status} ${req.statusText || ''}
        </span>
        ${getDNSBadge(req)}
        <span class="type-badge">${req.type}</span>
        <span class="method">${req.method}</span>
        <span class="timestamp">${req.timestamp}</span>
      </div>
      <div class="request-url">
        ${req.domain ? '<strong>' + escapeHtml(req.domain) + '</strong> - ' : ''}${escapeHtml(req.url)}
      </div>
      ${req.dnsError ? '<div class="dns-error-msg">⚠️ ' + escapeHtml(req.dnsError) + '</div>' : ''}
    </div>
  `).join('');
}

function getDNSBadge(req) {
  if (!req.dnsStatus) return '';
  
  const badges = {
    'valid': '<span class="dns-badge dns-valid" title="Valid DNS">🟢 DNS OK</span>',
    'invalid': '<span class="dns-badge dns-invalid" title="Domain does not exist">🔴 DNS Invalid</span>',
    'checking': '<span class="dns-badge dns-checking" title="Verification in progress">⏳ DNS...</span>',
    'error': '<span class="dns-badge dns-error" title="DNS verification error">⚠️ DNS Error</span>'
  };
  
  return badges[req.dnsStatus] || '';
}

function getStatusClass(status) {
  if (status === 'pending') return 'pending';
  if (status === 'ERROR') return 'error';
  
  if (acceptableCodes.includes(status)) return 'ok';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 400 && status < 500) return 'client-error';
  if (status >= 500) return 'server-error';
  
  return 'error';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function exportToCSV() {
  let requests = allRequests;
  
  if (filterErrorsOnly) {
    requests = requests.filter(r => !isAcceptableStatus(r.status, r.statusText));
  } else if (filterDnsErrorsOnly) {
    requests = requests.filter(r =>
      r.dnsStatus === 'invalid' || r.dnsStatus === 'error'
    );
  }
  
  const csv = [
    ['Timestamp', 'Status', 'DNS Status', 'Domain', 'Method', 'Type', 'URL'].join(','),
    ...requests.map(r => [
      r.timestamp,
      r.status,
      r.dnsStatus || 'N/A',
      r.domain || 'N/A',
      r.method,
      r.type,
      `"${r.url.replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  browser.downloads.download({
    url: url,
    filename: `http-status-${Date.now()}.csv`,
    saveAs: true
  });
}
