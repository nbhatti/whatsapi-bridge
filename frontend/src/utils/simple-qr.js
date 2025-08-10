/**
 * Simple QR Code generator using native JavaScript and Canvas API
 * This is a fallback when external CDNs fail
 */

// Simple QR Code generation using native Canvas API
function generateSimpleQR(container, text) {
  const size = 300;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas.style.border = '2px solid #ccc';
  
  const ctx = canvas.getContext('2d');
  
  // Clear canvas with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  // Draw a simple pattern representing the QR data
  // This is a very basic representation, not a real QR code
  ctx.fillStyle = '#000000';
  
  // Draw corner markers
  const markerSize = 30;
  const positions = [
    [10, 10], // Top-left
    [size - markerSize - 10, 10], // Top-right  
    [10, size - markerSize - 10], // Bottom-left
  ];
  
  positions.forEach(([x, y]) => {
    // Outer square
    ctx.fillRect(x, y, markerSize, markerSize);
    // Inner white square
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 5, y + 5, markerSize - 10, markerSize - 10);
    // Inner black square
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 10, y + 10, markerSize - 20, markerSize - 20);
  });
  
  // Generate a pseudo-random pattern based on the text
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed += text.charCodeAt(i);
  }
  
  // Simple random number generator
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  
  // Draw data pattern
  const moduleSize = 4;
  for (let x = 50; x < size - 50; x += moduleSize) {
    for (let y = 50; y < size - 50; y += moduleSize) {
      // Skip corner areas
      const isNearCorner = (x < 50 || x > size - 80) && (y < 50 || y > size - 80);
      if (!isNearCorner && pseudoRandom() > 0.5) {
        ctx.fillRect(x, y, moduleSize, moduleSize);
      }
    }
  }
  
  container.innerHTML = '';
  container.appendChild(canvas);
  
  // Add instruction text below
  const instruction = document.createElement('div');
  instruction.style.marginTop = '10px';
  instruction.style.fontSize = '12px';
  instruction.style.color = '#666';
  instruction.style.textAlign = 'center';
  instruction.style.maxWidth = size + 'px';
  instruction.innerHTML = '<strong>Note:</strong> This is a placeholder pattern. For actual QR scanning, use the data below:<br><br>' +
    '<div style="font-family: monospace; background: #f5f5f5; padding: 10px; word-break: break-all; max-height: 100px; overflow-y: auto;">' + 
    text + '</div>';
  container.appendChild(instruction);
}

// Export for use in the popup
if (typeof window !== 'undefined') {
  window.generateSimpleQR = generateSimpleQR;
}
