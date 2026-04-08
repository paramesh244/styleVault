const COLOR_MAP = {
  black: '#1a1a1a',
  white: '#f5f5f5',
  gray: '#888',
  grey: '#888',
  navy: '#1e3a5f',
  blue: '#3b82f6',
  'light blue': '#7dd3fc',
  'dark blue': '#1e40af',
  red: '#ef4444',
  'dark red': '#991b1b',
  maroon: '#7f1d1d',
  burgundy: '#6b1d3a',
  pink: '#ec4899',
  'hot pink': '#db2777',
  green: '#22c55e',
  'dark green': '#166534',
  olive: '#6b7c3e',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#a855f7',
  violet: '#8b5cf6',
  brown: '#92400e',
  tan: '#d2b48c',
  beige: '#f5f0e1',
  cream: '#fef9ef',
  khaki: '#c3b091',
  gold: '#ca8a04',
  silver: '#94a3b8',
  coral: '#f87171',
  teal: '#14b8a6',
  turquoise: '#06b6d4',
};

function getColorHex(colorName) {
  const lower = colorName.toLowerCase().trim();
  return COLOR_MAP[lower] || '#888';
}

export default function ClothingCard({ item, onClick }) {
  return (
    <div className="clothing-card" onClick={onClick} id={`clothing-${item.id}`}>
      {item.imageDataUrl ? (
        <img
          src={item.thumbnailDataUrl || item.imageDataUrl}
          alt={item.name || 'Clothing item'}
          className="clothing-card__image"
          loading="lazy"
        />
      ) : (
        <div
          className="clothing-card__image"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
          }}
        >
          👕
        </div>
      )}
      <div className="clothing-card__info">
        <div className="clothing-card__name">{item.name || 'Unnamed Item'}</div>
        <div className="clothing-card__type">
          {item.subType || item.type || 'Clothing'}
        </div>
        {item.colors && item.colors.length > 0 && (
          <div className="clothing-card__colors">
            {item.colors.slice(0, 4).map((color, i) => (
              <div
                key={i}
                className="color-dot"
                style={{ backgroundColor: getColorHex(color) }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
