import React, { useState, useMemo } from 'react';
import {
  Layers,
  RefreshCw,
  Plus,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Palette,
  Tag,
  Mic2,
  Users,
  Eye,
  Image as ImageIcon,
  Wand2,
  Grid,
  Sparkles,
  Calendar,
  Percent,
  Key,
  HeartHandshake,
  Snowflake,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Campaign, CampaignAsset, TeamCampaignBatch } from '../../types/campaign';
import { BrandKnowledgeBase } from '../../types/brand';
import { auditCampaignConsistency, autoAlignCampaignAssets, isCsrCampaign } from '../../services/campaignEngine';
import { saveCampaign, PRESET_CAMPAIGNS } from '../../services/storageService';
import { isValidImageUrl } from '../../services/imageStorage';
import { AssetCardsGrid } from './AssetCardsGrid';
import { AddAssetModal } from './AddAssetModal';
import { CrossAssetConflictMatrix } from './CrossAssetConflictMatrix';
import { SideBySideComparator } from './SideBySideComparator';
import { ReadinessScoreCard } from './ReadinessScoreCard';

interface CampaignConsistencyViewProps {
  campaign: Campaign;
  allCampaigns?: Campaign[];
  onSelectCampaign?: (campaignId: string) => void;
  kb: BrandKnowledgeBase;
  onUpdateCampaign: (updated: Campaign) => void;
  onInspectAssetInAuditor: (asset: CampaignAsset) => void;
}

export const CampaignConsistencyView: React.FC<CampaignConsistencyViewProps> = ({
  campaign,
  allCampaigns,
  onSelectCampaign,
  kb,
  onUpdateCampaign,
  onInspectAssetInAuditor
}) => {
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'comparator' | 'batches' | 'grid'>('comparator');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuditingBatches, setIsAuditingBatches] = useState(false);
  const [hasAuditedCampaign, setHasAuditedCampaign] = useState(true);
  const [alignmentSuccessMessage, setAlignmentSuccessMessage] = useState<string | null>(null);

  const availableCampaigns = allCampaigns && allCampaigns.length > 0 ? allCampaigns : PRESET_CAMPAIGNS;

  // Derived baseline from Module 1 Knowledge Base or Campaign Targets
  const benchmarkTagline =
    campaign.category === 'Festive'
      ? 'Celebrate Your Natural Radiance.'
      : campaign.category === 'CSR & Public Health'
      ? 'Aurelia Community Care & Wellness.'
      : campaign.category === 'Winter / Seasonal'
      ? 'Deep Winter Barrier Protection.'
      : kb.tone.primaryTagline;

  const benchmarkLogo = kb.logos.find(l => l.status === 'Approved Current')?.version || 'v3.0';

  const benchmarkDisclaimer = isCsrCampaign(campaign)
    ? '*Voluntary non-remunerated blood donation conducted in strict partnership with Armed Forces Transfusion Centre under NBTC guidelines. Zero commercial compensation provided.'
    : kb.disclaimers[0]?.disclaimerText || '*Based on clinical trial of 30 women over 4 weeks.';

  // Run dynamic audit against campaign assets and knowledge base
  const { conflicts, updatedAssets } = useMemo(() => {
    return auditCampaignConsistency(campaign, kb);
  }, [campaign, kb]);

  // Group assets into Team Batches
  const batches: TeamCampaignBatch[] = useMemo(() => {
    const knownTeams = [
      { name: 'Team Creative Pulse', role: 'Social Media & Influencer Agency' },
      { name: 'Team Metro Print & Retail', role: 'Offline Print & Store Display Agency' },
      { name: 'Team Growth & CRM Pod', role: 'In-House Digital & CRM Agency' }
    ];

    const teamMap = new Map<string, { role: string; assets: CampaignAsset[] }>();
    knownTeams.forEach(t => teamMap.set(t.name, { role: t.role, assets: [] }));

    updatedAssets.forEach(asset => {
      const team = asset.teamName || 'Team Growth & CRM Pod';
      if (!teamMap.has(team)) {
        teamMap.set(team, { role: 'Multi-Channel Production Team', assets: [] });
      }
      teamMap.get(team)!.assets.push(asset);
    });

    return Array.from(teamMap.entries()).map(([teamName, data], idx) => {
      const faultCount = data.assets.filter(a => a.status === 'Conflicts Detected').length;
      return {
        id: `batch-${idx + 1}`,
        teamName,
        role: data.role,
        status: faultCount > 0 ? ('Conflicts Detected' as const) : ('In Sync' as const),
        faultCount,
        assets: data.assets
      };
    });
  }, [updatedAssets]);

  const activeBatch = batches[activeBatchIndex] || batches[0] || {
    id: 'batch-default',
    teamName: 'Team Creative Pulse',
    role: 'Production Team',
    status: 'In Sync',
    faultCount: 0,
    assets: []
  };

  const handleReviewCampaignBatches = () => {
    setIsAuditingBatches(true);
    setTimeout(() => {
      setIsAuditingBatches(false);
      setHasAuditedCampaign(true);
    }, 450);
  };

  const handleAutoAlignAll = () => {
    const { updatedCampaign, alignedCount } = autoAlignCampaignAssets(campaign, kb);
    onUpdateCampaign(updatedCampaign);
    saveCampaign(updatedCampaign);
    setAlignmentSuccessMessage(
      `⚡ Successfully auto-aligned ${alignedCount} creative assets for "${campaign.name}"! Discrepant prices, discount rates, promo codes, dates, and regulatory disclaimers have been harmonized.`
    );
    setTimeout(() => setAlignmentSuccessMessage(null), 5000);
  };

  const handleAutoAlignBatch = (teamName: string) => {
    const batchAssets = campaign.assets.filter(a => a.teamName === teamName);
    const subCampaign: Campaign = {
      ...campaign,
      assets: batchAssets
    };
    const { updatedCampaign: alignedSub } = autoAlignCampaignAssets(subCampaign, kb);
    const alignedMap = new Map(alignedSub.assets.map(a => [a.id, a]));

    const newAssets = campaign.assets.map(a => (alignedMap.has(a.id) ? alignedMap.get(a.id)! : a));
    const reaudited = auditCampaignConsistency({ ...campaign, assets: newAssets }, kb);
    const updatedCampaign: Campaign = {
      ...campaign,
      assets: reaudited.updatedAssets,
      conflicts: reaudited.conflicts,
      lastRecheckedAt: new Date().toISOString()
    };
    onUpdateCampaign(updatedCampaign);
    saveCampaign(updatedCampaign);
  };

  const handleAddAsset = (newAsset: CampaignAsset) => {
    const newAssets = [...campaign.assets, newAsset];
    const reaudited = auditCampaignConsistency({ ...campaign, assets: newAssets }, kb);
    const updatedCampaign: Campaign = {
      ...campaign,
      assets: reaudited.updatedAssets,
      conflicts: reaudited.conflicts,
      lastRecheckedAt: new Date().toISOString()
    };
    onUpdateCampaign(updatedCampaign);
    saveCampaign(updatedCampaign);
  };

  const getCampaignIcon = (cat?: string) => {
    switch (cat) {
      case 'Festive':
        return <Sparkles size={16} color="#C89B3C" />;
      case 'CSR & Public Health':
        return <HeartHandshake size={16} color="#DC2626" />;
      case 'Winter / Seasonal':
        return <Snowflake size={16} color="#0284C7" />;
      default:
        return <Layers size={16} color="#00473E" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* CAMPAIGN SWITCHER CARD: BATCHES BASED ON REAL CAMPAIGN TYPES */}
      <div
        className="curved-section-box"
        style={{
          border: '1.5px solid #CBD5E1',
          backgroundColor: '#FFFFFF',
          padding: '20px 24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#00473E" />
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                Active Multi-Channel Campaign Preset
              </span>
              <span className="badge badge-brand" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                {campaign.category || 'Commercial Launch'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Switch between campaign presets to review tailored multi-channel assets (Festive, Blood Donation CSR, Winter, or Autumn Launch).
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>Schedule:</span>
            <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
              <Calendar size={12} style={{ marginRight: '4px' }} />
              {campaign.startDate} to {campaign.endDate}
            </span>
          </div>
        </div>

        {/* 4 Campaign Preset Switcher Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
          {availableCampaigns.map(c => {
            const isSelected = c.id === campaign.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCampaign && onSelectCampaign(c.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #00473E' : '1px solid #E2E8F0',
                  backgroundColor: isSelected ? '#F0FDF4' : '#F8FAFC',
                  boxShadow: isSelected ? '0 2px 8px rgba(0, 71, 62, 0.12)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getCampaignIcon(c.category)}
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: isSelected ? '#00473E' : '#0F172A' }}>
                      {c.name.replace('Aurelia ', '')}
                    </span>
                  </div>
                  {isSelected && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  {c.category === 'Festive'
                    ? 'Diwali festive offers • DIWALI25'
                    : c.category === 'CSR & Public Health'
                    ? 'Blood donation drive • NBTC ethics'
                    : c.category === 'Winter / Seasonal'
                    ? 'Winter hydration duo • WINTERFEST'
                    : 'Moisturizer launch • Standard catalog'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #CBD5E1' }}>
                  <span style={{ fontSize: '10.5px', color: '#475569', fontWeight: 600 }}>{c.assets.length} Channels</span>
                  <span style={{ fontSize: '10px', color: isSelected ? '#15803D' : '#64748B', fontWeight: 700 }}>
                    {isSelected ? '✓ Active Preset' : 'Switch →'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CAMPAIGN LAUNCH READINESS SCORE */}
      <ReadinessScoreCard
        campaign={campaign}
        kb={kb}
        onInspectAsset={onInspectAssetInAuditor}
      />

      {/* SECTION 1: ADMIN BENCHMARK STANDARD DYNAMICALLY DERIVED */}
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
            <ShieldCheck size={22} color="#00473E" />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#00473E' }}>
                Section 1: Approved Campaign Benchmark Standard ({campaign.name})
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>
                Single source of truth for this active campaign. All creative agencies and digital teams must align with these parameters.
              </div>
            </div>
          </div>
          <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: '12px' }}>
            <CheckCircle2 size={13} />
            <span>Enforced Admin Baseline</span>
          </span>
        </div>

        {/* Admin Baseline Parameters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
          {/* Approved Colors */}
          <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
              <Palette size={14} color="#2563EB" />
              <span>Approved Palette</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: campaign.themeColor || '#00473E', border: '1px solid #FFF', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#C89B3C', border: '1px solid #FFF', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                {campaign.category === 'CSR & Public Health' ? 'Crimson & Pearl' : campaign.category === 'Festive' ? 'Festive Gold & Emerald' : 'Emerald & Gold'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>
              {campaign.themeColor || '#00473E'} (Primary Theme Color)
            </div>
          </div>

          {/* Approved Voice & Tone */}
          <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
              <Mic2 size={14} color="#00473E" />
              <span>Approved Voice & Tone</span>
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#00473E' }}>
              {campaign.category === 'CSR & Public Health'
                ? 'Compassionate, Civic, Respectful'
                : campaign.category === 'Festive'
                ? 'Festive Luxury, Radiant, Warm'
                : 'Calm, Factual, Clinical'}
            </div>
            <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '6px', fontWeight: 600 }}>
              {campaign.category === 'CSR & Public Health'
                ? 'Prohibited: Commercial sales perks & gift vouchers'
                : 'Prohibited: Sensationalist hype & false guarantees'}
            </div>
          </div>

          {/* Approved Tagline / Slogan */}
          <div style={{ padding: '14px', backgroundColor: '#F0FDF4', borderRadius: '12px', border: '1.5px solid #BBF7D0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '8px' }}>
              <FileCheck2 size={14} color="#16A34A" />
              <span>Primary Approved Slogan</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#00473E', lineHeight: '1.4' }}>
              "{benchmarkTagline}"
            </div>
            <div style={{ fontSize: '11px', color: '#15803D', marginTop: '6px' }}>
              Required across all hero headlines
            </div>
          </div>

          {/* Commercial Parameters or CSR Venue */}
          {campaign.category === 'CSR & Public Health' ? (
            <div style={{ padding: '14px', backgroundColor: '#FEF2F2', borderRadius: '12px', border: '1.5px solid #FECACA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', marginBottom: '6px' }}>
                <HeartHandshake size={14} color="#DC2626" />
                <span>Drive Venue & Date</span>
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#991B1B' }}>
                14 November 2026 (9 AM – 5 PM)
              </div>
              <div style={{ fontSize: '11px', color: '#B91C1C', marginTop: '4px' }}>
                Aurelia Health Center, City Campus, Pune
              </div>
            </div>
          ) : (
            <div style={{ padding: '14px', backgroundColor: '#F0FDF4', borderRadius: '12px', border: '1.5px solid #BBF7D0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                  <Tag size={14} color="#16A34A" />
                  <span>Approved Price & Promo</span>
                </div>
                {campaign.approvedDiscountPercent && (
                  <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    {campaign.approvedDiscountPercent}% OFF
                  </span>
                )}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#00473E' }}>
                ₹{(campaign.approvedPrice || kb.products[0]?.currentPrice || 1299).toLocaleString('en-IN')}
                {campaign.approvedPromoCode && (
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#15803D', marginLeft: '6px' }}>
                    (Code: {campaign.approvedPromoCode})
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#15803D', marginTop: '4px' }}>
                Valid through {campaign.endDate}
              </div>
            </div>
          )}

          {/* Approved Visual Logo */}
          <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
              <Layers size={14} color="#C89B3C" />
              <span>Logo Standard</span>
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
              Logo {benchmarkLogo} (Botanical)
            </div>
            <div style={{ fontSize: '11px', color: '#991B1B', marginTop: '6px', fontWeight: 600 }}>
              Logo v2.1 Vintage Crest Prohibited
            </div>
          </div>

          {/* Mandatory Statutory Disclaimer */}
          <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
              <FileCheck2 size={14} color="#2563EB" />
              <span>Mandatory Disclaimer</span>
            </div>
            <div style={{ fontSize: '11px', color: '#334155', fontStyle: 'italic', lineHeight: '1.4' }}>
              "{benchmarkDisclaimer.slice(0, 75)}..."
            </div>
            <div style={{ fontSize: '10.5px', color: '#2563EB', marginTop: '6px', fontWeight: 600 }}>
              Required across all campaign materials
            </div>
          </div>
        </div>
      </div>

      {/* CENTRAL ACTION BAR */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 6px 20px rgba(15, 23, 42, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#2563EB',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RefreshCw size={22} className={isAuditingBatches ? 'spin' : ''} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
              Cross-Audit: {campaign.name}
            </div>
            <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '2px' }}>
              {updatedAssets.length} channel assets monitored. {conflicts.length} active cross-channel conflicts detected.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '10px' }}
            onClick={handleReviewCampaignBatches}
            disabled={isAuditingBatches}
          >
            <RefreshCw size={14} className={isAuditingBatches ? 'spin' : ''} />
            <span>{isAuditingBatches ? 'Auditing...' : 'Re-Check Engine'}</span>
          </button>

          <button
            className="btn btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '13.5px',
              fontWeight: 700,
              borderRadius: '10px',
              backgroundColor: '#16A34A',
              borderColor: '#15803D'
            }}
            onClick={handleAutoAlignAll}
          >
            <Wand2 size={16} />
            <span>⚡ Harmonize All Channels</span>
          </button>
        </div>
      </div>

      {alignmentSuccessMessage && (
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#166534',
            padding: '14px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)'
          }}
        >
          <CheckCircle2 size={20} color="#16A34A" />
          <span>{alignmentSuccessMessage}</span>
        </div>
      )}

      {/* SECTION 2: VIEW SWITCHER (SIDE-BY-SIDE COMPARATOR, AGENCY BATCHES, ASSET GRID) */}
      <div className="curved-section-box">
        <div className="curved-section-header">
          <div className="curved-section-title">
            <Users size={20} color="#2563EB" />
            <div>
              <span style={{ fontSize: '16px', fontWeight: 800 }}>
                Campaign Channels & Assets ({updatedAssets.length} Assets Across {batches.length} Production Units)
              </span>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>
                Audited dynamically for cross-channel price, discount %, promo code, and date consistency.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View Switcher: Side-by-Side Comparator vs Agency Batches vs Asset Grid */}
            <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '2px' }}>
              <button
                className={`btn btn-sm ${viewMode === 'comparator' ? 'btn-brand' : 'btn-secondary'}`}
                style={{ padding: '5px 12px', fontSize: '11.5px', border: 'none' }}
                onClick={() => setViewMode('comparator')}
              >
                <Layers size={13} />
                <span>Side-by-Side Diff</span>
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'batches' ? 'btn-brand' : 'btn-secondary'}`}
                style={{ padding: '5px 12px', fontSize: '11.5px', border: 'none' }}
                onClick={() => setViewMode('batches')}
              >
                <Users size={13} />
                <span>Agency Batches</span>
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-brand' : 'btn-secondary'}`}
                style={{ padding: '5px 12px', fontSize: '11.5px', border: 'none' }}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={13} />
                <span>Grid View</span>
              </button>
            </div>

            {/* Add Creative Asset Button */}
            <button
              className="btn btn-brand btn-sm"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={14} />
              <span>Add Creative Asset</span>
            </button>
          </div>
        </div>

        {/* VIEW MODE 1: STEP 2 INTERACTIVE SIDE-BY-SIDE COMPARATOR */}
        {viewMode === 'comparator' && (
          <SideBySideComparator
            campaign={campaign}
            kb={kb}
            onInspectAssetInAuditor={onInspectAssetInAuditor}
            onHarmonizeAssets={handleAutoAlignAll}
          />
        )}

        {/* VIEW MODE 2: AGENCY BATCHES VIEW */}
        {viewMode === 'batches' && (
          <div>
            {/* Batch Selector Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {batches.map((b, idx) => (
                <button
                  key={b.id}
                  className={`btn btn-sm ${activeBatchIndex === idx ? 'btn-brand' : 'btn-secondary'}`}
                  onClick={() => setActiveBatchIndex(idx)}
                  style={{ fontSize: '12px' }}
                >
                  <span>{b.teamName}</span>
                  <span
                    style={{
                      backgroundColor: b.faultCount > 0 ? '#DC2626' : '#16A34A',
                      color: '#FFF',
                      borderRadius: '10px',
                      padding: '1px 6px',
                      fontSize: '10px',
                      marginLeft: '6px'
                    }}
                  >
                    {b.faultCount}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Batch Header with Inline Align Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                  {activeBatch.teamName}
                </span>
                <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '8px' }}>
                  ({activeBatch.role}) • {activeBatch.assets.length} Creative Assets
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span
                  className={`badge ${activeBatch.faultCount > 0 ? 'badge-violation' : 'badge-success'}`}
                  style={{ fontSize: '11px' }}
                >
                  {activeBatch.faultCount > 0
                    ? `${activeBatch.faultCount} Faulty Assets Detected`
                    : 'All Assets Synchronized'}
                </span>

                {activeBatch.faultCount > 0 && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 10px', color: '#16A34A', fontWeight: 700 }}
                    onClick={() => handleAutoAlignBatch(activeBatch.teamName)}
                  >
                    <Wand2 size={12} />
                    <span>Auto-Align This Batch</span>
                  </button>
                )}
              </div>
            </div>

            {/* Selected Batch Asset Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
              {activeBatch.assets.map(asset => {
                const hasFaults = asset.status === 'Conflicts Detected';
                return (
                  <div
                    key={asset.id}
                    style={{
                      border: hasFaults ? '1.5px solid #FECACA' : '1.5px solid #BBF7D0',
                      backgroundColor: hasFaults ? '#FFF5F5' : '#F0FDF4',
                      borderRadius: '14px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      {/* Optional Creative Image Preview */}
                      {isValidImageUrl(asset.previewUrl) && (
                        <div
                          style={{
                            width: '100%',
                            height: '130px',
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

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '10px', textTransform: 'none' }}>
                          {asset.channel}
                        </span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {asset.auditStatus && (
                            <span
                              className={`badge ${
                                asset.auditStatus === 'Blocked'
                                  ? 'badge-violation'
                                  : asset.auditStatus === 'Needs Review'
                                  ? 'badge-unverified'
                                  : 'badge-success'
                              }`}
                              style={{ fontSize: '9px', padding: '1px 5px' }}
                            >
                              Auditor: {asset.auditStatus}
                            </span>
                          )}
                          <span className={`badge ${hasFaults ? 'badge-violation' : 'badge-success'}`} style={{ fontSize: '10px' }}>
                            {hasFaults ? `${asset.conflictCount} Faults` : 'Clean / In Sync'}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A', marginBottom: '8px' }}>
                        {asset.title}
                      </div>

                      <div
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px',
                          marginBottom: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748B' }}>Price:</span>
                          <strong style={{ color: hasFaults ? '#DC2626' : '#00473E' }}>
                            {campaign.category === 'CSR & Public Health'
                              ? 'Free / Non-Commercial'
                              : asset.extractedPriceStr || `₹${asset.extractedPrice || 'N/A'}`}
                          </strong>
                        </div>
                        {asset.extractedDiscountPercent !== undefined && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Discount:</span>
                            <span style={{ fontWeight: 700, color: '#C89B3C' }}>
                              {asset.extractedDiscountPercent}% OFF
                            </span>
                          </div>
                        )}
                        {asset.extractedPromoCode && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Promo Code:</span>
                            <code style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700 }}>
                              {asset.extractedPromoCode}
                            </code>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748B' }}>Logo Mark:</span>
                          <span style={{ color: asset.extractedLogoVersion?.includes('v2') ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
                            {asset.extractedLogoVersion || 'Logo v3'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748B' }}>Validity / Date:</span>
                          <span style={{ color: asset.extractedDate?.includes('Expired') || asset.extractedDate?.includes('30 Sept') ? '#DC2626' : '#334155', fontWeight: 600 }}>
                            {asset.extractedDate || 'N/A'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748B' }}>Tagline:</span>
                          <span style={{ color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                            "{asset.extractedTagline}"
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Format: {asset.format}</span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onInspectAssetInAuditor(asset)}
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        <Eye size={12} />
                        <span>Inspect in Auditor</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW MODE 3: UNIFIED ASSET GRID VIEW */}
        {viewMode === 'grid' && (
          <AssetCardsGrid
            assets={updatedAssets}
            onInspectAsset={onInspectAssetInAuditor}
          />
        )}
      </div>

      {/* SECTION 3: UNIFIED CROSS-ASSET CONFLICT MATRIX */}
      {hasAuditedCampaign && (
        <CrossAssetConflictMatrix
          conflicts={conflicts}
        />
      )}

      {/* Add Creative Asset Modal */}
      {isAddModalOpen && (
        <AddAssetModal
          onClose={() => setIsAddModalOpen(false)}
          onAddAsset={handleAddAsset}
          products={kb.products}
        />
      )}
    </div>
  );
};
