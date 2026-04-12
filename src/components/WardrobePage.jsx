import { useState, useEffect } from 'react';
import { getAllClothingSummary } from '../db';
import ClothingCard from './ClothingCard';

const FILTER_TYPES = ['all', 'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];

export default function WardrobePage({ onSelectClothing, onAddClick, clothingCount }) {
  const [clothing, setClothing] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClothing();
  }, []);

  async function loadClothing() {
    setLoading(true);
    const items = await getAllClothingSummary();
    setClothing(items);
    setLoading(false);
  }

  const filtered = clothing.filter((item) => {
    return filter === 'all' || item.type === filter;
  });

  if (loading) {
    return (
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-3xl font-black tracking-tight editorial-font mb-1">Digital Vault</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-8">Loading...</p>
        <div className="grid grid-cols-2 gap-4 pb-24">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-gray-100 mb-2"></div>
              <div className="h-4 bg-gray-100 w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-100 w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Title & Stats */}
      <section className="px-6 pt-6 pb-4">
        <h1 className="text-3xl font-black tracking-tight editorial-font mb-1">Digital Vault</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
          {clothing.length} Curated Piece{clothing.length !== 1 ? 's' : ''}
        </p>
      </section>

      {/* Upload / Add Section */}
      <section className="px-6 mb-8">
        <button 
          onClick={onAddClick}
          id="upload-trigger" 
          className="w-full aspect-[16/7] bg-white border border-dashed border-[#C5A059]/40 flex flex-col items-center justify-center gap-2 group active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-white transition-colors">
            <iconify-icon icon="lucide:camera" class="text-xl"></iconify-icon>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest">Capture New Piece</p>
          <p className="text-[10px] text-gray-400 text-center px-4">AI will automatically analyze fabric & cut</p>
        </button>
      </section>

      {/* Filters */}
      <section className="px-6 mb-6">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {FILTER_TYPES.map((type) => {
            const isActive = filter === type;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'bg-[#1A1A1A] text-white' 
                    : 'bg-white border border-gray-100 text-[#1A1A1A] active:bg-gray-50'
                }`}
              >
                {type === 'all' ? 'All' : type}
              </button>
            );
          })}
        </div>
      </section>

      {/* Wardrobe Grid */}
      <section className="px-6 grid grid-cols-2 gap-4 pb-32">
        {filtered.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-gray-400 text-sm">
            No items match this filter.
          </div>
        ) : (
          filtered.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              onClick={() => onSelectClothing(item)}
            />
          ))
        )}
      </section>
    </>
  );
}
