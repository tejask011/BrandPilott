import React, { useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { BrandKnowledgeBase, TerminologyRule, MandatoryDisclaimer } from '../../types/brand';

interface TerminologyManagerProps {
  kb: BrandKnowledgeBase;
  onUpdateKb: (updated: BrandKnowledgeBase) => void;
}

export const TerminologyManager: React.FC<TerminologyManagerProps> = ({ kb, onUpdateKb }) => {
  const [activeSubTab, setActiveSubTab] = useState<'terminology' | 'disclaimers'>('terminology');

  // New Term Form state
  const [showTermModal, setShowTermModal] = useState(false);
  const [term, setTerm] = useState('');
  const [termType, setTermType] = useState<TerminologyRule['type']>('Banned');
  const [category, setCategory] = useState('Superlatives');
  const [suggestedAlternative, setSuggestedAlternative] = useState('');
  const [reason, setReason] = useState('');

  // New Disclaimer Form state
  const [showDiscModal, setShowDiscModal] = useState(false);
  const [discTitle, setDiscTitle] = useState('');
  const [discText, setDiscText] = useState('');
  const [triggerRule, setTriggerRule] = useState('');
  const [channels, setChannels] = useState('Instagram, Website, Print Brochure');

  const handleAddTerm = () => {
    if (!term.trim() || !reason.trim()) return;

    const newRule: TerminologyRule = {
      id: `term-${Date.now()}`,
      term: term.trim(),
      type: termType,
      category,
      suggestedAlternative: suggestedAlternative.trim(),
      reason: reason.trim(),
      approvalStatus: 'Enforced'
    };

    const updatedKb: BrandKnowledgeBase = {
      ...kb,
      terminology: [...kb.terminology, newRule],
      lastUpdated: new Date().toISOString()
    };
    onUpdateKb(updatedKb);
    setShowTermModal(false);
    setTerm('');
    setSuggestedAlternative('');
    setReason('');
  };

  const handleDeleteTerm = (id: string) => {
    const updatedKb: BrandKnowledgeBase = {
      ...kb,
      terminology: kb.terminology.filter(t => t.id !== id),
      lastUpdated: new Date().toISOString()
    };
    onUpdateKb(updatedKb);
  };

  const handleAddDisclaimer = () => {
    if (!discTitle.trim() || !discText.trim()) return;

    const newDisc: MandatoryDisclaimer = {
      id: `disc-${Date.now()}`,
      title: discTitle.trim(),
      disclaimerText: discText.trim(),
      requiredOnChannels: channels.split(',').map(c => c.trim()),
      triggerRule: triggerRule.trim() || 'Required on all promotional assets.',
      validUntil: '2027-12-31',
      isActive: true
    };

    const updatedKb: BrandKnowledgeBase = {
      ...kb,
      disclaimers: [...kb.disclaimers, newDisc],
      lastUpdated: new Date().toISOString()
    };
    onUpdateKb(updatedKb);
    setShowDiscModal(false);
    setDiscTitle('');
    setDiscText('');
    setTriggerRule('');
  };

  const handleDeleteDisclaimer = (id: string) => {
    const updatedKb: BrandKnowledgeBase = {
      ...kb,
      disclaimers: kb.disclaimers.filter(d => d.id !== id),
      lastUpdated: new Date().toISOString()
    };
    onUpdateKb(updatedKb);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
        <button
          className={`btn ${activeSubTab === 'terminology' ? 'btn-brand' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveSubTab('terminology')}
        >
          <Ban size={14} />
          <span>Approved & Banned Terminology ({kb.terminology.length})</span>
        </button>
        <button
          className={`btn ${activeSubTab === 'disclaimers' ? 'btn-brand' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveSubTab('disclaimers')}
        >
          <FileText size={14} />
          <span>Mandatory Disclaimers ({kb.disclaimers.length})</span>
        </button>
      </div>

      {activeSubTab === 'terminology' ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Ban size={16} color="#DC2626" />
              <span>Terminology Enforcement Dictionary</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowTermModal(true)}>
              <Plus size={14} />
              <span>Add Term Rule</span>
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Flagged Term</th>
                  <th>Category</th>
                  <th>Enforcement Reason & ASCI/CCPA Rule</th>
                  <th>Approved Replacement</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {kb.terminology.map(t => {
                  const isBanned = t.type === 'Banned';
                  return (
                    <tr key={t.id}>
                      <td>
                        <span className={`badge ${isBanned ? 'badge-violation' : 'badge-success'}`}>
                          {isBanned ? <Ban size={11} /> : <CheckCircle2 size={11} />}
                          <span>{t.type}</span>
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '13.5px', color: isBanned ? '#991B1B' : '#166534' }}>
                        "{t.term}"
                      </td>
                      <td>
                        <span className="badge badge-neutral">{t.category}</span>
                      </td>
                      <td style={{ maxWidth: '340px', fontSize: '12.5px', color: '#475569' }}>
                        {t.reason}
                      </td>
                      <td style={{ maxWidth: '280px', fontSize: '12.5px', color: '#00473E', fontWeight: 600 }}>
                        {t.suggestedAlternative ? `"${t.suggestedAlternative}"` : '—'}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-icon-only"
                          onClick={() => handleDeleteTerm(t.id)}
                          style={{ color: '#DC2626', padding: '4px 6px' }}
                          title="Delete Rule"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <FileText size={16} color="#00473E" />
              <span>Mandatory Disclaimers & Legal Footnotes</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowDiscModal(true)}>
              <Plus size={14} />
              <span>Add Disclaimer</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {kb.disclaimers.map(disc => (
              <div
                key={disc.id}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>
                      {disc.title}
                    </span>
                    <div style={{ fontSize: '11.5px', color: '#2563EB', marginTop: '2px', fontWeight: 600 }}>
                      Trigger: {disc.triggerRule}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-success">Active Requirement</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDeleteDisclaimer(disc.id)}
                      style={{ color: '#DC2626', padding: '2px 6px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#334155',
                    marginBottom: '10px'
                  }}
                >
                  {disc.disclaimerText}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748B' }}>
                  <strong>Required on channels:</strong>
                  {disc.requiredOnChannels.map((ch, idx) => (
                    <span key={idx} className="badge badge-neutral" style={{ textTransform: 'none' }}>
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Term Modal */}
      {showTermModal && (
        <div className="modal-overlay" onClick={() => setShowTermModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                Add Terminology Enforcement Rule
              </div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                onClick={() => setShowTermModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Flagged Term or Phrase</label>
                <input
                  className="form-input"
                  placeholder="e.g. results guaranteed in 7 days"
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Rule Type</label>
                  <select
                    className="form-select"
                    value={termType}
                    onChange={e => setTermType(e.target.value as any)}
                  >
                    <option value="Banned">Banned (Strict Violation)</option>
                    <option value="Restricted">Restricted (Requires Review)</option>
                    <option value="Approved">Approved Phrasing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    className="form-input"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Enforcement Rationale (Cited to ASCI/CCPA or Brand Policy)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Violates CCPA 2022 guidelines. Skincare cannot promise rapid medical cures without certification."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Suggested Compliant Alternative</label>
                <input
                  className="form-input"
                  placeholder="e.g. Clinically formulated for visible hydration improvement within 4 weeks*"
                  value={suggestedAlternative}
                  onChange={e => setSuggestedAlternative(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowTermModal(false)}>
                Cancel
              </button>
              <button className="btn btn-brand" onClick={handleAddTerm}>
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Disclaimer Modal */}
      {showDiscModal && (
        <div className="modal-overlay" onClick={() => setShowDiscModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                Add Mandatory Disclaimer
              </div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                onClick={() => setShowDiscModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Disclaimer Title</label>
                <input
                  className="form-input"
                  placeholder="e.g. Dermatological Test Fine Print"
                  value={discTitle}
                  onChange={e => setDiscTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mandatory Disclaimer Text</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. *Based on clinical study of 30 women over 4 weeks. Individual results may vary."
                  value={discText}
                  onChange={e => setDiscText(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Trigger Rule</label>
                <input
                  className="form-input"
                  placeholder="e.g. Required whenever clinical hydration results or timeframes are claimed"
                  value={triggerRule}
                  onChange={e => setTriggerRule(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Required Channels (comma separated)</label>
                <input
                  className="form-input"
                  value={channels}
                  onChange={e => setChannels(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDiscModal(false)}>
                Cancel
              </button>
              <button className="btn btn-brand" onClick={handleAddDisclaimer}>
                Add Disclaimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
