import { useState, useRef } from 'react';
import { addClothing, blobToDataURL, createThumbnail } from '../db';
import { analyzeClothing } from '../services/geminiService';

const CLOTHING_TYPES = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];
const FIT_OPTIONS = ['slim', 'regular', 'relaxed', 'oversized', 'tailored', 'cropped', 'flared', 'skinny', 'straight', 'a-line'];

export default function AddClothingPage({ onClothingAdded, hasApiKey, onOpenSettings, showToast }) {
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragover, setDragover] = useState(false);

  const [form, setForm] = useState({
    name: '',
    type: 'tops',
    subType: '',
    colors: [],
    pattern: '',
    material: '',
    fit: 'regular',
    seasons: [],
    occasions: [],
    versatility: 0,
    pairsWith: [],
    careInstructions: '',
    description: '',
  });

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleImageSelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be under 10MB', 'error');
      return;
    }
    const dataUrl = await blobToDataURL(file);
    setImageDataUrl(dataUrl);
    setAnalyzed(false);
  }

  async function handleAnalyze() {
    if (!hasApiKey) {
      onOpenSettings();
      return;
    }
    if (!imageDataUrl) {
      showToast('Please upload an image first', 'error');
      return;
    }

    setAnalyzing(true);
    try {
      const analysis = await analyzeClothing(imageDataUrl);
      setForm({
        name: analysis.name || '',
        type: analysis.type || 'tops',
        subType: analysis.subType || '',
        colors: analysis.colors || [],
        pattern: analysis.pattern || '',
        material: analysis.material || '',
        fit: analysis.fit || 'regular',
        seasons: analysis.seasons || [],
        occasions: analysis.occasions || [],
        versatility: analysis.versatility || 0,
        pairsWith: analysis.pairsWith || [],
        careInstructions: analysis.careInstructions || '',
        description: analysis.description || '',
      });
      setAnalyzed(true);
      showToast('AI analysis complete! ✨');
    } catch (err) {
      showToast(err.message || 'Analysis failed. Try again.', 'error');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!imageDataUrl) {
      showToast('Please upload an image', 'error');
      return;
    }
    if (!form.name.trim()) {
      showToast('Please enter a name', 'error');
      return;
    }

    setSaving(true);
    try {
      const thumbnailDataUrl = await createThumbnail(imageDataUrl);
      await addClothing({ ...form, imageDataUrl, thumbnailDataUrl });
      onClothingAdded();
    } catch (err) {
      showToast('Failed to save. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleImageSelect(file);
  }

  return (
    <div className="px-6 pt-6 pb-32">
      <header className="mb-10">
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-bold mb-3 block">Digital Vault</span>
        <h1 className="text-4xl leading-tight font-black tracking-tight mb-2 editorial-font">
          Capture <span className="italic">Piece</span>
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Upload a photo to automatically extract color, fabric, and cut using AURA vision.
        </p>
      </header>

      {!imageDataUrl ? (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onDrop={handleDrop}
            className={`w-full aspect-[4/5] flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
              dragover ? 'bg-[#F8F4EA] border-[#C5A059]' : 'bg-gray-50 border-gray-200'
            } border-2 border-dashed`}
          >
            <div className="w-16 h-16 rounded-full bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059]">
              <iconify-icon icon="lucide:camera" class="text-3xl"></iconify-icon>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A]">Tap to Scan</p>
              <p className="text-xs text-gray-400 mt-1">Camera or Gallery</p>
            </div>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleImageSelect(e.target.files?.[0])}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleImageSelect(e.target.files?.[0])}
            className="hidden"
          />
        </>
      ) : (
        <>
          <div className="relative w-full aspect-[4/5] bg-gray-50 overflow-hidden mb-6 group">
            <img src={imageDataUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={() => {
                setImageDataUrl(null);
                setAnalyzed(false);
              }}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md flex items-center justify-center text-[#1A1A1A]"
            >
              <iconify-icon icon="lucide:x" class="text-lg"></iconify-icon>
            </button>
          </div>

          {!analyzed && !analyzing && (
            <button
              onClick={handleAnalyze}
              className="w-full h-14 bg-[#1A1A1A] text-white flex items-center justify-center gap-3 font-bold tracking-[0.2em] text-[10px] uppercase mb-8"
            >
              Analyze with AURA
              <iconify-icon icon="lucide:sparkles" class="text-sm text-[#C5A059]"></iconify-icon>
            </button>
          )}

          {analyzing && (
            <div className="w-full h-14 bg-gray-50 text-gray-500 flex items-center justify-center gap-3 font-bold tracking-[0.2em] text-[10px] uppercase mb-8 animate-pulse border border-gray-100">
               <iconify-icon icon="lucide:loader" class="text-sm animate-spin text-[#C5A059]"></iconify-icon>
               Extracting details...
            </div>
          )}

          {analyzed && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 border border-[#C5A059]/10 bg-[#C5A059]/5 mb-6">
                <iconify-icon icon="lucide:check-circle" class="text-[#C5A059] mt-1"></iconify-icon>
                <p className="text-[11px] text-[#1A1A1A] font-medium leading-tight">
                  AURA analysis complete. You can refine the extracted details below before adding to your vault.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2">Item Name</label>
                  <input
                    className="w-full p-4 bg-gray-50 border border-gray-100 focus:border-[#C5A059] outline-none text-sm font-bold editorial-font italic transition-colors"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2">Category</label>
                    <select
                      className="w-full p-4 bg-gray-50 border border-gray-100 focus:border-[#C5A059] outline-none text-xs uppercase tracking-widest font-bold transition-colors appearance-none"
                      value={form.type}
                      onChange={(e) => updateForm('type', e.target.value)}
                    >
                      {CLOTHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2">Fit</label>
                    <select
                      className="w-full p-4 bg-gray-50 border border-gray-100 focus:border-[#C5A059] outline-none text-xs uppercase tracking-widest font-bold transition-colors appearance-none"
                      value={form.fit}
                      onChange={(e) => updateForm('fit', e.target.value)}
                    >
                      {FIT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2">Colors</label>
                    <input
                      className="w-full p-4 bg-gray-50 border border-gray-100 focus:border-[#C5A059] outline-none text-sm transition-colors"
                      value={(form.colors || []).join(', ')}
                      onChange={(e) => updateForm('colors', e.target.value.split(',').map(s => s.trim()))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2">Material</label>
                    <input
                      className="w-full p-4 bg-gray-50 border border-gray-100 focus:border-[#C5A059] outline-none text-sm transition-colors"
                      value={form.material}
                      onChange={(e) => updateForm('material', e.target.value)}
                    />
                  </div>
                </div>
                
                {form.versatility > 0 && (
                  <div className="p-4 border-l-2 border-[#C5A059] bg-gray-50">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C5A059] mb-1">AURA Intelligence</p>
                    <p className="text-xs text-gray-600 mb-2">Versatility Score: <span className="font-bold">{form.versatility}/10</span></p>
                    {form.pairsWith && form.pairsWith.length > 0 && (
                      <p className="text-xs text-gray-600 mb-2">Pairs perfectly with: <span className="font-medium italic">{form.pairsWith.join(', ')}</span></p>
                    )}
                    {form.description && (
                      <p className="text-xs text-gray-500 italic mt-2">"{form.description}"</p>
                    )}
                  </div>
                )}
              </div>

              <button
                className="w-full h-14 bg-[#1A1A1A] text-white flex items-center justify-center gap-3 font-bold tracking-[0.2em] text-[10px] uppercase mt-4 disabled:opacity-50"
                onClick={handleSave}
                disabled={saving || !form.name}
              >
                {saving ? 'Adding to Vault...' : 'Add to Vault'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
