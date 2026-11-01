/**
 * Campaign Launch Readiness Score Card — Compact & Expandable
 *
 * A self-contained, compact SaaS dashboard component that derives and displays
 * the campaign readiness score dynamically from the current campaign + knowledge base.
 *
 * Features:
 * - Compact top card layout with SVG gauge and dynamic 1-sentence status explanation.
 * - "How is this calculated?" interactive modal explaining weights, severity deductions,
 *   critical safety override, and missing evidence rules.
 * - Single-open expandable category breakdown showing score/weight, unresolved counts,
 *   severity breakdown (H/M/L), deduction reasons, and relevant findings.
 * - Compact priority actions showing top 3 findings by default with "View all" toggle.
 * - Automatically recalculates on every campaign change, asset update, or Auto-Harmonize.
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  Rocket,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  DollarSign,
  Tag,
  Palette,
  FileText,
  Calendar,
  HelpCircle,
  X,
  Info,
} from 'lucide-react';
import { Campaign, CampaignAsset, CampaignConflict } from '../../types/campaign';
import { BrandKnowledgeBase } from '../../types/brand';
import {
  calculateReadinessScore,
  CATEGORY_WEIGHTS,
  SEVERITY_FRACTION,
  THRESHOLD_READY,
  THRESHOLD_NEEDS_REVIEW,
} from '../../services/readinessEngine';
import { auditCampaignConsistency } from '../../services/campaignEngine';
import {
  ReadinessCategory,
  CategoryScore,
  LaunchStatus,
  PriorityAction,
} from '../../types/readiness';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReadinessScoreCardProps {
  campaign: Campaign;
  kb: BrandKnowledgeBase;
  onInspectAsset?: (asset: CampaignAsset) => void;
}

// ─── Category Icons ───────────────────────────────────────────────────────────

function CategoryIcon({ category, size = 15 }: { category: ReadinessCategory; size?: number }) {
  switch (category) {
    case 'Price Consistency':
      return <DollarSign size={size} />;
    case 'Discount & Promo Code Consistency':
      return <Tag size={size} />;
    case 'Brand Compliance':
      return <Palette size={size} />;
    case 'Legal & Disclaimer Compliance':
      return <FileText size={size} />;
    case 'Campaign Date & CTA Consistency':
      return <Calendar size={size} />;
  }
}

// ─── Status Config ────────────────────────────────────────────────────────────

interface StatusConfig {
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  label: string;
}

function getStatusConfig(status: LaunchStatus): StatusConfig {
  switch (status) {
    case 'READY':
      return {
        color: '#15803D',
        bg: '#F0FDF4',
        border: '#86EFAC',
        icon: <ShieldCheck size={18} />,
        label: 'READY TO LAUNCH',
      };
    case 'NEEDS REVIEW':
      return {
        color: '#B45309',
        bg: '#FFFBEB',
        border: '#FCD34D',
        icon: <AlertTriangle size={18} />,
        label: 'NEEDS REVIEW',
      };
    case 'NOT READY':
      return {
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FCA5A5',
        icon: <ShieldX size={18} />,
        label: 'NOT READY',
      };
  }
}

function getCategoryStatusConfig(status: string) {
  switch (status) {
    case 'CRITICAL':
      return { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Critical' };
    case 'ISSUE':
      return { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Issues' };
    case 'INSUFFICIENT_EVIDENCE':
      return { color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE', label: 'Insufficient Evidence' };
    default:
      return { color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', label: 'Compliant' };
  }
}

function getSeverityConfig(severity: 'HIGH' | 'MEDIUM' | 'LOW') {
  switch (severity) {
    case 'HIGH':
      return { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626' };
    case 'MEDIUM':
      return { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706' };
    case 'LOW':
      return { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', dot: '#2563EB' };
  }
}

// ─── Circular Score Gauge (SVG) ───────────────────────────────────────────────

interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  launchStatus: LaunchStatus;
}

function ScoreGauge({ score, size = 100, strokeWidth = 9, launchStatus }: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, score / 100));
  const dashOffset = circumference * (1 - progress);
  const center = size / 2;

  const statusConfig = getStatusConfig(launchStatus);
  const trackColor = '#E2E8F0';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={statusConfig.color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Score label (centered) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: '24px', fontWeight: 900, color: statusConfig.color, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
          / 100
        </span>
      </div>
    </div>
  );
}

// ─── Calculation Explanation Modal ────────────────────────────────────────────

interface CalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CalculationModal({ isOpen, onClose }: CalculationModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = Object.entries(CATEGORY_WEIGHTS) as [ReadinessCategory, number][];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calc-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E2E8F0',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Info size={16} />
            </div>
            <div>
              <div id="calc-modal-title" style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                How is Readiness Calculated?
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Deterministic multi-variable governance scoring model
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12.5px', color: '#334155' }}>
          {/* Section 1: Categories & Weights */}
          <div>
            <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>1. Category Weights (Total: 100 Points)</span>
            </div>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
              {categories.map(([cat, weight], idx) => (
                <div
                  key={cat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                    borderBottom: idx < categories.length - 1 ? '1px solid #E2E8F0' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CategoryIcon category={cat} size={14} />
                    <span style={{ fontWeight: 600 }}>{cat}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: '#00473E', background: '#DCFCE7', padding: '1px 8px', borderRadius: '99px', fontSize: '11px' }}>
                    {weight} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Severity Deductions */}
          <div>
            <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              2. Severity-Based Normalized Deductions
            </div>
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 90px), 1fr))', gap: '8px', marginBottom: '8px' }}>
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: '#DC2626', fontSize: '11.5px' }}>CRITICAL / HIGH</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#991B1B', marginTop: '2px' }}>
                    {SEVERITY_FRACTION.HIGH * 100}%
                  </div>
                  <div style={{ fontSize: '10px', color: '#7F1D1D' }}>of category weight</div>
                </div>
                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: '#D97706', fontSize: '11.5px' }}>MEDIUM</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#92400E', marginTop: '2px' }}>
                    {SEVERITY_FRACTION.MEDIUM * 100}%
                  </div>
                  <div style={{ fontSize: '10px', color: '#78350F' }}>of category weight</div>
                </div>
                <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: '#2563EB', fontSize: '11.5px' }}>LOW</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#1E40AF', marginTop: '2px' }}>
                    {SEVERITY_FRACTION.LOW * 100}%
                  </div>
                  <div style={{ fontSize: '10px', color: '#1E3A8A' }}>of category weight</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.4' }}>
                Deductions are normalized so a category score is never negative. Duplicate conflicts across multiple assets are grouped by conflict ID and counted once.
              </div>
            </div>
          </div>

          {/* Section 3: Safety Override & Missing Evidence */}
          <div>
            <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              3. Governance Safety Rules
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 10px', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                <AlertTriangle size={15} color="#DC2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '11.5px', color: '#991B1B', lineHeight: '1.45' }}>
                  <strong>Critical Violation Override:</strong> Any unresolved High or Critical violation strictly prevents <span style={{ textDecoration: 'underline' }}>READY</span> status, forcing <span style={{ fontWeight: 700 }}>NEEDS REVIEW</span> or <span style={{ fontWeight: 700 }}>NOT READY</span> even if the overall score is &ge; 90.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 10px', backgroundColor: '#EEF2FF', borderRadius: '8px', border: '1px solid #C7D2FE' }}>
                <Info size={15} color="#4F46E5" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '11.5px', color: '#3730A3', lineHeight: '1.45' }}>
                  <strong>Missing Evidence Handling:</strong> Categories with missing or uninspected assets default to <span style={{ fontWeight: 700 }}>NEEDS REVIEW</span> rather than receiving assumed compliance.
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Thresholds */}
          <div>
            <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              4. Launch Thresholds
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534' }}>
                <strong>&ge; {THRESHOLD_READY} pts:</strong> READY (if 0 critical issues)
              </div>
              <div style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', color: '#B45309' }}>
                <strong>{THRESHOLD_NEEDS_REVIEW}–{THRESHOLD_READY - 1} pts:</strong> NEEDS REVIEW
              </div>
              <div style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                <strong>&lt; {THRESHOLD_NEEDS_REVIEW} pts:</strong> NOT READY
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
          }}
        >
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onClose}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Expandable Category Progress Row ─────────────────────────────────────────

interface CategoryRowProps {
  cs: CategoryScore;
  isExpanded: boolean;
  onToggle: () => void;
  allConflicts: CampaignConflict[];
  onInspectAsset?: (asset: CampaignAsset) => void;
  allAssets: CampaignAsset[];
}

function CategoryRow({
  cs,
  isExpanded,
  onToggle,
  allConflicts,
  onInspectAsset,
  allAssets,
}: CategoryRowProps) {
  const pct = Math.round((cs.score / cs.weight) * 100);
  const barColor =
    cs.status === 'CRITICAL'
      ? '#DC2626'
      : cs.status === 'ISSUE'
      ? '#D97706'
      : cs.status === 'INSUFFICIENT_EVIDENCE'
      ? '#6366F1'
      : '#16A34A';

  const catStatusCfg = getCategoryStatusConfig(cs.status);
  const categoryConflicts = allConflicts.filter(c => cs.conflictIds.includes(c.id));

  return (
    <div
      style={{
        border: `1px solid ${isExpanded ? catStatusCfg.border : cs.findingCount > 0 ? '#E2E8F0' : '#F1F5F9'}`,
        borderRadius: '10px',
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Row Header Button */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          background: isExpanded ? catStatusCfg.bg : cs.findingCount > 0 ? '#FAFAFA' : '#FFFFFF',
          border: 'none',
          cursor: 'pointer',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left',
          transition: 'background-color 0.15s ease',
        }}
      >
        {/* Category icon */}
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: cs.findingCount > 0 ? catStatusCfg.bg : '#F1F5F9',
            border: `1px solid ${cs.findingCount > 0 ? catStatusCfg.border : '#E2E8F0'}`,
            color: cs.findingCount > 0 ? catStatusCfg.color : '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CategoryIcon category={cs.category} size={14} />
        </div>

        {/* Name + progress bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
              {cs.category}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {cs.findingCount > 0 ? (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: catStatusCfg.color,
                    backgroundColor: catStatusCfg.bg,
                    border: `1px solid ${catStatusCfg.border}`,
                    padding: '1px 6px',
                    borderRadius: '99px',
                  }}
                >
                  {cs.findingCount} issue{cs.findingCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#15803D',
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    padding: '1px 6px',
                    borderRadius: '99px',
                  }}
                >
                  Passed
                </span>
              )}
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: barColor }}>
                {cs.score} / {cs.weight}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: '5px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                backgroundColor: barColor,
                borderRadius: '99px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Severity counts (compact tags) */}
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {cs.sevBreakdown.HIGH > 0 && (
            <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '1px 5px', borderRadius: '99px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              {cs.sevBreakdown.HIGH}H
            </span>
          )}
          {cs.sevBreakdown.MEDIUM > 0 && (
            <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '1px 5px', borderRadius: '99px', backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
              {cs.sevBreakdown.MEDIUM}M
            </span>
          )}
          {cs.sevBreakdown.LOW > 0 && (
            <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '1px 5px', borderRadius: '99px', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
              {cs.sevBreakdown.LOW}L
            </span>
          )}
        </div>

        {/* Expand chevron */}
        <div style={{ color: '#64748B', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {/* Expanded Inline Detail */}
      {isExpanded && (
        <div
          style={{
            padding: '12px 14px 14px',
            backgroundColor: '#FFFFFF',
            borderTop: `1px solid ${cs.findingCount > 0 ? catStatusCfg.border : '#E2E8F0'}`,
          }}
        >
          {/* Summary Metric Ribbon */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              marginBottom: '10px',
              fontSize: '11px',
              color: '#475569',
            }}
          >
            <div>
              <strong>Score:</strong> {cs.score} / {cs.weight} pts
            </div>
            <span style={{ color: '#CBD5E1' }}>•</span>
            <div>
              <strong>Unresolved Findings:</strong> {cs.findingCount}
            </div>
            <span style={{ color: '#CBD5E1' }}>•</span>
            <div>
              <strong>Severity:</strong> High ({cs.sevBreakdown.HIGH}), Medium ({cs.sevBreakdown.MEDIUM}), Low ({cs.sevBreakdown.LOW})
            </div>
          </div>

          {/* Reason for deduction */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>
              Deduction Analysis & Reason
            </div>
            <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: '1.45', backgroundColor: '#FAFAFA', padding: '6px 10px', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
              {cs.explanation}
            </div>
          </div>

          {/* Relevant Audit Findings List */}
          {categoryConflicts.length > 0 ? (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '6px' }}>
                Relevant Audit Findings ({categoryConflicts.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {categoryConflicts.map(conflict => {
                  const sevCfg = getSeverityConfig(conflict.severity);
                  const firstAssetId = conflict.involvedAssets[0]?.assetId;
                  const targetAsset = firstAssetId ? allAssets.find(a => a.id === firstAssetId) : undefined;

                  return (
                    <div
                      key={conflict.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: sevCfg.bg,
                        border: `1px solid ${sevCfg.border}`,
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: sevCfg.dot,
                          flexShrink: 0,
                          marginTop: '5px',
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                            {conflict.title}
                          </span>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              color: sevCfg.color,
                              backgroundColor: '#FFFFFF',
                              border: `1px solid ${sevCfg.border}`,
                              padding: '1px 5px',
                              borderRadius: '99px',
                              flexShrink: 0,
                            }}
                          >
                            {conflict.severity}
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 4px', lineHeight: '1.4' }}>
                          {conflict.description}
                        </p>
                        <div style={{ fontSize: '10.5px', color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          <span>
                            <strong>Approved:</strong> {conflict.approvedTruth.validValue}
                          </span>
                          <span>
                            <strong>Fix:</strong> {conflict.suggestedAlignment}
                          </span>
                        </div>
                        {/* Involved channels */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '6px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {conflict.involvedAssets.map(ia => (
                              <span
                                key={ia.assetId}
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: 600,
                                  backgroundColor: '#FFFFFF',
                                  color: '#475569',
                                  border: '1px solid #CBD5E1',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                }}
                              >
                                {ia.channel}: {ia.detectedValue}
                              </span>
                            ))}
                          </div>
                          {onInspectAsset && targetAsset && (
                            <button
                              type="button"
                              onClick={() => onInspectAsset(targetAsset)}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: '4px',
                                padding: '2px 7px',
                                fontSize: '10.5px',
                                fontWeight: 600,
                                color: '#0F172A',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                              title="Inspect asset in Content Auditor"
                            >
                              <span>Inspect</span>
                              <ArrowRight size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#15803D',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={13} color="#16A34A" />
              <span>All assets are in sync and fully meet the benchmark standard for this category.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const ReadinessScoreCard: React.FC<ReadinessScoreCardProps> = ({
  campaign,
  kb,
  onInspectAsset,
}) => {
  // Single expanded category state to prevent vertical page clutter
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Compact priority actions: show top 3 by default, expand on user request
  const [showAllActions, setShowAllActions] = useState<boolean>(false);

  // Interactive "How is this calculated?" popover modal
  const [showCalculationModal, setShowCalculationModal] = useState<boolean>(false);

  // Reset interactive expansions when campaign switches
  useEffect(() => {
    setExpandedCategory(null);
    setShowAllActions(false);
  }, [campaign.id]);

  // Recalculates dynamically on every campaign or kb update
  const readiness = useMemo(
    () => calculateReadinessScore(campaign, kb),
    [campaign, kb]
  );

  // Retrieve live conflicts for the expanded detail panel
  const { conflicts: liveConflicts } = useMemo(
    () => auditCampaignConsistency(campaign, kb),
    [campaign, kb]
  );

  // Accordion toggle: single category open at a time
  const toggleCategory = (cat: string) => {
    setExpandedCategory(prev => (prev === cat ? null : cat));
  };

  const statusConfig = getStatusConfig(readiness.launchStatus);

  // Dynamic concise score explanation beneath the score
  const scoreExplanation = useMemo(() => {
    if (readiness.assetsAudited === 0) {
      return 'No campaign assets audited yet. Upload assets to calculate readiness.';
    }
    if (readiness.hasCriticalViolation) {
      return 'Critical violations are preventing campaign approval. High-severity conflicts must be resolved before publication.';
    }
    if (readiness.launchStatus === 'READY') {
      return 'All audited categories currently meet the configured requirements. Campaign is ready to publish.';
    }
    // Dynamic reason based on actual failing categories
    const failingCats = readiness.categoryScores
      .filter(cs => cs.findingCount > 0)
      .map(cs => cs.category);

    if (failingCats.length > 0) {
      return `Your campaign needs review because of ${failingCats.slice(0, 2).join(' and ')} ${failingCats.length > 2 ? `(+${failingCats.length - 2} other issues)` : 'inconsistencies'}.`;
    }
    return readiness.statusReason;
  }, [readiness]);

  // Handle "inspect asset" from priority actions
  const handleInspectFromAction = (action: PriorityAction) => {
    if (!onInspectAsset || !action.primaryAssetId) return;
    const asset = campaign.assets.find(a => a.id === action.primaryAssetId);
    if (asset) onInspectAsset(asset);
  };

  // Slice priority actions: 3 items initially, or all if toggled
  const displayedActions = showAllActions
    ? readiness.priorityActions
    : readiness.priorityActions.slice(0, 3);

  return (
    <>
      {/* ── Calculation Explanation Modal ─────────────────────────────────── */}
      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
      />

      {/* ── Main Compact Readiness Card ───────────────────────────────────── */}
      <div
        className="curved-section-box"
        style={{
          border: `2px solid ${statusConfig.border}`,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
          padding: '18px 20px',
        }}
      >
        {/* Card Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            paddingBottom: '12px',
            borderBottom: '1px solid #E2E8F0',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: statusConfig.bg,
                border: `1px solid ${statusConfig.border}`,
                color: statusConfig.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Rocket size={17} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                Campaign Launch Readiness
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Live audit consistency score &bull; Evaluated across {readiness.assetsAudited} creative assets
              </div>
            </div>
          </div>

          {/* Right Action Controls: "How is this calculated?" + Launch Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowCalculationModal(true)}
              style={{
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#2563EB',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              title="Click to view scoring weights, severity deductions, and rules"
            >
              <HelpCircle size={14} color="#2563EB" />
              <span>How is this calculated?</span>
            </button>

            {/* Launch Status Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '99px',
                backgroundColor: statusConfig.bg,
                border: `1.5px solid ${statusConfig.border}`,
                color: statusConfig.color,
                fontWeight: 800,
                fontSize: '12px',
              }}
            >
              {statusConfig.icon}
              <span>{statusConfig.label}</span>
            </div>
          </div>
        </div>

        {/* ── Main Score Section (Compact Layout) ─────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '18px',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${statusConfig.bg} 0%, #FFFFFF 100%)`,
            border: `1px solid ${statusConfig.border}`,
          }}
        >
          {/* Circular Score Gauge */}
          <ScoreGauge
            score={readiness.overallScore}
            size={96}
            strokeWidth={9}
            launchStatus={readiness.launchStatus}
          />

          {/* Campaign Title + Dynamic Concise Explanation + Stats */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>
                {readiness.campaignName}
              </div>
            </div>

            {/* Concise Dynamic Explanation beneath the score */}
            <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: '1.45', marginBottom: '10px' }}>
              {scoreExplanation}
            </div>

            {/* Metrics Pills Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  fontSize: '11px',
                  color: '#1E40AF',
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={13} color="#2563EB" />
                <span>Audited: <strong>{readiness.assetsAudited}</strong></span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  backgroundColor: readiness.unresolvedCount > 0 ? '#FEF2F2' : '#F0FDF4',
                  border: `1px solid ${readiness.unresolvedCount > 0 ? '#FECACA' : '#BBF7D0'}`,
                  fontSize: '11px',
                  color: readiness.unresolvedCount > 0 ? '#991B1B' : '#166534',
                  fontWeight: 600,
                }}
              >
                {readiness.unresolvedCount > 0 ? (
                  <XCircle size={13} color="#DC2626" />
                ) : (
                  <CheckCircle2 size={13} color="#16A34A" />
                )}
                <span>Unresolved: <strong>{readiness.unresolvedCount}</strong></span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  fontSize: '11px',
                  color: '#166534',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={13} color="#16A34A" />
                <span>Resolved: <strong>{readiness.resolvedCount}</strong></span>
              </div>

              {readiness.hasCriticalViolation && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '99px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#DC2626',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  <AlertTriangle size={13} />
                  <span>Launch Blocked</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Category-wise Score Breakdown (Single-open accordion) ───────── */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#0F172A',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#2563EB" />
              <span>Category Score Breakdown</span>
            </div>
            <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 500 }}>
              Click any category to expand details
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {readiness.categoryScores.map(cs => (
              <CategoryRow
                key={cs.category}
                cs={cs}
                isExpanded={expandedCategory === cs.category}
                onToggle={() => toggleCategory(cs.category)}
                allConflicts={liveConflicts}
                onInspectAsset={onInspectAsset}
                allAssets={campaign.assets}
              />
            ))}
          </div>
        </div>

        {/* ── Compact Priority Actions (Top 3 with "View All" toggle) ─────── */}
        {readiness.priorityActions.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} color="#D97706" />
                <span>Priority Actions ({readiness.priorityActions.length} unresolved)</span>
              </div>
              {readiness.priorityActions.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllActions(prev => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563EB',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '2px 4px',
                  }}
                >
                  <span>{showAllActions ? 'Show fewer (top 3)' : `View all (${readiness.priorityActions.length})`}</span>
                  {showAllActions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {displayedActions.map((action, idx) => {
                const sevCfg = getSeverityConfig(action.severity);
                return (
                  <div
                    key={action.conflictId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Priority badge */}
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: idx === 0 ? '#FEF2F2' : '#F1F5F9',
                        color: idx === 0 ? '#DC2626' : '#64748B',
                        fontSize: '10px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#0F172A',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {action.title}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                        {action.category} &bull; {action.assetCount} asset{action.assetCount > 1 ? 's' : ''} affected
                      </div>
                    </div>

                    {/* Severity badge */}
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: sevCfg.color,
                        backgroundColor: sevCfg.bg,
                        border: `1px solid ${sevCfg.border}`,
                        padding: '1px 6px',
                        borderRadius: '99px',
                        flexShrink: 0,
                      }}
                    >
                      {action.severity}
                    </span>

                    {/* Inspect button */}
                    {onInspectAsset && action.primaryAssetId && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '10.5px',
                          padding: '3px 8px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                        onClick={() => handleInspectFromAction(action)}
                        title="Inspect in Content Auditor"
                      >
                        <span>Inspect</span>
                        <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
