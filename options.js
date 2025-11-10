const DEFAULT_CODES = [200, 204, 304];

// Load configuration on startup
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  
  // Handle checkbox changes
  document.querySelectorAll('#preset-codes input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateDisplay);
  });
  
  // Handle custom field
  document.getElementById('custom-codes').addEventListener('input', updateDisplay);
  
  // Save button
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  
  // Reset button
  document.getElementById('reset-btn').addEventListener('click', resetSettings);
});

function loadSettings() {
  browser.storage.local.get('acceptableCodes').then((result) => {
    const codes = result.acceptableCodes || DEFAULT_CODES;
    
    // Check appropriate checkboxes
    codes.forEach(code => {
      const checkbox = document.getElementById(`code-${code}`);
      if (checkbox) {
        checkbox.checked = true;
      } else {
        // Add to custom field if not in presets
        const customInput = document.getElementById('custom-codes');
        const currentCustom = customInput.value.trim();
        if (currentCustom) {
          customInput.value = currentCustom + ', ' + code;
        } else {
          customInput.value = code.toString();
        }
      }
    });
    
    updateDisplay();
  });
}

function getCurrentCodes() {
  const codes = new Set();
  
  // Codes from checkboxes
  document.querySelectorAll('#preset-codes input[type="checkbox"]:checked').forEach(checkbox => {
    codes.add(parseInt(checkbox.value));
  });
  
  // Custom codes
  const customInput = document.getElementById('custom-codes').value;
  if (customInput.trim()) {
    customInput.split(',').forEach(code => {
      const num = parseInt(code.trim());
      if (!isNaN(num) && num >= 100 && num < 600) {
        codes.add(num);
      }
    });
  }
  
  return Array.from(codes).sort((a, b) => a - b);
}

function updateDisplay() {
  const codes = getCurrentCodes();
  document.getElementById('current-codes-display').textContent = codes.join(', ');
}

function saveSettings() {
  const codes = getCurrentCodes();
  
  if (codes.length === 0) {
    showMessage('You must select at least one acceptable code!', 'error');
    return;
  }
  
  browser.storage.local.set({ acceptableCodes: codes }).then(() => {
    showMessage('✓ Configuration saved successfully!', 'success');
  });
}

function resetSettings() {
  if (confirm('Reset to default values (200, 204, 304)?')) {
    browser.storage.local.set({ acceptableCodes: DEFAULT_CODES }).then(() => {
      // Uncheck all checkboxes
      document.querySelectorAll('#preset-codes input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
      });
      
      // Clear custom field
      document.getElementById('custom-codes').value = '';
      
      // Reload
      loadSettings();
      
      showMessage('✓ Configuration reset!', 'success');
    });
  }
}

function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = 'message ' + type;
  messageDiv.style.display = 'block';
  
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 3000);
}
