import { deleteClothing } from '../db';
import { useState } from 'react';

export default function ClothingDetailModal({ clothing, onClose, onDelete, showToast }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteClothing(clothing.id);
      onDelete();
    } catch (err) {
      showToast('Failed to delete', 'error');
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-end justify-center p-0 transition-opacity">
      <div className="w-full max-w-md bg-white h-[90dvh] rounded-t-3xl overflow-hidden flex flex-col relative animate-[slideUp_300ms_ease-out]">
        
        {/* Header Action */}
        <div className="absolute top-4 right-4 z-10">
          <button onClick={onClose} className="w-10 h-10 bg-black/20 backdrop-blur text-white flex items-center justify-center rounded-full hover:bg-black/40">
            <iconify-icon icon="lucide:x" class="text-xl"></iconify-icon>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto w-full no-scrollbar">
          
          {/* Hero Image */}
          <div className="w-full aspect-[3/4] bg-gray-100 relative">
            {clothing.imageDataUrl ? (
              <img src={clothing.imageDataUrl} alt={clothing.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">👗</div>
            )}
            <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#C5A059] mb-1 block">
                {clothing.type}
              </span>
              <h2 className="text-3xl font-black editorial-font">{clothing.name}</h2>
            </div>
          </div>

          {/* Details Content */}
          <div className="p-6 space-y-8">
            
            {/* Intel Core Details */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <DetailItem label="Fit" value={clothing.fit} />
              <DetailItem label="Material" value={clothing.material} />
              <DetailItem label="Colors" value={(clothing.colors || []).join(', ')} />
              <DetailItem label="Pattern" value={clothing.pattern} />
            </div>

            <div className="h-[1px] bg-gray-100 w-full"></div>

            {/* AI Insights Segment */}
            {clothing.description && (
              <div>
                <h3 className="text-xs uppercase font-bold tracking-widest text-[#1A1A1A] mb-3">AURA Editorial Note</h3>
                <p className="text-sm text-gray-500 italic leading-relaxed">
                  "{clothing.description}"
                </p>
              </div>
            )}

            {clothing.versatility > 0 && (
              <div className="p-5 border border-[#C5A059]/30 bg-gray-50">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A059] mb-4 flex items-center gap-2">
                   <iconify-icon icon="lucide:sparkles"></iconify-icon>
                   Styling Intel
                 </h3>
                 <p className="text-sm border-b border-gray-200 pb-2 mb-2">
                    <span className="font-bold text-gray-900 mr-2">Versatility:</span>
                    {clothing.versatility}/10
                 </p>
                 {clothing.pairsWith && clothing.pairsWith.length > 0 && (
                   <p className="text-sm border-b border-gray-200 pb-2 mb-2">
                      <span className="font-bold text-gray-900 mr-2">Pairs with:</span>
                      {clothing.pairsWith.join(', ')}
                   </p>
                 )}
                 {clothing.careInstructions && (
                   <p className="text-sm">
                      <span className="font-bold text-gray-900 mr-2">Care:</span>
                      {clothing.careInstructions}
                   </p>
                 )}
              </div>
            )}

            {/* Danger Zone */}
            <div className="pt-8 mb-8 pb-12">
              {!showDeleteConfirm ? (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-4 text-xs font-bold uppercase tracking-widest text-red-500 flex items-center justify-center gap-2"
                >
                  <iconify-icon icon="lucide:trash-2"></iconify-icon>
                  Remove from Vault
                </button>
              ) : (
                <div className="p-4 bg-red-50 border border-red-100">
                  <p className="text-sm text-red-600 font-bold mb-4 text-center">Delete this piece forever?</p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-3 bg-white border border-gray-200 text-xs font-bold uppercase tracking-widest" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                    <button className="flex-1 py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-widest" onClick={handleDelete} disabled={deleting}>
                      {deleting ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">{label}</div>
      <div className="text-sm font-semibold text-[#1A1A1A] capitalize">{value}</div>
    </div>
  );
}
