import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleGoogleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      {/* Navigation Header */}
      <header className="shrink-0 pt-14 px-6 flex justify-between items-center bg-white/95 backdrop-blur-md z-40 sticky top-0">
        <a href="#" className="text-2xl font-black tracking-tighter italic editorial-font">
          AURA<span className="text-[#C5A059]">.</span>
        </a>
        <button className="w-10 h-10 flex items-center justify-center">
          <iconify-icon icon="lucide:menu" class="text-2xl"></iconify-icon>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative w-full h-full">
        
        {/* Hero Section */}
        <section className="px-6 pt-10 pb-8">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-bold mb-3 block">
            The Future of Dressing
          </span>
          <h1 className="text-[46px] leading-[1.05] font-black tracking-tight mb-6 editorial-font">
            Your <span className="italic">Personal</span><br/>
            AI Stylist.
          </h1>
          <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-[280px]">
            Unlock the full potential of your wardrobe with editorial-grade AI styling.
          </p>
          
          <div className="relative w-full aspect-[4/5] bg-gray-50 overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop" 
              alt="Fashion Concept" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 border border-[#C5A059]/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C5A059] flex items-center justify-center">
                  <iconify-icon icon="lucide:sparkles" class="text-white text-sm"></iconify-icon>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">AI Recommendation</p>
                  <p className="text-xs font-semibold">Wedding Guest • Minimalist Luxe</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features-section" className="px-6 py-12 bg-white">
          <h2 className="text-2xl font-bold editorial-font mb-10 text-center">
            Elevated Intelligence
          </h2>
          
          <div className="space-y-10">
            {/* Feature 1 */}
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 border border-[#C5A059] flex items-center justify-center">
                <iconify-icon icon="lucide:camera" class="text-[#C5A059] text-xl"></iconify-icon>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Digital Vault</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Snap a photo and let our AI categorize every piece by fabric, cut, and color tone.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 border border-[#C5A059] flex items-center justify-center">
                <iconify-icon icon="lucide:wand-2" class="text-[#C5A059] text-xl"></iconify-icon>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Curated Edits</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Receive daily outfit compositions tailored to your calendar and the current weather.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 border border-[#C5A059] flex items-center justify-center">
                <iconify-icon icon="lucide:message-square" class="text-[#C5A059] text-xl"></iconify-icon>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Occasion Advice</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Simply ask: "What should I wear to a yacht party?" and get instant, curated looks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="px-6 py-16 bg-[#1A1A1A] text-white text-center overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#C5A059_0%,_transparent_70%)]"></div>
          </div>
          <iconify-icon icon="ri:double-quotes-l" class="text-3xl text-[#C5A059] mb-4"></iconify-icon>
          <p className="text-2xl editorial-font italic leading-snug mb-6 relative z-10">
            "Fashion is the armor to survive the reality of everyday life."
          </p>
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A059] font-bold">Bill Cunningham</span>
        </section>

        {/* Spacer for Action Bar */}
        <div className="h-32"></div>
      </main>

      {/* Fixed Action Bar */}
      <footer className="shrink-0 px-6 pb-[34px] pt-4 bg-white border-t border-gray-100 flex flex-col gap-3 z-50">
        {error && (
          <div className="text-center p-2 mb-2 border border-red-200 bg-red-50 text-red-500 text-xs font-bold rounded">
            {error}
          </div>
        )}
        <button 
          id="get-started-btn"
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="w-full h-14 bg-[#1A1A1A] text-white flex items-center justify-center gap-2 font-bold tracking-widest text-xs uppercase transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <>
               <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'currentColor' }} />
               Starting...
            </>
          ) : (
            <>
              Get Started (Google)
              <iconify-icon icon="lucide:arrow-right" class="text-sm"></iconify-icon>
            </>
          )}
        </button>
        <button 
          id="explore-features-btn" 
          onClick={() => {
            const section = document.getElementById('features-section');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
          }}
          className="w-full h-14 bg-white border border-gray-200 text-[#1A1A1A] flex items-center justify-center font-bold tracking-widest text-xs uppercase transition-all active:bg-gray-50"
        >
          Explore Features
        </button>
      </footer>
    </>
  );
}
