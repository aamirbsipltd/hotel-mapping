import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          fontFamily: 'sans-serif',
          gap: 24,
        }}
      >
        {/* Brand stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: 'oklch(0.696 0.17 162)',
          }}
        />

        {/* Logo / wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'oklch(0.696 0.17 162)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>H</span>
          </div>
          <span style={{ fontSize: 36, fontWeight: 800, color: '#0a0a0a', letterSpacing: '-1px' }}>
            Hotel Mapping Tool
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: '#0a0a0a',
            textAlign: 'center',
            lineHeight: 1.15,
            maxWidth: 900,
            letterSpacing: '-1.5px',
          }}
        >
          Map your hotels to<br />Tripadvisor in minutes
        </div>

        {/* Subline */}
        <div style={{ fontSize: 24, color: '#6b7280', textAlign: 'center', maxWidth: 700 }}>
          Upload a CSV. Get back Location IDs with confidence scores.
        </div>

        {/* CTA pill */}
        <div
          style={{
            marginTop: 8,
            background: 'oklch(0.696 0.17 162)',
            color: '#fff',
            padding: '14px 36px',
            borderRadius: 10,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          Free for first 5 hotels →
        </div>

        {/* Bottom stripe */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: 'oklch(0.696 0.17 162)',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
