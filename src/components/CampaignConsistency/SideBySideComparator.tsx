import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Wand2,
  Calendar,
  Tag,
  Percent,
  Key,
  MousePointerClick,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Check,
  ExternalLink
} from 'lucide-react';
import { Campaign, CampaignAsset } from '../../types/campaign';
import { BrandKnowledgeBase } from '../../types/brand';
import { isValidImageUrl } from '../../services/imageStorage';
import { extractDiscountPercent, extractPromoCode, isCsrCampaign } from '../../services/campaignEngine';

interface SideBySideComparatorProps {
  campaign: Campaign;
  kb: BrandKnowledgeBase;
  onInspectAssetInAuditor: (asset: CampaignAsset) => void;
  onHarmonizeAssets: () => void;
}

export const SideBySideComparator: React.FC<SideBySideComparatorProps> = ({
  campaign,
  kb,
  onInspectAssetInAuditor,
  onHarmonizeAssets
}) => {
  // By default, select first 3-4 assets for comparison
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(() =>
    campaign.assets.slice(0, 4).map(a => a.id)
  );

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssetIds(prev => {
      if (prev.includes(assetId)) {
        if (prev.length <= 2) return prev; // Keep at least 2 for comparison
        return prev.filter(id => id !== assetId);
      } else {
        if (prev.length >= 4) return [...prev.slice(1), assetId]; // Max 4 side-by-side
        return [...prev, assetId];
      }
    });
  };

  const comparedAssets = campaign.assets.filter(a => selectedAssetIds.includes(a.id));

  // Benchmark truth for comparison row indicators
  const benchmarkPrice = campaign.approvedPrice ?? kb.products[0]?.currentPrice ?? 1299;
  const benchmarkDiscount = campaign.approvedDiscountPercent;
  const benchmarkPromoCode = campaign.approvedPromoCode?.toUpperCase();
  const benchmarkDate = campaign.endDate || '30 Nov 2026';
  const benchmarkLogo = kb.logos.find(l => l.status === 'Approved Current')?.version || 'Logo v3';
  const benchmarkTagline =
    campaign.category === 'Festive'
      ? 'Celebrate Your Natural Radiance.'
      : campaign.category === 'CSR & Public Health'
      ? 'Aurelia Community Care & Wellness.'
      : campaign.category === 'Winter / Seasonal'
      ? 'Deep Winter Barrier Protection.'
      : kb.tone.primaryTagline;
  const benchmarkCta = campaign.approvedCta || (isCsrCampaign(campaign) ? 'Register as Donor' : 'Shop Now');

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #E2E8F0',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      {/* Header with Title and Harmonize CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <span style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                Multi-Channel Side-by-Side Comparison Workspace
              </span>
              <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                Synchronized row-by-row verification across marketing channels. Comparing {comparedAssets.length} active creative touchpoints.
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={onHarmonizeAssets}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '9px',
              backgroundColor: '#16A34A',
              borderColor: '#15803D'
            }}
          >
            <Wand2 size={15} />
            <span>Harmonize Selected Channels</span>
          </button>
        </div>
      </div>

      {/* Asset Selection Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginRight: '6px' }}>
          Select Channels to Compare (2–4):
        </span>
        {campaign.assets.map(asset => {
          const isSelected = selectedAssetIds.includes(asset.id);
          const hasConflicts = asset.status === 'Conflicts Detected';
          return (
            <button
              key={asset.id}
              onClick={() => toggleAssetSelection(asset.id)}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '11.5px',
                fontWeight: 600,
                border: isSelected ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                color: isSelected ? '#1D4ED8' : '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{isSelected ? <Check size={12} /> : null}</span>
              <span>{asset.channel}: {asset.title}</span>
              {hasConflicts && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Synchronized Side-by-Side Comparison Table */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
              <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 800, color: '#475569', width: '180px' }}>
                Channel / Asset
              </th>
              {comparedAssets.map(asset => (
                <th
                  key={asset.id}
                  style={{
                    padding: '14px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#0F172A',
                    borderLeft: '1px solid #E2E8F0',
                    width: `${82 / comparedAssets.length}%`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#E2E8F0',
                        color: '#334155',
                        fontWeight: 700
                      }}
                    >
                      {asset.channel}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onInspectAssetInAuditor(asset)}
                      style={{ padding: '2px 8px', fontSize: '10.5px', height: '24px' }}
                      title="Open in Content Auditor with bounding-box pins"
                    >
                      <Eye size={12} />
                      <span>Audit</span>
                    </button>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '6px', color: '#0F172A' }}>
                    {asset.title}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* ROW 1: Creative Preview Thumbnail */}
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={14} color="#64748B" />
                  <span>Creative Artwork</span>
                </div>
              </td>
              {comparedAssets.map(asset => (
                <td key={asset.id} style={{ padding: '12px 16px', borderLeft: '1px solid #E2E8F0' }}>
                  {isValidImageUrl(asset.previewUrl) ? (
                    <div
                      style={{
                        width: '100%',
                        height: '110px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FAF5EF'
                      }}
                    >
                      <img
                        src={asset.previewUrl}
                        alt={asset.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '75px',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        border: '1px dashed #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '4px',
                        color: '#64748B',
                        fontSize: '11.5px'
                      }}
                    >
                      <FileText size={18} color="#94A3B8" />
                      <span>{asset.format} Copy Template</span>
                    </div>
                  )}
                </td>
              ))}
            </tr>

            {/* ROW 2: Price & Commercial Offer */}
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={14} color="#00473E" />
                  <span>Advertised Price</span>
                </div>
              </td>
              {comparedAssets.map(asset => {
                const isMismatch =
                  asset.extractedPrice !== undefined &&
                  asset.extractedPrice > 0 &&
                  asset.extractedPrice !== benchmarkPrice &&
                  campaign.category !== 'CSR & Public Health';
                return (
                  <td key={asset.id} style={{ padding: '12px 16px', borderLeft: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          color: isMismatch ? '#DC2626' : '#00473E'
                        }}
                      >
                        {campaign.category === 'CSR & Public Health'
                          ? 'Free / Non-Commercial'
                          : asset.extractedPriceStr || `₹${asset.extractedPrice || 'N/A'}`}
                      </span>
                      {isMismatch ? (
                        <span
                          className="badge badge-violation"
                          style={{ fontSize: '10px', padding: '1px 6px' }}
                        >
                          ≠ ₹{benchmarkPrice.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span
                          className="badge badge-success"
                          style={{ fontSize: '10px', padding: '1px 6px' }}
                        >
                          ✓ In Sync
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* ROW 3: Discount Percentage (If commercial campaign) */}
            {campaign.category !== 'CSR & Public Health' && (
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Percent size={14} color="#C89B3C" />
                    <span>Discount Rate</span>
                  </div>
                </td>
                {comparedAssets.map(asset => {
                  const discount = extractDiscountPercent(asset);
                  const isMismatch =
                    benchmarkDiscount !== undefined &&
                    discount !== undefined &&
                    discount !== benchmarkDiscount;
                  return (
                    <td key={asset.id} style={{ padding: '12px 16px', borderLeft: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: isMismatch ? '#DC2626' : '#0F172A' }}>
                          {discount ? `${discount}% OFF` : 'Standard Rate'}
                        </span>
                        {isMismatch && (
                          <span className="badge badge-violation" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            ≠ {benchmarkDiscount}% Standard
                          </span>
                        )}
                        {!isMismatch && discount && (
                          <span className="badge badge-success" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            ✓ Match
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* ROW 4: Promo Checkout Voucher Code */}
            {campaign.category !== 'CSR & Public Health' && (
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={14} color="#2563EB" />
                    <span>Checkout Promo Code</span>
                  </div>
                </td>
                {comparedAssets.map(asset => {
                  const code = extractPromoCode(asset);
                  const isMismatch =
                    benchmarkPromoCode &&
                    code &&
                    code !== benchmarkPromoCode;
                  return (
                    <td key={asset.id} style={{ padding: '12px 16px', borderLeft: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: isMismatch ? '#FEE2E2' : '#F1F5F9',
                            color: isMismatch ? '#DC2626' : '#2563EB'
                          }}
                        >
                          {code || 'No code required'}
                        </code>
                        {isMismatch && (
                          <span className="badge badge-violation" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            ≠ {benchmarkPromoCode}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* ROW 5: Validity Window / Event Date */}
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="#16A34A" />
                  <span>{isCsrCampaign(campaign) ? 'Event Date & Time' : 'Promotional Validity'}</span>
                </div>
              </td>
              {comparedAssets.map(asset => {
                const dateText = asset.extractedDate || 'Standard Term';
                const hasExpired =
                  dateText.includes('Expired') ||
                  dateText.includes('30 Sept') ||
                  dateText.includes('12 Nov') ||
                  dateText.includes('31 Oct') ||
                  dateText.includes('25 Dec');
                return (
                  <td key={asset.id} style={{ padding: '12px 16px', borderLeft: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: hasExpired ? '#DC2626' : '#334155'
                        }}
                      >
                        {dateText}
                      </span>
                      {hasExpired && (
                        <span className="badge badge-violation" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          Drift / Outdated
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* ROW 6: Call-to-Action (CTA) */}
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MousePointerClick size={14} color="#7C3AED" />
                  <span>Call to Action (CTA)</span>
                </div>
              </td>
              {comparedAssets.map(asset => {
                const cta = asset.extractedCta || 'Shop Now';
                const isCommercialViolation =
                  isCsrCampaign(campaign) &&
                  (/voucher|₹500|buy/i.test(cta) || /voucher|₹500/i.test(asset.fullText));
                return (
                  <td key={asset.id} style={{ padding: '12px 16px', borderLeft: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: isCommercialViolation ? '#DC2626' : '#475569'
                        }}
                      >
                        "{cta}"
                      </span>
                      {isCommercialViolation && (
                        <span className="badge badge-violation" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          Prohibited Perk
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* ROW 7: Slogan / Tagline */}
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#0F172A" />
                  <span>Headline Slogan</span>
                </div>
              </td>
              {comparedAssets.map(asset => {
                const tagline = asset.extractedTagline || 'N/A';
                const isUnapproved =
                  tagline.toLowerCase().includes('most loved') ||
                  tagline.toLowerCase().includes('miracle') ||
                  tagline.toLowerCase().includes('cure') ||
                  tagline.toLowerCase().includes('24 hours');
                return (
                  <td key={asset.id} style={{ padding: '12px 16px', borderLeft: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isUnapproved ? '#DC2626' : '#1E293B',
                          lineHeight: '1.4'
                        }}
                      >
                        "{tagline}"
                      </span>
                      {isUnapproved && (
                        <span className="badge badge-violation" style={{ fontSize: '10px', width: 'fit-content' }}>
                          Unapproved Superlative
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* ROW 8: Logo Version */}
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="#C89B3C" />
                  <span>Logo Mark</span>
                </div>
              </td>
              {comparedAssets.map(asset => {
                const logo = asset.extractedLogoVersion || 'Unknown';
                const isDeprecated =
                  logo.toLowerCase().includes('v2') ||
                  logo.toLowerCase().includes('deprecated') ||
                  logo.toLowerCase().includes('vintage');
                return (
                  <td key={asset.id} style={{ padding: '12px 16px', borderLeft: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: isDeprecated ? '#DC2626' : '#16A34A'
                        }}
                      >
                        {logo}
                      </span>
                      {isDeprecated && (
                        <span className="badge badge-violation" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          Deprecated
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* ROW 9: Mandatory Disclaimers */}
            <tr>
              <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} color="#2563EB" />
                  <span>Statutory Notice</span>
                </div>
              </td>
              {comparedAssets.map(asset => {
                const isMissing =
                  !asset.extractedDisclaimer ||
                  asset.extractedDisclaimer.toLowerCase().includes('missing') ||
                  asset.extractedDisclaimer.toLowerCase().includes('no');
                return (
                  <td key={asset.id} style={{ padding: '12px 16px', borderLeft: '1px solid #E2E8F0' }}>
                    {isMissing ? (
                      <span className="badge badge-violation" style={{ fontSize: '10.5px' }}>
                        Missing Mandatory Footnote
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#166534', fontStyle: 'italic', lineHeight: '1.4' }}>
                        "{asset.extractedDisclaimer}"
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

