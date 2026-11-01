import React, { useState } from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  MessageSquare,
  Sparkles,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { AuditFinding, FindingCategory, ReviewDecision } from '../../types/audit';

interface ReviewIssuesPaneProps {
  findings: AuditFinding[];
  selectedFindingId: string | null;
  onSelectFinding: (findingId: string) => void;
  onOpenDecisionModal: (finding: AuditFinding, actionType: ReviewDecision) => void;
  overallScore: number;
  hasRunAudit?: boolean;
  onRunAudit?: () => void;
  isAuditing?: boolean;
  onQuickApplyFix?: (findingId: string) => void;
  onApplyAllFixes?: () => void;
}

export const ReviewIssuesPane: React.FC<ReviewIssuesPaneProps> = ({
  findings,
  selectedFindingId,
  onSelectFinding,
  onOpenDecisionModal,
  overallScore,
  hasRunAudit = false,
  onRunAudit,
  isAuditing = false,
  onQuickApplyFix,
  onApplyAllFixes
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filteredFindings = findings.filter(f => {
    if (filterCategory === 'ALL') return true;
    return f.category === filterCategory;
  });

  const ruleViolationsCount = findings.filter(f => f.category === 'Verified rule violation').length;
  const unverifiedClaimsCount = findings.filter(f => f.category === 'No supporting evidence found').length;
  const inconsistenciesCount = findings.filter(f => f.category === 'Potential inconsistency').length;

  const getCategoryBadgeClass = (category: FindingCategory) => {
    switch (category) {
      case 'Verified rule violation':
        return 'badge-violation';
      case 'No supporting evidence found':
        return 'badge-unverified';
      case 'Potential inconsistency':
        return 'badge-inconsistency';
      case 'Confirmed false claim':
        return 'badge-false';
      default:
        return 'badge-neutral';
    }
  };

  // State 1: Audit not yet triggered (clean, blank, eliminates confusion)
  if (!hasRunAudit) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: '#94A3B8',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '12px'
              }}
            >
              3
            </div>
            <div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                Review Issues & Evidence
              </span>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Awaiting Audit Execution
              </div>
            </div>
          </div>

          <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
            Pending Run
          </span>
        </div>

        {/* Clean, blank welcoming state */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 24px',
            backgroundColor: '#F8FAFC',
            borderRadius: '14px',
            border: '1.5px dashed #CBD5E1',
            textAlign: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#EFF6FF',
              border: '2px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB'
            }}
          >
            <Sparkles size={28} />
          </div>

          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              Ready for Evidence Audit
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748B', maxWidth: '340px', lineHeight: '1.5', margin: '0 auto' }}>
              Review findings and clinical evidence are kept blank until you trigger the audit. Click <strong>"Run Evidence Audit"</strong> to scan against Brand Memory.
            </div>
          </div>

          <div
            style={{
              width: '100%',
              maxWidth: '360px',
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '12px 16px',
              textAlign: 'left',
              fontSize: '11.5px',
              color: '#475569',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '2px' }}>Audit will evaluate:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#2563EB', fontWeight: 800 }}>•</span>
              <span>Catalog price verification (₹1,299 vs expired promo rates)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#2563EB', fontWeight: 800 }}>•</span>
              <span>ASCI & CCPA clinical evidence substantiation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#2563EB', fontWeight: 800 }}>•</span>
              <span>Active slogan vs retired slogans & approved tone</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#2563EB', fontWeight: 800 }}>•</span>
              <span>Logo asset version & mandatory legal disclaimers</span>
            </div>
          </div>

          {onRunAudit && (
            <button
              className="btn btn-primary"
              onClick={onRunAudit}
              disabled={isAuditing}
              style={{ padding: '10px 22px', fontSize: '13px', fontWeight: 700, borderRadius: '10px', marginTop: '4px' }}
            >
              <Sparkles size={15} />
              <span>{isAuditing ? 'Running Audit...' : 'Run Evidence Audit Now'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
      {/* Pane Header matching Image 2 & PDF Page 7 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#2563EB',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '12px'
            }}
          >
            3
          </div>
          <div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              Review Issues & Evidence
            </span>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              {findings.length} findings • {findings.filter(f => f.decision === 'PENDING').length} need human review
            </div>
          </div>
        </div>

        {/* Header Action & Audit Score Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onApplyAllFixes && findings.some(f => f.decision === 'PENDING') && (
            <button
              className="btn btn-brand btn-sm"
              onClick={onApplyAllFixes}
              style={{
                backgroundColor: '#16A34A',
                borderColor: '#16A34A',
                color: '#FFF',
                fontSize: '11px',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
              }}
              title="Apply all approved guideline fixes at once"
            >
              <Sparkles size={12} />
              <span>Apply All Fixes ({findings.filter(f => f.decision === 'PENDING').length})</span>
            </button>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: overallScore >= 80 ? '#F0FDF4' : overallScore >= 50 ? '#FFFBEB' : '#FEF2F2',
              padding: '5px 12px',
              borderRadius: '10px',
              border: `1px solid ${overallScore >= 80 ? '#BBF7D0' : overallScore >= 50 ? '#FDE68A' : '#FECACA'}`
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Compliance Score:</span>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: overallScore >= 80 ? '#16A34A' : overallScore >= 50 ? '#D97706' : '#DC2626'
              }}
            >
              {overallScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${filterCategory === 'ALL' ? 'btn-brand' : 'btn-secondary'}`}
          onClick={() => setFilterCategory('ALL')}
          style={{ fontSize: '11.5px', padding: '4px 10px' }}
        >
          All ({findings.length})
        </button>
        {ruleViolationsCount > 0 && (
          <button
            className={`btn btn-sm ${filterCategory === 'Verified rule violation' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setFilterCategory('Verified rule violation')}
            style={{ fontSize: '11.5px', padding: '4px 10px' }}
          >
            Violations ({ruleViolationsCount})
          </button>
        )}
        {unverifiedClaimsCount > 0 && (
          <button
            className={`btn btn-sm ${filterCategory === 'No supporting evidence found' ? 'btn-brand' : 'btn-secondary'}`}
            onClick={() => setFilterCategory('No supporting evidence found')}
            style={{ fontSize: '11.5px', padding: '4px 10px' }}
          >
            Unverified ({unverifiedClaimsCount})
          </button>
        )}
        {inconsistenciesCount > 0 && (
          <button
            className={`btn btn-sm ${filterCategory === 'Potential inconsistency' ? 'btn-brand' : 'btn-secondary'}`}
            onClick={() => setFilterCategory('Potential inconsistency')}
            style={{ fontSize: '11.5px', padding: '4px 10px' }}
          >
            Inconsistencies ({inconsistenciesCount})
          </button>
        )}
      </div>

      {/* Findings List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
        {filteredFindings.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              backgroundColor: '#F0FDF4',
              borderRadius: '12px',
              border: '1px solid #BBF7D0'
            }}
          >
            <CheckCircle2 size={36} color="#16A34A" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#166534' }}>
              Zero Compliance Violations Detected
            </div>
            <div style={{ fontSize: '12.5px', color: '#15803D', marginTop: '4px' }}>
              All prices, dates, claims, disclaimers, and tones align with the active Brand Knowledge Base!
            </div>
          </div>
        ) : (
          filteredFindings.map(finding => {
            const isSelected = selectedFindingId === finding.id;
            const isResolved = finding.decision !== 'PENDING';

            return (
              <div
                key={finding.id}
                onClick={() => onSelectFinding(finding.id)}
                style={{
                  border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  backgroundColor: isSelected ? '#F8FAFC' : '#FFFFFF',
                  padding: '16px',
                  boxShadow: isSelected ? '0 4px 14px rgba(37,99,235,0.12)' : '0 1px 4px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: finding.severity === 'HIGH' ? '#DC2626' : '#D97706',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 800
                      }}
                    >
                      {finding.pinNumber}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>
                        {finding.title}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                        <span className={`badge ${getCategoryBadgeClass(finding.category)}`} style={{ fontSize: '10px' }}>
                          {finding.category}
                        </span>
                        <span
                          className="badge"
                          style={{
                            fontSize: '10px',
                            backgroundColor: finding.severity === 'HIGH' ? '#FEE2E2' : '#FEF3C7',
                            color: finding.severity === 'HIGH' ? '#DC2626' : '#D97706'
                          }}
                        >
                          {finding.severity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isResolved ? (
                    <span className="badge badge-success" style={{ fontSize: '10px' }}>
                      <CheckCircle2 size={11} />
                      <span>{finding.decision}</span>
                    </span>
                  ) : (
                    <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                      Review Needed
                    </span>
                  )}
                </div>

                {/* VISUAL BEFORE VS AFTER DIFF (User requested: "can see the fix and where the error is") */}
                <div
                  className="diff-grid-container"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: '10px',
                    margin: '12px 0',
                    backgroundColor: '#F8FAFC',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  {/* Flagged Original Error */}
                  <div
                    style={{
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '6px',
                      padding: '8px 10px'
                    }}
                  >
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <XCircle size={11} />
                      <span>Current Flagged Error</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#991B1B', fontWeight: 600, textDecoration: 'line-through' }}>
                      {finding.flaggedText}
                    </div>
                  </div>

                  {/* Approved On-Brand Fix */}
                  <div
                    style={{
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '6px',
                      padding: '8px 10px'
                    }}
                  >
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={11} />
                      <span>Approved Fix (On-Brand)</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#00473E', fontWeight: 700 }}>
                      {finding.suggestedFix}
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: '1.5', marginBottom: '10px' }}>
                  {finding.explanation}
                </div>

                {/* Source Backlink Citation */}
                <div
                  style={{
                    backgroundColor: '#F1F5F9',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    fontSize: '11.5px',
                    color: '#475569',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: '#1E293B' }}>Source Truth: </span>
                    <span style={{ color: '#2563EB', fontWeight: 600 }}>{finding.approvedSource.title}</span>
                    {finding.approvedSource.validityNote && (
                      <span style={{ color: '#64748B' }}> • {finding.approvedSource.validityNote}</span>
                    )}
                  </div>
                  <ExternalLink size={12} color="#2563EB" />
                </div>

                {/* Human Review Decision Buttons */}
                {!isResolved ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      paddingTop: '10px',
                      borderTop: '1px solid #E2E8F0',
                      flexWrap: 'wrap'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="btn btn-brand btn-sm"
                      onClick={() => onQuickApplyFix ? onQuickApplyFix(finding.id) : onOpenDecisionModal(finding, 'ACCEPTED')}
                      style={{ padding: '6px 14px', fontSize: '12px', backgroundColor: '#16A34A', borderColor: '#16A34A', color: '#FFF' }}
                    >
                      <CheckCircle2 size={13} />
                      <span>Accept & Apply Fix</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenDecisionModal(finding, 'DISPUTED')}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      <MessageSquare size={13} />
                      <span>Dispute</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenDecisionModal(finding, 'ESCALATED')}
                      style={{ padding: '6px 12px', fontSize: '12px', color: '#DC2626' }}
                    >
                      <ShieldAlert size={13} />
                      <span>Escalate</span>
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#166534',
                      backgroundColor: '#F0FDF4',
                      border: '1.5px solid #86EFAC',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      marginTop: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} color="#16A34A" />
                      <div>
                        <div style={{ fontWeight: 800, color: '#166534' }}>
                          Fix Accepted & Applied to Preview
                        </div>
                        <div style={{ fontSize: '11px', color: '#15803D', marginTop: '2px' }}>
                          Approved Replacement: <strong>{finding.suggestedFix}</strong>
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '10px', padding: '3px 8px' }}>
                      Resolved
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
