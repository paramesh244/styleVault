import { useState, useEffect } from 'react';
import { IoSparkles, IoShuffle, IoBookmarkOutline, IoSend } from 'react-icons/io5';
import { getAllClothing, saveOutfit, getClothingById } from '../db';
import { suggestOutfits, chatFollowUp } from '../services/geminiService';
import OutfitCard from './OutfitCard';

const OCCASIONS = [
  { id: 'casual', label: 'Casual Day', icon: '😎' },
  { id: 'work', label: 'Work / Office', icon: '💼' },
  { id: 'date', label: 'Date Night', icon: '❤️' },
  { id: 'party', label: 'Party', icon: '🎉' },
  { id: 'wedding', label: 'Wedding', icon: '💒' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌿' },
  { id: 'workout', label: 'Workout', icon: '💪' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
];

export default function SuggestPage({ hasApiKey, clothingCount, onOpenSettings, onAddClick, showToast }) {
  const [clothing, setClothing] = useState([]);
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [customRequest, setCustomRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [enrichedOutfits, setEnrichedOutfits] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    loadClothing();
  }, []);

  async function loadClothing() {
    const items = await getAllClothing();
    setClothing(items);
  }

  async function handleSuggest() {
    if (!hasApiKey) {
      onOpenSettings();
      return;
    }

    const request = customRequest.trim() ||
      (selectedOccasion ? `I need an outfit for ${OCCASIONS.find(o => o.id === selectedOccasion)?.label || selectedOccasion}` : '');

    if (!request) {
      showToast('Please select an occasion or describe where you\'re going', 'error');
      return;
    }

    setLoading(true);
    setSuggestions(null);
    setEnrichedOutfits([]);
    setChatMessages([]);

    try {
      const result = await suggestOutfits(clothing, request);
      setSuggestions(result);

      // Enrich outfits with clothing data
      if (result.outfits) {
        const enriched = result.outfits.map((outfit) => {
          const items = (outfit.itemIds || [])
            .map((id) => clothing.find((c) => c.id === id))
            .filter(Boolean);
          return { ...outfit, items };
        });
        setEnrichedOutfits(enriched);
      }
    } catch (err) {
      console.error('Suggestion failed:', err);
      showToast(err.message || 'Failed to get suggestions. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleShuffle() {
    const occasion = selectedOccasion
      ? OCCASIONS.find(o => o.id === selectedOccasion)?.label
      : customRequest;
    const request = `Give me DIFFERENT outfit suggestions for: ${occasion || 'a nice outing'}. Don't repeat previous combinations.`;
    setCustomRequest(request);
    setLoading(true);
    setSuggestions(null);
    setEnrichedOutfits([]);

    try {
      const result = await suggestOutfits(clothing, request);
      setSuggestions(result);
      if (result.outfits) {
        const enriched = result.outfits.map((outfit) => {
          const items = (outfit.itemIds || [])
            .map((id) => clothing.find((c) => c.id === id))
            .filter(Boolean);
          return { ...outfit, items };
        });
        setEnrichedOutfits(enriched);
      }
    } catch (err) {
      showToast(err.message || 'Shuffle failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveOutfit(outfit) {
    try {
      await saveOutfit({
        name: outfit.name,
        clothingIds: outfit.itemIds || [],
        occasion: selectedOccasion || customRequest,
        aiReasoning: outfit.reasoning,
        styleNotes: outfit.styleNotes,
      });
      showToast('Outfit saved! 💾');
    } catch (err) {
      showToast('Failed to save outfit', 'error');
    }
  }

  async function handleChat() {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const wardrobeDesc = clothing
        .map((item) => `[ID:${item.id}] ${item.name} — ${item.type}, ${(item.colors || []).join(', ')}`)
        .join('\n');
      const reply = await chatFollowUp(wardrobeDesc, suggestions, userMsg);
      setChatMessages((prev) => [...prev, { role: 'ai', text: reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Sorry, I had trouble responding. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  // Not enough items
  if (clothingCount < 2) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">✨</div>
        <h2 className="empty-state__title">Add More Clothes First</h2>
        <p className="empty-state__text">
          You need at least 2 clothing items for outfit suggestions. Currently have {clothingCount}.
        </p>
        <button className="btn btn--primary btn--lg" onClick={onAddClick}>
          + Add Clothes
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Style Suggest</h1>
      <p className="page-subtitle">Tell me where you're going ✨</p>

      {/* Occasion Grid */}
      {!suggestions && !loading && (
        <>
          <div className="occasion-grid">
            {OCCASIONS.map((occ) => (
              <button
                key={occ.id}
                className={`occasion-card ${selectedOccasion === occ.id ? 'occasion-card--active' : ''}`}
                onClick={() => {
                  setSelectedOccasion(selectedOccasion === occ.id ? null : occ.id);
                  setCustomRequest('');
                }}
              >
                <div className="occasion-card__icon">{occ.icon}</div>
                <div className="occasion-card__label">{occ.label}</div>
              </button>
            ))}
          </div>

          <div className="divider" />

          <div className="input-group">
            <label className="input-label">Or describe the situation</label>
            <textarea
              className="input-field"
              value={customRequest}
              onChange={(e) => {
                setCustomRequest(e.target.value);
                setSelectedOccasion(null);
              }}
              placeholder="e.g., Job interview at a tech startup, slightly cool spring day..."
              rows={3}
              id="occasion-input"
            />
          </div>

          <button
            className="btn btn--primary btn--full btn--lg"
            onClick={handleSuggest}
            disabled={!selectedOccasion && !customRequest.trim()}
            id="suggest-btn"
          >
            <IoSparkles /> Get AI Suggestions
          </button>
        </>
      )}

      {/* Loading */}
      {loading && (
        <div className="ai-loading">
          <div className="ai-loading__sparkle">✨</div>
          <div className="spinner spinner--lg" />
          <div className="ai-loading__text">
            AI is styling your wardrobe...
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Analyzing {clothing.length} items
          </div>
        </div>
      )}

      {/* Results */}
      {suggestions && !loading && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Outfit Suggestions
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--ghost" onClick={handleShuffle}>
                <IoShuffle /> Shuffle
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => {
                  setSuggestions(null);
                  setEnrichedOutfits([]);
                  setChatMessages([]);
                  setCustomRequest('');
                  setSelectedOccasion(null);
                }}
              >
                New
              </button>
            </div>
          </div>

          {/* General Advice */}
          {suggestions.generalAdvice && (
            <div style={{
              padding: 14,
              background: 'rgba(168, 85, 247, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(168, 85, 247, 0.15)',
              marginBottom: 16,
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              <span style={{ color: 'var(--text-accent)', fontWeight: 600 }}>💡 Style Tip:</span>{' '}
              {suggestions.generalAdvice}
            </div>
          )}

          {/* Outfit Cards */}
          {enrichedOutfits.map((outfit, i) => (
            <OutfitCard
              key={i}
              outfit={outfit}
              onSave={() => handleSaveOutfit(outfit)}
            />
          ))}

          {/* Follow-up Chat */}
          <div className="divider" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12 }}>
            💬 Ask follow-up questions
          </h3>

          {chatMessages.map((msg, i) => (
            <div key={i} className={`ai-message ${msg.role === 'user' ? 'ai-message--user' : ''}`}>
              {msg.text}
            </div>
          ))}

          {chatLoading && (
            <div className="ai-message" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Thinking...
            </div>
          )}

          <div className="chat-input-row">
            <input
              className="input-field"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChat()}
              placeholder="What if it rains? Make it more casual..."
              id="chat-input"
            />
            <button
              className="btn btn--primary"
              onClick={handleChat}
              disabled={chatLoading || !chatInput.trim()}
              style={{ padding: '12px 14px' }}
            >
              <IoSend />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
