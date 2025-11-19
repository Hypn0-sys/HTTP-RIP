const DEFAULT_CODES = [200, 204, 304];

// Load configuration on startup
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  initTheme();

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

  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
});

function loadSettings() {
  browser.storage.local.get(['acceptableCodes', 'dnsProvider']).then((result) => {
    const codes = result.acceptableCodes || DEFAULT_CODES;
    const provider = result.dnsProvider || 'google';

    // Set DNS provider
    const dnsSelect = document.getElementById('dns-provider');
    if (dnsSelect) {
      dnsSelect.value = provider;
    }

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
  const provider = document.getElementById('dns-provider').value;

  if (codes.length === 0) {
    showMessage('You must select at least one acceptable code!', 'error');
    return;
  }

  browser.storage.local.set({
    acceptableCodes: codes,
    dnsProvider: provider
  }).then(() => {
    showMessage('✓ Configuration saved successfully!', 'success');
  });
}

function resetSettings() {
  if (confirm('Reset to default values?')) {
    browser.storage.local.set({
      acceptableCodes: DEFAULT_CODES,
      dnsProvider: 'google'
    }).then(() => {
      // Uncheck all checkboxes
      document.querySelectorAll('#preset-codes input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
      });

      // Clear custom field
      document.getElementById('custom-codes').value = '';

      // Reset DNS provider
      document.getElementById('dns-provider').value = 'google';

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

function initTheme() {
  browser.storage.local.get('theme').then((result) => {
    const savedTheme = result.theme;

    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    }
  });
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  browser.storage.local.set({ theme: newTheme });
}

function setTheme(theme) {
  if (theme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    document.getElementById('theme-toggle').textContent = '☀️';
  } else {
    document.body.removeAttribute('data-theme');
    document.getElementById('theme-toggle').textContent = '🌙';
  }
}
