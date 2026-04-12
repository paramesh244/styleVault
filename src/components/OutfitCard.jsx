export default function OutfitCard({ outfit, onSave, onDelete }) {
  const mainImage = outfit.items && outfit.items.length > 0 
    ? (outfit.items[0].imageDataUrl || outfit.items[0].thumbnailDataUrl)
    : 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop'; // fallback
    
  return (
    <div className="block group mb-8">
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
        

        
        {onDelete && (
           <button 
             onClick={(e) => { e.preventDefault(); onDelete(); }}
             className="absolute bottom-4 right-4 w-10 h-10 bg-white/95 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-red-500 border border-gray-100 transition-colors"
           >
             <iconify-icon icon="lucide:trash-2" class="text-lg"></iconify-icon>
           </button>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold editorial-font text-[#1A1A1A]">{outfit.name || 'Curated Look'}</h3>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
            {outfit.confidence ? `${outfit.confidence}/10 Match` : 'Style Edit'}
          </span>
        </div>
        
        <div className="bg-gray-50 p-4 border-l-2 border-[#C5A059]">
          <p className="text-xs text-gray-600 italic mb-3 leading-relaxed font-medium">
            "{outfit.reasoning || outfit.styleNotes || 'A carefully composed look for your occasion.'}"
          </p>
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {outfit.items && outfit.items.map((item, i) => (
               <span key={i} className="text-[8px] uppercase tracking-widest font-bold px-2 py-1 bg-white border border-gray-200 text-gray-500">
                 {item.type || item.name}
               </span>
            ))}
          </div>
          
          {onSave && (
            <button 
              onClick={(e) => { e.preventDefault(); onSave(); }}
              className="w-full h-12 mt-4 bg-white border border-[#C5A059]/30 text-[#C5A059] flex items-center justify-center gap-2 font-bold tracking-[0.2em] text-[10px] uppercase transition-all active:bg-[#F8F4EA]"
            >
              <iconify-icon icon="lucide:bookmark" class="text-sm"></iconify-icon>
              Save Outfit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
