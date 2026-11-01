import React, { useState, useRef, useEffect } from 'react';
import { Plus, Layers, Upload, Image as ImageIcon, X, Check } from 'lucide-react';
import { AssetChannel, CampaignAsset } from '../../types/campaign';
import { ProductFact } from '../../types/brand';
import { loadBrandKnowledgeBase } from '../../services/storageService';
import { saveAssetImage } from '../../services/imageStorage';

interface AddAssetModalProps {
  onClose: () => void;
  onAddAsset: (newAsset: CampaignAsset) => void;
  products?: ProductFact[];
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({ onClose, onAddAsset, products }) => {
  const [catalogProducts, setCatalogProducts] = useState<ProductFact[]>(products || []);
  const [selectedProductSku, setSelectedProductSku] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  const [title, setTitle] = useState('');
  const [teamName, setTeamName] = useState('Team Creative Pulse');
  const [channel, setChannel] = useState<AssetChannel>('Instagram');
  const [format, setFormat] = useState<'Image' | 'PDF' | 'Copy'>('Image');
  const [priceStr, setPriceStr] = useState('₹1,299');
  const [offer, setOffer] = useState('Standard Catalog Offer');
  const [dateStr, setDateStr] = useState('Valid till 30 Nov 2026');
  const [tagline, setTagline] = useState('Discover your daily skincare ritual.');
  const [logoVersion, setLogoVersion] = useState('Logo v3 (Approved)');
  const [disclaimer, setDisclaimer] = useState('*Based on clinical trial of 30 women over 4 weeks.');
  const [fullText, setFullText] = useState('');
  
  // Image Upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!products || products.length === 0) {
      try {
        const kb = loadBrandKnowledgeBase();
        if (kb && kb.products) {
          setCatalogProducts(kb.products);
        }
      } catch (e) {
        console.warn('Failed to load products for AddAssetModal:', e);
      }
    }
  }, [products]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }
    setImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setImagePreviewUrl(localUrl);
    setFormat('Image');
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1));
    }
  };

  const handleProductSelect = (sku: string) => {
    setSelectedProductSku(sku);
    if (!sku) {
      setSelectedProductId('');
      return;
    }
    const matched = catalogProducts.find(p => p.sku === sku);
    if (matched) {
      setSelectedProductId(matched.id);
      // Auto-populate price if appropriate
      setPriceStr(`₹${matched.currentPrice.toLocaleString('en-IN')}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const priceNum = parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 1299;
    const assetId = `asset-${Date.now()}`;

    let storedPreviewUrl = '';
    if (imageFile) {
      try {
        storedPreviewUrl = await saveAssetImage(assetId, imageFile);
      } catch (err) {
        console.warn('Failed to save image to IndexedDB:', err);
        storedPreviewUrl = imagePreviewUrl || '';
      }
    }

    const newAsset: CampaignAsset = {
      id: assetId,
      title: title.trim(),
      teamName,
      channel,
      format: imageFile ? 'Image' : format,
      previewUrl: storedPreviewUrl,
      productId: selectedProductId || undefined,
      productSku: selectedProductSku || undefined,
      uploadedAt: new Date().toISOString(),
      extractedPrice: priceNum,
      extractedPriceStr: priceStr,
      extractedOffer: offer,
      extractedDate: dateStr,
      extractedTagline: tagline,
      extractedLogoVersion: logoVersion,
      extractedDisclaimer: disclaimer,
      extractedBackground: '✓ Pearl Cream (#F7F5F0) matte studio surface with subtle botanical shadow',
      backgroundStatus: 'Clean',
      backgroundFindings: [],
      fullText: fullText || `${title} - ${tagline}. Price: ${priceStr}. ${disclaimer}`,
      status: 'In Sync',
      conflictCount: 0
    };

    onAddAsset(newAsset);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
              <Layers size={18} color="#2563EB" />
              <span>Add Creative Asset to Campaign</span>
            </div>
            <button
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {/* Creative Image Attachment */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Creative Image (Optional — for Visual OCR & Overlay Pins)</span>
                {imageFile && (
                  <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} /> Image Attached
                  </span>
                )}
              </label>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />

              {imagePreviewUrl ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #BBF7D0',
                    backgroundColor: '#F0FDF4'
                  }}
                >
                  <img
                    src={imagePreviewUrl}
                    alt="Creative Preview"
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1px solid #86EFAC'
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {imageFile?.name || 'Selected creative image'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#15803D' }}>
                      {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ''} · Ready for visual evidence audit
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ color: '#DC2626', borderColor: '#FECACA' }}
                    onClick={() => {
                      setImageFile(null);
                      setImagePreviewUrl(null);
                    }}
                  >
                    <X size={12} />
                    <span>Remove</span>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #CBD5E1',
                    borderRadius: '10px',
                    padding: '16px',
                    textAlign: 'center',
                    backgroundColor: '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                    <Upload size={18} />
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                    Click or drag & drop creative image here
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    Supports PNG, JPG, WebP. Visual OCR and pinpoint markers will link to this image.
                  </div>
                </div>
              )}
            </div>

            {/* Target Catalog Product Mapping */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Target Product (Catalog Mapping)</span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Used for price & claim consistency checks</span>
              </label>
              <select
                className="form-select"
                value={selectedProductSku}
                onChange={e => handleProductSelect(e.target.value)}
              >
                <option value="">Auto-detect from creative / OCR text</option>
                {catalogProducts.map(prod => (
                  <option key={prod.id} value={prod.sku}>
                    {prod.productName} — ₹{prod.currentPrice.toLocaleString('en-IN')} (SKU: {prod.sku})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Asset Title</label>
                <input
                  className="form-input"
                  placeholder="e.g. Metro Station Outdoor Billboard"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Agency / Production Team</label>
                <select
                  className="form-select"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                >
                  <option value="Team Creative Pulse">Team Creative Pulse (Social Agency)</option>
                  <option value="Team Metro Print & Retail">Team Metro Print & Retail (Print Agency)</option>
                  <option value="Team Growth & CRM Pod">Team Growth & CRM Pod (In-House Digital)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Marketing Channel</label>
                <select
                  className="form-select"
                  value={channel}
                  onChange={e => setChannel(e.target.value as AssetChannel)}
                >
                  <option value="Instagram">Instagram</option>
                  <option value="Website">Website</option>
                  <option value="Print Brochure">Print Brochure</option>
                  <option value="Email">Email</option>
                  <option value="Billboard">Billboard</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Asset Format</label>
                <select
                  className="form-select"
                  value={format}
                  onChange={e => setFormat(e.target.value as 'Image' | 'PDF' | 'Copy')}
                >
                  <option value="Image">Image (Social / Banner)</option>
                  <option value="PDF">PDF (Brochure / Catalog)</option>
                  <option value="Copy">Copy (Landing page / Email)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Campaign Validity Date</label>
                <input
                  className="form-input"
                  placeholder="e.g. Valid till 30 Nov 2026"
                  value={dateStr}
                  onChange={e => setDateStr(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Promotional Offer Note</label>
                <input
                  className="form-input"
                  placeholder="e.g. Standard Catalog Offer"
                  value={offer}
                  onChange={e => setOffer(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Displayed Price</label>
                <input
                  className="form-input"
                  placeholder="e.g. ₹1,299"
                  value={priceStr}
                  onChange={e => setPriceStr(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Displayed Logo Version</label>
                <select
                  className="form-select"
                  value={logoVersion}
                  onChange={e => setLogoVersion(e.target.value)}
                >
                  <option value="Logo v3 (Approved)">Logo v3.0 (Botanical Emblem - Approved)</option>
                  <option value="Logo v2 (Deprecated)">Logo v2.1 (Vintage Crest - Deprecated)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tagline / Headline</label>
              <input
                className="form-input"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="e.g. Discover your daily skincare ritual."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mandatory Disclaimer Included?</label>
              <input
                className="form-input"
                value={disclaimer}
                onChange={e => setDisclaimer(e.target.value)}
                placeholder="e.g. *Based on clinical trial of 30 women over 4 weeks or 'None'"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Draft Copy / Full Text</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={fullText}
                onChange={e => setFullText(e.target.value)}
                placeholder="Draft copy of the asset..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-brand">
              <Plus size={14} />
              <span>Add to Campaign & Run Audit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
