export default function OutfitCard({ outfit, onSave, onDelete }) {
  const mainImage = outfit.items && outfit.items.length > 0 
    ? (outfit.items[0].thumbnailDataUrl || outfit.items[0].imageDataUrl)
    : null;
    
  return (
    <div className="block group mb-8">
      {/* Hero Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 mb-4 border border-gray-100">
        {mainImage ? (
          <img 
            src={mainImage} 
            alt="Outfit Hero" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">👗</div>
        )}
        
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 flex items-center gap-2 border border-[#C5A059]/10">
          <iconify-icon icon="lucide:sparkles" class="text-xs text-[#C5A059]"></iconify-icon>
          <span className="text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A]">AI Pick</span>
        </div>

        {/* Confidence badge */}
        {outfit.confidence > 0 && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 border border-[#C5A059]/10">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#C5A059]">
              {outfit.confidence}/10
            </span>
          </div>
        )}
        
        {onDelete && (
           <button 
             onClick={(e) => { e.preventDefault(); onDelete(); }}
             className="absolute bottom-4 right-4 w-10 h-10 bg-white/95 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-red-500 border border-gray-100 transition-colors"
           >
             <iconify-icon icon="lucide:trash-2" class="text-lg"></iconify-icon>
           </button>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Title */}
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold editorial-font text-[#1A1A1A]">{outfit.name || 'Curated Look'}</h3>
        </div>

        {/* Item thumbnails strip */}
        {outfit.items && outfit.items.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {outfit.items.map((item, i) => (
              <div key={i} className="shrink-0 w-16 h-16 bg-gray-50 border border-gray-100 overflow-hidden relative group/item">
                {(item.thumbnailDataUrl || item.imageDataUrl) ? (
                  <img 
                    src={item.thumbnailDataUrl || item.imageDataUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">👗</div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm px-1 py-0.5">
                  <span className="text-[7px] uppercase tracking-wider font-bold text-white truncate block">
                    {item.type || item.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Reasoning */}
        {(outfit.reasoning || outfit.aiReasoning) && (
          <div className="bg-gray-50 p-4 border-l-2 border-[#C5A059]">
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#C5A059] mb-2">Why It Works</p>
            <p className="text-xs text-gray-600 italic leading-relaxed font-medium">
              "{outfit.reasoning || outfit.aiReasoning}"
            </p>
          </div>
        )}

        {/* Style Notes */}
        {outfit.styleNotes && (
          <div className="p-4 border border-gray-100 bg-white">
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
              <iconify-icon icon="lucide:shirt" class="text-xs text-[#C5A059]"></iconify-icon>
              How to Wear It
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {outfit.styleNotes}
            </p>
          </div>
        )}

        {/* Color Story */}
        {outfit.colorStory && (
          <div className="p-4 border border-[#C5A059]/15 bg-[#C5A059]/5">
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#C5A059] mb-2 flex items-center gap-1.5">
              <iconify-icon icon="lucide:palette" class="text-xs"></iconify-icon>
              Color Story
            </p>
            <p className="text-xs text-gray-700 italic leading-relaxed">
              {outfit.colorStory}
            </p>
          </div>
        )}

        {/* Missing Pieces */}
        {outfit.missingPieces && outfit.missingPieces.length > 0 && (
          <div className="p-4 border border-gray-100 bg-gray-50/50">
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
              <iconify-icon icon="lucide:shopping-bag" class="text-xs text-[#C5A059]"></iconify-icon>
              Would Elevate This Look
            </p>
            <ul className="space-y-1.5">
              {outfit.missingPieces.map((piece, i) => (
                <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
                  <span className="text-[#C5A059] mt-0.5 shrink-0">+</span>
                  {piece}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Item tags */}
        <div className="flex flex-wrap items-center gap-2">
          {outfit.items && outfit.items.map((item, i) => (
             <span key={i} className="text-[8px] uppercase tracking-widest font-bold px-2 py-1 bg-white border border-gray-200 text-gray-500">
               {item.name || item.type}
             </span>
          ))}
        </div>
        
        {/* Save button */}
        {onSave && (
          <button 
            onClick={(e) => { e.preventDefault(); onSave(); }}
            className="w-full h-12 bg-white border border-[#C5A059]/30 text-[#C5A059] flex items-center justify-center gap-2 font-bold tracking-[0.2em] text-[10px] uppercase transition-all active:bg-[#F8F4EA]"
          >
            <iconify-icon icon="lucide:bookmark" class="text-sm"></iconify-icon>
            Save Outfit
          </button>
        )}
      </div>
    </div>
  );
}
