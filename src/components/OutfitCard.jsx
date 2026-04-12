import { IoBookmarkOutline } from 'react-icons/io5';

export default function OutfitCard({ outfit, onSave, onDelete }) {
  return (
    <div className="outfit-card">
      <div className="outfit-card__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div className="outfit-card__name">{outfit.name}</div>
          {outfit.confidence > 0 && (
            <div style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-full, 100px)',
              background: outfit.confidence >= 8
                ? 'rgba(52, 211, 153, 0.15)'
                : outfit.confidence >= 5
                  ? 'rgba(251, 191, 36, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              color: outfit.confidence >= 8
                ? 'var(--success, #34d399)'
                : outfit.confidence >= 5
                  ? '#fbbf24'
                  : 'var(--error, #ef4444)',
              fontSize: '0.7rem',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {outfit.confidence}/10
            </div>
          )}
        </div>
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

      {/* Color Story */}
      {outfit.colorStory && (
        <div style={{
          marginTop: 8,
          padding: '8px 12px',
          background: 'rgba(99, 102, 241, 0.06)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          🎨 <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Color Story:</span> {outfit.colorStory}
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

      {/* Missing Pieces / Shopping Suggestions */}
      {outfit.missingPieces && outfit.missingPieces.length > 0 && (
        <div style={{
          marginTop: 8,
          padding: '8px 12px',
          background: 'rgba(251, 191, 36, 0.06)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>🛍️ Would elevate this look:</span>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: 18 }}>
            {outfit.missingPieces.map((piece, i) => (
              <li key={i} style={{ marginBottom: 2 }}>{piece}</li>
            ))}
          </ul>
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
