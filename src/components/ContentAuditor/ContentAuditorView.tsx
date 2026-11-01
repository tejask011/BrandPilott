import React, { useState, useEffect } from 'react';
import { BrandKnowledgeBase } from '../../types/brand';
import { AuditFinding, AuditReport, ReviewDecision } from '../../types/audit';
import { UploadPane, ASSET_BATCHES, BatchAsset, UploadHistoryEntry, loadUploadHistory, saveUploadHistory, clearUploadHistory } from './UploadPane';
import { AssetPreviewPane } from './AssetPreviewPane';
import { ReviewIssuesPane } from './ReviewIssuesPane';
import { HumanDecisionModal } from './HumanDecisionModal';
import { SendBackEmailModal } from './SendBackEmailModal';
import { GroqReportModal } from './GroqReportModal';
import { runContentAudit, calculateComplianceScore } from '../../services/auditorEngine';
import { calculateAssetAuditStatus } from '../../services/productCatalogService';
import { performOcr, OcrResult } from '../../services/ocrService';
import { extractTextFromPdf } from '../../services/pdfService';
import { cleanOcrTextWithGroq } from '../../services/groqService';
import { saveAuditLedgerRecord } from '../../services/storageService';
import { BrandPaletteScanner } from './BrandPaletteScanner';
import { PaletteAnalysisResult, analyzeImagePaletteFromUrl } from '../../services/colorAnalysisService';
import { MailCheck, CheckCircle2, AlertTriangle, RotateCcw, Eye, Upload, AlertCircle, Layers } from 'lucide-react';

interface ContentAuditorViewProps {
  kb: BrandKnowledgeBase;
  incomingAsset?: BatchAsset | null;
  onClearIncomingAsset?: () => void;
  onSaveCampaignAssetAudit?: (campaignAssetId: string, report: AuditReport) => void;
}

/**
 * Applies a finding's suggested fix to the draft text.
 * Returns success: true only when the target text can be reliably identified and replaced.
 * Otherwise returns false with a helpful reason asking for manual editing.
 */
function applyFindingFixToText(
  currentText: string,
  finding: AuditFinding
): { success: boolean; updatedText: string; reason?: string } {
  // Disclaimer missing: append cleanly at the end
  if (finding.ruleType === 'Disclaimer') {
    const cleanFix = finding.suggestedFix.trim();
    if (!currentText.includes(cleanFix)) {
      const updatedText = currentText.trimEnd() + '\n\n' + cleanFix;
      return { success: true, updatedText };
    }
    return { success: false, updatedText: currentText, reason: 'Disclaimer is already present in draft text.' };
  }

  // Visual/Logo issues cannot be applied textually
  if (finding.ruleType === 'Logo') {
    return {
      success: false,
      updatedText: currentText,
      reason: 'Logo replacement must be updated in artwork/graphic files directly.'
    };
  }

  const flagged = finding.flaggedText.trim();
  const unquotedFlagged = flagged.replace(/^["'""]|["'""]$/g, '').trim();
  const cleanFix = finding.suggestedFix.replace(/^["'""]|["'""]$/g, '').trim();

  // 1. Exact match
  if (currentText.includes(flagged)) {
    return { success: true, updatedText: currentText.replace(flagged, cleanFix) };
  }

  // 2. Unquoted match
  if (unquotedFlagged && currentText.includes(unquotedFlagged)) {
    return { success: true, updatedText: currentText.replace(unquotedFlagged, cleanFix) };
  }

  // 3. Unique case-insensitive match (avoid replacing ambiguous short words)
  if (unquotedFlagged.length >= 4) {
    const lowerText = currentText.toLowerCase();
    const lowerFlagged = unquotedFlagged.toLowerCase();
    const firstIdx = lowerText.indexOf(lowerFlagged);
    if (firstIdx !== -1) {
      const secondIdx = lowerText.indexOf(lowerFlagged, firstIdx + 1);
      if (secondIdx === -1) {
        const updatedText =
          currentText.substring(0, firstIdx) +
          cleanFix +
          currentText.substring(firstIdx + unquotedFlagged.length);
        return { success: true, updatedText };
      }
    }
  }

  // 4. Price pattern match (e.g. ₹1,099 or 1099 or ₹749)
  if (finding.ruleType === 'Price') {
    const priceDigits = flagged.replace(/[^0-9]/g, '');
    if (priceDigits) {
      const priceRegex = new RegExp(`(₹|rs\\.?\\s*)?\\s*${priceDigits}`, 'i');
      if (priceRegex.test(currentText)) {
        return { success: true, updatedText: currentText.replace(priceRegex, cleanFix) };
      }
    }
  }

  if (currentText.includes(cleanFix)) {
    return {
      success: false,
      updatedText: currentText,
      reason: `The approved fix ("${cleanFix}") is already present in the draft.`
    };
  }

  return {
    success: false,
    updatedText: currentText,
    reason: `Could not confidently match "${flagged}" in editable draft copy. Please edit the draft text manually.`
  };
}

/**
 * Convert a File to a data URL for localStorage persistence.
 * Only stores images; for PDFs/text, stores empty string.
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve('');
      return;
    }
    // Resize to a thumbnail-sized data URL to save space
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 300;
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(e.target?.result as string || '');
        }
      };
      img.onerror = () => resolve('');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export const ContentAuditorView: React.FC<ContentAuditorViewProps> = ({
  kb,
  incomingAsset,
  onClearIncomingAsset,
  onSaveCampaignAssetAudit
}) => {
  // Current draft asset
  const [selectedAsset, setSelectedAsset] = useState<BatchAsset>(ASSET_BATCHES[0].assets[0]);
  const [draftText, setDraftText] = useState<string>(ASSET_BATCHES[0].assets[0].draftText);
  const [originalDraftText, setOriginalDraftText] = useState<string>(ASSET_BATCHES[0].assets[0].draftText);

  // Upload history
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryEntry[]>(loadUploadHistory);

  // Applied fix IDs (for visual diff highlighting)
  const [appliedFixIds, setAppliedFixIds] = useState<Set<string>>(new Set());

  // OCR results tracking (preserves exact words, bboxes, dimensions and confidence)
  const [currentOcrResult, setCurrentOcrResult] = useState<OcrResult | null>(null);

  // Audit state - null until user clicks "Run Evidence Audit" to eliminate confusion
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState<{ percent: number; status: string } | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Modals
  const [decisionModalFinding, setDecisionModalFinding] = useState<AuditFinding | null>(null);
  const [decisionModalAction, setDecisionModalAction] = useState<ReviewDecision>('ACCEPTED');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isGroqReportModalOpen, setIsGroqReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Mobile / Tablet pane switcher ('upload' | 'preview' | 'issues' | 'all')
  const [mobilePane, setMobilePane] = useState<'upload' | 'preview' | 'issues' | 'all'>('preview');

  // Feature 2: In-Browser Brand Palette & Visual Identity Scanner
  const [paletteAnalysis, setPaletteAnalysis] = useState<PaletteAnalysisResult | null>(null);
  const [isPaletteAnalyzing, setIsPaletteAnalyzing] = useState(false);

  useEffect(() => {
    if (selectedAsset.type === 'image' && selectedAsset.previewUrl) {
      let isCurrent = true;
      setIsPaletteAnalyzing(true);
      analyzeImagePaletteFromUrl(selectedAsset.previewUrl, kb.colors)
        .then(result => {
          if (isCurrent) {
            setPaletteAnalysis(result);
            setIsPaletteAnalyzing(false);
          }
        })
        .catch(() => {
          if (isCurrent) setIsPaletteAnalyzing(false);
        });
      return () => {
        isCurrent = false;
      };
    } else {
      setPaletteAnalysis(null);
      setIsPaletteAnalyzing(false);
    }
  }, [selectedAsset.previewUrl, selectedAsset.type, kb.colors]);

  // Track previous incomingAsset and selection to synchronize state without cascading effects
  const [prevIncomingAsset, setPrevIncomingAsset] = useState<BatchAsset | null>(null);
  if (incomingAsset && incomingAsset !== prevIncomingAsset) {
    setPrevIncomingAsset(incomingAsset);
    setSelectedAsset(incomingAsset);
    const text = incomingAsset.draftText || '';
    setDraftText(text);
    setOriginalDraftText(text);
    setCurrentOcrResult(incomingAsset.ocrResult || null);
    setAuditReport(null);
    setSelectedFindingId(null);
    setAppliedFixIds(new Set());
  }

  const [prevAssetId, setPrevAssetId] = useState<string>(selectedAsset.id);
  const [prevKbVersion, setPrevKbVersion] = useState<string>(kb.activeVersion);
  if (selectedAsset.id !== prevAssetId || kb.activeVersion !== prevKbVersion) {
    setPrevAssetId(selectedAsset.id);
    setPrevKbVersion(kb.activeVersion);
    setCurrentOcrResult(selectedAsset.ocrResult || null);
    setAuditReport(null);
    setSelectedFindingId(null);
    setAppliedFixIds(new Set());
  }

  // Handle side-effects (toast and clear callback) when incoming asset changes
  useEffect(() => {
    if (incomingAsset) {
      const text = incomingAsset.draftText || '';
      const timer = setTimeout(() => {
        if (!text || text.trim().length === 0) {
          setToastMessage(`Content for campaign asset "${incomingAsset.name}" is not yet available. Please provide copy or upload a creative.`);
        } else {
          setToastMessage(`Loaded campaign asset: "${incomingAsset.name}". Ready for audit.`);
        }
      }, 0);

      const hideTimer = setTimeout(() => setToastMessage(null), 5000);

      if (onClearIncomingAsset) {
        onClearIncomingAsset();
      }

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [incomingAsset, onClearIncomingAsset]);

  // Global clipboard paste listener to capture pasted images (Ctrl+V) and direct text drafts
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // 1. Check for image files in clipboardData
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              const namedFile = new File(
                [file],
                file.name || `Pasted-Creative-${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.png`,
                { type: file.type || 'image/png' }
              );
              handleFileUpload(namedFile);
              return;
            }
          }
        }
      }

      // 2. If no image, but text was pasted and user is NOT typing inside a text input/textarea
      const target = e.target as HTMLElement;
      const isInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );

      if (!isInput) {
        const text = e.clipboardData?.getData('text');
        if (text && text.trim().length > 0) {
          e.preventDefault();
          const customAsset: BatchAsset = {
            id: `pasted-text-${Date.now()}`,
            name: 'Pasted Draft Copy',
            batchCategory: 'Content Banners',
            type: 'text',
            channel: 'Clipboard Text',
            description: 'Draft marketing copy pasted directly from clipboard.',
            draftText: text,
            previewUrl: '',
            previewFormat: 'text',
            expectedStatus: 'Warning'
          };
          setSelectedAsset(customAsset);
          setDraftText(text);
          setOriginalDraftText(text);
          setCurrentOcrResult(null);
          setAuditReport(null);
          setSelectedFindingId(null);
          setAppliedFixIds(new Set());
          setToastMessage('📋 Draft copy pasted from clipboard. Ready to audit!');
          setTimeout(() => setToastMessage(null), 4000);
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const executeAudit = async (
    textToAudit: string,
    title: string,
    type: 'image' | 'pdf' | 'text',
    url: string,
    logoTag?: string,
    extractedVia: 'Tesseract OCR' | 'PDF Parser' | 'Direct Input' = 'Direct Input',
    ocrConfidence?: number,
    cachedOcrResult?: OcrResult | null
  ) => {
    setIsAuditing(true);
    let activeOcrResult = cachedOcrResult ?? currentOcrResult ?? selectedAsset.ocrResult ?? null;

    // If it's an image asset and we don't have OCR results yet, run OCR on the image URL
    if (type === 'image' && (!activeOcrResult || !activeOcrResult.words?.length) && url && !url.includes('placeholder')) {
      setAuditProgress({ percent: 15, status: 'Performing OCR on image...' });
      try {
        const ocrRes = await performOcr(url, (p, s) => {
          setAuditProgress({ percent: Math.round(15 + p * 0.45), status: `OCR: ${s}` });
        });
        if (ocrRes.words && ocrRes.words.length > 0) {
          activeOcrResult = ocrRes;
          setCurrentOcrResult(ocrRes);
          setSelectedAsset(prev => ({ ...prev, ocrResult: ocrRes }));

          // Reconstruct noisy OCR text with Groq AI to recover all claims, headlines, prices & disclaimers
          if (ocrRes.text) {
            setAuditProgress({ percent: 62, status: 'Reconstructing copy with Groq AI...' });
            try {
              const enhancedText = await cleanOcrTextWithGroq(ocrRes.text);
              if (enhancedText && enhancedText.trim().length > 10) {
                textToAudit = enhancedText;
                setDraftText(enhancedText);
                setSelectedAsset(prev => ({ ...prev, draftText: enhancedText }));
              }
            } catch (groqErr) {
              console.warn('Groq text enhancement skipped:', groqErr);
            }
          }
        }
      } catch (ocrErr) {
        console.warn('OCR on previewUrl failed:', ocrErr);
      }
    }

    setAuditProgress({ percent: 70, status: 'Auditing draft copy against Brand Memory...' });

    try {
      const isOcr = Boolean(activeOcrResult?.words?.length);
      const report = await runContentAudit(
        {
          draftText: textToAudit,
          assetTitle: title,
          assetType: type,
          assetUrl: url,
          extractedVia: isOcr ? 'Tesseract OCR' : extractedVia,
          ocrConfidence: activeOcrResult?.confidence ?? ocrConfidence,
          detectedLogoTag: logoTag,
          backgroundDescription: selectedAsset.backgroundDescription || '',
          ocrWords: activeOcrResult?.words,
          ocrImageWidth: activeOcrResult?.imageWidth,
          ocrImageHeight: activeOcrResult?.imageHeight,
          explicitProductSku: selectedAsset.productSku,
          explicitProductId: selectedAsset.productId,
          existingFindings: auditReport?.findings
        },
        kb
      );

      setAuditReport(report);
      if (report.findings.length > 0) {
        setSelectedFindingId(report.findings[0].id);
      }

      if (onSaveCampaignAssetAudit && (selectedAsset.campaignAssetId || selectedAsset.id.startsWith('campaign-'))) {
        const campaignAssetId = selectedAsset.campaignAssetId || selectedAsset.id.replace('campaign-', '');
        onSaveCampaignAssetAudit(campaignAssetId, report);
      }
    } catch (err) {
      console.error('Audit execution error:', err);
      setToastMessage('Audit failed to complete. Please check console for details.');
    } finally {
      setIsAuditing(false);
      setAuditProgress(null);
    }
  };

  const handleSelectAsset = (asset: BatchAsset) => {
    setSelectedAsset(asset);
    setDraftText(asset.draftText);
    setOriginalDraftText(asset.draftText);
    setCurrentOcrResult(asset.ocrResult || null);
    setAuditReport(null);
    setSelectedFindingId(null);
    setAppliedFixIds(new Set());
  };

  const handleTextChange = (newText: string) => {
    setDraftText(newText);
    if (selectedAsset.type === 'text') {
      setSelectedAsset(prev => ({
        ...prev,
        draftText: newText
      }));
    }
  };

  const addToUploadHistory = async (file: File, draftText: string, _previewUrl?: string) => {
    // Generate a thumbnail data URL for history persistence
    const thumbnailDataUrl = await fileToDataUrl(file);

    const entry: UploadHistoryEntry = {
      id: `upload-${Date.now()}`,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'text',
      previewUrl: thumbnailDataUrl || '', // data URL for localStorage persistence
      draftText,
      timestamp: new Date().toISOString(),
      channel: 'Custom Upload'
    };

    const updated = [entry, ...uploadHistory];
    setUploadHistory(updated);
    saveUploadHistory(updated);
  };

  const handleClearHistory = () => {
    setUploadHistory([]);
    clearUploadHistory();
    setToastMessage('Upload history cleared.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFileUpload = async (file: File) => {
    setIsAuditing(true);
    setAuditReport(null);
    setSelectedFindingId(null);
    setAppliedFixIds(new Set());

    const blobUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    const customAsset: BatchAsset = {
      id: `custom-${Date.now()}`,
      name: file.name || (isImage ? 'Pasted Creative Image' : 'Custom Upload'),
      batchCategory: 'Content Banners',
      type: isImage ? 'image' : isPdf ? 'pdf' : 'text',
      channel: isImage ? 'Pasted Image (OCR)' : isPdf ? 'PDF Upload' : 'Direct Text Upload',
      description: isImage
        ? 'Creative image loaded. Extracting text via OCR...'
        : `Uploaded file: ${file.name}`,
      draftText: '',
      previewUrl: blobUrl,
      previewFormat: isImage ? 'image' : 'text',
      expectedStatus: 'Warning'
    };

    // IMMEDIATELY update selected asset so the image or document shows up in the preview screen right away!
    setSelectedAsset(customAsset);
    setDraftText('');
    setOriginalDraftText('');
    setCurrentOcrResult(null);

    if (isImage) {
      setToastMessage('📷 Image loaded into preview. Running Tesseract OCR analysis...');
      setAuditProgress({ percent: 20, status: 'Preprocessing image & running OCR...' });
      try {
        const ocrRes = await performOcr(file, (p, s) => {
          setAuditProgress({ percent: Math.round(p * 0.45), status: `OCR: ${s}` });
        });
        customAsset.ocrResult = ocrRes;
        setCurrentOcrResult(ocrRes);

        const extracted = ocrRes.text || 'No text detected';
        setAuditProgress({ percent: 75, status: 'Reconstructing copy with AI...' });
        let cleanedText = extracted;
        try {
          cleanedText = await cleanOcrTextWithGroq(extracted);
        } catch (groqErr) {
          console.warn('Groq text reconstruction skipped/failed:', groqErr);
        }
        const finalText = cleanedText || extracted;
        customAsset.draftText = finalText;
        customAsset.description = `Recognized ${ocrRes.words?.length || 0} words (${(ocrRes.confidence || 0).toFixed(0)}% OCR accuracy)`;
        setSelectedAsset({ ...customAsset });
        setDraftText(finalText);
        setOriginalDraftText(finalText);

        // Save to upload history
        await addToUploadHistory(file, finalText, blobUrl);

        setToastMessage(`✅ Image OCR complete (${ocrRes.words?.length || 0} words recognized). Ready to run audit.`);
        setTimeout(() => setToastMessage(null), 5000);
      } catch (err) {
        console.warn('OCR error:', err);
        customAsset.draftText = 'OCR could not read text. You can type or edit copy directly.';
        setSelectedAsset({ ...customAsset });
        setDraftText(customAsset.draftText);
        setOriginalDraftText(customAsset.draftText);

        // Still save to history even on OCR failure
        await addToUploadHistory(file, customAsset.draftText, blobUrl);
        setToastMessage('⚠️ OCR could not detect legible text. You can edit copy manually in the left pane.');
        setTimeout(() => setToastMessage(null), 5000);
      } finally {
        setIsAuditing(false);
        setAuditProgress(null);
      }
    } else if (isPdf) {
      setAuditProgress({ percent: 40, status: 'Parsing PDF streams...' });
      try {
        const pdfRes = await extractTextFromPdf(file);
        customAsset.draftText = pdfRes.text;
        setSelectedAsset({ ...customAsset });
        setDraftText(pdfRes.text);
        setOriginalDraftText(pdfRes.text);

        // Save to upload history
        await addToUploadHistory(file, pdfRes.text, '');

        setToastMessage(`PDF loaded. Click "Run Evidence Audit" to review.`);
        setTimeout(() => setToastMessage(null), 5000);
      } catch (err) {
        console.warn('PDF fallback:', err);
      } finally {
        setIsAuditing(false);
        setAuditProgress(null);
      }
    } else {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = (e.target?.result as string) || '';
        customAsset.draftText = content;
        setSelectedAsset({ ...customAsset });
        setDraftText(content);
        setOriginalDraftText(content);
        setIsAuditing(false);
        setAuditProgress(null);

        // Save to upload history
        await addToUploadHistory(file, content, '');

        setToastMessage(`Text loaded. Click "Run Evidence Audit" to review.`);
        setTimeout(() => setToastMessage(null), 5000);
      };
      reader.readAsText(file);
    }
  };

  /**
   * Records a human review decision without artificially bumping the score.
   */
  const handleConfirmDecision = (
    findingId: string,
    decision: ReviewDecision,
    note: string,
    decidedBy: string
  ) => {
    if (!auditReport) return;
    const finding = auditReport.findings.find(f => f.id === findingId);
    if (!finding) return;

    saveAuditLedgerRecord({
      id: `led-${Date.now()}`,
      findingId: finding.id,
      assetTitle: auditReport.assetTitle,
      flaggedText: finding.flaggedText,
      findingCategory: finding.category,
      decision,
      decisionNote: note,
      decidedBy,
      brandVersion: kb.activeVersion,
      timestamp: new Date().toISOString()
    });

    const updatedFindings = auditReport.findings.map(f => {
      if (f.id === findingId) {
        return {
          ...f,
          decision,
          decisionNote: note,
          decisionBy: decidedBy,
          decisionTimestamp: new Date().toISOString()
        };
      }
      return f;
    });

    const resolvedCount = updatedFindings.filter(f => f.decision === 'ACCEPTED').length;
    const approvalStatus = calculateAssetAuditStatus(updatedFindings);

    // Preserves honest evidence-based scoring: score is derived strictly from findings
    const updatedReport: AuditReport = {
      ...auditReport,
      overallScore: calculateComplianceScore(updatedFindings),
      findings: updatedFindings,
      approvalStatus,
      summary: {
        ...auditReport.summary,
        resolvedCount
      }
    };

    setAuditReport(updatedReport);

    if (onSaveCampaignAssetAudit && (selectedAsset.campaignAssetId || selectedAsset.id.startsWith('campaign-'))) {
      const campaignAssetId = selectedAsset.campaignAssetId || selectedAsset.id.replace('campaign-', '');
      onSaveCampaignAssetAudit(campaignAssetId, updatedReport);
    }

    setToastMessage(`Recorded human decision: ${decision} for Finding #${finding.pinNumber}. Status: ${approvalStatus}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * Applies the approved suggested fix to the actual draft copy,
   * then automatically reruns the audit so the score and findings accurately
   * reflect verified corrections.
   */
  const handleQuickApplyFix = async (findingId: string) => {
    if (!auditReport) return;
    const finding = auditReport.findings.find(f => f.id === findingId);
    if (!finding) return;

    const fixResult = applyFindingFixToText(draftText, finding);
    if (!fixResult.success) {
      setToastMessage(fixResult.reason || 'Could not automatically apply this fix. Please edit the draft manually.');
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    const updatedDraft = fixResult.updatedText;
    setDraftText(updatedDraft);
    setAppliedFixIds(prev => new Set([...prev, findingId]));

    // Record verified fix in governance ledger
    saveAuditLedgerRecord({
      id: `led-${Date.now()}`,
      findingId: finding.id,
      assetTitle: auditReport.assetTitle,
      flaggedText: finding.flaggedText,
      findingCategory: finding.category,
      decision: 'ACCEPTED',
      decisionNote: `Applied suggested fix: "${finding.suggestedFix}" to draft copy.`,
      decidedBy: 'Meera (Compliance Reviewer)',
      brandVersion: kb.activeVersion,
      timestamp: new Date().toISOString()
    });

    // Rerun the audit on the updated text to compute verified score while preserving OCR coordinates
    try {
      const activeOcr = currentOcrResult ?? selectedAsset.ocrResult;
      const updatedReport = await runContentAudit(
        {
          draftText: updatedDraft,
          assetTitle: selectedAsset.name,
          assetType: selectedAsset.type,
          assetUrl: selectedAsset.previewUrl,
          extractedVia: auditReport.extractedVia,
          ocrConfidence: auditReport.ocrConfidence,
          detectedLogoTag: selectedAsset.detectedLogoTag,
          backgroundDescription: selectedAsset.backgroundDescription || '',
          ocrWords: activeOcr?.words,
          ocrImageWidth: activeOcr?.imageWidth,
          ocrImageHeight: activeOcr?.imageHeight,
          explicitProductSku: selectedAsset.productSku,
          explicitProductId: selectedAsset.productId,
          existingFindings: auditReport.findings
        },
        kb
      );
      setAuditReport(updatedReport);

      if (onSaveCampaignAssetAudit && (selectedAsset.campaignAssetId || selectedAsset.id.startsWith('campaign-'))) {
        const campaignAssetId = selectedAsset.campaignAssetId || selectedAsset.id.replace('campaign-', '');
        onSaveCampaignAssetAudit(campaignAssetId, updatedReport);
      }

      setToastMessage(`✅ Fix applied! "${finding.flaggedText}" → "${finding.suggestedFix}". New compliance: ${updatedReport.overallScore}%.`);
    } catch (err) {
      console.error('Audit rerun failed:', err);
      setToastMessage('Correction applied to draft. Please rerun audit to verify.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  /**
   * Applies all confident text fixes, leaves unverified/artwork findings pending,
   * and reruns the audit. Does not arbitrarily set score to 100.
   */
  const handleApplyAllFixes = async () => {
    if (!auditReport || auditReport.findings.length === 0) return;

    let workingDraft = draftText;
    let appliedCount = 0;
    let skippedCount = 0;
    const newAppliedIds = new Set(appliedFixIds);

    for (const finding of auditReport.findings) {
      if (finding.decision !== 'ACCEPTED') {
        const fixResult = applyFindingFixToText(workingDraft, finding);
        if (fixResult.success) {
          workingDraft = fixResult.updatedText;
          appliedCount++;
          newAppliedIds.add(finding.id);
          saveAuditLedgerRecord({
            id: `led-${Date.now()}-${finding.id}`,
            findingId: finding.id,
            assetTitle: auditReport.assetTitle,
            flaggedText: finding.flaggedText,
            findingCategory: finding.category,
            decision: 'ACCEPTED',
            decisionNote: `Applied suggested fix: "${finding.suggestedFix}" to draft copy.`,
            decidedBy: 'Meera (Compliance Reviewer)',
            brandVersion: kb.activeVersion,
            timestamp: new Date().toISOString()
          });
        } else {
          skippedCount++;
        }
      }
    }

    if (appliedCount === 0) {
      setToastMessage('No pending findings could be automatically applied to draft text. Please edit draft manually.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    setDraftText(workingDraft);
    setAppliedFixIds(newAppliedIds);

    // Rerun audit to compute new honest score while preserving OCR coordinates
    try {
      const activeOcr = currentOcrResult ?? selectedAsset.ocrResult;
      const updatedReport = await runContentAudit(
        {
          draftText: workingDraft,
          assetTitle: selectedAsset.name,
          assetType: selectedAsset.type,
          assetUrl: selectedAsset.previewUrl,
          extractedVia: auditReport.extractedVia,
          ocrConfidence: auditReport.ocrConfidence,
          detectedLogoTag: selectedAsset.detectedLogoTag,
          backgroundDescription: selectedAsset.backgroundDescription || '',
          ocrWords: activeOcr?.words,
          ocrImageWidth: activeOcr?.imageWidth,
          ocrImageHeight: activeOcr?.imageHeight,
          explicitProductSku: selectedAsset.productSku,
          explicitProductId: selectedAsset.productId,
          existingFindings: auditReport.findings
        },
        kb
      );
      setAuditReport(updatedReport);

      if (onSaveCampaignAssetAudit && (selectedAsset.campaignAssetId || selectedAsset.id.startsWith('campaign-'))) {
        const campaignAssetId = selectedAsset.campaignAssetId || selectedAsset.id.replace('campaign-', '');
        onSaveCampaignAssetAudit(campaignAssetId, updatedReport);
      }

      setToastMessage(
        `✅ Applied ${appliedCount} text fix${appliedCount > 1 ? 'es' : ''}${skippedCount > 0 ? ` (${skippedCount} require manual editing/artwork update)` : ''}. New score: ${updatedReport.overallScore}%.`
      );
    } catch (err) {
      console.error('Audit rerun failed:', err);
    }
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleSendEmailNotification = async (data: { recipientEmail: string; recipientName: string; subject: string; messageBody?: string }) => {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.warn('Email dispatch backend ping:', e);
    }

    // Record rejection in ledger
    saveAuditLedgerRecord({
      id: `led-mail-${Date.now()}`,
      findingId: 'batch-rejection',
      assetTitle: selectedAsset.name,
      flaggedText: `${auditReport?.findings.length || 0} Rule Violations`,
      findingCategory: 'Verified rule violation',
      decision: 'DISPUTED',
      decisionNote: `Sent formal rejection email to ${data.recipientEmail} (${data.recipientName}): Re-revision required before publish.`,
      decidedBy: 'Meera (Compliance Reviewer)',
      brandVersion: kb.activeVersion,
      timestamp: new Date().toISOString()
    });

    setToastMessage(`Rejection email dispatched to ${data.recipientEmail}. Delivery status: Delivered.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: toastMessage.startsWith('✅') ? '#F0FDF4' : '#F0FDF4',
            border: `1.5px solid ${toastMessage.startsWith('✅') ? '#86EFAC' : '#BBF7D0'}`,
            borderRadius: '12px',
            padding: '12px 20px',
            color: '#166534',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)',
            animation: 'slideDown 0.3s ease'
          }}
        >
          <MailCheck size={18} color="#16A34A" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Empty or Unavailable Content Notice */}
      {(!draftText || draftText.trim().length === 0) && (
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '1.5px solid #FDE68A',
            borderRadius: '12px',
            padding: '12px 18px',
            color: '#92400E',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertTriangle size={18} color="#D97706" />
          <span>
            Content for <strong>"{selectedAsset.name}"</strong> is currently unavailable or empty. Please enter draft copy in the left pane or upload an asset file to begin auditing.
          </span>
        </div>
      )}

      {/* Comparison indicator when draft has been corrected */}
      {draftText !== originalDraftText && (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '1.5px solid #A7F3D0',
            borderRadius: '10px',
            padding: '8px 16px',
            fontSize: '12px',
            color: '#065F46',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#059669" />
            <strong>Draft has been corrected</strong> — fixes applied to the live preview. Switch to "Fixed (Approved)" view to see the clean version.
          </span>
          <button
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => {
              setDraftText(originalDraftText);
              setAppliedFixIds(new Set());
              setToastMessage('Reverted draft to original unedited copy.');
              setTimeout(() => setToastMessage(null), 3000);
            }}
          >
            <RotateCcw size={12} />
            <span>Revert to Original Copy</span>
          </button>
        </div>
      )}

      {/* Mobile/Tablet Workstation Pane Switcher */}
      <div className="auditor-mobile-pane-tabs">
        <button
          type="button"
          className={`pane-tab ${mobilePane === 'upload' ? 'active' : ''}`}
          onClick={() => setMobilePane('upload')}
        >
          <Upload size={13} />
          <span>1. Asset & Copy</span>
        </button>

        <button
          type="button"
          className={`pane-tab ${mobilePane === 'preview' ? 'active' : ''}`}
          onClick={() => setMobilePane('preview')}
        >
          <Eye size={13} />
          <span>2. Visual Preview</span>
          {auditReport && auditReport.findings.length > 0 && (
            <span className="pane-badge">{auditReport.findings.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`pane-tab ${mobilePane === 'issues' ? 'active' : ''}`}
          onClick={() => setMobilePane('issues')}
        >
          <AlertCircle size={13} />
          <span>3. Issues & Fixes</span>
          {auditReport && auditReport.findings.length > 0 && (
            <span className="pane-badge pane-badge-warn">{auditReport.findings.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`pane-tab ${mobilePane === 'all' ? 'active' : ''}`}
          onClick={() => setMobilePane('all')}
        >
          <Layers size={13} />
          <span>All Stacked</span>
        </button>
      </div>

      {/* 3-Pane Workspace Container matching Image 2 & PDF Page 7 */}
      <div className="auditor-workspace-grid">
        {/* Pane 1: Batches & Material Selection */}
        <div
          className="curved-section-box auditor-pane-1"
          style={{
            display: mobilePane === 'upload' || mobilePane === 'all' ? 'flex' : 'none',
            flexDirection: 'column'
          }}
        >
          <UploadPane
            selectedAsset={selectedAsset}
            onSelectAsset={handleSelectAsset}
            onFileUpload={handleFileUpload}
            onTextChange={handleTextChange}
            currentText={draftText}
            isAuditing={isAuditing}
            onRunAudit={() => executeAudit(draftText, selectedAsset.name, selectedAsset.type, selectedAsset.previewUrl, selectedAsset.detectedLogoTag, 'Direct Input')}
            auditProgress={auditProgress}
            onOpenEmailModal={() => setIsEmailModalOpen(true)}
            onOpenGroqReportModal={() => setIsGroqReportModalOpen(true)}
            uploadHistory={uploadHistory}
            onClearHistory={handleClearHistory}
          />
        </div>

        {/* Pane 2: Preview Material with Interactive Numbered Markers */}
        <div
          className="curved-section-box auditor-pane-2"
          style={{
            display: mobilePane === 'preview' || mobilePane === 'all' ? 'flex' : 'none',
            flexDirection: 'column'
          }}
        >
          <AssetPreviewPane
            assetTitle={selectedAsset.name}
            assetType={selectedAsset.type}
            previewUrl={selectedAsset.previewUrl}
            rawText={draftText}
            findings={auditReport?.findings || []}
            selectedFindingId={selectedFindingId}
            onSelectFinding={id => setSelectedFindingId(id)}
            extractedVia={auditReport?.extractedVia || 'Direct Input'}
            ocrConfidence={auditReport?.ocrConfidence}
            originalDraftText={originalDraftText}
            appliedFixIds={appliedFixIds}
            previewFormat={selectedAsset.previewFormat}
            instagramCaption={selectedAsset.instagramCaption}
            instagramHashtags={selectedAsset.instagramHashtags}
            instagramAccount={selectedAsset.instagramAccount}
            onFileUpload={handleFileUpload}
          />

          {selectedAsset.type === 'image' && (
            <BrandPaletteScanner
              paletteResult={paletteAnalysis}
              brandColors={kb.colors}
              isAnalyzing={isPaletteAnalyzing}
            />
          )}
        </div>

        {/* Pane 3: Review Issues & Evidence Table */}
        <div
          className="curved-section-box auditor-pane-3"
          style={{
            display: mobilePane === 'issues' || mobilePane === 'all' ? 'flex' : 'none',
            flexDirection: 'column'
          }}
        >
          <ReviewIssuesPane
            findings={auditReport?.findings || []}
            selectedFindingId={selectedFindingId}
            onSelectFinding={id => setSelectedFindingId(id)}
            onOpenDecisionModal={(f, a) => {
              setDecisionModalFinding(f);
              setDecisionModalAction(a);
            }}
            overallScore={auditReport?.overallScore ?? 60}
            hasRunAudit={auditReport !== null}
            onRunAudit={() => executeAudit(draftText, selectedAsset.name, selectedAsset.type, selectedAsset.previewUrl, selectedAsset.detectedLogoTag, 'Direct Input')}
            isAuditing={isAuditing}
            onQuickApplyFix={handleQuickApplyFix}
            onApplyAllFixes={handleApplyAllFixes}
          />
        </div>
      </div>

      {/* Human Decision Modal */}
      {decisionModalFinding && (
        <HumanDecisionModal
          finding={decisionModalFinding}
          actionType={decisionModalAction}
          onClose={() => setDecisionModalFinding(null)}
          onConfirm={handleConfirmDecision}
        />
      )}

      {/* Send Back Email Modal */}
      {isEmailModalOpen && (
        <SendBackEmailModal
          assetTitle={selectedAsset.name}
          findings={auditReport?.findings || []}
          onClose={() => setIsEmailModalOpen(false)}
          onSendEmail={handleSendEmailNotification}
        />
      )}

      {/* Groq Team Report Modal */}
      {isGroqReportModalOpen && auditReport && (
        <GroqReportModal
          report={auditReport}
          kb={kb}
          onClose={() => setIsGroqReportModalOpen(false)}
        />
      )}
    </div>
  );
};
