# HTTP RIP - HTTP Request Inspector & Protector

A Firefox extension that monitors HTTP requests and verifies DNS resolution for enhanced web security and debugging.

## 📋 Overview

HTTP RIP is a powerful Firefox extension that captures and analyzes all HTTP requests made by web pages. It provides real-time monitoring of HTTP status codes and automatically verifies DNS resolution for each domain, helping you identify broken links, invalid domains, and potential security issues.

## ✨ Features

### HTTP Monitoring
- **Real-time Request Capture**: Monitors all HTTP requests made by the active tab
- **Status Code Analysis**: Highlights requests with non-acceptable HTTP status codes
- **Configurable Acceptable Codes**: Customize which HTTP status codes are considered acceptable
- **Error Detection**: Automatically identifies and counts HTTP errors
- **Request Details**: View method, type, timestamp, and full URL for each request

### DNS Verification
- **Automatic DNS Checks**: Verifies domain existence for every HTTP request
- **Google Public DNS Integration**: Uses Google's reliable DNS API for validation
- **Smart Caching**: Caches DNS results for 5 minutes to optimize performance
- **Visual Status Indicators**: Clear badges showing DNS validation status
- **Error Tracking**: Separate counter for DNS-related errors

### User Interface
- **Clean Dashboard**: Summary view with total requests, HTTP errors, and DNS errors
- **Dual Filtering**: Filter by HTTP errors or DNS errors independently
- **Color-Coded Badges**: Easy-to-read status indicators for both HTTP and DNS
- **Domain Highlighting**: Bold domain names for quick identification
- **Responsive Design**: Clean, modern interface that scales well

### Data Export
- **CSV Export**: Export captured requests with full details
- **Filtered Export**: Export only filtered results (HTTP or DNS errors)
- **Complete Data**: Includes timestamp, HTTP status, DNS status, domain, method, type, and URL

## 📸 Screenshots

*Screenshots coming soon*

## 🚀 Installation

### From Firefox Add-ons (Recommended)
*Coming soon - pending publication*

### Manual Installation (Development)

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/http-rip.git
   cd http-rip
   ```

2. **Load in Firefox**
   - Open Firefox and navigate to `about:debugging`
   - Click "This Firefox" in the left sidebar
   - Click "Load Temporary Add-on"
   - Navigate to the extension directory and select `manifest.json`

3. **Start Monitoring**
   - Click the HTTP RIP icon in the toolbar
   - Browse any website to see captured requests

## 📖 Usage Guide

### Basic Monitoring

1. **Open the Extension**
   - Click the HTTP RIP icon in your Firefox toolbar
   - The popup displays all requests from the current tab

2. **View Request Details**
   - Each request shows:
     - HTTP status code with color-coded badge
     - DNS verification status
     - Request method (GET, POST, etc.)
     - Resource type (document, script, image, etc.)
     - Timestamp
     - Domain and full URL

3. **Interpret DNS Status Badges**
   - 🟢 **DNS OK**: Domain exists and resolves correctly
   - 🔴 **DNS Invalid**: Domain does not exist (NXDOMAIN)
   - ⏳ **DNS...**: Verification in progress
   - ⚠️ **DNS Error**: Error occurred during DNS lookup

### Filtering

- **Show HTTP Errors Only**: Check to display only requests with non-acceptable status codes
- **Show DNS Errors Only**: Check to display only requests to invalid or error domains
- Filters are mutually exclusive for focused analysis

### Configuration

1. **Access Settings**
   - Click the gear icon (⚙️) in the extension popup
   - Or go to `about:addons` → HTTP RIP → Options

2. **Configure Acceptable Status Codes**
   - Select from preset codes (200, 201, 204, 301, 302, 304, etc.)
   - Add custom codes in the text field
   - Click "Save" to apply changes

3. **Default Acceptable Codes**
   - 200 (OK)
   - 204 (No Content)
   - 304 (Not Modified)

### Export Data

1. Click the "Export CSV" button
2. Choose save location
3. Open in any spreadsheet application
4. CSV includes: Timestamp, Status, DNS Status, Domain, Method, Type, URL

## ⚙️ Configuration Options

### Acceptable HTTP Status Codes

You can customize which HTTP status codes are considered acceptable. By default, the extension treats the following codes as acceptable:

- **200** - OK
- **204** - No Content
- **304** - Not Modified

To modify acceptable codes:
1. Open the extension options page
2. Check/uncheck preset status codes
3. Add custom codes (comma-separated)
4. Click "Save"

### DNS Cache

The extension caches DNS lookup results to reduce API calls and improve performance:

- **Cache TTL**: 5 minutes (300,000 ms)
- **Automatic Cleanup**: Cache entries expire automatically
- **Performance Impact**: Reduces API calls by ~90% for frequently visited domains

## 🔧 Technical Details

### DNS Verification

- **Provider**: Google Public DNS API
- **Endpoint**: `https://dns.google/resolve`
- **Query Type**: A records (IPv4 addresses)
- **Rate Limit**: Up to 10,000 requests per day (Google DNS limit)
- **Timeout**: Handled by browser's fetch API (typically 30 seconds)
- **Async Processing**: DNS checks don't block UI or HTTP requests

### HTTP Monitoring

- **API**: Firefox WebRequest API
- **Scope**: All HTTP/HTTPS requests from the active tab
- **Excluded**: Requests from browser internals (tabId = -1)
- **Storage**: Requests stored per-tab, cleared on navigation

### Performance

- **DNS Caching**: 5-minute TTL reduces redundant API calls
- **Async Operations**: Non-blocking DNS verification
- **Memory Management**: Auto-cleanup when tabs are closed
- **Refresh Rate**: UI updates every 2 seconds

### Permissions Required

- **webRequest**: Monitor HTTP requests
- **tabs**: Access tab information
- **<all_urls>**: Capture requests from all domains
- **storage**: Save configuration settings

## 🧪 Testing

### Valid Domains Test
Visit well-known sites to verify DNS checking:
- `https://www.google.com`
- `https://github.com`
- `https://stackoverflow.com`

**Expected**: All show 🟢 DNS OK

### Invalid Domains Test
Create a test HTML file with invalid domains:
```html
<!DOCTYPE html>
<html>
<body>
  <img src="https://this-domain-absolutely-does-not-exist-123456.com/image.png">
  <script src="https://invalid-test-domain-xyz.net/script.js"></script>
</body>
</html>
```

**Expected**: Shows 🔴 DNS Invalid

### DNS Cache Test
1. Visit a site (e.g., google.com)
2. Reload the page multiple times rapidly
3. Check browser console for background script

**Expected**: DNS queries not repeated within 5 minutes

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Your Changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation as needed

## 🐛 Known Issues

1. **Initial Delay**: First DNS check may take 1-2 seconds
2. **API Rate Limits**: Heavy usage may hit Google DNS rate limits
3. **Local Domains**: .local domains or IP addresses may not validate correctly
4. **WebSocket Requests**: Not captured by WebRequest API

## 📝 Changelog

### Version 1.1 (Current)
- ✅ Added DNS verification via Google Public DNS
- ✅ DNS caching with 5-minute TTL
- ✅ Visual DNS status badges
- ✅ DNS error filtering
- ✅ DNS error counter in summary
- ✅ Enhanced CSV export with DNS data

### Version 1.0
- ✅ HTTP request monitoring
- ✅ Configurable acceptable status codes
- ✅ Error filtering
- ✅ CSV export
- ✅ Options page

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Public DNS API for DNS resolution
- Firefox WebExtensions API documentation
- The open-source community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/http-rip/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/http-rip/discussions)

---

Made with ❤️ for web developers and security enthusiasts