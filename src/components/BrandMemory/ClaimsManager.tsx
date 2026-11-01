import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Calendar,
  Plus,
  Trash2,
  Award
} from 'lucide-react';
import { BrandKnowledgeBase, ApprovedClaim } from '../../types/brand';

interface ClaimsManagerProps {
  kb: BrandKnowledgeBase;
  onUpdateKb: (updated: BrandKnowledgeBase) => void;
}

export const ClaimsManager: React.FC<ClaimsManagerProps> = ({ kb, onUpdateKb }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [claimText, setClaimText] = useState('');
  const [category, setCategory] = useState<ApprovedClaim['category']>('Efficacy');
  const [supportingEvidence, setSupportingEvidence] = useState('');
  const [studyReference, setStudyReference] = useState('');
  const [validUntil, setValidUntil] = useState('2027-12-31');
  const [regulatoryTag, setRegulatoryTag] = useState('ASCI Rule 1.4 Validated');

  const handleAddClaim = () => {
    if (!claimText.trim() || !studyReference.trim()) return;

    const newClaim: ApprovedClaim = {
      id: `cl-${Date.now()}`,
      claimText: claimText.trim(),
      category,
      supportingEvidence: supportingEvidence.trim() || 'Internal laboratory efficacy verification dossier.',
      studyReference: studyReference.trim(),
      validFrom: new Date().toISOString().split('T')[0],
      validUntil,
      approvalStatus: 'Approved',
      regulatoryTag
    };

    const updatedKb: BrandKnowledgeBase = {
      ...kb,
      claims: [...kb.claims, newClaim],
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Arjun (Brand Manager)'
    };

    onUpdateKb(updatedKb);
    setShowAddModal(false);
    setClaimText('');
    setSupportingEvidence('');
    setStudyReference('');
  };

  const handleDeleteClaim = (id: string) => {
    const updatedKb: BrandKnowledgeBase = {
      ...kb,
      claims: kb.claims.filter(c => c.id !== id),
      lastUpdated: new Date().toISOString()
    };
    onUpdateKb(updatedKb);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '10px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="#2563EB" />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1E40AF' }}>
              Approved Promotional Claims & Substantiation Library
            </span>
            <span className="badge badge-inconsistency">Clinical Evidence Vault</span>
          </div>
          <div style={{ fontSize: '12.5px', color: '#1E3A8A', marginTop: '4px' }}>
            Under ASCI and CCPA rules, promotional statements must cite verified empirical studies. If a marketing draft makes a claim without evidence in this library, BrandPilot flags it as "No supporting evidence found".
          </div>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} />
          <span>Add Approved Claim</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>
        {kb.claims.map(claim => (
          <div
            key={claim.id}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderLeft: '4px solid #2563EB'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="badge badge-inconsistency">{claim.category}</span>
                <span className="badge badge-success">
                  <ShieldCheck size={12} />
                  <span>{claim.approvalStatus}</span>
                </span>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                "{claim.claimText}"
              </div>

              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                  color: '#334155',
                  marginBottom: '10px'
                }}
              >
                <div style={{ fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FileText size={13} />
                  <span>Clinical Trial / Lab Evidence:</span>
                </div>
                <div>{claim.supportingEvidence}</div>
                <div style={{ marginTop: '6px', fontWeight: 600, color: '#2563EB' }}>
                  Dossier Ref: {claim.studyReference}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid #E2E8F0',
                fontSize: '11.5px',
                color: '#64748B'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} />
                <span>Valid until: <strong>{claim.validUntil}</strong></span>
                <span style={{ margin: '0 4px' }}>•</span>
                <span style={{ color: '#16A34A', fontWeight: 600 }}>{claim.regulatoryTag}</span>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDeleteClaim(claim.id)}
                style={{ padding: '3px 8px', color: '#DC2626' }}
                title="Archive / Remove Claim"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                Register Approved Claim with Clinical Evidence
              </div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Approved Promotional Statement</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Provides up to 72 hours of clinically proven cellular hydration"
                  value={claimText}
                  onChange={e => setClaimText(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Claim Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                  >
                    <option value="Efficacy">Efficacy</option>
                    <option value="Safety">Safety</option>
                    <option value="Clinical">Clinical</option>
                    <option value="Ingredients">Ingredients</option>
                    <option value="Sustainability">Sustainability</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Study / Dossier Reference ID</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Clinical Trial #HT-402"
                    value={studyReference}
                    onChange={e => setStudyReference(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Substantiating Clinical / Lab Summary</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Double-blind placebo controlled study on 30 female participants over 28 days with corneometer measurement."
                  value={supportingEvidence}
                  onChange={e => setSupportingEvidence(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Regulatory Tag</label>
                  <input
                    className="form-input"
                    value={regulatoryTag}
                    onChange={e => setRegulatoryTag(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Evidence Expiry / Valid Until</label>
                  <input
                    type="date"
                    className="form-input"
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn btn-brand" onClick={handleAddClaim}>
                Register Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
