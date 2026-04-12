import { IoClose, IoTrashOutline, IoCreateOutline } from 'react-icons/io5';
import { deleteClothing } from '../db';
import { useState } from 'react';

export default function ClothingDetailModal({ clothing, onClose, onDelete, showToast }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteClothing(clothing.id);
      onDelete();
    } catch (err) {
      showToast('Failed to delete', 'error');
      setDeleting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-handle" />
        <div className="modal-header">
          <h2 className="modal-title">{clothing.name || 'Clothing Item'}</h2>
          <button className="icon-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        {/* Image */}
        {clothing.imageDataUrl && (
          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16 }}>
            <img
              src={clothing.imageDataUrl}
              alt={clothing.name}
              style={{ width: '100%', maxHeight: '40vh', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <DetailItem label="Type" value={clothing.type} />
          <DetailItem label="Sub-type" value={clothing.subType} />
          <DetailItem label="Pattern" value={clothing.pattern} />
          <DetailItem label="Material" value={clothing.material} />
          <DetailItem label="Formality" value={clothing.formality} />
          <DetailItem label="Fit" value={clothing.fit} />
        </div>

        {/* Colors */}
        {clothing.colors && clothing.colors.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="input-label">Colors</div>
            <div className="chip-group">
              {clothing.colors.map((color, i) => (
                <span key={i} className="chip chip--sm">{color}</span>
              ))}
            </div>
          </div>
        )}

        {/* Seasons */}
        {clothing.seasons && clothing.seasons.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="input-label">Seasons</div>
            <div className="chip-group">
              {clothing.seasons.map((s, i) => (
                <span key={i} className="chip chip--sm chip--active">
                  {s === 'spring' ? '🌸' : s === 'summer' ? '☀️' : s === 'fall' ? '🍂' : '❄️'} {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Occasions */}
        {clothing.occasions && clothing.occasions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="input-label">Occasions</div>
            <div className="chip-group">
              {clothing.occasions.map((o, i) => (
                <span key={i} className="chip chip--sm">{o}</span>
              ))}
            </div>
          </div>
        )}

        {/* AI Description */}
        {clothing.description && (
          <div style={{ marginBottom: 16 }}>
            <div className="input-label">AI Description</div>
            <div style={{
              padding: 12,
              background: 'var(--bg-glass)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              {clothing.description}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {(clothing.versatility > 0 || (clothing.pairsWith && clothing.pairsWith.length > 0) || clothing.careInstructions) && (
          <div style={{
            marginBottom: 20,
            padding: '10px 14px',
            background: 'rgba(168, 85, 247, 0.06)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(168, 85, 247, 0.1)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>✨ AI Insights</div>
            {clothing.versatility > 0 && (
              <div style={{ marginBottom: 4 }}>
                <strong>Versatility:</strong> {clothing.versatility}/10 — {clothing.versatility >= 7 ? 'A wardrobe workhorse!' : clothing.versatility >= 4 ? 'Good for several looks' : 'Statement piece'}
              </div>
            )}
            {clothing.pairsWith && clothing.pairsWith.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <strong>Pairs well with:</strong> {clothing.pairsWith.join(', ')}
              </div>
            )}
            {clothing.careInstructions && (
              <div>
                <strong>Care:</strong> {clothing.careInstructions}
              </div>
            )}
          </div>
        )}

        <div className="divider" />

        {/* Actions */}
        {!showDeleteConfirm ? (
          <button
            className="btn btn--ghost btn--full"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ color: 'var(--error)' }}
          >
            <IoTrashOutline /> Delete from Wardrobe
          </button>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              Delete "{clothing.name}"? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn--secondary"
                style={{ flex: 1 }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{ flex: 1, background: 'var(--error)', color: 'white' }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  if (!value) return null;
  return (
    <div style={{
      padding: 10,
      background: 'var(--bg-glass)',
      borderRadius: 'var(--radius-sm)',
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </div>
    </div>
  );
}
