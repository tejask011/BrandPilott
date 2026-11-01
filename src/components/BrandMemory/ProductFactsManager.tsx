import React, { useState } from 'react';
import {
  Tag,
  Calendar,
  History,
  Plus,
  Edit2,
  CheckCircle2,
  Clock,
  Archive
} from 'lucide-react';
import { BrandKnowledgeBase, ProductFact, PriceRecord } from '../../types/brand';

interface ProductFactsManagerProps {
  kb: BrandKnowledgeBase;
  onUpdateKb: (updated: BrandKnowledgeBase) => void;
  onFactChanged?: (factSummary: string) => void;
}

export const ProductFactsManager: React.FC<ProductFactsManagerProps> = ({
  kb,
  onUpdateKb,
  onFactChanged
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductFact>(kb.products[0]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);

  // Price update form state
  const [newPrice, setNewPrice] = useState<number>(selectedProduct.currentPrice);
  const [campaignName, setCampaignName] = useState('');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('2027-12-31');
  const [priceNotes, setPriceNotes] = useState('');

  // New product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Moisturizers');
  const [newProdVolume, setNewProdVolume] = useState('50ml');
  const [newProdPrice, setNewProdPrice] = useState(999);
  const [newProdIngredients, setNewProdIngredients] = useState('');

  const handleOpenPriceModal = (prod: ProductFact) => {
    setSelectedProduct(prod);
    setNewPrice(prod.currentPrice);
    setCampaignName(`Price Update ${kb.activeVersion}`);
    setValidFrom(new Date().toISOString().split('T')[0]);
    setValidUntil('2027-12-31');
    setPriceNotes('');
    setShowPriceModal(true);
  };

  const handleSavePriceUpdate = () => {
    if (!newPrice || newPrice <= 0) return;

    // Archive old price record
    const archivedPriceRecord: PriceRecord = {
      id: `ph-${Date.now()}`,
      price: selectedProduct.currentPrice,
      currency: selectedProduct.currency,
      campaignName: `Prior Catalog Rate`,
      validFrom: selectedProduct.validFrom,
      validUntil: validFrom,
      isCurrent: false,
      notes: `Archived on ${new Date().toISOString().split('T')[0]} by Manager update`
    };

    const newActivePriceRecord: PriceRecord = {
      id: `ph-${Date.now() + 1}`,
      price: newPrice,
      currency: selectedProduct.currency,
      campaignName: campaignName || 'Standard Brand Catalog',
      validFrom,
      validUntil,
      isCurrent: true,
      notes: priceNotes || 'Active approved price'
    };

    const updatedProducts = kb.products.map(p => {
      if (p.id === selectedProduct.id) {
        return {
          ...p,
          currentPrice: newPrice,
          validFrom,
          validUntil,
          priceHistory: [newActivePriceRecord, archivedPriceRecord, ...p.priceHistory.filter(h => !h.isCurrent)]
        };
      }
      return p;
    });

    // Bump version minor
    const currentVerNum = parseFloat(kb.activeVersion.replace('v', '')) || 3.2;
    const newVersion = `v${(currentVerNum + 0.1).toFixed(1)}`;

    const changeDescription = `Updated ${selectedProduct.productName} price from ₹${selectedProduct.currentPrice} to ₹${newPrice} (Valid ${validFrom} to ${validUntil}).`;

    const updatedKb: BrandKnowledgeBase = {
      ...kb,
      activeVersion: newVersion,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Arjun (Brand Manager)',
      products: updatedProducts,
      versionHistory: [
        {
          version: newVersion,
          timestamp: new Date().toISOString(),
          updatedBy: 'Arjun (Brand Manager)',
          changesSummary: changeDescription,
          snapshotDescription: `Price revision for ${selectedProduct.sku}.`
        },
        ...kb.versionHistory
      ]
    };

    onUpdateKb(updatedKb);
    setSelectedProduct(updatedProducts.find(p => p.id === selectedProduct.id)!);
    setShowPriceModal(false);
    onFactChanged?.(changeDescription);
  };

  const handleCreateProduct = () => {
    if (!newProdName.trim() || !newProdSku.trim()) return;

    const newProd: ProductFact = {
      id: `p-${Date.now()}`,
      productName: newProdName.trim(),
      sku: newProdSku.trim(),
      category: newProdCategory,
      volume: newProdVolume,
      currentPrice: newProdPrice,
      currency: 'INR (₹)',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '2027-12-31',
      approvalStatus: 'Approved',
      ingredientsSummary: newProdIngredients,
      aliases: [newProdName.trim()],
      priceHistory: [
        {
          id: `ph-${Date.now()}`,
          price: newProdPrice,
          currency: 'INR (₹)',
          campaignName: 'Initial Launch Catalog',
          validFrom: new Date().toISOString().split('T')[0],
          validUntil: '2027-12-31',
          isCurrent: true,
          notes: 'Standard launch price'
        }
      ]
    };

    const updatedKb: BrandKnowledgeBase = {
      ...kb,
      products: [...kb.products, newProd],
      lastUpdated: new Date().toISOString()
    };

    onUpdateKb(updatedKb);
    setSelectedProduct(newProd);
    setShowNewProductModal(false);
    setNewProdName('');
    setNewProdSku('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '10px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={18} color="#16A34A" />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#166534' }}>
              Product Truth & Price Validity Timeline
            </span>
            <span className="badge badge-success">Manager Authorized</span>
          </div>
          <div style={{ fontSize: '12.5px', color: '#15803D', marginTop: '4px' }}>
            Store each price with its validity window. Old prices are kept so the auditor knows "₹1,099 was valid until last month" rather than claiming it was invented.
          </div>
        </div>

        <button className="btn btn-brand btn-sm" onClick={() => setShowNewProductModal(true)}>
          <Plus size={14} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Main Grid: Products List & Price History Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
        {/* Products List */}
        <div className="curved-section-box">
          <div className="curved-section-header">
            <div className="curved-section-title">
              <Tag size={18} color="#00473E" />
              <span>Catalog Products ({kb.products.length})</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {kb.products.map(prod => {
              const isSelected = selectedProduct.id === prod.id;
              return (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>
                        {prod.productName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        SKU: <strong>{prod.sku}</strong> | Vol: {prod.volume} | Cat: {prod.category}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#00473E' }}>
                        ₹{prod.currentPrice.toLocaleString('en-IN')}
                      </div>
                      <span className="badge badge-success" style={{ marginTop: '4px' }}>
                        {prod.approvalStatus}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid #E2E8F0',
                      fontSize: '11.5px',
                      color: '#64748B'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      <span>Valid: {prod.validFrom} to {prod.validUntil}</span>
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleOpenPriceModal(prod);
                      }}
                      style={{ padding: '2px 8px', fontSize: '11px' }}
                    >
                      <Edit2 size={12} />
                      <span>Update Price</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Product Price History & Details */}
        <div className="curved-section-box">
          <div className="curved-section-header">
            <div className="curved-section-title">
              <History size={18} color="#2563EB" />
              <span>Price Validity History: {selectedProduct.productName}</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenPriceModal(selectedProduct)}>
              <Edit2 size={14} />
              <span>Edit / Revise Price</span>
            </button>
          </div>

          {/* Current Active Price Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              marginBottom: '18px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-success">Current Active Truth</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#00473E', marginTop: '6px' }}>
                  ₹{selectedProduct.currentPrice.toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#166534' }}>
                <div><strong>Effective From:</strong> {selectedProduct.validFrom}</div>
                <div><strong>Valid Until:</strong> {selectedProduct.validUntil}</div>
                <div style={{ marginTop: '4px', color: '#15803D' }}>Approved by Brand Manager</div>
              </div>
            </div>

            {selectedProduct.ingredientsSummary && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#334155', borderTop: '1px solid #BBF7D0', paddingTop: '8px' }}>
                <strong>Key Formula Facts:</strong> {selectedProduct.ingredientsSummary}
              </div>
            )}
          </div>

          {/* Historical Prices Timeline */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} />
              <span>Historical Validity Records (Kept as comparison evidence)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedProduct.priceHistory.map(ph => (
                <div
                  key={ph.id}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: ph.isCurrent ? '#F8FAFC' : '#FEF2F2',
                    border: ph.isCurrent ? '1px solid #CBD5E1' : '1px solid #FECACA',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: ph.isCurrent ? '#0F172A' : '#991B1B' }}>
                        ₹{ph.price.toLocaleString('en-IN')}
                      </span>
                      {ph.isCurrent ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-violation">
                          <Archive size={11} />
                          <span>Expired</span>
                        </span>
                      )}
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                        {ph.campaignName}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                      {ph.notes}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#64748B' }}>
                    <div>From: {ph.validFrom}</div>
                    <div>Until: <strong>{ph.validUntil}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Price Revision Modal */}
      {showPriceModal && (
        <div className="modal-overlay" onClick={() => setShowPriceModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                Revise Price Record — {selectedProduct.productName}
              </div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                onClick={() => setShowPriceModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '14px', padding: '12px', background: '#FEF3C7', borderRadius: '8px', border: '1px solid #FDE68A', fontSize: '12px', color: '#92400E' }}>
                <strong>Versioned Update:</strong> Saving this change will archive ₹{selectedProduct.currentPrice} with validity end date {validFrom}, record this action in the Brand Memory Ledger, and trigger a recheck prompt for all active campaign assets.
              </div>

              <div className="form-group">
                <label className="form-label">New Approved Price (INR ₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newPrice}
                  onChange={e => setNewPrice(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Catalog / Campaign Tier Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Q4 Standard Catalog 2026"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Valid From Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={validFrom}
                    onChange={e => setValidFrom(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Valid Until Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Approval Rationale / Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Monsoon promotional rate ended. Returning to standard catalog price."
                  value={priceNotes}
                  onChange={e => setPriceNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPriceModal(false)}>
                Cancel
              </button>
              <button className="btn btn-brand" onClick={handleSavePriceUpdate}>
                <CheckCircle2 size={16} />
                <span>Save & Create Version</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {showNewProductModal && (
        <div className="modal-overlay" onClick={() => setShowNewProductModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                Add New Product to Brand Knowledge Base
              </div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                onClick={() => setShowNewProductModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Aurelia Night Recovery Peptide Balm"
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">SKU Identifier</label>
                  <input
                    className="form-input"
                    placeholder="e.g. AUR-NRP-50"
                    value={newProdSku}
                    onChange={e => setNewProdSku(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Net Volume / Weight</label>
                  <input
                    className="form-input"
                    placeholder="e.g. 50g"
                    value={newProdVolume}
                    onChange={e => setNewProdVolume(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    className="form-input"
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Launch Price (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Key Active Ingredients</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. 3% Copper Tripeptide, Bakuchiol, Evening Primrose Oil"
                  value={newProdIngredients}
                  onChange={e => setNewProdIngredients(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewProductModal(false)}>
                Cancel
              </button>
              <button className="btn btn-brand" onClick={handleCreateProduct}>
                Add to Knowledge Base
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
