import { useState, useRef } from 'react';
import { addClothing, blobToDataURL, createThumbnail } from '../db';
import { analyzeClothing } from '../services/geminiService';

const CLOTHING_TYPES = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];
const FIT_OPTIONS = ['slim', 'regular', 'relaxed', 'oversized', 'tailored', 'cropped', 'flared', 'skinny', 'straight', 'a-line'];

const EMPTY_FORM = {
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
};

export default function AddClothingPage({ onClothingAdded, hasApiKey, onOpenSettings, showToast }) {
  // --- Single-image edit state ---
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragover, setDragover] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // --- Multi-image queue state ---
  const [imageQueue, setImageQueue] = useState([]); // Array of { file, dataUrl, status }
  const [batchMode, setBatchMode] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [batchResults, setBatchResults] = useState([]); // Array of { name, success, error? }

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetAll() {
    setImageDataUrl(null);
    setAnalyzed(false);
    setAnalyzing(false);
    setSaving(false);
    setForm({ ...EMPTY_FORM });
    setImageQueue([]);
    setBatchMode(false);
    setBatchProcessing(false);
    setBatchProgress({ current: 0, total: 0 });
    setBatchResults([]);
  }

  // Validate a single file
  function validateFile(file) {
    if (!file.type.startsWith('image/')) return 'Not an image file';
    if (file.size > 10 * 1024 * 1024) return 'Image must be under 10MB';
    return null;
  }

  // Handle selecting one or more files (gallery input — no capture)
  async function handleFilesSelect(files) {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = [];

    for (const file of fileArray) {
      const err = validateFile(file);
      if (err) {
        showToast(`Skipped "${file.name}": ${err}`, 'error');
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    // Single file → go to single-image edit flow
    if (validFiles.length === 1) {
      const dataUrl = await blobToDataURL(validFiles[0]);
      setImageDataUrl(dataUrl);
      setAnalyzed(false);
      setBatchMode(false);
      return;
    }

    // Multiple files → batch mode
    const queue = [];
    for (const file of validFiles) {
      const dataUrl = await blobToDataURL(file);
      queue.push({ file, dataUrl, status: 'pending' });
    }
    setImageQueue(queue);
    setBatchMode(true);
    setImageDataUrl(null);
    showToast(`${queue.length} photos selected for batch upload`);
  }

  // Handle camera capture (single photo only)
  async function handleCameraCapture(file) {
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      showToast(err, 'error');
      return;
    }
    const dataUrl = await blobToDataURL(file);
    setImageDataUrl(dataUrl);
    setAnalyzed(false);
    setBatchMode(false);
  }

  // Remove image from batch queue
  function removeFromQueue(index) {
    setImageQueue((prev) => prev.filter((_, i) => i !== index));
    if (imageQueue.length <= 2) {
      // If only 1 left after removal, switch to single mode
      const remaining = imageQueue.filter((_, i) => i !== index);
      if (remaining.length === 1) {
        setImageDataUrl(remaining[0].dataUrl);
        setBatchMode(false);
        setImageQueue([]);
      } else if (remaining.length === 0) {
        resetAll();
      }
    }
  }

  // Process entire batch: analyze + save each image
  async function handleBatchProcess() {
    if (!hasApiKey) {
      onOpenSettings();
      return;
    }
    if (imageQueue.length === 0) return;

    setBatchProcessing(true);
    setBatchProgress({ current: 0, total: imageQueue.length });
    const results = [];

    for (let i = 0; i < imageQueue.length; i++) {
      const item = imageQueue[i];
      setBatchProgress({ current: i + 1, total: imageQueue.length });

      // Update queue status
      setImageQueue((prev) =>
        prev.map((q, idx) => (idx === i ? { ...q, status: 'processing' } : q))
      );

      try {
        // Analyze
        const analysis = await analyzeClothing(item.dataUrl);
        const formData = {
          name: analysis.name || `Item ${i + 1}`,
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
        };

        // Save
        const thumbnailDataUrl = await createThumbnail(item.dataUrl);
        await addClothing({ ...formData, imageDataUrl: item.dataUrl, thumbnailDataUrl });

        results.push({ name: formData.name, success: true });
        setImageQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, status: 'done' } : q))
        );
      } catch (err) {
        results.push({ name: `Item ${i + 1}`, success: false, error: err.message });
        setImageQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, status: 'error' } : q))
        );
      }
    }

    setBatchResults(results);
    setBatchProcessing(false);

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    if (failCount === 0) {
      showToast(`All ${successCount} items added to vault! ✨`);
    } else {
      showToast(`${successCount} added, ${failCount} failed`, failCount > 0 ? 'error' : 'success');
    }

    onClothingAdded();
  }

  // --- Single image flow handlers (same as before) ---
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
    // Scroll to top so user can see the analysis progress
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
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
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) handleFilesSelect(files);
  }

  // ===================== RENDER =====================

  // --- Batch results screen ---
  if (batchResults.length > 0 && !batchProcessing) {
    const successCount = batchResults.filter((r) => r.success).length;
    return (
      <div className="px-6 pt-6 pb-32">
        <header className="mb-10">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-bold mb-3 block">Batch Complete</span>
          <h1 className="text-4xl leading-tight font-black tracking-tight mb-2 editorial-font">
            {successCount} <span className="italic">Added</span>
          </h1>
        </header>

        <div className="space-y-3 mb-8">
          {batchResults.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 p-4 border ${r.success ? 'border-green-100 bg-green-50/50' : 'border-red-100 bg-red-50/50'}`}>
              <iconify-icon
                icon={r.success ? 'lucide:check-circle' : 'lucide:x-circle'}
                class={`text-lg ${r.success ? 'text-green-500' : 'text-red-500'}`}
              ></iconify-icon>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{r.name}</p>
                {r.error && <p className="text-[11px] text-red-500 mt-0.5">{r.error}</p>}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={resetAll}
          className="w-full h-14 bg-[#1A1A1A] text-white flex items-center justify-center gap-3 font-bold tracking-[0.2em] text-[10px] uppercase"
        >
          Add More Items
        </button>
      </div>
    );
  }

  // --- Batch mode: preview queue ---
  if (batchMode && imageQueue.length > 0) {
    return (
      <div className="px-6 pt-6 pb-32">
        <header className="mb-8">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-bold mb-3 block">Batch Upload</span>
          <h1 className="text-4xl leading-tight font-black tracking-tight mb-2 editorial-font">
            {imageQueue.length} <span className="italic">Photos</span>
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            AURA will analyze and add each item to your vault automatically.
          </p>
        </header>

        {/* Progress bar during processing */}
        {batchProcessing && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                Processing {batchProgress.current} of {batchProgress.total}
              </p>
              <p className="text-[10px] font-bold text-[#C5A059]">
                {Math.round((batchProgress.current / batchProgress.total) * 100)}%
              </p>
            </div>
            <div className="w-full h-1 bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-[#C5A059] transition-all duration-500 ease-out"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Image grid */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          {imageQueue.map((item, i) => (
            <div key={i} className="relative aspect-square bg-gray-50 overflow-hidden group">
              <img src={item.dataUrl} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />

              {/* Status overlay */}
              {item.status === 'processing' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <iconify-icon icon="lucide:loader" class="text-2xl text-white animate-spin"></iconify-icon>
                </div>
              )}
              {item.status === 'done' && (
                <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                  <iconify-icon icon="lucide:check" class="text-2xl text-white"></iconify-icon>
                </div>
              )}
              {item.status === 'error' && (
                <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                  <iconify-icon icon="lucide:x" class="text-2xl text-white"></iconify-icon>
                </div>
              )}

              {/* Remove button (only before processing starts) */}
              {!batchProcessing && item.status === 'pending' && (
                <button
                  onClick={() => removeFromQueue(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <iconify-icon icon="lucide:x" class="text-xs"></iconify-icon>
                </button>
              )}

              {/* Index badge */}
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 backdrop-blur-sm">
                {i + 1}
              </div>
            </div>
          ))}

          {/* Add more button */}
          {!batchProcessing && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#C5A059] hover:text-[#C5A059] transition-colors"
            >
              <iconify-icon icon="lucide:plus" class="text-xl"></iconify-icon>
              <span className="text-[9px] font-bold uppercase tracking-wider">Add</span>
            </button>
          )}
        </div>

        {/* Action buttons */}
        {!batchProcessing && (
          <div className="space-y-3">
            <button
              onClick={handleBatchProcess}
              className="w-full h-14 bg-[#1A1A1A] text-white flex items-center justify-center gap-3 font-bold tracking-[0.2em] text-[10px] uppercase"
            >
              Analyze & Add All
              <iconify-icon icon="lucide:sparkles" class="text-sm text-[#C5A059]"></iconify-icon>
            </button>
            <button
              onClick={resetAll}
              className="w-full h-12 bg-gray-50 text-gray-500 flex items-center justify-center gap-2 font-bold tracking-[0.15em] text-[10px] uppercase border border-gray-100"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Hidden file input for adding more */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const addMore = async () => {
                const newItems = [];
                for (const file of Array.from(e.target.files)) {
                  const err = validateFile(file);
                  if (err) {
                    showToast(`Skipped "${file.name}": ${err}`, 'error');
                    continue;
                  }
                  const dataUrl = await blobToDataURL(file);
                  newItems.push({ file, dataUrl, status: 'pending' });
                }
                setImageQueue((prev) => [...prev, ...newItems]);
                if (newItems.length > 0) showToast(`${newItems.length} more photos added`);
              };
              addMore();
            }
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>
    );
  }

  // --- Default: upload prompt or single-image edit ---
  return (
    <div className="px-6 pt-6 pb-32">
      <header className="mb-10">
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-bold mb-3 block">Digital Vault</span>
        <h1 className="text-4xl leading-tight font-black tracking-tight mb-2 editorial-font">
          Capture <span className="italic">Piece</span>
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Upload photos to automatically extract color, fabric, and cut using AURA vision.
        </p>
      </header>

      {!imageDataUrl ? (
        <>
          {/* Main upload area — opens gallery (no capture attr) */}
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
              <iconify-icon icon="lucide:image-plus" class="text-3xl"></iconify-icon>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A]">Choose Photos</p>
              <p className="text-xs text-gray-400 mt-1">Select one or multiple from gallery</p>
            </div>
          </button>

          {/* Camera shortcut button */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full h-12 mt-3 bg-gray-50 text-[#1A1A1A] flex items-center justify-center gap-2 font-bold tracking-[0.15em] text-[10px] uppercase border border-gray-100 hover:border-[#C5A059] transition-colors"
          >
            <iconify-icon icon="lucide:camera" class="text-sm text-[#C5A059]"></iconify-icon>
            Take a Photo Instead
          </button>

          {/* Gallery input — NO capture attribute, allows gallery + multiple */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              handleFilesSelect(e.target.files);
              e.target.value = '';
            }}
            className="hidden"
          />
          {/* Camera input — HAS capture attribute for direct camera access */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              handleCameraCapture(e.target.files?.[0]);
              e.target.value = '';
            }}
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
                setForm({ ...EMPTY_FORM });
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
