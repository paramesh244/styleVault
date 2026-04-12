export default function ClothingCard({ item, onClick }) {
  // Use subset of colors/materials for tags
  const tags = [];
  if (item.colors && item.colors.length > 0) {
    tags.push(item.colors[0]); // Just take primary color for cleaner UI
  }
  if (item.material || item.fabric) {
    tags.push(item.material || item.fabric);
  }
  
  if (tags.length === 0 && item.subType) {
    tags.push(item.subType);
  } else if (tags.length === 0 && item.type) {
    tags.push(item.type);
  }

  return (
    <div className="group cursor-pointer" onClick={onClick} id={`clothing-${item.id}`}>
      <div className="aspect-[3/4] bg-gray-50 overflow-hidden mb-2 relative">
        {(item.thumbnailDataUrl || item.imageDataUrl) ? (
          <img 
            src={item.thumbnailDataUrl || item.imageDataUrl} 
            alt={item.name || 'Clothing item'} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">👗</div>
        )}
        <div className="absolute top-2 right-2">
          <div className="bg-white/90 backdrop-blur-sm p-1.5 flex items-center justify-center border border-[#C5A059]/20">
            <iconify-icon icon="lucide:sparkles" class="text-[10px] text-[#C5A059]"></iconify-icon>
          </div>
        </div>
      </div>
      <h3 className="text-xs font-bold uppercase tracking-tight truncate pr-1">
        {item.name || 'Unnamed Item'}
      </h3>
      <div className="flex flex-wrap gap-1 mt-1.5 h-[18px] overflow-hidden">
        {tags.slice(0, 2).map((tag, i) => (
          <span key={i} className="text-[8px] px-1.5 py-0.5 border border-gray-100 text-gray-400 uppercase truncate max-w-[80px]">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
