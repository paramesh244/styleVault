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
      <div className="px-6 pt-8 pb-4 h-full">
        <h1 className="text-4xl font-black tracking-tight mb-6">Saved <span className="italic">Outfits</span></h1>
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-100 w-full mb-4"></div>
          <div className="h-64 bg-gray-100 w-full"></div>
        </div>
      </div>
    );
  }

  if (outfits.length === 0) {
    return (
      <div className="px-6 py-12 flex flex-col items-center justify-center text-center h-full">
        <iconify-icon icon="lucide:bookmark" class="text-4xl text-[#C5A059] mb-4 opacity-50"></iconify-icon>
        <h2 className="text-xl font-bold editorial-font mb-2">No Saved Outfits</h2>
        <p className="text-gray-500 text-sm mb-8">
          When you compose a look with AURA, save your favorites here.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Page Title & Tabs */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-4xl font-black tracking-tight mb-6 editorial-font">Saved <span className="italic">Outfits</span></h1>
        
        <div className="flex gap-8 border-b border-gray-100">
          <button className="pb-3 border-b-2 border-[#C5A059] text-xs uppercase tracking-widest font-bold text-[#1A1A1A]">Gallery</button>
        </div>
      </div>

      <div className="px-6 space-y-10 pt-4">
        {outfits.map((outfit) => (
          <OutfitCard
            key={outfit.id}
            outfit={outfit}
            onDelete={() => handleDelete(outfit.id)}
          />
        ))}
      </div>
    </div>
  );
}
