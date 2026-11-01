import React, { useState, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Check,
  Eye,
  Copy,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Image as ImageIcon,
  Tag,
  Upload
} from 'lucide-react';
import { AuditFinding } from '../../types/audit';

interface AssetPreviewPaneProps {
  assetTitle: string;
  assetType: 'image' | 'pdf' | 'text';
  previewUrl?: string;
  rawText: string;
  findings: AuditFinding[];
  selectedFindingId: string | null;
  onSelectFinding: (findingId: string) => void;
  extractedVia: string;
  ocrConfidence?: number;
  originalDraftText?: string;
  appliedFixIds?: Set<string>;
  /** Explicit preview layout. When provided overrides auto-detection. */
  previewFormat?: 'instagram' | 'pamphlet' | 'banner' | 'image' | 'text';
  /** Caption text for Instagram preview (separate from OCR-extracted text). */
  instagramCaption?: string;
  /** Hashtags shown after caption in Instagram layout. */
  instagramHashtags?: string[];
  /** Brand account username shown in Instagram header. */
  instagramAccount?: string;
  /** Optional file upload handler for drag-and-drop on preview */
  onFileUpload?: (file: File) => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// Small sub-components
// ──────────────────────────────────────────────────────────────────────────────

const AureliaAvatar: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #00473E 0%, #16A34A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      border: '2px solid #A7F3D0',
      color: '#FFFFFF',
      fontWeight: 900,
      fontSize: size * 0.38,
      letterSpacing: '0.5px',
      fontFamily: 'serif'
    }}
  >
    A
  </div>
);

const FindingBox: React.FC<{
  finding: AuditFinding;
  left: number;
  top: number;
  width: number;
  height: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}> = ({ finding, left, top, width, height, isSelected, onSelect }) => {
  const isResolved = finding.decision === 'ACCEPTED';
  const borderColor = isResolved ? '#16A34A' : isSelected ? '#2563EB' : finding.severity === 'HIGH' ? '#DC2626' : '#D97706';
  const bgColor = isResolved ? 'rgba(22,163,74,0.12)' : isSelected ? 'rgba(37,99,235,0.14)' : finding.severity === 'HIGH' ? 'rgba(220,38,38,0.12)' : 'rgba(217,119,6,0.12)';

  // Smart positioning for small fine-print text & edge boundaries
  const isLogo = finding.ruleType === 'Logo';
  const isSmallBox = height < 3.8 || width < 8;
  const isNearBottom = top > 86;
  const isNearTop = top < 4;
  const isNearLeft = left < 4;

  const pinTop = isNearTop ? '2px' : isSmallBox ? '-14px' : '-8px';
  const pinLeft = isNearLeft ? '0px' : '-8px';

  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}%`,
        left: `${left}%`,
        width: `${width}%`,
        height: `${height}%`,
        minHeight: '14px',
        minWidth: '22px',
        border: `2px ${isResolved ? 'solid' : isSelected ? 'solid' : 'dashed'} ${borderColor}`,
        borderRadius: isLogo ? '50%' : '6px',
        backgroundColor: bgColor,
        cursor: 'pointer',
        pointerEvents: 'auto',
        transition: 'all 0.2s ease',
        zIndex: isSelected ? 40 : 20,
        boxShadow: isSelected
          ? `0 0 0 3px rgba(37,99,235,0.35), 0 4px 16px rgba(0,0,0,0.25)`
          : '0 1px 4px rgba(0,0,0,0.12)'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(finding.id);
      }}
      title={`Pin ${finding.pinNumber} (${finding.ruleType}): ${finding.title}`}
    >
      {/* Corner polygon reticle indicator for precision alignment */}
      {!isLogo && (
        <>
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '5px',
              height: '5px',
              borderTop: `2px solid ${borderColor}`,
              borderLeft: `2px solid ${borderColor}`,
              pointerEvents: 'none'
            }}
          />
          <span
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '5px',
              height: '5px',
              borderBottom: `2px solid ${borderColor}`,
              borderRight: `2px solid ${borderColor}`,
              pointerEvents: 'none'
            }}
          />
        </>
      )}
      {/* Numbered pin badge with smart non-obscuring anchor */}
      <div
        style={{
          position: 'absolute',
          top: pinTop,
          left: pinLeft,
          width: isSmallBox ? '18px' : '20px',
          height: isSmallBox ? '18px' : '20px',
          borderRadius: '50%',
          backgroundColor: borderColor,
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isSmallBox ? '10px' : '11px',
          fontWeight: 900,
          border: '2px solid #FFFFFF',
          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
          zIndex: 45
        }}
      >
        {isResolved ? <Check size={11} strokeWidth={3} /> : finding.pinNumber}
      </div>

      {/* Floating tooltip with boundary auto-flip */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            ...(isNearBottom ? { top: '-26px' } : { bottom: '-24px' }),
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: borderColor,
            color: '#FFFFFF',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 50,
            pointerEvents: 'none'
          }}
        >
          {isResolved
            ? '✓ Resolved'
            : `${finding.ruleType}: ${finding.flaggedText.slice(0, 32)}${finding.flaggedText.length > 32 ? '…' : ''}`}
        </div>
      )}
    </div>
  );
};

const ImageWithOverlay: React.FC<{
  src: string;
  alt: string;
  findingBoxes: Array<{ finding: AuditFinding; left: number; top: number; width: number; height: number }>;
  selectedFindingId: string | null;
  onSelectFinding: (id: string) => void;
  findings: AuditFinding[];
  containerStyle?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
}> = ({ src, alt, findingBoxes, selectedFindingId, onSelectFinding, findings, containerStyle, imgStyle }) => (
  <div style={{ position: 'relative', lineHeight: 0, ...containerStyle }}>
    <img src={src} alt={alt} style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain', ...imgStyle }} />
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {findingBoxes.map(({ finding, left, top, width, height }) => (
        <FindingBox key={finding.id} finding={finding} left={left} top={top} width={width} height={height} isSelected={selectedFindingId === finding.id} onSelect={onSelectFinding} />
      ))}
      {findings.length === 0 && (
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', backgroundColor: 'rgba(15,23,42,0.85)', color: '#FFFFFF', backdropFilter: 'blur(8px)', padding: '10px 14px', borderRadius: '10px', fontSize: '11.5px', textAlign: 'center', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>
          Ready for Evidence Audit · Click &quot;Run Evidence Audit&quot; to detect brand violations.
        </div>
      )}
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────

export const AssetPreviewPane: React.FC<AssetPreviewPaneProps> = ({
  assetTitle,
  assetType,
  previewUrl,
  rawText,
  findings,
  selectedFindingId,
  onSelectFinding,
  extractedVia,
  ocrConfidence,
  originalDraftText,
  appliedFixIds: _appliedFixIds,
  previewFormat: previewFormatProp,
  instagramCaption,
  instagramHashtags,
  instagramAccount = 'aurelia.skincare',
  onFileUpload,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCorrectedVersion, setShowCorrectedVersion] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleZoomIn    = () => setZoomLevel(prev => Math.min(prev + 0.15, 1.5));
  const handleZoomOut   = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  // ── Resolve preview format ─────────────────────────────────────────────────
  const resolvedFormat = useMemo((): 'instagram' | 'pamphlet' | 'banner' | 'image' | 'text' => {
    if (assetType === 'text') return 'text';
    if (previewFormatProp) return previewFormatProp;
    if (assetType === 'image') return 'image';
    return 'text';
  }, [assetType, previewFormatProp]);

  // ── Resolve image URL ──────────────────────────────────────────────────────
  const resolvedImageUrl = useMemo(() => {
    if (!previewUrl) return null;
    if (previewUrl === 'clinic-brochure') return '/assets/clinic-brochure.svg';
    if (previewUrl === 'website-hero') return '/assets/website-hero.svg';
    const isReal =
      previewUrl.startsWith('blob:') ||
      previewUrl.startsWith('data:') ||
      previewUrl.startsWith('/') ||
      previewUrl.startsWith('http') ||
      /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(previewUrl);
    return isReal ? previewUrl : null;
  }, [previewUrl]);

  const displayImageUrl = resolvedImageUrl;

  // ── Finding boxes (validated coordinates only) ─────────────────────────────
  const findingBoxes = useMemo(() => {
    return findings
      .filter((finding): finding is typeof finding & { coordinate: NonNullable<typeof finding.coordinate> } => {
        const c = finding.coordinate;
        return Boolean(c && Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.width) && Number.isFinite(c.height) && (c.width ?? 0) > 0 && (c.height ?? 0) > 0);
      })
      .map(finding => {
        const c = finding.coordinate;
        return {
          finding,
          left:   Math.max(0, Math.min(100, c.x)),
          top:    Math.max(0, Math.min(100, c.y)),
          width:  Math.max(0, Math.min(100 - c.x, c.width ?? 0)),
          height: Math.max(0, Math.min(100 - c.y, c.height ?? 0)),
        };
      });
  }, [findings]);

  // ── Text helpers ───────────────────────────────────────────────────────────
  const getResolvedText = () => {
    let resolved = rawText;
    findings.forEach(f => { if (f.flaggedText && f.suggestedFix) resolved = resolved.replace(f.flaggedText, f.suggestedFix); });
    return resolved;
  };

  const handleCopyResolved = () => {
    navigator.clipboard.writeText(getResolvedText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const changedLines = useMemo(() => {
    if (!originalDraftText || originalDraftText === rawText) return new Set<number>();
    const origLines = originalDraftText.split('\n');
    const newLines  = rawText.split('\n');
    const changed = new Set<number>();
    for (let i = 0; i < Math.max(origLines.length, newLines.length); i++) {
      if ((origLines[i] || '') !== (newLines[i] || '')) changed.add(i);
    }
    return changed;
  }, [originalDraftText, rawText]);

  // ── Shared elements ────────────────────────────────────────────────────────
  const headerControls = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>2</div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>Preview Material</div>
          <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>{showCorrectedVersion ? 'Showing Regenerated On-Brand Version' : 'Showing Draft with Highlighted Error Markers'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

        <button className={`btn btn-sm ${!showCorrectedVersion ? 'btn-brand' : 'btn-secondary'}`} style={{ fontSize: '11.5px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => setShowCorrectedVersion(false)}>
          <Eye size={13} /><span>Old (Draft)</span>
        </button>
        <button className={`btn btn-sm`} style={{ fontSize: '11.5px', padding: '5px 12px', backgroundColor: showCorrectedVersion ? '#16A34A' : '#FFFFFF', borderColor: showCorrectedVersion ? '#16A34A' : '#BBF7D0', color: showCorrectedVersion ? '#FFF' : '#166534', border: '1px solid', display: 'flex', alignItems: 'center', gap: '5px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setShowCorrectedVersion(true)}>
          <CheckCircle2 size={13} /><span>Fixed (Approved)</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '6px' }}>
          <button className="btn btn-secondary btn-icon-only btn-sm" onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={13} /></button>
          <span style={{ fontSize: '11.5px', color: '#64748B', minWidth: '36px', textAlign: 'center' }}>{Math.round(zoomLevel * 100)}%</span>
          <button className="btn btn-secondary btn-icon-only btn-sm" onClick={handleZoomIn} title="Zoom In"><ZoomIn size={13} /></button>
          <button className="btn btn-secondary btn-icon-only btn-sm" onClick={handleResetZoom} title="Reset Zoom"><Maximize2 size={13} /></button>
        </div>
      </div>
    </div>
  );

  const pinsStrip = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
      {!showCorrectedVersion ? (
        <>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Pins on Ad:</span>
          {findings.length === 0 ? (
            <span style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>No violations flagged yet. Run audit to inspect.</span>
          ) : (
            findings.map((f, i) => {
              const isResolved = f.decision === 'ACCEPTED';
              const isSelected = selectedFindingId === f.id;
              const hasCoord   = Boolean(f.coordinate && (f.coordinate.width ?? 0) > 0);
              return (
                <button key={f.id} className="btn btn-sm" style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: isResolved ? '#F0FDF4' : isSelected ? '#EFF6FF' : '#FEF2F2', border: `1.5px solid ${isResolved ? '#86EFAC' : isSelected ? '#3B82F6' : '#FECACA'}`, color: isResolved ? '#166534' : isSelected ? '#1D4ED8' : '#DC2626', fontWeight: isSelected ? 700 : 500, display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: hasCoord ? 1 : 0.7 }} onClick={() => onSelectFinding(f.id)} title={hasCoord ? undefined : 'No image coordinates — visible in findings panel only'}>
                  {isResolved ? <Check size={11} color="#16A34A" /> : <span>{f.pinNumber || i + 1}</span>}
                  <span>{f.ruleType}: {f.flaggedText.length > 18 ? f.flaggedText.slice(0, 16) + '…' : f.flaggedText}</span>
                  {!hasCoord && !isResolved && <Tag size={9} color="#94A3B8" />}
                </button>
              );
            })
          )}
        </>
      ) : (
        <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} color="#16A34A" /> All corrections applied — Showing Approved Version
        </span>
      )}
    </div>
  );

  const fixedTextCard = (
    <div style={{ width: '100%', maxWidth: '420px', minHeight: '400px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '2.5px solid #16A34A', boxShadow: '0 12px 36px rgba(22,163,74,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ backgroundColor: '#16A34A', color: '#FFF', padding: '8px 16px', fontSize: '11.5px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /><span>REGENERATED ON-BRAND CREATIVE</span></span>
        <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '4px' }}>Brand Memory Verified</span>
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1.5px solid #16A34A', padding: '6px 14px', borderRadius: '8px', backgroundColor: '#F0FDF4' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#00473E', letterSpacing: '2px' }}>AURELIA</div>
          <span style={{ fontSize: '9.5px', color: '#16A34A', fontWeight: 700 }}>Logo v3.0 (Approved)</span>
          <CheckCircle2 size={14} color="#16A34A" />
        </div>
        <div style={{ background: 'linear-gradient(135deg, #00473E 0%, #16A34A 100%)', borderRadius: '12px', padding: '16px', color: '#FFF', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', opacity: 0.85, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>Approved headline</div>
          <div style={{ fontSize: '17px', fontWeight: 900, marginTop: '6px', lineHeight: 1.3 }}>Discover Your Daily Skincare Ritual</div>
        </div>
        <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '10px', padding: '14px', fontSize: '12.5px', color: '#065F46', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {getResolvedText()}
        </div>
      </div>
      <div style={{ backgroundColor: '#00473E', color: '#FFF', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
        <span>Aurelia Skincare Official</span>
        <span style={{ color: '#4ADE80', fontWeight: 700 }}>100% Brand Memory Verified</span>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
      {headerControls}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0] && onFileUpload) {
            onFileUpload(e.dataTransfer.files[0]);
          }
        }}
        style={{
          flex: 1,
          minHeight: '520px',
          backgroundColor: '#F1F5F9',
          border: isDraggingOver ? '2px dashed #2563EB' : '1px solid #CBD5E1',
          borderRadius: '14px',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: resolvedFormat === 'banner' ? '14px' : '20px 16px',
          position: 'relative',
          transition: 'border 0.2s ease'
        }}
      >
        {isDraggingOver && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(239, 246, 255, 0.94)',
              border: '3px dashed #2563EB',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              zIndex: 100,
              backdropFilter: 'blur(4px)'
            }}
          >
            <Upload size={38} color="#2563EB" />
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#1E40AF' }}>
              Drop Creative Image or PDF to load & run Tesseract OCR
            </span>
          </div>
        )}

        <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s ease', position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Background Scene Vision Scanner Warning Banner */}
          {findings.some(f => f.ruleType === 'Background') && (
            <div
              style={{
                width: '100%',
                maxWidth: '430px',
                boxSizing: 'border-box',
                marginBottom: '14px',
                backgroundColor: '#FFFDF5',
                border: '1.5px solid #F59E0B',
                borderRadius: '12px',
                padding: '10px 14px',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.12)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#B45309' }}>
                  <ImageIcon size={15} color="#D97706" />
                  <span>📷 Background Scene Vision Scanner</span>
                </div>
                <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '10.5px' }}>
                  ⚠️ WARNING STATUS
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#78350F', lineHeight: '1.45' }}>
                {findings.filter(f => f.ruleType === 'Background').map((bf) => (
                  <div
                    key={bf.id}
                    style={{
                      cursor: 'pointer',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      backgroundColor: selectedFindingId === bf.id ? '#FDE68A' : 'transparent',
                      marginTop: '4px'
                    }}
                    onClick={() => onSelectFinding(bf.id)}
                  >
                    <strong>Flagged:</strong> {bf.flaggedText} <br />
                    <span style={{ color: '#047857', fontWeight: 600 }}>Fix: {bf.suggestedFix}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ──────────────── INSTAGRAM ──────────────── */}
          {resolvedFormat === 'instagram' && !showCorrectedVersion && (
            <div style={{ width: '100%', maxWidth: '430px', boxSizing: 'border-box', backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', border: '1px solid #DBDBDB', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
              {/* Account header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '2px', borderRadius: '50%', background: 'linear-gradient(45deg, #F9CE34, #EE2A7B, #6228D7)' }}>
                    <div style={{ padding: '2px', borderRadius: '50%', backgroundColor: '#FFFFFF' }}>
                      <AureliaAvatar size={34} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>{instagramAccount}</div>
                    <div style={{ fontSize: '10.5px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                      <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: '9.5px', padding: '1px 5px', borderRadius: '3px', border: '1px solid #BFDBFE' }}>Sponsored</span>
                      <span>· Demo asset</span>
                    </div>
                  </div>
                </div>
                <button style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }} title="Options (demo only)">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {/* Violation banner */}
              {findings.length > 0 && (
                <div style={{ margin: '0 14px 8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <AlertCircle size={13} color="#DC2626" />
                  <span>Interactive Ad Preview — numbered markers highlight exact violations</span>
                </div>
              )}

              {/* Creative image */}
              {displayImageUrl ? (
                <ImageWithOverlay
                  src={displayImageUrl}
                  alt={assetTitle}
                  findingBoxes={findingBoxes}
                  selectedFindingId={selectedFindingId}
                  onSelectFinding={onSelectFinding}
                  findings={findings}
                  containerStyle={{ width: '100%', backgroundColor: '#FAF5EF' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    minHeight: '260px',
                    backgroundColor: '#F8FAFC',
                    borderTop: '1px solid #E2E8F0',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '28px 20px',
                    textAlign: 'center',
                    gap: '10px'
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563EB'
                    }}
                  >
                    <ImageIcon size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', marginBottom: '3px' }}>
                      No Creative Image Attached
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', maxWidth: '280px', lineHeight: '1.4' }}>
                      Attach a creative image to this asset to inspect visual branding, logo placement, and OCR pinpoint markers.
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#059669', backgroundColor: '#ECFDF5', padding: '3px 10px', borderRadius: '5px', fontWeight: 600 }}>
                    Metadata evidence audit active
                  </div>
                </div>
              )}

              {/* Engagement toolbar */}
              <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {[Heart, MessageCircle, Send].map((Icon, idx) => (
                    <button key={idx} style={{ padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', color: '#0F172A', display: 'flex', alignItems: 'center' }} title="(demo only)">
                      <Icon size={24} strokeWidth={1.8} />
                    </button>
                  ))}
                </div>
                <button style={{ padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', color: '#0F172A', display: 'flex', alignItems: 'center' }} title="Save (demo only)">
                  <Bookmark size={24} strokeWidth={1.8} />
                </button>
              </div>

              {/* Caption & hashtags */}
              <div style={{ padding: '2px 14px 14px', fontSize: '13px', color: '#0F172A', lineHeight: 1.5 }}>
                {instagramCaption ? (
                  <p style={{ margin: 0 }}>
                    <span style={{ fontWeight: 700 }}>{instagramAccount}</span>{' '}
                    {instagramCaption}
                    {instagramHashtags && instagramHashtags.length > 0 && (
                      <span style={{ color: '#2563EB', marginLeft: '4px' }}>{instagramHashtags.join(' ')}</span>
                    )}
                  </p>
                ) : (
                  <p style={{ margin: 0, color: '#94A3B8', fontStyle: 'italic', fontSize: '11.5px' }}>No caption provided for this asset.</p>
                )}
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#94A3B8' }}>View all comments</div>
              </div>

              {/* Compliance badge */}
              {findings.length > 0 && (
                <div style={{ borderTop: '1px solid #F1F5F9', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={13} color="#DC2626" />
                  <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600 }}>
                    {findingBoxes.length} of {findings.length} issues pinned on image · {findings.length - findingBoxes.length} in findings panel only
                  </span>
                </div>
              )}
            </div>
          )}

          {resolvedFormat === 'instagram' && showCorrectedVersion && (
            <div style={{ width: '100%', maxWidth: '430px', backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', border: '2px solid #16A34A', boxShadow: '0 8px 32px rgba(22,163,74,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '2px', borderRadius: '50%', background: 'linear-gradient(45deg, #16A34A, #4ADE80)' }}>
                    <div style={{ padding: '2px', borderRadius: '50%', backgroundColor: '#FFFFFF' }}>
                      <AureliaAvatar size={34} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{instagramAccount}</div>
                    <div style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: 600 }}>✓ On-brand — Approved</div>
                  </div>
                </div>
                <CheckCircle2 size={18} color="#16A34A" />
              </div>
              {fixedTextCard}
            </div>
          )}

          {/* ──────────────── PAMPHLET ──────────────── */}
          {resolvedFormat === 'pamphlet' && !showCorrectedVersion && (
            <div style={{ width: '100%', maxWidth: '420px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 14px', width: '100%', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#64748B" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Document Preview</span>
                </div>
                {findings.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#DC2626', fontWeight: 600 }}>
                    <AlertCircle size={13} color="#DC2626" />
                    <span>{findings.length} issue{findings.length > 1 ? 's' : ''} detected</span>
                  </div>
                )}
              </div>
              {resolvedImageUrl ? (
                <ImageWithOverlay src={resolvedImageUrl} alt={assetTitle} findingBoxes={findingBoxes} selectedFindingId={selectedFindingId} onSelectFinding={onSelectFinding} findings={findings} containerStyle={{ width: '100%', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 28px rgba(0,0,0,0.14)', border: '2px solid #CBD5E1', backgroundColor: '#FFF' }} />
              ) : (
                <div style={{ width: '100%', minHeight: '480px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1.5px solid #CBD5E1', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ borderBottom: '2px solid #00473E', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#00473E', letterSpacing: '3px' }}>AURELIA</div>
                    <div style={{ fontSize: '10px', color: '#16A34A', fontWeight: 700, letterSpacing: '1px' }}>SKINCARE</div>
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#1E293B', whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif' }}>{rawText}</div>
                </div>
              )}
            </div>
          )}
          {resolvedFormat === 'pamphlet' && showCorrectedVersion && <div style={{ width: '100%', maxWidth: '420px', boxSizing: 'border-box' }}>{fixedTextCard}</div>}

          {/* ──────────────── BANNER ──────────────── */}
          {resolvedFormat === 'banner' && !showCorrectedVersion && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '7px 14px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={14} color="#64748B" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Banner / Display Ad Preview</span>
                </div>
                {findings.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#DC2626', fontWeight: 600 }}>
                    <AlertCircle size={13} color="#DC2626" /><span>{findings.length} issue{findings.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              {resolvedImageUrl ? (
                <ImageWithOverlay src={resolvedImageUrl} alt={assetTitle} findingBoxes={findingBoxes} selectedFindingId={selectedFindingId} onSelectFinding={onSelectFinding} findings={findings} containerStyle={{ width: '100%', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.12)', border: '1.5px solid #CBD5E1', backgroundColor: '#FAF5EF' }} />
              ) : (
                <div style={{ width: '100%', minHeight: '200px', backgroundColor: '#1E293B', borderRadius: '12px', border: '2px solid #334155', padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(22,163,74,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#4ADE80', letterSpacing: '2px', textTransform: 'uppercase' }}>Banner Ad Copy</div>
                  {rawText.split('\n').filter(Boolean).map((line, i) => {
                    const mf = findings.find(f => f.flaggedText && line.toLowerCase().includes(f.flaggedText.toLowerCase().trim()));
                    return (
                      <div key={i} style={{ fontSize: i === 0 ? '18px' : '13px', fontWeight: i === 0 ? 900 : 500, color: mf ? '#FCA5A5' : i === 0 ? '#FFFFFF' : '#CBD5E1', lineHeight: 1.4, borderLeft: mf ? '3px solid #DC2626' : 'none', paddingLeft: mf ? '10px' : '0', cursor: mf ? 'pointer' : 'default' }} onClick={() => mf && onSelectFinding(mf.id)}>
                        {line}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {resolvedFormat === 'banner' && showCorrectedVersion && <div style={{ width: '100%' }}>{fixedTextCard}</div>}

          {/* ──────────────── NEUTRAL IMAGE ──────────────── */}
          {resolvedFormat === 'image' && !showCorrectedVersion && resolvedImageUrl && (
            <div style={{ width: '100%', maxWidth: '420px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {findings.length > 0 && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FECACA', color: '#991B1B', padding: '6px 14px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} color="#DC2626" /><span>Interactive Ad Preview · Rectangular Regions Highlight Exact Violations</span>
                </div>
              )}
              <ImageWithOverlay src={resolvedImageUrl} alt={assetTitle} findingBoxes={findingBoxes} selectedFindingId={selectedFindingId} onSelectFinding={onSelectFinding} findings={findings} containerStyle={{ width: '100%', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 10px 32px rgba(0,0,0,0.16)', border: '2px solid #CBD5E1', backgroundColor: '#FAF5EF' }} />
            </div>
          )}
          {resolvedFormat === 'image' && !showCorrectedVersion && !resolvedImageUrl && (
            <div style={{ width: '100%', maxWidth: '420px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  width: '100%',
                  minHeight: '260px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '14px',
                  border: '2px dashed #CBD5E1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px 24px',
                  textAlign: 'center',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563EB'
                  }}
                >
                  <ImageIcon size={26} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A', marginBottom: '4px' }}>
                    No Creative Image Attached
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', maxWidth: '300px', lineHeight: '1.5' }}>
                    Attach or upload a creative image to perform visual OCR analysis and inspect pinpoint violation markers.
                  </div>
                </div>
                <div style={{ fontSize: '11.5px', color: '#059669', backgroundColor: '#ECFDF5', padding: '4px 12px', borderRadius: '6px', fontWeight: 600 }}>
                  ✓ Metadata-only evidence audit remains active
                </div>
              </div>

              {/* Metadata Copy Preview */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Draft Copy / Metadata
                  </div>
                  {findings.length > 0 && (
                    <span className="badge badge-violation" style={{ fontSize: '10px' }}>
                      {findings.length} findings
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#1E293B',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    backgroundColor: '#FAF5EF',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    maxHeight: '220px',
                    overflowY: 'auto'
                  }}
                >
                  {rawText || 'No draft copy available for this asset.'}
                </div>
              </div>
            </div>
          )}
          {resolvedFormat === 'image' && showCorrectedVersion && <div style={{ width: '100%', maxWidth: '420px', boxSizing: 'border-box' }}>{fixedTextCard}</div>}

          {/* ──────────────── TEXT (no image asset / Pasted Custom Copy) ──────────────── */}
          {resolvedFormat === 'text' && (
            <div style={{ width: '100%', maxWidth: '460px', boxSizing: 'border-box', minHeight: '480px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #CBD5E1', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderBottom: '1.5px solid #E2E8F0', paddingBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#2563EB" />
                  <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#0F172A' }}>{assetTitle}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>{extractedVia}</span>
                  {showCorrectedVersion && (
                    <button className="btn btn-sm btn-secondary" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={handleCopyResolved}>
                      <Copy size={12} /><span>{copiedText ? 'Copied!' : 'Copy Fixed'}</span>
                    </button>
                  )}
                </div>
              </div>

              {showCorrectedVersion ? (
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} color="#16A34A" /><span>Showing Approved On-Brand Marketing Copy</span>
                </div>
              ) : (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '8px 14px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={15} color="#DC2626" /><span>Live Draft Copy Preview · Pins highlight rule violations</span>
                </div>
              )}

              <div style={{ fontSize: '13.5px', lineHeight: '1.8', color: '#1E293B', fontFamily: 'Arial, sans-serif', whiteSpace: 'pre-wrap', backgroundColor: '#FAF5EF', padding: '16px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', minHeight: '260px' }}>
                {(!rawText || rawText.trim().length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748B' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#2563EB' }}>
                      <FileText size={26} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#1E293B', marginBottom: '4px' }}>
                      Pasted Draft Copy Screen
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', maxWidth: '320px', margin: '0 auto', lineHeight: 1.5 }}>
                      Type or paste your marketing text into the editor on the left (or press <strong>Ctrl+V</strong>) to preview and audit against Brand Memory.
                    </div>
                  </div>
                ) : !showCorrectedVersion ? (() => {
                  const lines = rawText.split('\n');
                  return lines.map((line, lIdx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={lIdx} style={{ height: '10px' }} />;
                    const mf = findings.find(f => f.flaggedText && trimmed.toLowerCase().includes(f.flaggedText.replace(/['"]/g, '').toLowerCase().trim()));
                    const wasChanged = changedLines.has(lIdx);
                    if (mf) {
                      const isResolved = mf.decision === 'ACCEPTED';
                      const isSelected = selectedFindingId === mf.id;
                      return (
                        <div key={lIdx} style={{ margin: '6px 0', padding: '6px 10px', borderRadius: '8px', backgroundColor: isResolved ? '#F0FDF4' : isSelected ? '#EFF6FF' : '#FEF2F2', border: isResolved ? '1.5px solid #BBF7D0' : isSelected ? '2px solid #2563EB' : '1.5px dashed #DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }} onClick={() => onSelectFinding(mf.id)}>
                          <span style={{ fontWeight: 600, color: isResolved ? '#166534' : '#991B1B' }}>{line}</span>
                          <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: isResolved ? '#16A34A' : isSelected ? '#2563EB' : '#DC2626', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>
                            {isResolved ? <Check size={12} /> : mf.pinNumber}
                          </span>
                        </div>
                      );
                    }
                    if (wasChanged) {
                      return (
                        <div key={lIdx} style={{ margin: '4px 0', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={14} color="#16A34A" />
                          <span style={{ fontWeight: 600, color: '#065F46' }}>{line}</span>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#059669', backgroundColor: '#D1FAE5', padding: '1px 6px', borderRadius: '4px', flexShrink: 0, textTransform: 'uppercase' }}>Fixed</span>
                        </div>
                      );
                    }
                    return <div key={lIdx} style={{ margin: '4px 0' }}>{line}</div>;
                  });
                })() : <div>{getResolvedText()}</div>}
              </div>

              {rawText && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748B' }}>
                  <span>{rawText.trim().split(/\s+/).filter(Boolean).length} words · {rawText.length} characters</span>
                  <span>{findings.length} brand finding{findings.length !== 1 ? 's' : ''} detected</span>
                </div>
              )}

              {findings.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Identified Issues:</span>
                  {findings.map(f => (
                    <button key={f.id} className="btn btn-sm" style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', backgroundColor: f.decision === 'ACCEPTED' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${f.decision === 'ACCEPTED' ? '#BBF7D0' : '#FECACA'}`, color: f.decision === 'ACCEPTED' ? '#166534' : '#DC2626' }} onClick={() => onSelectFinding(f.id)}>
                      Pin {f.pinNumber}: {f.ruleType}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {resolvedFormat !== 'text' && pinsStrip}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748B' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
          <span>Click any numbered marker to inspect Brand Memory evidence or apply a fix.</span>
        </span>
        {ocrConfidence && <span style={{ fontWeight: 600, color: '#16A34A' }}>OCR Accuracy: {ocrConfidence.toFixed(1)}%</span>}
      </div>
    </div>
  );
};
