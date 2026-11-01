import React, { useState } from 'react';
import {
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Plus,
  Trash2,
  Search
} from 'lucide-react';
import { BrandKnowledgeBase, BackgroundRule } from '../../types/brand';

interface BackgroundSceneManagerProps {
  kb: BrandKnowledgeBase;
  onUpdateKb: (updated: BrandKnowledgeBase) => void;
}

export const BackgroundSceneManager: React.FC<BackgroundSceneManagerProps> = ({
  kb,
  onUpdateKb
}) => {
  const bgData = kb.backgroundGuidelines || {
    overview: 'All campaign and creative visual backdrops must reinforce Aurelia’s 100% Vegan, cruelty-free, clinical, and secular brand governance standards. Backgrounds must be calm, elegant, and free from sensitive, conflicting, or non-vegan elements.',
    approvedBackdrops: [
      'Pearl Cream (#F7F5F0) matte surface with gentle diffused sunlight',
      'Minimalist cosmetic laboratory glassware & sterile glass stands',
      'Fresh botanical leaves (e.g., Centella Asiatica, Green Tea flora)',
      'Clean bathroom marble counter / spa stone aesthetic',
      'Subtle Aurelia Emerald (#00473E) and gold tint studio backdrops'
    ],
    restrictedElements: []
  };

  const [testSceneText, setTestSceneText] = useState('');
  const [testResult, setTestResult] = useState<{
    hasWarning: boolean;
    findings: { ruleName: string; category: string; matchedKeyword: string; reason: string; fix: string }[];
  } | null>(null);

  // Add rule modal / form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState<'Meat / Non-Veg' | 'Animals' | 'Religion / Religious Symbols' | 'Raw Serum Elements' | 'Custom'>('Custom');
  const [newElementName, setNewElementName] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [newPolicyReason, setNewPolicyReason] = useState('');
  const [newSuggestedFix, setNewSuggestedFix] = useState('');

  const handleToggleRuleActive = (ruleId: string) => {
    const updatedRules = bgData.restrictedElements.map(r =>
      r.id === ruleId ? { ...r, isActive: !r.isActive } : r
    );
    const updatedKb: BrandKnowledgeBase = {
      ...kb,
      backgroundGuidelines: {
        ...bgData,
        restrictedElements: updatedRules
      },
      lastUpdated: new Date().toISOString()
    };
    onUpdateKb(updatedKb);
  };

  const handleAddRule = () => {
    if (!newElementName.trim() || !newKeywords.trim()) return;

    const newRule: BackgroundRule = {
      id: `bg-custom-${Date.now()}`,
      category: newCategory,
      elementName: newElementName.trim(),
      keywords: newKeywords.split(',').map(k => k.trim()).filter(Boolean),
      severity: 'WARNING',
      policyReason: newPolicyReason.trim() || 'Restricted visual element under Aurelia Brand Governance.',
      suggestedFix: newSuggestedFix.trim() || 'Use approved pearl cream or neutral botanical background.',
      isActive: true
    };

    const updatedKb: BrandKnowledgeBase = {
      ...kb,
      backgroundGuidelines: {
        ...bgData,
        restrictedElements: [...bgData.restrictedElements, newRule]
      },
      lastUpdated: new Date().toISOString()
    };
    onUpdateKb(updatedKb);

    setNewElementName('');
    setNewKeywords('');
    setNewPolicyReason('');
    setNewSuggestedFix('');
    setShowAddForm(false);
  };

  const handleRemoveRule = (ruleId: string) => {
    const updatedKb: BrandKnowledgeBase = {
      ...kb,
      backgroundGuidelines: {
        ...bgData,
        restrictedElements: bgData.restrictedElements.filter(r => r.id !== ruleId)
      },
      lastUpdated: new Date().toISOString()
    };
    onUpdateKb(updatedKb);
  };

  const handleRunSimulator = () => {
    if (!testSceneText.trim()) {
      setTestResult(null);
      return;
    }
    const lower = testSceneText.toLowerCase();
    const findings: { ruleName: string; category: string; matchedKeyword: string; reason: string; fix: string }[] = [];

    for (const rule of bgData.restrictedElements) {
      if (!rule.isActive) continue;
      for (const kw of rule.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          findings.push({
            ruleName: rule.elementName,
            category: rule.category,
            matchedKeyword: kw,
            reason: rule.policyReason,
            fix: rule.suggestedFix
          });
          break;
        }
      }
    }

    setTestResult({
      hasWarning: findings.length > 0,
      findings
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SECTION 1: HEADER & OVERVIEW BANNER */}
      <div
        className="curved-section-box"
        style={{
          border: '2px solid #00473E',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(0, 71, 62, 0.08)'
        }}
      >
        <div className="curved-section-header">
          <div className="curved-section-title">
            <ImageIcon size={22} color="#00473E" />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#00473E' }}>
                Brand Visual Scene & Background Image Guidelines (Brand Memory v{kb.activeVersion})
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 400 }}>
                Defines permissible backdrops and strictly restricts scene elements like meat, animals, religious iconography, and raw serum chemical formulas to safeguard brand safety.
              </div>
            </div>
          </div>
          <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: '12px' }}>
            <CheckCircle2 size={13} />
            <span>Enforced in Campaign & Auditor</span>
          </span>
        </div>

        {/* Brand Governance Notice Box */}
        <div
          style={{
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1.5px solid #FACC15',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginTop: '8px'
          }}
        >
          <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '12.5px', color: '#854D0E', lineHeight: '1.55' }}>
            <strong>Mandatory Governance Policy:</strong> Under Aurelia Brand Memory standards, any marketing creative whose background image depicts <strong>meat / non-veg food, domestic or wild animals, religious symbols / places of worship</strong>, or <strong>raw unapproved chemical elements in serum</strong> triggers an automatic <strong>Warning Status (`⚠️ WARNING`)</strong> during Campaign and Creative audits.
          </div>
        </div>
      </div>

      {/* SECTION 2: THE RESTRICTED BACKGROUND ELEMENTS GRID */}
      <div className="curved-section-box">
        <div className="curved-section-header">
          <div className="curved-section-title">
            <ShieldAlert size={20} color="#DC2626" />
            <div>
              <span style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A' }}>
                Restricted Background Elements & Warning Triggers ({bgData.restrictedElements.length} Rules Enforced)
              </span>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                These elements trigger a Warning Status when detected anywhere in the background of a campaign creative.
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={14} />
            <span>Add Custom Background Rule</span>
          </button>
        </div>

        {/* Add Rule Form */}
        {showAddForm && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #FECACA',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#991B1B' }}>
              Add New Background Restriction Rule
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '10px' }}>
              <div>
                <label className="form-label">Rule Element Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Alcohol / Tobacco bottles in background"
                  value={newElementName}
                  onChange={e => setNewElementName(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                >
                  <option value="Meat / Non-Veg">Meat / Non-Veg</option>
                  <option value="Animals">Animals</option>
                  <option value="Religion / Religious Symbols">Religion / Religious Symbols</option>
                  <option value="Raw Serum Elements">Raw Serum Elements</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Keywords to Scan (comma-separated)</label>
              <input
                className="form-input"
                placeholder="e.g. wine, beer, alcohol, cigarette, tobacco"
                value={newKeywords}
                onChange={e => setNewKeywords(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '10px' }}>
              <div>
                <label className="form-label">Policy Reason</label>
                <input
                  className="form-input"
                  placeholder="e.g. Incompatible with clinical skincare wellness image"
                  value={newPolicyReason}
                  onChange={e => setNewPolicyReason(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Suggested Alternative / Fix</label>
                <input
                  className="form-input"
                  placeholder="e.g. Replace with clean herbal tea glassware or botanical leaves"
                  value={newSuggestedFix}
                  onChange={e => setNewSuggestedFix(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button className="btn btn-brand btn-sm" onClick={handleAddRule}>
                Save Background Rule
              </button>
            </div>
          </div>
        )}

        {/* Rules Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {bgData.restrictedElements.map(rule => {
            const isMeat = rule.category === 'Meat / Non-Veg';
            const isAnimal = rule.category === 'Animals';
            const isReligion = rule.category === 'Religion / Religious Symbols';
            const isSerum = rule.category === 'Raw Serum Elements';

            const iconBadge = isMeat ? '🥩' : isAnimal ? '🐾' : isReligion ? '🏛️' : isSerum ? '🧪' : '⚠️';
            const cardBg = rule.isActive ? '#FFFDF5' : '#F8FAFC';
            const cardBorder = rule.isActive ? '1.5px solid #FDE68A' : '1px solid #E2E8F0';

            return (
              <div
                key={rule.id}
                style={{
                  border: cardBorder,
                  borderRadius: '14px',
                  backgroundColor: cardBg,
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: rule.isActive ? '0 2px 8px rgba(217, 119, 6, 0.06)' : 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{iconBadge}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#0F172A' }}>
                          {rule.elementName}
                        </div>
                        <span className="badge badge-neutral" style={{ fontSize: '10px', marginTop: '2px' }}>
                          Category: {rule.category}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: rule.isActive ? '#FEF3C7' : '#F1F5F9',
                          color: rule.isActive ? '#B45309' : '#64748B',
                          border: rule.isActive ? '1px solid #FCD34D' : '1px solid #CBD5E1',
                          fontWeight: 700,
                          fontSize: '11px'
                        }}
                      >
                        ⚠️ WARNING STATUS
                      </span>

                      {rule.id.startsWith('bg-custom') && (
                        <button
                          onClick={() => handleRemoveRule(rule.id)}
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '2px' }}
                          title="Remove custom rule"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: '1.5', marginBottom: '12px' }}>
                    <strong>Policy Reason:</strong> {rule.policyReason}
                  </div>

                  {/* Scanned Keywords */}
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Detected Keywords:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {rule.keywords.map((kw, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '11px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '4px',
                            padding: '1px 6px',
                            color: '#475569'
                          }}
                        >
                          "{kw}"
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Fix */}
                  <div
                    style={{
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11.5px',
                      color: '#166534'
                    }}
                  >
                    <strong>Approved Alignment:</strong> {rule.suggestedFix}
                  </div>
                </div>

                {/* Footer Switch */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <span style={{ fontSize: '12px', color: rule.isActive ? '#15803D' : '#94A3B8', fontWeight: 600 }}>
                    {rule.isActive ? '● Rule Active in Audits' : '○ Rule Paused'}
                  </span>

                  <button
                    className={`btn btn-sm ${rule.isActive ? 'btn-secondary' : 'btn-brand'}`}
                    style={{ padding: '3px 10px', fontSize: '11px' }}
                    onClick={() => handleToggleRuleActive(rule.id)}
                  >
                    {rule.isActive ? 'Pause Rule' : 'Activate Rule'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: APPROVED BRAND BACKDROP AESTHETICS */}
      <div className="curved-section-box">
        <div className="curved-section-header">
          <div className="curved-section-title">
            <CheckCircle2 size={20} color="#16A34A" />
            <div>
              <span style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A' }}>
                Approved Brand Backdrop Aesthetics ({bgData.approvedBackdrops.length} Standard Palettes)
              </span>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Official staging environments certified for Aurelia Skincare product photography and graphics.
              </div>
            </div>
          </div>
          <span className="badge badge-success">Approved Standard</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
          {bgData.approvedBackdrops.map((backdrop, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: idx === 0 ? '#F7F5F0' : idx === 1 ? '#E2E8F0' : idx === 2 ? '#DCFCE7' : '#00473E',
                  border: '1px solid #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: idx === 3 ? '#FFF' : '#00473E',
                  fontWeight: 800,
                  fontSize: '12px',
                  flexShrink: 0
                }}
              >
                ✓
              </div>
              <span style={{ fontSize: '12.5px', color: '#1E293B', fontWeight: 500 }}>
                {backdrop}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: INTERACTIVE BACKGROUND SCENE TEST SIMULATOR */}
      <div
        className="curved-section-box"
        style={{
          border: '1.5px solid #2563EB',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)'
        }}
      >
        <div className="curved-section-header">
          <div className="curved-section-title">
            <Search size={20} color="#2563EB" />
            <div>
              <span style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A' }}>
                Interactive Background Image Scene Scanner Simulator
              </span>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Test image backdrop descriptions or creative staging copy against Brand Memory to see live warning triggers.
              </div>
            </div>
          </div>
          <span className="badge badge-inconsistency">Live Test Bench</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Quick Preset Tests:</span>
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 8px', fontSize: '11px' }}
              onClick={() => setTestSceneText('Product photo in cozy living room with golden retriever pet dog lying on carpet')}
            >
              🐾 Pet Dog Backdrop
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 8px', fontSize: '11px' }}
              onClick={() => setTestSceneText('Moisturizer flat lay on outdoor picnic table next to barbecue grill and chicken steak')}
            >
              🥩 Meat / BBQ Grill
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 8px', fontSize: '11px' }}
              onClick={() => setTestSceneText('Creative poster with traditional prayer altar and temple religious shrine in background')}
            >
              🏛️ Religious Shrine
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 8px', fontSize: '11px' }}
              onClick={() => setTestSceneText('Vitamin C serum dropper showing floating raw chemical element formula and H2SO4 acid molecules')}
            >
              🧪 Raw Chemical Element in Serum
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 8px', fontSize: '11px' }}
              onClick={() => setTestSceneText('Aurelia moisturizer placed on clean pearl cream bathroom marble with fresh green tea leaves')}
            >
              ✓ Clean Approved Scene
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Describe what is in the background image (e.g. 'Serum on glass table with pet cat and meat plate in background')..."
              value={testSceneText}
              onChange={e => setTestSceneText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRunSimulator()}
            />
            <button
              className="btn btn-primary"
              onClick={handleRunSimulator}
            >
              <Search size={15} />
              <span>Scan Background Scene</span>
            </button>
          </div>

          {/* Test Results Output */}
          {testResult && (
            <div
              style={{
                marginTop: '10px',
                padding: '16px',
                borderRadius: '12px',
                border: testResult.hasWarning ? '1.5px solid #F59E0B' : '1.5px solid #10B981',
                backgroundColor: testResult.hasWarning ? '#FFFDF5' : '#F0FDF4'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {testResult.hasWarning ? (
                    <AlertTriangle size={18} color="#D97706" />
                  ) : (
                    <CheckCircle2 size={18} color="#10B981" />
                  )}
                  <span style={{ fontWeight: 800, fontSize: '14px', color: testResult.hasWarning ? '#B45309' : '#047857' }}>
                    {testResult.hasWarning
                      ? `⚠️ WARNING STATUS: ${testResult.findings.length} Restricted Background Element(s) Detected`
                      : '✓ CLEAN: Backdrop complies with Brand Memory Visual Standards'}
                  </span>
                </div>

                <span
                  className="badge"
                  style={{
                    backgroundColor: testResult.hasWarning ? '#FEF3C7' : '#D1FAE5',
                    color: testResult.hasWarning ? '#92400E' : '#065F46',
                    fontWeight: 700
                  }}
                >
                  {testResult.hasWarning ? 'WARNING STATUS' : 'APPROVED STATUS'}
                </span>
              </div>

              {testResult.hasWarning && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {testResult.findings.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #FDE68A',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ color: '#92400E' }}>
                          [{f.category}] {f.ruleName} — Matched keyword: "{f.matchedKeyword}"
                        </strong>
                        <span className="badge badge-violation" style={{ fontSize: '10px' }}>
                          Warning Trigger
                        </span>
                      </div>
                      <div style={{ color: '#475569', marginBottom: '4px' }}>
                        <strong>Reason:</strong> {f.reason}
                      </div>
                      <div style={{ color: '#166534', fontWeight: 600 }}>
                        <strong>Actionable Fix:</strong> {f.fix}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
