import { useState, useEffect } from 'react';
import { IoSearchOutline } from 'react-icons/io5';
import { getAllClothing } from '../db';
import ClothingCard from './ClothingCard';

const FILTER_TYPES = ['all', 'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];

export default function WardrobePage({ onSelectClothing, onAddClick }) {
  const [clothing, setClothing] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClothing();
  }, []);

  async function loadClothing() {
    setLoading(true);
    const items = await getAllClothing();
    setClothing(items);
    setLoading(false);
  }

  const filtered = clothing.filter((item) => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch =
      !search ||
      (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.subType || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div>
        <h1 className="page-title">My Wardrobe</h1>
        <p className="page-subtitle">Loading your clothes...</p>
        <div className="clothing-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="clothing-card">
              <div className="skeleton" style={{ aspectRatio: '3/4' }} />
              <div style={{ padding: '10px 12px' }}>
                <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 10, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (clothing.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">👗</div>
        <h2 className="empty-state__title">Your Wardrobe is Empty</h2>
        <p className="empty-state__text">
          Start by adding your first clothing item. Take a photo or upload from your gallery!
        </p>
        <button className="btn btn--primary btn--lg" onClick={onAddClick} id="add-first-item-btn">
          + Add First Item
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">My Wardrobe</h1>
      <p className="page-subtitle">{clothing.length} item{clothing.length !== 1 ? 's' : ''} in your collection</p>

      {/* Search */}
      <div className="input-group" style={{ marginBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <IoSearchOutline
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '1.1rem',
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search your clothes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
            id="wardrobe-search"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="filter-bar">
        {FILTER_TYPES.map((type) => (
          <button
            key={type}
            className={`chip ${filter === type ? 'chip--active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            {type !== 'all' &&
              ` (${clothing.filter((c) => c.type === type).length})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state__icon">🔍</div>
          <p className="empty-state__text">No items match your filter</p>
        </div>
      ) : (
        <div className="clothing-grid">
          {filtered.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              onClick={() => onSelectClothing(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
