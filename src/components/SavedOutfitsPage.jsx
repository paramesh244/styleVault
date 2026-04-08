import { useState, useEffect } from 'react';
import { getAllOutfits, deleteOutfit, getClothingById } from '../db';
import OutfitCard from './OutfitCard';

export default function SavedOutfitsPage({ showToast }) {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOutfits();
  }, []);

  async function loadOutfits() {
    setLoading(true);
    const saved = await getAllOutfits();

    // Enrich with clothing data
    const enriched = await Promise.all(
      saved.map(async (outfit) => {
        const items = await Promise.all(
          (outfit.clothingIds || []).map((id) => getClothingById(id))
        );
        return {
          ...outfit,
          name: outfit.name || 'Saved Outfit',
          reasoning: outfit.aiReasoning,
          styleNotes: outfit.styleNotes,
          items: items.filter(Boolean),
        };
      })
    );

    setOutfits(enriched);
    setLoading(false);
  }

  async function handleDelete(outfitId) {
    await deleteOutfit(outfitId);
    setOutfits((prev) => prev.filter((o) => o.id !== outfitId));
    showToast('Outfit removed');
  }

  if (loading) {
    return (
      <div>
        <h1 className="page-title">Saved Outfits</h1>
        <p className="page-subtitle">Loading...</p>
        {[1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 200, marginBottom: 16, borderRadius: 'var(--radius-xl)' }} />
        ))}
      </div>
    );
  }

  if (outfits.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">💾</div>
        <h2 className="empty-state__title">No Saved Outfits</h2>
        <p className="empty-state__text">
          When you get outfit suggestions from AI, save your favorites here for quick access!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Saved Outfits</h1>
      <p className="page-subtitle">{outfits.length} saved combination{outfits.length !== 1 ? 's' : ''}</p>

      {outfits.map((outfit) => (
        <OutfitCard
          key={outfit.id}
          outfit={outfit}
          onDelete={() => handleDelete(outfit.id)}
        />
      ))}
    </div>
  );
}
