import { useState, useEffect } from 'react';
import { getAllClothing, saveOutfit } from '../db';
import { suggestOutfits, chatFollowUp } from '../services/geminiService';
import OutfitCard from './OutfitCard';

const OCCASIONS = [
  { id: 'casual', label: 'Casual Day', icon: 'lucide:coffee' },
  { id: 'work', label: 'Work / Office', icon: 'lucide:briefcase' },
  { id: 'party', label: 'Party', icon: 'lucide:glass-water' },
  { id: 'wedding', label: 'Wedding Gala', icon: 'lucide:sparkles' },
  { id: 'outdoor', label: 'Outdoor', icon: 'lucide:anchor' },
  { id: 'date', label: 'Date Night', icon: 'lucide:heart' },
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

      if (result.outfits) {
        const enriched = result.outfits.map((outfit) => {
          const items = (outfit.itemIds || [])
            .map((id) => clothing.find((c) => String(c.id) === String(id)))
            .filter(Boolean);
          return { ...outfit, items };
        });
        setEnrichedOutfits(enriched);
      }
    } catch (err) {
      showToast(err.message || 'Failed to get suggestions. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveOutfit(outfit) {
    try {
      await saveOutfit({
        name: outfit.name,
        clothingIds: (outfit.itemIds || []).map(String),
        occasion: selectedOccasion || customRequest,
        aiReasoning: outfit.reasoning,
        styleNotes: outfit.styleNotes,
        confidence: outfit.confidence || 0,
        colorStory: outfit.colorStory || '',
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
        { role: 'ai', text: 'Apologies, I encountered an error. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  if (clothingCount < 2) {
    return (
      <div className="px-6 py-12 flex flex-col items-center justify-center text-center h-full">
        <iconify-icon icon="lucide:sparkles" class="text-4xl text-[#C5A059] mb-4 opacity-50"></iconify-icon>
        <h2 className="text-xl font-bold editorial-font mb-2">Vault is too sparse</h2>
        <p className="text-gray-500 text-sm mb-8">
          Upload at least 2 items so AURA can compose an outfit logic.
        </p>
        <button onClick={onAddClick} className="px-8 py-4 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-widest font-bold">
          Start Capturing
        </button>
      </div>
    );
  }

  // Suggestion Results View
  if (suggestions && !loading) {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return (
      <>
        <header className="px-6 pt-4 pb-2 flex justify-between items-end border-b border-gray-50 bg-white sticky top-0 z-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-1">Today's Edit</p>
            <h2 className="text-xl font-bold editorial-font italic">{today}</h2>
          </div>
          <div className="flex items-center gap-2 text-right">
            <button 
              onClick={() => {
                setSuggestions(null);
                setEnrichedOutfits([]);
                setSelectedOccasion(null);
                setCustomRequest('');
                setChatMessages([]);
              }}
              className="px-4 py-2 bg-gray-50 text-[10px] uppercase tracking-widest font-bold border border-gray-200 text-gray-600"
            >
              Change Focus
            </button>
          </div>
        </header>

        <section className="px-6 py-8 pb-32">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-[32px] font-black leading-none editorial-font">Curated<br/><span className="italic">Looks</span></h1>
          </div>

          {suggestions.generalAdvice && (
            <div className="mb-8 p-4 border border-[#C5A059]/20 bg-[#C5A059]/5 flex items-start gap-3">
              <iconify-icon icon="lucide:sparkles" class="text-[#C5A059] mt-1 flex-shrink-0"></iconify-icon>
              <p className="text-sm text-gray-800 leading-relaxed italic">
                {suggestions.generalAdvice}
              </p>
            </div>
          )}

          <div className="space-y-12 mb-12">
            {enrichedOutfits.map((outfit, i) => (
              <OutfitCard key={i} outfit={outfit} onSave={() => handleSaveOutfit(outfit)} />
            ))}
          </div>

          {/* Follow-up Chat Section */}
          <div className="mt-8 border-t border-gray-100 pt-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A] mb-6 flex items-center gap-2">
              <iconify-icon icon="lucide:message-square" class="text-[#C5A059]"></iconify-icon>
              Style Consultant
            </h3>

            <div className="space-y-4 mb-6">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`p-4 text-sm ${msg.role === 'user' ? 'bg-[#F8F4EA] border border-[#C5A059]/20 ml-8' : 'bg-gray-50 border border-gray-100 mr-8'}`}>
                  {msg.role === 'user' ? (
                     <p className="text-[#1A1A1A] font-bold">{msg.text}</p>
                  ) : (
                     <p className="text-gray-600 leading-relaxed italic">"{msg.text}"</p>
                  )}
                </div>
              ))}
              
              {chatLoading && (
                <div className="p-4 bg-gray-50 border border-gray-100 mr-8 flex items-center gap-2 text-gray-400">
                  <iconify-icon icon="lucide:loader" class="animate-spin text-[#C5A059]"></iconify-icon>
                  <span className="text-xs uppercase font-bold tracking-widest text-[#1A1A1A]">Consulting AURA...</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 p-4 bg-white border border-gray-200 focus:border-[#C5A059] outline-none text-sm transition-colors"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder="Ask about layering, weather..."
              />
              <button
                className="w-14 h-14 bg-[#1A1A1A] text-white flex items-center justify-center disabled:opacity-50"
                onClick={handleChat}
                disabled={chatLoading || !chatInput.trim()}
              >
                <iconify-icon icon="lucide:arrow-right" class="text-xl"></iconify-icon>
              </button>
            </div>
          </div>

          <button 
            onClick={handleSuggest} 
            className="w-full py-6 mt-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 group"
          >
             <iconify-icon icon="lucide:refresh-cw" class="text-[#C5A059] text-xl mb-2 group-active:rotate-180 transition-transform duration-500"></iconify-icon>
             <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-400">Refresh Edits</span>
          </button>
        </section>
      </>
    );
  }

  // Loading View
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center mt-20">
        <div className="w-16 h-16 rounded-full border border-[#C5A059]/30 flex items-center justify-center mb-6 animate-pulse">
          <iconify-icon icon="lucide:sparkles" class="text-2xl text-[#C5A059] animate-spin" style={{ animationDuration: '3s' }}></iconify-icon>
        </div>
        <h2 className="text-2xl editorial-font font-bold mb-2">Curating...</h2>
        <p className="text-gray-400 text-sm italic">Analyzing {clothing.length} pieces to find the perfect edit.</p>
      </div>
    );
  }

  // Request/Prompt View
  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-6 pb-8 flex-1">
        <header className="mb-10">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-bold mb-3 block">Style Guidance</span>
          <h1 className="text-4xl leading-tight font-black tracking-tight mb-2 editorial-font">
            What's the <br/><span className="italic">Occasion?</span>
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Tell us where you're headed for a curated look.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4 mb-12">
          {OCCASIONS.map((occ) => (
            <button 
              key={occ.id}
              onClick={() => {
                setSelectedOccasion(selectedOccasion === occ.id ? null : occ.id);
                setCustomRequest('');
              }}
              className={`flex flex-col items-start p-5 border transition-all duration-300 ${
                selectedOccasion === occ.id 
                  ? 'bg-[#F8F4EA] border-[#C5A059]' 
                  : 'bg-white border-gray-100'
              }`}
            >
              <iconify-icon icon={occ.icon} class="text-[#C5A059] text-xl mb-4"></iconify-icon>
              <span className="text-xs uppercase font-bold tracking-widest">{occ.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-[1px] bg-gray-100"></div>
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-300">OR</span>
          <div className="flex-1 h-[1px] bg-gray-100"></div>
        </div>

        <section className="space-y-6">
          <div className="space-y-3">
            <h2 className="editorial-font text-lg font-bold italic text-[#1A1A1A]">Custom Request</h2>
            <div className="relative">
              <textarea 
                value={customRequest}
                onChange={(e) => {
                  setCustomRequest(e.target.value);
                  setSelectedOccasion(null);
                }}
                placeholder="e.g. A gallery opening in Soho, it's raining but warm..."
                className="w-full h-32 p-4 bg-gray-50 border border-gray-100 focus:border-[#C5A059] outline-none text-sm leading-relaxed transition-colors resize-none"
              ></textarea>
            </div>
          </div>
        </section>

        <div className="mt-8 flex items-start gap-4 p-4 border border-[#C5A059]/10 bg-[#C5A059]/5">
          <iconify-icon icon="lucide:info" class="text-[#C5A059] mt-1"></iconify-icon>
          <p className="text-[11px] text-[#1A1A1A] font-medium leading-tight italic">
            Tip: Mentioning details like weather, venue, or mood helps AURA provide more accurate styling.
          </p>
        </div>
      </div>

      <footer className="sticky bottom-0 px-6 py-6 bg-white border-t border-gray-100 z-10 shadow-[0_-10px_40px_rgba(255,255,255,1)]">
        <button 
          onClick={handleSuggest}
          disabled={!selectedOccasion && !customRequest.trim()}
          className="w-full h-14 bg-[#1A1A1A] text-white flex items-center justify-center gap-3 font-bold tracking-[0.2em] text-[10px] uppercase transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          Get AI Suggestion
          <iconify-icon icon="lucide:wand-2" class="text-sm text-[#C5A059]"></iconify-icon>
        </button>
      </footer>
    </div>
  );
}
