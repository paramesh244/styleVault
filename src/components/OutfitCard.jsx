import { IoBookmarkOutline } from 'react-icons/io5';

export default function OutfitCard({ outfit, onSave, onDelete }) {
  return (
    <div className="outfit-card">
      <div className="outfit-card__header">
        <div className="outfit-card__name">{outfit.name}</div>
        {outfit.styleNotes && (
          <div className="outfit-card__badge">💡 Tip</div>
        )}
      </div>

      {/* Item Thumbnails */}
      <div className="outfit-card__items">
        {(outfit.items || []).map((item, i) => (
          <div key={i} style={{ textAlign: 'center', flexShrink: 0 }}>
            {item.thumbnailDataUrl || item.imageDataUrl ? (
              <img
                src={item.thumbnailDataUrl || item.imageDataUrl}
                alt={item.name}
                className="outfit-card__item-thumb"
              />
            ) : (
              <div
                className="outfit-card__item-thumb"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-tertiary)',
                  fontSize: '1.5rem',
                }}
              >
                👕
              </div>
            )}
            <div style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              marginTop: 4,
              maxWidth: 80,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {item.name}
            </div>
          </div>
        ))}
        {(outfit.items || []).length === 0 && (
          <div style={{
            padding: '20px',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            fontStyle: 'italic',
          }}>
            Items not found in wardrobe (may have been deleted)
          </div>
        )}
      </div>

      {/* Reasoning */}
      {outfit.reasoning && (
        <div className="outfit-card__reasoning">
          <div className="outfit-card__reasoning-label">✨ Why this works</div>
          {outfit.reasoning}
        </div>
      )}

      {/* Style Notes */}
      {outfit.styleNotes && (
        <div style={{
          marginTop: 8,
          padding: '8px 12px',
          background: 'rgba(168, 85, 247, 0.06)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem',
          color: 'var(--text-accent)',
        }}>
          💡 {outfit.styleNotes}
        </div>
      )}

      {/* Actions */}
      <div className="outfit-card__actions">
        {onSave && (
          <button className="btn btn--secondary" onClick={onSave} style={{ flex: 1 }}>
            <IoBookmarkOutline /> Save Outfit
          </button>
        )}
        {onDelete && (
          <button
            className="btn btn--ghost"
            onClick={onDelete}
            style={{ color: 'var(--error)' }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
