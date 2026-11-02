import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { CampaignAsset } from '../../types/campaign';
import { isValidImageUrl } from '../../services/imageStorage';

interface AssetCardsGridProps {
  assets: CampaignAsset[];
  onInspectAsset?: (asset: CampaignAsset) => void;
  onEditAsset?: (asset: CampaignAsset) => void;
}

export const AssetCardsGrid: React.FC<AssetCardsGridProps> = ({
  assets,
  onInspectAsset
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
          Campaign Multi-Channel Asset Roster ({assets.length} Assets)
        </h3>
        <span style={{ fontSize: '12px', color: '#64748B' }}>
          Audited as a unified set across all publication endpoints
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
        {assets.map(asset => {
          const hasConflicts = asset.status === 'Conflicts Detected' || asset.auditStatus === 'Blocked';
          const needsRecheck = asset.status === 'Needs Recheck' || asset.auditStatus === 'Needs Review';
          const hasImage = isValidImageUrl(asset.previewUrl);

          return (
            <div
              key={asset.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: `4px solid ${hasConflicts ? '#DC2626' : needsRecheck ? '#F59E0B' : '#16A34A'
                  }`
              }}
            >
              <div>
                {/* Optional Creative Image Thumbnail */}
                {hasImage && (
                  <div
                    style={{
                      width: '100%',
                      height: '140px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '10px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FAF5EF'
                    }}
                  >
                    <img
                      src={asset.previewUrl}
                      alt={asset.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                )}

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span className="badge badge-neutral" style={{ fontSize: '10.5px', textTransform: 'none', marginBottom: '4px' }}>
                      {asset.channel}
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>
                      {asset.title}
                    </div>
                  </div>

                  <span
                    className={`badge ${hasConflicts
                        ? 'badge-violation'
                        : needsRecheck
                          ? 'badge-unverified'
                          : 'badge-success'
                      }`}
                  >
                    {hasConflicts ? (
                      <>
                        <AlertTriangle size={11} />
                        <span>{asset.conflictCount > 0 ? `${asset.conflictCount} Conflicts` : 'Blocked'}</span>
                      </>
                    ) : needsRecheck ? (
                      <>
                        <RefreshCw size={11} />
                        <span>Needs Recheck</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={11} />
                        <span>In Sync</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Extracted Key Facts */}
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '12px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Extracted Price:</span>
                    <strong
                      style={{
                        color: hasConflicts ? '#DC2626' : '#00473E'
                      }}
                    >
                      {asset.extractedPriceStr || 'None'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Logo Version:</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: asset.extractedLogoVersion?.includes('v2') || asset.extractedLogoVersion?.includes('Deprecated')
                          ? '#DC2626'
                          : '#16A34A'
                      }}
                    >
                      {asset.extractedLogoVersion || 'Unknown'}
                    </span>
                  </div>

                  {asset.auditStatus && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748B' }}>Audit Status:</span>
                      <span
                        className={`badge ${asset.auditStatus === 'Blocked'
                            ? 'badge-violation'
                            : asset.auditStatus === 'Needs Review'
                              ? 'badge-unverified'
                              : 'badge-success'
                          }`}
                        style={{ fontSize: '10px' }}
                      >
                        {asset.auditStatus}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Offer / Promo:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>
                      {asset.extractedOffer || 'Standard rate'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Validity Window:</span>
                    <span style={{ color: '#475569' }}>{asset.extractedDate || 'N/A'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Mandatory Disclaimer:</span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: asset.extractedDisclaimer?.includes('Missing') ? '#DC2626' : '#16A34A'
                      }}
                    >
                      {asset.extractedDisclaimer?.includes('Missing') ? 'Missing' : 'Present'}
                    </span>
                  </div>
                </div>

                {/* Excerpt */}
                <div
                  style={{
                    fontSize: '11.5px',
                    color: '#64748B',
                    lineHeight: '1.4',
                    maxHeight: '44px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '10px'
                  }}
                >
                  "{asset.fullText.slice(0, 110)}..."
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '10px',
                  borderTop: '1px solid #E2E8F0',
                  fontSize: '11.5px'
                }}
              >
                <span style={{ color: '#94A3B8' }}>Format: {asset.format}</span>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onInspectAsset?.(asset)}
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  <ExternalLink size={12} />
                  <span>Inspect in Auditor</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
