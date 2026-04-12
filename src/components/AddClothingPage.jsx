import { useState, useRef } from 'react';
import { IoCameraOutline, IoImageOutline, IoSparkles, IoCheckmarkCircle } from 'react-icons/io5';
import { addClothing, blobToDataURL, createThumbnail } from '../db';
import { analyzeClothing } from '../services/geminiService';

const CLOTHING_TYPES = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];
const OCCASIONS = ['everyday', 'work', 'date night', 'party', 'wedding', 'workout', 'outdoor adventure', 'travel', 'beach', 'brunch', 'job interview', 'concert'];
const SEASONS = ['spring', 'summer', 'fall', 'winter'];
const FORMALITY_LEVELS = ['very casual', 'casual', 'smart casual', 'business casual', 'business', 'formal', 'black tie'];
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
    formality: 'casual',
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

  function toggleArrayField(field, value) {
    setForm((prev) => {
      const arr = prev[field] || [];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  async function handleImageSelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    // Limit to 10MB
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
        formality: analysis.formality || 'casual',
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
      console.error('Analysis failed:', err);
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
      await addClothing({
        ...form,
        imageDataUrl,
        thumbnailDataUrl,
      });
      onClothingAdded();
    } catch (err) {
      console.error('Save failed:', err);
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
    <div>
      <h1 className="page-title">Add Clothing</h1>
      <p className="page-subtitle">Upload a photo and let AI analyze it</p>

      {/* Image Upload */}
      {!imageDataUrl ? (
        <>
          <div
            className={`upload-area ${dragover ? 'upload-area--dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onDrop={handleDrop}
            id="upload-area"
          >
            <div className="upload-area__icon">📸</div>
            <div className="upload-area__text">Tap to upload or take a photo</div>
            <div className="upload-area__hint">JPG, PNG, WEBP • Max 10MB</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              className="btn btn--secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{ flex: 1 }}
            >
              <IoImageOutline /> Gallery
            </button>
            <button
              className="btn btn--secondary"
              onClick={() => cameraInputRef.current?.click()}
              style={{ flex: 1 }}
            >
              <IoCameraOutline /> Camera
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageSelect(e.target.files?.[0])}
            style={{ display: 'none' }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleImageSelect(e.target.files?.[0])}
            style={{ display: 'none' }}
          />
        </>
      ) : (
        <>
          {/* Image Preview */}
          <div className="image-preview">
            <img src={imageDataUrl} alt="Clothing preview" />
            <button
              className="image-preview__remove"
              onClick={() => {
                setImageDataUrl(null);
                setAnalyzed(false);
                setForm({
                  name: '', type: 'tops', subType: '', colors: [], pattern: '',
                  material: '', formality: 'casual', fit: 'regular', seasons: [], occasions: [],
                  versatility: 0, pairsWith: [], careInstructions: '', description: '',
                });
              }}
            >
              ✕
            </button>
          </div>

          {/* AI Analyze Button */}
          {!analyzed && !analyzing && (
            <button
              className="btn btn--primary btn--full btn--lg"
              onClick={handleAnalyze}
              style={{ marginBottom: 20 }}
              id="analyze-btn"
            >
              <IoSparkles /> Analyze with AI ✨
            </button>
          )}

          {analyzing && (
            <div className="ai-loading" style={{ marginBottom: 20 }}>
              <div className="ai-loading__sparkle">✨</div>
              <div className="spinner spinner--lg" />
              <div className="ai-loading__text">
                AI is analyzing your clothing...
              </div>
            </div>
          )}

          {analyzed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
              padding: '10px 14px', background: 'rgba(52, 211, 153, 0.1)',
              borderRadius: 'var(--radius-md)', border: '1px solid rgba(52, 211, 153, 0.2)',
              fontSize: '0.85rem', color: 'var(--success)',
            }}>
              <IoCheckmarkCircle /> AI analysis complete — review & edit below
            </div>
          )}

          {/* Form Fields */}
          <div className="input-group">
            <label className="input-label">Name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="e.g., Navy Striped Shirt"
              id="clothing-name-input"
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Type</label>
              <select
                className="input-field"
                value={form.type}
                onChange={(e) => updateForm('type', e.target.value)}
              >
                {CLOTHING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Sub-type</label>
              <input
                className="input-field"
                value={form.subType}
                onChange={(e) => updateForm('subType', e.target.value)}
                placeholder="e.g., Oxford shirt"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Pattern</label>
              <input
                className="input-field"
                value={form.pattern}
                onChange={(e) => updateForm('pattern', e.target.value)}
                placeholder="e.g., striped"
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Material</label>
              <input
                className="input-field"
                value={form.material}
                onChange={(e) => updateForm('material', e.target.value)}
                placeholder="e.g., cotton"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Colors</label>
            <input
              className="input-field"
              value={(form.colors || []).join(', ')}
              onChange={(e) => updateForm('colors', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              placeholder="e.g., navy blue, white"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Formality</label>
            <select
              className="input-field"
              value={form.formality}
              onChange={(e) => updateForm('formality', e.target.value)}
            >
              {FORMALITY_LEVELS.map((f) => (
                <option key={f} value={f}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Fit</label>
            <select
              className="input-field"
              value={form.fit}
              onChange={(e) => updateForm('fit', e.target.value)}
            >
              {FIT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Seasons</label>
            <div className="chip-group">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  className={`chip ${(form.seasons || []).includes(s) ? 'chip--active' : ''}`}
                  onClick={() => toggleArrayField('seasons', s)}
                >
                  {s === 'spring' ? '🌸' : s === 'summer' ? '☀️' : s === 'fall' ? '🍂' : '❄️'} {s}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Occasions</label>
            <div className="chip-group">
              {OCCASIONS.map((o) => (
                <button
                  key={o}
                  className={`chip ${(form.occasions || []).includes(o) ? 'chip--active' : ''}`}
                  onClick={() => toggleArrayField('occasions', o)}
                >
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">AI Description</label>
            <textarea
              className="input-field"
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              placeholder="A detailed description of this item..."
              rows={3}
            />
          </div>

          {/* AI-generated extra fields (read-only display) */}
          {analyzed && form.versatility > 0 && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(168, 85, 247, 0.06)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(168, 85, 247, 0.1)',
              marginBottom: 12,
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>✨ AI Insights</div>
              <div style={{ marginBottom: 4 }}>
                <strong>Versatility:</strong> {form.versatility}/10 — {form.versatility >= 7 ? 'A wardrobe workhorse!' : form.versatility >= 4 ? 'Good for several looks' : 'Statement piece'}
              </div>
              {form.pairsWith && form.pairsWith.length > 0 && (
                <div style={{ marginBottom: 4 }}>
                  <strong>Pairs well with:</strong> {form.pairsWith.join(', ')}
                </div>
              )}
              {form.careInstructions && (
                <div>
                  <strong>Care:</strong> {form.careInstructions}
                </div>
              )}
            </div>
          )}

          {/* Save Button */}
          <button
            className="btn btn--primary btn--full btn--lg"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            id="save-clothing-btn"
            style={{ marginTop: 8, marginBottom: 20 }}
          >
            {saving ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Saving...
              </>
            ) : (
              '✓ Save to Wardrobe'
            )}
          </button>
        </>
      )}
    </div>
  );
}
