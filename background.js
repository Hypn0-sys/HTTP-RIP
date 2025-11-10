// Default acceptable HTTP codes
let acceptableCodes = [200, 204, 304];

// DNS cache to avoid repeated requests
let dnsCache = {};
const DNS_CACHE_TTL = 300000; // 5 minutes en millisecondes

// Load acceptable codes from storage
browser.storage.local.get('acceptableCodes').then((result) => {
  if (result.acceptableCodes) {
    acceptableCodes = result.acceptableCodes;
  } else {
    // Save default values
    browser.storage.local.set({ acceptableCodes: acceptableCodes });
  }
});

// Listen for configuration changes
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.acceptableCodes) {
    acceptableCodes = changes.acceptableCodes.newValue;
    // Recalculate errors for all tabs
    Object.keys(requestsByTab).forEach(tabId => {
      recalculateErrors(parseInt(tabId));
    });
  }
});

// Store requests by tab
let requestsByTab = {};
let errorCountByTab = {};
let dnsErrorCountByTab = {};

// Check if a code is acceptable
function isAcceptableCode(code) {
  return acceptableCodes.includes(code);
}

// Recalculate errors for a tab
function recalculateErrors(tabId) {
  if (!requestsByTab[tabId]) {
    errorCountByTab[tabId] = 0;
    dnsErrorCountByTab[tabId] = 0;
    updateBadge(tabId);
    return;
  }
  
  // Count HTTP errors (non-acceptable codes)
  errorCountByTab[tabId] = requestsByTab[tabId].filter(r =>
    r.status !== 'pending' &&
    r.status !== 'ERROR' &&
    !isAcceptableCode(r.status)
  ).length;
  
  // Add network errors (except NS_BINDING_ABORTED)
  errorCountByTab[tabId] += requestsByTab[tabId].filter(r =>
    r.status === 'ERROR' && r.statusText !== 'NS_BINDING_ABORTED'
  ).length;
  
  // Count DNS errors (except for cancelled requests)
  dnsErrorCountByTab[tabId] = requestsByTab[tabId].filter(r =>
    (r.dnsStatus === 'invalid' || r.dnsStatus === 'error') &&
    (r.status !== 'ERROR' || r.statusText !== 'NS_BINDING_ABORTED')
  ).length;
  
  updateBadge(tabId);
}

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

// Check if DNS cache is valid
function isDNSCacheValid(domain) {
  if (!dnsCache[domain]) return false;
  const now = Date.now();
  return (now - dnsCache[domain].timestamp) < DNS_CACHE_TTL;
}

// Verify DNS via Google Public DNS API
async function checkDNS(domain) {
  // Check cache first
  if (isDNSCacheValid(domain)) {
    return dnsCache[domain];
  }
  
  try {
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }
    );
    
    if (!response.ok) {
      throw new Error(`DNS API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Determine if domain exists
    const exists = data.Status === 0 && data.Answer && data.Answer.length > 0;
    
    const result = {
      exists: exists,
      status: exists ? 'valid' : 'invalid',
      answers: data.Answer || [],
      timestamp: Date.now(),
      error: data.Status !== 0 ? `DNS Status: ${data.Status}` : null
    };
    
    // Cache result
    dnsCache[domain] = result;
    
    return result;
  } catch (error) {
    const result = {
      exists: false,
      status: 'error',
      error: error.message,
      timestamp: Date.now()
    };
    
    // Cache even errors (with shorter TTL)
    dnsCache[domain] = result;
    
    return result;
  }
}

// Clean up when tab is closed
browser.tabs.onRemoved.addListener((tabId) => {
  delete requestsByTab[tabId];
  delete errorCountByTab[tabId];
  delete dnsErrorCountByTab[tabId];
});

// Clean up when navigating to a new page
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    requestsByTab[tabId] = [];
    errorCountByTab[tabId] = 0;
    dnsErrorCountByTab[tabId] = 0;
    updateBadge(tabId);
  }
});

// Capture start of each request
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId === -1) return;
    
    if (!requestsByTab[details.tabId]) {
      requestsByTab[details.tabId] = [];
    }
    
    const domain = extractDomain(details.url);
    
    const request = {
      id: details.requestId,
      url: details.url,
      domain: domain,
      method: details.method,
      type: details.type,
      timestamp: new Date(details.timeStamp).toLocaleTimeString(),
      status: 'pending',
      dnsStatus: 'checking',
      dnsError: null
    };
    
    requestsByTab[details.tabId].push(request);
    
    // Verify DNS asynchronously
    if (domain) {
      checkDNS(domain).then(dnsResult => {
        request.dnsStatus = dnsResult.status;
        request.dnsError = dnsResult.error;
        
        // Recalculate errors instead of incrementing
        recalculateErrors(details.tabId);
      }).catch(err => {
        request.dnsStatus = 'error';
        request.dnsError = err.message;
        recalculateErrors(details.tabId);
      });
    }
  },
  { urls: ["<all_urls>"] }
);

// Capture completed requests
browser.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId === -1) return;
    
    if (!requestsByTab[details.tabId]) return;
    
    let request = requestsByTab[details.tabId].find(r => r.id === details.requestId);
    if (request) {
      request.status = details.statusCode;
      request.statusText = getStatusText(details.statusCode);
      
      // Recalculate errors instead of incrementing
      recalculateErrors(details.tabId);
    }
  },
  { urls: ["<all_urls>"] }
);

// Capture failed requests
browser.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (details.tabId === -1) return;
    
    if (!requestsByTab[details.tabId]) return;
    
    // Ignore NS_BINDING_ABORTED (request cancelled by user)
    if (details.error === 'NS_BINDING_ABORTED') return;
    
    let request = requestsByTab[details.tabId].find(r => r.id === details.requestId);
    if (request) {
      request.status = 'ERROR';
      request.statusText = details.error;
      
      // Recalculate errors instead of incrementing
      recalculateErrors(details.tabId);
    }
  },
  { urls: ["<all_urls>"] }
);

// Update badge with error count (HTTP + DNS)
function updateBadge(tabId) {
  const httpErrors = errorCountByTab[tabId] || 0;
  const dnsErrors = dnsErrorCountByTab[tabId] || 0;
  const totalErrors = httpErrors + dnsErrors;
  
  if (totalErrors > 0) {
    browser.browserAction.setBadgeText({
      text: totalErrors.toString(),
      tabId: tabId
    });
    browser.browserAction.setBadgeBackgroundColor({
      color: '#FF0000',
      tabId: tabId
    });
  } else {
    browser.browserAction.setBadgeText({
      text: '',
      tabId: tabId
    });
  }
}

// Message handler for popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getRequests') {
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      const tabId = tabs[0].id;
      sendResponse({
        requests: requestsByTab[tabId] || [],
        errorCount: errorCountByTab[tabId] || 0,
        dnsErrorCount: dnsErrorCountByTab[tabId] || 0,
        acceptableCodes: acceptableCodes
      });
    });
    return true;
  }
  
  if (message.action === 'clearData') {
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      const tabId = tabs[0].id;
      requestsByTab[tabId] = [];
      errorCountByTab[tabId] = 0;
      dnsErrorCountByTab[tabId] = 0;
      updateBadge(tabId);
      sendResponse({ success: true });
    });
    return true;
  }
});

// HTTP status code texts
function getStatusText(code) {
  const statusTexts = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  return statusTexts[code] || 'Unknown';
}
