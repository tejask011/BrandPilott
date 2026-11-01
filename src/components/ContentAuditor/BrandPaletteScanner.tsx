import React, { useState } from 'react';
import { Palette, CheckCircle2, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { PaletteAnalysisResult, ExtractedColorSwatch } from '../../services/colorAnalysisService';
import { ColorToken } from '../../types/brand';

interface BrandPaletteScannerProps {
  paletteResult: PaletteAnalysisResult | null;
  brandColors: ColorToken[];
  isAnalyzing?: boolean;
}

export const BrandPaletteScanner: React.FC<BrandPaletteScannerProps> = ({
  paletteResult,
  brandColors,
  isAnalyzing = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  if (isAnalyzing) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          backgroundColor: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          fontSize: '11.5px',
          color: '#64748B'
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            border: '2px solid #CBD5E1',
            borderTopColor: '#7C3AED',
            animation: 'spin 1s linear infinite'
          }}
        />
        <span>Scanning canvas pixel palette against Brand Memory...</span>
      </div>
    );
  }

  if (!paletteResult || paletteResult.dominantSwatches.length === 0) {
    return null;
  }

  const handleCopyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const getStatusBadge = () => {
    switch (paletteResult.status) {
      case 'COMPLIANT':
        return (
          <span className="badge badge-success" style={{ fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={11} />
            <span>{paletteResult.paletteComplianceScore}% On-Brand</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="badge badge-unverified" style={{ fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={11} />
            <span>{paletteResult.paletteComplianceScore}% Minor Accent Drift</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-violation" style={{ fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={11} />
            <span>{paletteResult.paletteComplianceScore}% Palette Violation</span>
          </span>
        );
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          flexWrap: 'wrap',
          gap: '8px'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              backgroundColor: '#F5F3FF',
              border: '1px solid #DDD6FE',
              color: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Palette size={14} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span>Visual Palette Scanner</span>
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Dominant Swatches Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            {paletteResult.dominantSwatches.map((s, idx) => (
              <div
                key={idx}
                title={`${s.hex} (${s.percentage}%) — ${s.isCompliant ? `Matches ${s.matchedToken?.name}` : 'Off-Brand'}`}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  backgroundColor: s.hex,
                  border: s.isCompliant ? '1.5px solid rgba(0,0,0,0.15)' : '2px solid #DC2626',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                  position: 'relative',
                  flexShrink: 0
                }}
              />
            ))}
          </div>

          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded Breakdown */}
      {isExpanded && (
        <div
          style={{
            paddingTop: '8px',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
            {paletteResult.summaryText}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 115px), 1fr))', gap: '6px' }}>
            {paletteResult.dominantSwatches.map((swatch, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  backgroundColor: swatch.isCompliant ? '#F8FAFC' : '#FEF2F2',
                  border: swatch.isCompliant ? '1px solid #E2E8F0' : '1px solid #FECACA'
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '3px',
                    backgroundColor: swatch.hex,
                    border: '1px solid rgba(0,0,0,0.15)',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: swatch.isCompliant ? '#1E293B' : '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{swatch.percentage}%</span>
                    {swatch.isCompliant ? (
                      <CheckCircle2 size={10} color="#16A34A" />
                    ) : (
                      <AlertCircle size={10} color="#DC2626" />
                    )}
                  </div>
                  <div
                    onClick={() => handleCopyHex(swatch.hex)}
                    style={{
                      fontSize: '9.5px',
                      fontFamily: 'monospace',
                      color: '#64748B',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    title="Click to copy hex"
                  >
                    <span>{swatch.hex}</span>
                    {copiedHex === swatch.hex ? <Check size={8} color="#16A34A" /> : <Copy size={8} />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {paletteResult.offBrandColors.length > 0 && (
            <div
              style={{
                fontSize: '10.5px',
                color: '#991B1B',
                backgroundColor: '#FEF2F2',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #FECACA'
              }}
            >
              ⚠ <strong>Non-Compliant Accent Detected</strong>: Unapproved hues clash with the calm, luxury brand identity. Please adjust artwork background in Figma.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
