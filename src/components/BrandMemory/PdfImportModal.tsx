import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Upload,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Tag,
  Palette,
  ShieldAlert,
  FileCheck2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { BrandKnowledgeBase } from '../../types/brand';
import { extractTextFromPdf } from '../../services/pdfService';
import {
  ExtractedBrandData,
  parseBrandGuideFromText,
  mergeExtractedDataIntoKb
} from '../../services/pdfBrandGuideParser';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingKb: BrandKnowledgeBase;
  onApplyNewKb: (updatedKb: BrandKnowledgeBase, summary: string) => void;
}

const SAMPLE_DEMO_PDF_TEXT = `AURELIA SKINCARE — CORPORATE BRAND IDENTITY & GOVERNANCE MANUAL (Q4 2026)
Single Source of Truth for Advertising Compliance & Creative Agencies

1. BRAND COLOR PALETTE & VISUAL SYSTEM
Primary Theme Color: Aurelia Emerald #00473E (Required on primary hero logos and headline accents).
Secondary Seal: Refined Gold #C89B3C (Used for premium verification seals and award emblems).
Background Foundation: Pearl Cream #F7F5F0 (Matte background surfaces, clean cards).
Text Standards: Deep Charcoal #1A202C for primary body copy, Muted Slate #718096 for captions.
Accent Highlight: Hydration Rose #FBD38D for social post icons.

2. VERIFIED PRODUCT CATALOG & MANDATORY PRICING STANDARDS
Product 1: Aurelia Deep Hydrating Moisturizer 50g (SKU: AUR-HM-50)
- Approved Standard Price: ₹1,299.
- Any creative advertising ₹1,099 is strictly prohibited and non-compliant.
- Approved Promo: 20% OFF with code AUTUMN20.

Product 2: Aurelia Vitamin C Glow Serum 30ml (SKU: AUR-VTC-30)
- Approved Standard Price: ₹899.
- Any ad quoting ₹749 is an expired promotion and strictly rejected.

3. PROHIBITED SUPERLATIVES & BANNED MEDICAL CLAIMS (ASCI / CCPA RULEBOOK)
The following terms are legally banned under ASCI Code and statutory misleading ad guidelines:
- "India's most loved moisturizer" — Unsubstantiated superlative without independent market research.
- "Results guaranteed in 7 days" — Prohibited absolute guarantee.
- "Cures acne permanently" — Prohibited medicinal cure claim.
- "Miracle glow" — Unsubstantiated miracle terminology.
- "100% cure for wrinkles" — Strict regulatory violation.

4. MANDATORY CLINICAL TRIAL FOOTNOTES & STATUTORY DISCLAIMERS
All creatives featuring efficacy claims must include this exact asterisk footnote:
*Based on a 4-week clinical trial of 30 women using Aurelia Deep Hydrating Moisturizer twice daily. Individual skin results may vary. Consult a certified dermatologist.

5. PRIMARY BRAND TAGLINE
Approved Primary Slogan: "Discover your daily skincare ritual."
Legacy Retired Tagline: "Glow naturally, your promise." (Retired since Sept 2026; do not publish).`;

export const PdfImportModal: React.FC<PdfImportModalProps> = ({
  isOpen,
  onClose,
  existingKb,
  onApplyNewKb
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedBrandData | null>(null);
  const [versionLabel, setVersionLabel] = useState<string>('v3.3 (PDF Guidelines)');
  const [activeReviewTab, setActiveReviewTab] = useState<'colors' | 'products' | 'claims' | 'terms' | 'disclaimers'>('colors');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessText = async (text: string, sourceName: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setProcessingStep('Extracting text content from PDF pages...');

    try {
      setProcessingStep('Running semantic brand policy analysis via Groq LLaMA 3.3...');
      const data = await parseBrandGuideFromText(text, existingKb);
      setExtractedData(data);
    } catch (err) {
      console.error('Error processing brand PDF:', err);
      setErrorMsg('Failed to parse brand guidelines. Please check the document format.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      setErrorMsg('Please select a valid .pdf brand guidelines document.');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setProcessingStep(`Loading ${selectedFile.name}...`);

    try {
      const { text } = await extractTextFromPdf(selectedFile);
      if (!text || text.trim().length < 20) {
        throw new Error('PDF has no extractable text. Please use a text-based brand guidelines PDF.');
      }
      await handleProcessText(text, selectedFile.name);
    } catch (err: any) {
      console.error('PDF extraction failed:', err);
      setErrorMsg(err.message || 'Could not extract text from the selected PDF.');
      setIsProcessing(false);
    }
  };

  const handleLoadDemoPdf = async () => {
    setFile(null);
    await handleProcessText(SAMPLE_DEMO_PDF_TEXT, 'Aurelia_Brand_Guidelines_2026.pdf');
  };

  const handleApplyToMemory = () => {
    if (!extractedData) return;

    const updated = mergeExtractedDataIntoKb(
      existingKb,
      extractedData,
      versionLabel.trim() || 'v3.3',
      'PDF Brand Sync Engine'
    );

    const summary = `Synchronized brand guidelines from PDF. Added/updated rules and recorded snapshot in ${versionLabel}.`;
    onApplyNewKb(updated, summary);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="curved-section-box"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1.5px solid #CBD5E1'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.18)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38BDF8'
              }}
            >
              <FileCheck2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Import Brand Book (PDF-to-Memory Sync)
              </h2>
              <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: '2px 0 0 0' }}>
                Module 1 Extension: Automatically convert PDF brand manuals into enforced Brand Memory rules.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Step 1: Upload Dropzone & Demo Button */}
          {!extractedData && !isProcessing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: '14px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#EFF6FF',
                    border: '2px solid #BFDBFE',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px auto'
                  }}
                >
                  <Upload size={24} />
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  Click to Upload or Drag & Drop Brand Guidelines PDF
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', maxWidth: '440px', margin: '0 auto' }}>
                  Accepts standard corporate brand manual documents, style books, or agency guideline decks.
                </div>
              </div>

              {/* 1-Click Demo Shortcut */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  backgroundColor: '#F0FDF4',
                  borderRadius: '12px',
                  border: '1px solid #BBF7D0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={18} color="#16A34A" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>
                      Don't have a PDF on hand?
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#15803D' }}>
                      Load the official <strong>Aurelia Skincare Q4 Brand Identity Manual (Demo PDF)</strong> with 1 click.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-brand btn-sm"
                  onClick={handleLoadDemoPdf}
                  style={{
                    backgroundColor: '#16A34A',
                    borderColor: '#16A34A',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '6px 14px'
                  }}
                >
                  Load Demo Manual
                </button>
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    color: '#DC2626',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
                gap: '16px'
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  border: '4px solid #E2E8F0',
                  borderTopColor: '#7C3AED',
                  animation: 'spin 1s linear infinite'
                }}
              />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  Processing Brand Manual...
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748B' }}>
                  {processingStep}
                </div>
              </div>
            </div>
          )}

          {/* Extracted Review Mode */}
          {extractedData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Summary Banner */}
              <div
                style={{
                  padding: '14px 18px',
                  backgroundColor: '#F5F3FF',
                  border: '1.5px solid #DDD6FE',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={20} color="#7C3AED" />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#4C1D95' }}>
                      Brand Rules Extracted Successfully
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#6D28D9' }}>
                      Found {extractedData.colors.length} Color Tokens &bull; {extractedData.products.length} Products &bull; {extractedData.terminology.length} Prohibited Claims &bull; {extractedData.disclaimers.length} Disclaimers
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setExtractedData(null)}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  <RefreshCw size={12} />
                  <span>Choose Another Document</span>
                </button>
              </div>

              {/* Version Labeling Input */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#F8FAFC',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                  New Version Label:
                </span>
                <input
                  type="text"
                  value={versionLabel}
                  onChange={e => setVersionLabel(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#0F172A'
                  }}
                  placeholder="e.g. v3.3 (Q4 Guidelines)"
                />
              </div>

              {/* Category Review Tabs */}
              <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', flexWrap: 'wrap' }}>
                <button
                  className={`btn btn-sm ${activeReviewTab === 'colors' ? 'btn-brand' : 'btn-secondary'}`}
                  onClick={() => setActiveReviewTab('colors')}
                  style={{ fontSize: '11.5px', padding: '4px 10px' }}
                >
                  <Palette size={13} />
                  <span>Colors ({extractedData.colors.length})</span>
                </button>
                <button
                  className={`btn btn-sm ${activeReviewTab === 'products' ? 'btn-brand' : 'btn-secondary'}`}
                  onClick={() => setActiveReviewTab('products')}
                  style={{ fontSize: '11.5px', padding: '4px 10px' }}
                >
                  <Tag size={13} />
                  <span>Products & Prices ({extractedData.products.length})</span>
                </button>
                <button
                  className={`btn btn-sm ${activeReviewTab === 'terms' ? 'btn-brand' : 'btn-secondary'}`}
                  onClick={() => setActiveReviewTab('terms')}
                  style={{ fontSize: '11.5px', padding: '4px 10px' }}
                >
                  <ShieldAlert size={13} />
                  <span>Restricted Claims ({extractedData.terminology.length})</span>
                </button>
                <button
                  className={`btn btn-sm ${activeReviewTab === 'disclaimers' ? 'btn-brand' : 'btn-secondary'}`}
                  onClick={() => setActiveReviewTab('disclaimers')}
                  style={{ fontSize: '11.5px', padding: '4px 10px' }}
                >
                  <FileText size={13} />
                  <span>Disclaimers ({extractedData.disclaimers.length})</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div style={{ minHeight: '180px', maxHeight: '260px', overflowY: 'auto' }}>
                {activeReviewTab === 'colors' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))', gap: '10px' }}>
                    {extractedData.colors.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF'
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            backgroundColor: c.hex,
                            border: '1px solid rgba(0,0,0,0.15)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                            {c.hex} {c.isPrimary ? '• Primary' : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeReviewTab === 'products' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {extractedData.products.map((p, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                            {p.productName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            SKU: <strong>{p.sku}</strong> &bull; Category: {p.category}
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#00473E' }}>
                          ₹{p.currentPrice.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeReviewTab === 'terms' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {extractedData.terminology.map((t, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '10px 14px',
                          border: '1px solid #FECACA',
                          borderRadius: '8px',
                          backgroundColor: '#FEF2F2'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span className="badge badge-violation" style={{ fontSize: '10px' }}>
                            {t.type}
                          </span>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#991B1B' }}>
                            &quot;{t.term}&quot;
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#7F1D1D' }}>
                          {t.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeReviewTab === 'disclaimers' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {extractedData.disclaimers.map((d, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '10px 14px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          backgroundColor: '#F8FAFC'
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                          {d.title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#475569', fontStyle: 'italic', lineHeight: '1.4' }}>
                          {d.disclaimerText}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>

          {extractedData && (
            <button
              type="button"
              className="btn btn-brand btn-sm"
              onClick={handleApplyToMemory}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#7C3AED',
                borderColor: '#7C3AED',
                color: '#FFFFFF',
                fontWeight: 700,
                padding: '7px 18px'
              }}
            >
              <span>Apply &amp; Sync Brand Memory ({versionLabel})</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
