/**
 * Simple QR Code fallback implementation using Google Charts API
 * This is used when the CDN QRCode library fails to load
 */

export function generateQRCodeFallback(container, text, options = {}) {
  const size = options.width || 300;
  
  // Clear container
  container.innerHTML = '';
  
  // Create image element
  const img = document.createElement('img');
  img.style.width = `${size}px`;
  img.style.height = `${size}px`;
  img.alt = 'QR Code';
  
  // Use Google Charts API as fallback
  const encodedText = encodeURIComponent(text);
  img.src = `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodedText}`;
  
  img.onerror = function() {
    // If Google Charts also fails, show a text fallback
    container.innerHTML = `
      <div style="
        width: ${size}px; 
        height: ${size}px; 
        border: 2px solid #ccc; 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        font-family: monospace; 
        font-size: 12px; 
        padding: 10px; 
        box-sizing: border-box;
        word-break: break-all;
        background: #f5f5f5;
      ">
        <div style="margin-bottom: 10px; font-weight: bold;">QR Code Data:</div>
        <div style="max-height: 200px; overflow-y: auto;">${text}</div>
        <div style="margin-top: 10px; font-size: 10px; color: #666;">
          Copy this data to your WhatsApp Web scanner
        </div>
      </div>
    `;
  };
  
  container.appendChild(img);
}
