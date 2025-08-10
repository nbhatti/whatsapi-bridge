import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ width: string; height: string }> }
) {
  const { width, height } = await params;
  
  // Parse dimensions
  const w = parseInt(width, 10);
  const h = parseInt(height, 10);
  
  // Validate dimensions
  if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0 || w > 2000 || h > 2000) {
    return new NextResponse('Invalid dimensions', { status: 400 });
  }
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <circle cx="${w/2}" cy="${h/2 - 10}" r="${Math.min(w, h) * 0.25}" fill="#9ca3af"/>
      <circle cx="${w/2 - 8}" cy="${h/2 - 15}" r="3" fill="#6b7280"/>
      <circle cx="${w/2 + 8}" cy="${h/2 - 15}" r="3" fill="#6b7280"/>
      <path d="M ${w/2 - 12} ${h/2 + 5} Q ${w/2} ${h/2 + 15} ${w/2 + 12} ${h/2 + 5}" 
            stroke="#6b7280" stroke-width="2" fill="none"/>
      <text x="${w/2}" y="${h - 10}" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="12" fill="#6b7280">${w}x${h}</text>
    </svg>
  `.trim();
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
