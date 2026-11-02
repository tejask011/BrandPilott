import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateComplianceScore, findPhraseBounds } from '../src/services/auditorEngine';
import { scanBackgroundScene, auditCampaignConsistency, autoAlignCampaignAssets } from '../src/services/campaignEngine';
import { INITIAL_BRAND_KNOWLEDGE_BASE, INITIAL_CAMPAIGN, DIWALI_CAMPAIGN, BLOOD_DONATION_CAMPAIGN } from '../src/services/storageService';
import { AuditFinding } from '../src/types/audit';

function createMockFinding(severity: 'HIGH' | 'MEDIUM' | 'LOW', id = 'f1'): AuditFinding {
  return {
    id,
    pinNumber: 1,
    title: 'Test Finding',
    category: 'Verified rule violation',
    severity,
    flaggedText: 'Flagged phrase',
    explanation: 'Explanation',
    approvedSource: {
      title: 'Guideline',
      version: 'v3.2'
    },
    suggestedFix: 'Approved phrase',
    suggestedFixExplanation: 'Fix explanation',
    ruleType: 'Claim',
    decision: 'PENDING'
  };
}

describe('Task 2 — Compliance Score Calculation', () => {
  test('returns 100 for clean assets with zero findings', () => {
    const score = calculateComplianceScore([]);
    assert.equal(score, 100);
  });

  test('deducts 25 points for each HIGH severity finding', () => {
    const findings = [createMockFinding('HIGH', 'f1')];
    assert.equal(calculateComplianceScore(findings), 75);
  });

  test('deducts 15 points for MEDIUM and 5 for LOW severity', () => {
    const findings = [
      createMockFinding('MEDIUM', 'f1'),
      createMockFinding('LOW', 'f2')
    ];
    // 100 - 15 - 5 = 80
    assert.equal(calculateComplianceScore(findings), 80);
  });

  test('calculates cumulative deductions accurately across mixed severities', () => {
    const findings = [
      createMockFinding('HIGH', 'f1'),   // -25
      createMockFinding('HIGH', 'f2'),   // -25
      createMockFinding('MEDIUM', 'f3'), // -15
      createMockFinding('LOW', 'f4')     // -5
    ];
    // 100 - 25 - 25 - 15 - 5 = 30
    assert.equal(calculateComplianceScore(findings), 30);
  });

  test('clamps score to 0 when deductions exceed 100 points (never negative)', () => {
    const findings = [
      createMockFinding('HIGH', 'f1'),
      createMockFinding('HIGH', 'f2'),
      createMockFinding('HIGH', 'f3'),
      createMockFinding('HIGH', 'f4'),
      createMockFinding('HIGH', 'f5')
    ];
    // 100 - 125 -> clamped to 0
    assert.equal(calculateComplianceScore(findings), 0);
  });

  test('clamped score never exceeds 100', () => {
    const score = calculateComplianceScore([]);
    assert.ok(score <= 100 && score >= 0);
  });
});

describe('Task 3 — Suggested Fix Workflow Logic', () => {
  function applyFindingFixToText(
    currentText: string,
    finding: AuditFinding
  ): { success: boolean; updatedText: string; reason?: string } {
    if (finding.ruleType === 'Disclaimer') {
      const cleanFix = finding.suggestedFix.trim();
      if (!currentText.includes(cleanFix)) {
        return { success: true, updatedText: currentText.trimEnd() + '\n\n' + cleanFix };
      }
      return { success: false, updatedText: currentText, reason: 'Disclaimer is already present in draft text.' };
    }

    if (finding.ruleType === 'Logo') {
      return {
        success: false,
        updatedText: currentText,
        reason: 'Logo replacement must be updated in artwork/graphic files directly.'
      };
    }

    const flagged = finding.flaggedText.trim();
    const unquotedFlagged = flagged.replace(/^["'“”]|["'“”]$/g, '').trim();
    const cleanFix = finding.suggestedFix.replace(/^["'“”]|["'“”]$/g, '').trim();

    if (currentText.includes(flagged)) {
      return { success: true, updatedText: currentText.replace(flagged, cleanFix) };
    }

    if (unquotedFlagged && currentText.includes(unquotedFlagged)) {
      return { success: true, updatedText: currentText.replace(unquotedFlagged, cleanFix) };
    }

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

    if (finding.ruleType === 'Price') {
      const priceDigits = flagged.replace(/[^0-9]/g, '');
      if (priceDigits) {
        const priceRegex = new RegExp(`(₹|rs\\.?\\s*)?\\s*${priceDigits}`, 'i');
        if (priceRegex.test(currentText)) {
          return { success: true, updatedText: currentText.replace(priceRegex, cleanFix) };
        }
      }
    }

    return {
      success: false,
      updatedText: currentText,
      reason: `Could not confidently match "${flagged}" in editable draft copy. Please edit the draft text manually.`
    };
  }

  test('replaces exact flagged text with approved fix in editable draft', () => {
    const finding = createMockFinding('HIGH');
    finding.flaggedText = 'Results guaranteed in 7 days.';
    finding.suggestedFix = 'Visible barrier hydration within 4 weeks*.';

    const draft = 'Aurelia Skincare. Results guaranteed in 7 days. Special offer.';
    const result = applyFindingFixToText(draft, finding);

    assert.equal(result.success, true);
    assert.equal(result.updatedText, 'Aurelia Skincare. Visible barrier hydration within 4 weeks*. Special offer.');
  });

  test('replaces unquoted flagged text when quotes exist in guideline entry', () => {
    const finding = createMockFinding('HIGH');
    finding.flaggedText = '"India\'s most loved moisturizer!"';
    finding.suggestedFix = '"Discover your daily skincare ritual."';

    const draft = "Welcome to Aurelia. India's most loved moisturizer! Daily ritual.";
    const result = applyFindingFixToText(draft, finding);

    assert.equal(result.success, true);
    assert.equal(result.updatedText, 'Welcome to Aurelia. Discover your daily skincare ritual. Daily ritual.');
  });

  test('appends mandatory legal disclaimer when absent from draft', () => {
    const finding = createMockFinding('HIGH');
    finding.ruleType = 'Disclaimer';
    finding.flaggedText = '(Disclaimer footnote absent from asset)';
    finding.suggestedFix = '*Based on clinical trial of 30 women over 4 weeks.';

    const draft = 'Aurelia Deep Hydrating Moisturizer 50g.';
    const result = applyFindingFixToText(draft, finding);

    assert.equal(result.success, true);
    assert.ok(result.updatedText.endsWith('*Based on clinical trial of 30 women over 4 weeks.'));
  });

  test('refuses automatic text replacement for Logo rules and guides manual artwork update', () => {
    const finding = createMockFinding('MEDIUM');
    finding.ruleType = 'Logo';
    finding.flaggedText = 'Vintage Crest Logo v2.1';
    finding.suggestedFix = 'Botanical Wordmark v3.0';

    const draft = 'Aurelia Skincare — Discover your daily skincare ritual.';
    const result = applyFindingFixToText(draft, finding);

    assert.equal(result.success, false);
    assert.ok(result.reason?.includes('artwork/graphic files directly'));
    assert.equal(result.updatedText, draft); // Content left untouched
  });

  test('refuses replacement and prompts manual editing if flagged text cannot be located', () => {
    const finding = createMockFinding('HIGH');
    finding.flaggedText = 'Completely unknown phrase not in draft';
    finding.suggestedFix = 'Fixed text';

    const draft = 'Aurelia Skincare — Discover your daily skincare ritual.';
    const result = applyFindingFixToText(draft, finding);

    assert.equal(result.success, false);
    assert.ok(result.reason?.includes('Could not confidently match'));
    assert.equal(result.updatedText, draft);
  });
});

describe('Task 1 — Backend Proxy Request Validation & Health', () => {
  let serverInstance: any;

  test('GET /api/health returns server status without exposing secrets', async () => {
    const { server } = await import('../server/index');
    serverInstance = server;
    await new Promise(r => setTimeout(r, 300));
    const res = await fetch('http://localhost:3001/api/health', { headers: { Connection: 'close' } });
    assert.equal(res.status, 200);
    const data = await res.json() as { status: string; groqConfigured: boolean };
    assert.equal(data.status, 'ok');
    assert.equal(typeof data.groqConfigured, 'boolean');
    assert.equal((data as Record<string, unknown>).apiKey, undefined);
  });

  test('POST /api/groq/chat rejects empty messages array with 400', async () => {
    const res = await fetch('http://localhost:3001/api/groq/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Connection': 'close' },
      body: JSON.stringify({ messages: [] })
    });
    assert.equal(res.status, 400);
    const data = await res.json() as { error: string };
    assert.ok(data.error.includes('must be a non-empty array'));
  });

  test('POST /api/groq/chat rejects invalid role with 400', async () => {
    const res = await fetch('http://localhost:3001/api/groq/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Connection': 'close' },
      body: JSON.stringify({
        messages: [{ role: 'hacker', content: 'test' }]
      })
    });
    assert.equal(res.status, 400);
    const data = await res.json() as { error: string };
    assert.ok(data.error.includes('must be system, user, or assistant'));
  });

  test('POST /api/groq/chat rejects message content exceeding 25,000 characters with 400', async () => {
    const res = await fetch('http://localhost:3001/api/groq/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Connection': 'close' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'A'.repeat(26000) }]
      })
    });
    assert.equal(res.status, 400);
    const data = await res.json() as { error: string };
    assert.ok(data.error.includes('up to 25,000 characters'));

    if (serverInstance) {
      if (typeof serverInstance.closeAllConnections === 'function') {
        serverInstance.closeAllConnections();
      }
      await new Promise<void>((resolve) => {
        serverInstance.close(() => resolve());
      });
    }
  });
});

describe('Task 4 — Content Auditor Marker Accuracy & Coordinate Mapping', () => {
  const mockImageWidth = 900;
  const mockImageHeight = 1200;

  const mockOcrWords = [
    { text: 'AURELIA', bbox: { x0: 204, y0: 60, x1: 424, y1: 98 } },
    { text: 'SKINCARE', bbox: { x0: 440, y0: 60, x1: 692, y1: 98 } },
    { text: 'VITAMIN', bbox: { x0: 136, y0: 202, x1: 353, y1: 238 } },
    { text: 'C', bbox: { x0: 369, y0: 202, x1: 400, y1: 238 } },
    { text: 'GLOW', bbox: { x0: 417, y0: 202, x1: 572, y1: 238 } },
    { text: 'SERUM', bbox: { x0: 586, y0: 202, x1: 760, y1: 238 } },
    { text: '*100%', bbox: { x0: 78, y0: 811, x1: 238, y1: 848 } },
    { text: 'CURE', bbox: { x0: 254, y0: 811, x1: 389, y1: 848 } },
    { text: 'FOR', bbox: { x0: 404, y0: 811, x1: 507, y1: 848 } },
    { text: 'WRINKLES', bbox: { x0: 519, y0: 811, x1: 784, y1: 848 } },
    { text: 'RESULTS', bbox: { x0: 122, y0: 882, x1: 273, y1: 906 } },
    { text: 'GUARANTEED', bbox: { x0: 285, y0: 882, x1: 528, y1: 906 } },
    { text: 'IN', bbox: { x0: 542, y0: 882, x1: 574, y1: 906 } },
    { text: '48', bbox: { x0: 586, y0: 882, x1: 629, y1: 906 } },
    { text: 'HOURS!', bbox: { x0: 643, y0: 882, x1: 775, y1: 906 } }
  ];

  test('locates exact normalized percentage rectangle for "100% cure for wrinkles"', () => {
    const bounds = findPhraseBounds('100% cure for wrinkles', mockOcrWords, mockImageWidth, mockImageHeight);
    assert.ok(bounds, 'Bounds should be found');
    // x0=78, y0=811, x1=784, y1=848
    // x% = (78 / 900) * 100 ≈ 8.67%
    // y% = (811 / 1200) * 100 ≈ 67.58%
    assert.ok(Math.abs(bounds.x - (78 / 900) * 100) < 0.01);
    assert.ok(Math.abs(bounds.y - (811 / 1200) * 100) < 0.01);
    assert.ok(Math.abs(bounds.width - ((784 - 78) / 900) * 100) < 0.01);
    assert.ok(Math.abs(bounds.height - ((848 - 811) / 1200) * 100) < 0.01);
  });

  test('locates exact separate rectangle for "Results guaranteed in 48 hours!" without overlap', () => {
    const boundsWrinkles = findPhraseBounds('100% cure for wrinkles', mockOcrWords, mockImageWidth, mockImageHeight);
    const boundsGuarantee = findPhraseBounds('results guaranteed in 48 hours', mockOcrWords, mockImageWidth, mockImageHeight);
    assert.ok(boundsWrinkles && boundsGuarantee);
    // Guarantee is at y0=882, which is below y1=848
    assert.ok(boundsGuarantee.y > boundsWrinkles.y + boundsWrinkles.height, 'Guarantee box should be below wrinkle cure box');
  });

  test('returns undefined for non-existent phrases and does not fabricate coordinates', () => {
    const bounds = findPhraseBounds('Some imaginary text not in image', mockOcrWords, mockImageWidth, mockImageHeight);
    assert.equal(bounds, undefined);
  });

  test('VITAMIN C GLOW SERUM coordinates are distinct and not matched for violations', () => {
    const boundsProduct = findPhraseBounds('VITAMIN C GLOW SERUM', mockOcrWords, mockImageWidth, mockImageHeight);
    const boundsWrinkles = findPhraseBounds('100% cure for wrinkles', mockOcrWords, mockImageWidth, mockImageHeight);
    assert.ok(boundsProduct && boundsWrinkles);
    // Product is near y=202/1200 ≈ 16.8%, wrinkles is near y=811/1200 ≈ 67.6%
    assert.ok(boundsProduct.y < 25);
    assert.ok(boundsWrinkles.y > 60);
  });
});

describe('Task 5 — Background Visual Scene Scanning & Warning Status', () => {
  const kb = INITIAL_BRAND_KNOWLEDGE_BASE;

  test('detects meat/barbecue in background and triggers WARNING status', () => {
    const result = scanBackgroundScene(
      'Outdoor lifestyle shot of moisturizer next to barbecue grill and chicken meat platter on picnic table',
      kb
    );
    assert.equal(result.hasWarning, true);
    assert.ok(result.findings.some(f => f.category === 'Meat / Non-Veg'));
    assert.ok(result.detectedSummary.includes('Meat / Non-Veg'));
  });

  test('detects live domestic animals/pets in background and triggers WARNING status', () => {
    const result = scanBackgroundScene(
      'Living room couch scene with golden retriever pet dog resting near product staging',
      kb
    );
    assert.equal(result.hasWarning, true);
    assert.ok(result.findings.some(f => f.category === 'Animals'));
    assert.ok(result.detectedSummary.includes('Animals'));
  });

  test('detects religious symbols/iconography/shrine in background and triggers WARNING status', () => {
    const result = scanBackgroundScene(
      'Creative poster with traditional prayer altar and religious temple shrine visible on shelf',
      kb
    );
    assert.equal(result.hasWarning, true);
    assert.ok(result.findings.some(f => f.category === 'Religion / Religious Symbols'));
    assert.ok(result.detectedSummary.includes('Religion'));
  });

  test('detects exposed raw chemical element formula in serum and triggers WARNING status', () => {
    const result = scanBackgroundScene(
      'Close-up of serum dropper with floating chemical element and raw acid formula graphic in droplet',
      kb
    );
    assert.equal(result.hasWarning, true);
    assert.ok(result.findings.some(f => f.category === 'Raw Serum Elements'));
    assert.ok(result.detectedSummary.includes('Raw Serum Elements'));
  });

  test('returns clean approved status for pearl cream and sterile laboratory glass backdrop', () => {
    const result = scanBackgroundScene(
      'Moisturizer placed on minimalist pearl cream bathroom marble with sterile laboratory glassware and botanical leaf',
      kb
    );
    assert.equal(result.hasWarning, false);
    assert.equal(result.findings.length, 0);
    assert.ok(result.detectedSummary.includes('Clean / Approved Backdrop'));
  });

  test('auditCampaignConsistency flags Background Scene Warning across campaign assets', () => {
    const campaignWithBgWarning = {
      ...INITIAL_CAMPAIGN,
      assets: [
        {
          ...INITIAL_CAMPAIGN.assets[0],
          extractedBackground: '⚠️ Domestic pet dog on sofa in background',
          fullText: 'Aurelia Moisturizer with pet dog in background'
        },
        INITIAL_CAMPAIGN.assets[1]
      ]
    };
    const { conflicts } = auditCampaignConsistency(campaignWithBgWarning, kb);
    const bgConflict = conflicts.find(c => c.type === 'Background Scene Warning');
    assert.ok(bgConflict, 'Should detect Background Scene Warning conflict');
    assert.equal(bgConflict?.severity, 'MEDIUM');
  });
});

describe('Task 6 — Price Extraction, Catalog Matching, and Evidence Audit Engine', () => {
  const kb = INITIAL_BRAND_KNOWLEDGE_BASE;

  test('extractPricesFromText extracts INR prices in multiple formats without picking up volumes or years', async () => {
    const { extractPricesFromText } = await import('../src/services/productCatalogService');
    
    // Test multiple price variations
    const text1 = 'Aurelia Vitamin C Glow Serum 30ml - Special Offer: ₹1,299. Valid in 2026. 100% genuine.';
    const prices1 = extractPricesFromText(text1);
    assert.equal(prices1.length, 1);
    assert.equal(prices1[0].value, 1299);
    assert.equal(prices1[0].rawText, '₹1,299');

    const text2 = 'Only ₹ 1,299 for Aurelia Deep Hydrating Moisturizer 50g (Mfg 2025).';
    const prices2 = extractPricesFromText(text2);
    assert.equal(prices2.length, 1);
    assert.equal(prices2[0].value, 1299);

    const text3 = 'Aurelia Radiant Vitamin C Serum at Rs. 899.';
    const prices3 = extractPricesFromText(text3);
    assert.equal(prices3.length, 1);
    assert.equal(prices3[0].value, 899);

    const text4 = 'Aurelia Soothing Barrier Cleanser 150ml at 599 only.';
    const prices4 = extractPricesFromText(text4);
    assert.equal(prices4.length, 1);
    assert.equal(prices4[0].value, 599);
  });

  test('matchProductFromCreative matches product via registered alias "Vitamin C Glow Serum" to SKU AUR-VTC-30', async () => {
    const { matchProductFromCreative } = await import('../src/services/productCatalogService');
    const creativeText = 'AURELIA SKINCARE - VITAMIN C GLOW SERUM - Discover your daily skincare ritual. Only ₹1,299';
    
    const match = matchProductFromCreative(creativeText, kb.products);
    assert.ok(match.product, 'Should match a product');
    assert.equal(match.product?.sku, 'AUR-VTC-30');
    assert.equal(match.product?.currentPrice, 899);
    assert.equal(match.isEstablished, true);
    assert.equal(match.confidence, 'HIGH');
  });

  test('matchProductFromCreative matches explicit SKU AUR-VTC-30 directly', async () => {
    const { matchProductFromCreative } = await import('../src/services/productCatalogService');
    const creativeText = 'Special promotional ad';
    
    const match = matchProductFromCreative(creativeText, kb.products, {
      explicitSku: 'AUR-VTC-30'
    });
    assert.ok(match.product);
    assert.equal(match.product?.sku, 'AUR-VTC-30');
    assert.equal(match.isEstablished, true);
    assert.equal(match.confidence, 'HIGH');
  });

  test('matchProductFromCreative flags uncertain / ambiguous product match as isEstablished = false', async () => {
    const { matchProductFromCreative } = await import('../src/services/productCatalogService');
    // Ad mentions general "Serum" but no SKU, no specific brand alias
    const creativeText = 'Generic Anti-Aging Serum 30ml - Only ₹1,299';
    
    const match = matchProductFromCreative(creativeText, kb.products);
    // Should NOT be established as a definite product match
    assert.equal(match.isEstablished, false);
  });

  test('runContentAudit flags price mismatch (₹1,299 creative vs ₹899 catalog for Vitamin C Glow Serum)', async () => {
    const { runContentAudit } = await import('../src/services/auditorEngine');
    const adText = `AURELIA SKINCARE
VITAMIN C GLOW SERUM
Discover your daily skincare ritual.
BRIGHTENS Dull Skin | EVENS TONE Reduces Dark Spots | HYDRATES For Healthy Glow
Only ₹1,299 >
Dermatologically Tested | Paraben Free | Cruelty Free
*Based on a clinical trial of 30 women over 4 weeks.`;

    const report = await runContentAudit(
      {
        draftText: adText,
        assetTitle: 'Vitamin C Glow Serum Advertisement',
        assetType: 'image',
        extractedVia: 'Tesseract OCR'
      },
      kb
    );

    const priceFinding = report.findings.find(f => f.ruleType === 'Price');
    assert.ok(priceFinding, 'Must generate a Price finding for mismatch');
    assert.equal(priceFinding?.severity, 'HIGH');
    assert.equal(priceFinding?.priceDetails?.creativePrice, 1299);
    assert.equal(priceFinding?.priceDetails?.approvedPrice, 899);
    assert.equal(priceFinding?.priceDetails?.matchedProductSku, 'AUR-VTC-30');
    assert.equal(priceFinding?.priceDetails?.matchedProductName, 'Aurelia Radiant Vitamin C Serum');
    assert.ok(priceFinding?.suggestedFix.includes('899'), 'Suggested fix should recommend catalog price ₹899');
    assert.equal(report.approvalStatus, 'Blocked', 'Overall status should be Blocked due to price mismatch');
  });

  test('runContentAudit does NOT flag price when creative price matches approved catalog (₹899)', async () => {
    const { runContentAudit } = await import('../src/services/auditorEngine');
    const adText = `AURELIA SKINCARE
VITAMIN C GLOW SERUM
Discover your daily skincare ritual.
Only ₹899
*Based on a clinical trial of 30 women over 4 weeks.`;

    const report = await runContentAudit(
      {
        draftText: adText,
        assetTitle: 'Vitamin C Serum Correct Price',
        assetType: 'image',
        extractedVia: 'Tesseract OCR'
      },
      kb
    );

    const priceMismatch = report.findings.find(f =>
      f.ruleType === 'Price' && f.priceDetails?.reviewStatus === 'CONFIRMED_MISMATCH'
    );
    assert.equal(priceMismatch, undefined, 'Should NOT flag when price matches approved catalog');
  });

  test('runContentAudit produces unverified price report instead of silent approval when price is missing on commercial creative', async () => {
    const { runContentAudit } = await import('../src/services/auditorEngine');
    const adText = `AURELIA SKINCARE
VITAMIN C GLOW SERUM
Discover your daily skincare ritual.
*Based on a clinical trial of 30 women over 4 weeks.`;

    const report = await runContentAudit(
      {
        draftText: adText,
        assetTitle: 'Vitamin C Serum Missing Price',
        assetType: 'image',
        extractedVia: 'Tesseract OCR'
      },
      kb
    );

    const unverifiedFinding = report.findings.find(f =>
      f.ruleType === 'Price' && f.priceDetails?.reviewStatus === 'UNVERIFIED_PRICE'
    );
    assert.ok(unverifiedFinding, 'Should report unverified price finding');
    assert.equal(unverifiedFinding?.priceDetails?.reviewStatus, 'UNVERIFIED_PRICE');
    assert.equal(report.approvalStatus, 'Needs Review', 'Should be Needs Review when price is unverified');
  });

  test('re-audit preserves reviewer decision and note across multiple audit runs without duplicating findings', async () => {
    const { runContentAudit } = await import('../src/services/auditorEngine');
    const adText = `AURELIA SKINCARE
VITAMIN C GLOW SERUM
Discover your daily skincare ritual.
Only ₹1,299
*Based on a clinical trial of 30 women over 4 weeks.`;

    // First audit
    const initialReport = await runContentAudit(
      {
        draftText: adText,
        assetTitle: 'Vitamin C Glow Serum Ad',
        assetType: 'image',
        extractedVia: 'Tesseract OCR'
      },
      kb
    );

    const priceFinding = initialReport.findings.find(f => f.ruleType === 'Price')!;
    assert.ok(priceFinding, 'Finding must exist');

    // Simulate reviewer recording an approved exception
    const findingsWithDecision: AuditFinding[] = initialReport.findings.map(f => {
      if (f.id === priceFinding.id) {
        return {
          ...f,
          decision: 'REJECTED' as const,
          decisionNote: 'Special festival gift packaging edition with ₹1,299 MSRP authorized by VP Marketing',
          decisionBy: 'Meera (Compliance Reviewer)',
          decisionTimestamp: new Date().toISOString()
        };
      }
      return f;
    });

    // Run audit second time with existingFindings passed
    const reauditedReport = await runContentAudit(
      {
        draftText: adText,
        assetTitle: 'Vitamin C Glow Serum Ad',
        assetType: 'image',
        extractedVia: 'Tesseract OCR',
        existingFindings: findingsWithDecision
      },
      kb
    );

    // Verify findings are NOT duplicated
    const priceFindings = reauditedReport.findings.filter(f => f.ruleType === 'Price');
    assert.equal(priceFindings.length, 1, 'Must not duplicate findings on re-audit');

    // Verify decision and notes were preserved
    const preservedFinding = priceFindings[0];
    assert.equal(preservedFinding.decision, 'REJECTED');
    assert.equal(preservedFinding.decisionNote, 'Special festival gift packaging edition with ₹1,299 MSRP authorized by VP Marketing');
    assert.equal(preservedFinding.decisionBy, 'Meera (Compliance Reviewer)');
  });

  test('calculateAssetAuditStatus returns Blocked, Needs Review, or Approved correctly', async () => {
    const { calculateAssetAuditStatus } = await import('../src/services/productCatalogService');

    // Clean findings
    assert.equal(calculateAssetAuditStatus([]), 'Approved');

    // Resolved finding
    const resolvedFinding: AuditFinding = {
      ...createMockFinding('HIGH', 'f1'),
      decision: 'ACCEPTED'
    };
    assert.equal(calculateAssetAuditStatus([resolvedFinding]), 'Approved');

    // High severity unresolved finding
    const highFinding: AuditFinding = {
      ...createMockFinding('HIGH', 'f2'),
      decision: 'PENDING'
    };
    assert.equal(calculateAssetAuditStatus([highFinding]), 'Blocked');

    // Unverified finding
    const unverifiedFinding: AuditFinding = {
      ...createMockFinding('MEDIUM', 'f3'),
      category: 'Price could not be verified',
      decision: 'PENDING'
    };
    assert.equal(calculateAssetAuditStatus([unverifiedFinding]), 'Needs Review');
  });
});

describe('Task 7 — Campaign Multi-Variable Consistency & Preset Campaigns', () => {
  const kb = INITIAL_BRAND_KNOWLEDGE_BASE;

  test('auditCampaignConsistency flags Discount Percentage and Promo Code conflicts in Diwali Campaign', () => {
    const { conflicts } = auditCampaignConsistency(DIWALI_CAMPAIGN, kb);
    const discountConflict = conflicts.find(c => c.type === 'Discount Percentage Mismatch');
    const promoConflict = conflicts.find(c => c.type === 'Promo Code Inconsistency');

    assert.ok(discountConflict, 'Should identify conflicting discount percentages (35% vs 25% vs 20%)');
    assert.equal(discountConflict.severity, 'HIGH');
    assert.ok(promoConflict, 'Should identify conflicting promo codes (DIWALI35 vs DIWALI25 vs DIWALI20)');
    assert.equal(promoConflict.severity, 'HIGH');
  });

  test('auditCampaignConsistency flags Commercial Policy Violation in CSR Blood Donation Campaign', () => {
    const { conflicts } = auditCampaignConsistency(BLOOD_DONATION_CAMPAIGN, kb);
    const commercialConflict = conflicts.find(c => c.type === 'Commercial / Policy Violation');
    const dateConflict = conflicts.find(c => c.type === 'Date Expiry Conflict');

    assert.ok(commercialConflict, 'Should catch prohibited ₹500 gift vouchers for voluntary blood donation');
    assert.equal(commercialConflict.severity, 'HIGH');
    assert.ok(dateConflict, 'Should catch event date discrepancy (12 Nov vs 14 Nov)');
  });

  test('autoAlignCampaignAssets harmonizes multi-channel conflicts across campaign presets', () => {
    const { updatedCampaign, alignedCount } = autoAlignCampaignAssets(DIWALI_CAMPAIGN, kb);
    assert.ok(alignedCount > 0, 'Should align multiple divergent assets');

    const reAudited = auditCampaignConsistency(updatedCampaign, kb);
    const remainingHigh = reAudited.conflicts.filter(c => c.severity === 'HIGH');
    assert.equal(remainingHigh.length, 0, 'All high severity commercial discrepancies must be resolved');
  });
});
