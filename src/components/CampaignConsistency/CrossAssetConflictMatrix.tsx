import React from 'react';
import {
  CheckCircle2,
  Layers
} from 'lucide-react';
import { CampaignConflict } from '../../types/campaign';

interface CrossAssetConflictMatrixProps {
  conflicts: CampaignConflict[];
  onSelectConflict?: (conflict: CampaignConflict) => void;
}

export const CrossAssetConflictMatrix: React.FC<CrossAssetConflictMatrixProps> = ({
  conflicts,
  onSelectConflict
}) => {
  if (conflicts.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: '36px',
          textAlign: 'center',
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0'
        }}
      >
        <CheckCircle2 size={36} color="#16A34A" style={{ margin: '0 auto 8px' }} />
        <div style={{ fontWeight: 700, fontSize: '16px', color: '#166534' }}>
          Zero Cross-Asset Conflicts Detected
        </div>
        <div style={{ fontSize: '13px', color: '#15803D', marginTop: '4px' }}>
          All campaign assets are completely synchronized across prices, discount offers, expiry dates, taglines, and approved logos.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <Layers size={18} color="#2563EB" />
          <span>Cross-Asset Conflict Matrix ({conflicts.length} Inconsistencies Across Channels)</span>
        </div>
        <span className="badge badge-violation">Action Required Before Launch</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {conflicts.map(conflict => (
          <div
            key={conflict.id}
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '16px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              borderLeft: `4px solid ${conflict.severity === 'HIGH' ? '#DC2626' : '#D97706'}`
            }}
          >
            {/* Conflict Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: conflict.severity === 'HIGH' ? '#FEE2E2' : '#FEF3C7',
                      color: conflict.severity === 'HIGH' ? '#DC2626' : '#D97706'
                    }}
                  >
                    {conflict.type}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '14.5px', color: '#0F172A' }}>
                    {conflict.title}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '6px', lineHeight: '1.5' }}>
                  {conflict.description}
                </div>
              </div>

              <span
                className="badge"
                style={{
                  backgroundColor: conflict.severity === 'HIGH' ? '#DC2626' : '#D97706',
                  color: '#FFFFFF'
                }}
              >
                {conflict.severity} SEVERITY
              </span>
            </div>

            {/* Comparison Grid Across Involved Assets */}
            <div
              className="conflict-asset-columns"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                gap: '10px',
                margin: '12px 0',
                backgroundColor: '#F8FAFC',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0'
              }}
            >
              {conflict.involvedAssets.map((ia, idx) => {
                const valLower = ia.detectedValue.toLowerCase();
                const isConflicting =
                  conflict.involvedAssets.length === 1
                    ? true
                    : conflict.type === 'Price Discrepancy'
                    ? (() => {
                        const detectedNums = ia.detectedValue.replace(/[^0-9]/g, '');
                        const validPriceMatch = conflict.approvedTruth.validValue.match(/₹?([0-9,]+)/);
                        if (validPriceMatch) {
                          const approvedNum = validPriceMatch[1].replace(/,/g, '');
                          return detectedNums !== approvedNum;
                        }
                        return false;
                      })()
                    : valLower.includes('v2') ||
                      valLower.includes('deprecated') ||
                      valLower.includes('outdated') ||
                      valLower.includes('most loved') ||
                      valLower.includes('miracle') ||
                      valLower.includes('missing') ||
                      valLower.includes('expired') ||
                      valLower.includes('30 sept') ||
                      valLower.includes('warning') ||
                      valLower.includes('restricted') ||
                      valLower.includes('unverified');

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '10px',
                      backgroundColor: isConflicting ? '#FEF2F2' : '#FFFFFF',
                      borderRadius: '6px',
                      border: isConflicting ? '1px solid #FECACA' : '1px solid #E2E8F0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '10px', textTransform: 'none' }}>
                        {ia.channel}
                      </span>
                      {isConflicting ? (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#DC2626' }}>
                          Outdated / Conflict
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#16A34A' }}>
                          Approved
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{ia.assetTitle}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isConflicting ? '#991B1B' : '#0F172A', marginTop: '4px' }}>
                      {ia.detectedValue}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Approved Benchmark & Alignment Suggestion */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F0FDF4',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #BBF7D0',
                fontSize: '12px'
              }}
            >
              <div>
                <span style={{ fontWeight: 700, color: '#166534' }}>Approved Truth: </span>
                <span style={{ color: '#00473E', fontWeight: 600 }}>{conflict.approvedTruth.validValue}</span>
                <span style={{ color: '#475569' }}> (Ref: {conflict.approvedTruth.sourceDocument})</span>
              </div>
              <div style={{ fontWeight: 600, color: '#15803D' }}>
                {conflict.suggestedAlignment}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
