import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Award, BookOpen, Star, ChevronLeft, ChevronRight, ImageIcon, Sparkles } from 'lucide-react';
import NandiCard from './NandiCard';
import AwardsGallery from './AwardsGallery';
import MediaGallery from './MediaGallery';
import Pillars from './Pillars';

const YoutubeIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const HomeView = ({ setActiveTab, data, works, setSelectedWork }) => {
  const [activeRoot, setActiveRoot] = useState(null);
  const [overlayIndex, setOverlayIndex] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [sparkles, setSparkles] = useState([]);

  const awards = data.awardsGallery || [];
  
  const handleNext = (e) => {
    e?.stopPropagation();
    setOverlayIndex((prev) => (prev + 1) % awards.length);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setOverlayIndex((prev) => (prev - 1 + awards.length) % awards.length);
  };

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 70) handleNext();
    if (touchStart - touchEnd < -70) handlePrev();
    setTouchStart(null);
  };

  const triggerSparkle = (e) => {
    e.stopPropagation();
    const newSparkles = Array.from({ length: 12 }).map((_, i) => ({
      id: Math.random(),
      x: (Math.random() - 0.5) * 160,
      y: (Math.random() - 0.5) * 160,
      size: Math.random() * 12 + 8,
      delay: Math.random() * 0.2
    }));
    setSparkles(prev => [...prev, ...newSparkles]);
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => !newSparkles.find(ns => ns.id === s.id)));
    }, 1000);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (overlayIndex === null) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') setOverlayIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [overlayIndex]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="animate-in fade-in duration-700 overflow-x-hidden">
      {/* Hero Section - Split Grid Architecture */}
      <section className="bg-slate-900 text-white relative overflow-hidden dark:bg-slate-950 min-h-[70vh] md:min-h-[90vh] flex items-center pt-12 md:pt-20 pb-12 md:pb-20">
        {/* Background Glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full" />
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-red-600/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-30 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 items-center">
            
            {/* Column: Integrated Portrait - Priority on Mobile */}
            <div className="lg:col-span-5 xl:col-span-4 relative group animate-in zoom-in duration-1000 order-1 lg:order-2">
              <div className="relative aspect-square sm:aspect-[3/4] md:aspect-[4/5] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl border-4 md:border-[12px] border-white/5 bg-slate-800 dark:bg-slate-900 mx-auto max-w-[280px] sm:max-w-none">
                <img 
                  src="/dr-murthy.jpg" 
                  className="w-full h-full object-cover object-[center_15%] transition-transform duration-1000 group-hover:scale-105" 
                  alt="Dr. Prasada Murthy"
                  onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                />
                
                {/* Advanced Archival Blending */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80 dark:from-slate-950" />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[2.5rem] md:rounded-[4rem]" />
              </div>
              
              {/* Floating Decorative Elements */}
              <div 
                className="absolute -bottom-4 -left-4 bg-red-600 text-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl hidden sm:block animate-bounce duration-[3000ms] cursor-pointer hover:scale-110 active:scale-95 transition-transform z-50 overflow-visible"
                onClick={triggerSparkle}
              >
                <Star className="w-6 h-6 md:w-8 md:h-8" />
                
                {/* Sparkle Particles */}
                {sparkles.map(s => (
                  <Sparkles 
                    key={s.id} 
                    className="absolute text-yellow-400 pointer-events-none opacity-0 animate-[sparkle_0.8s_ease-out_forwards]" 
                    style={{ 
                      left: `calc(50% + ${s.x}px)`, 
                      top: `calc(50% + ${s.y}px)`,
                      width: s.size,
                      height: s.size,
                      animationDelay: `${s.delay}s`
                    }} 
                  />
                ))}

                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes sparkle {
                    0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1.5) rotate(180deg); opacity: 0; }
                  }
                `}} />
              </div>
            </div>

            {/* Column: Text Content */}
            <div className="lg:col-span-7 xl:col-span-8 animate-in slide-in-from-left duration-700 order-2 lg:order-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 text-red-500 text-[10px] font-black uppercase tracking-widest mb-6 md:mb-10 border border-red-600/20"><Award className="w-3.5 h-3.5" /> {data.heroBadge}</div>
              
              <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-4 md:mb-6 leading-[0.9] tracking-tighter uppercase whitespace-pre-line">
                <ReactMarkdown components={{ 
                  p: ({ node, ...props }) => <React.Fragment {...props} />, 
                  strong: ({ node, ...props }) => <span className="text-red-600 underline decoration-white/10 underline-offset-8" {...props} /> 
                }}>
                  {data.heroTitle}
                </ReactMarkdown>
              </h1>
              
              {data.heroSubtitle && (
                <h2 className="text-xl sm:text-2xl md:text-4xl font-medium italic text-slate-400 mb-10 md:mb-14 tracking-tight opacity-90 font-serif flex flex-wrap justify-center lg:justify-start items-center gap-y-2">
                  {data.heroSubtitle.split(/\s*[•·|]\s*/).map((part, i, arr) => (
                    <React.Fragment key={i}>
                      <span>{part.trim()}</span>
                      {i < arr.length - 1 && (
                        <span className="text-red-600 px-3 md:px-5 font-bold not-italic opacity-100 select-none">•</span>
                      )}
                    </React.Fragment>
                  ))}
                </h2>
              )}
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-6">
                <button onClick={() => window.open(data.watchChannelLink || 'https://www.youtube.com/@pramutalks', '_blank')} className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 md:px-12 py-4 md:py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all shadow-xl shadow-red-600/20 active:scale-95 group">
                  <YoutubeIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Watch Channel
                </button>
                <button onClick={() => setActiveTab('works')} className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/10 px-8 md:px-12 py-4 md:py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all active:scale-95">Explore Literature</button>
              </div>
            </div>

          </div>
        </div>

        {data.heroBgUrl && <img src={data.heroBgUrl} className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none mix-blend-overlay z-0" alt="" />}
      </section>

      {/* Philosophy Section */}
      <section className="py-20 md:py-24 bg-white border-b border-slate-50 px-4 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black mb-6 uppercase tracking-tighter dark:text-white">{data.philosophyTitle}</h2>
            <div className="w-12 h-1 bg-red-600 mb-8" />
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium italic mb-6 dark:text-slate-300">"{data.philosophyQuote}"</p>
            <p className="text-slate-500 leading-relaxed dark:text-slate-400 text-sm md:text-base">{data.philosophyText}</p>
          </div>
          <div className="bg-slate-50 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 border border-slate-100 flex flex-col items-center justify-center text-center dark:bg-slate-950 dark:border-slate-800">
            <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-red-600 mb-4" />
            <p className="text-xl md:text-2xl font-black text-slate-900 uppercase dark:text-white">{data.philosophyAccent}</p>
            <p className="text-[9px] md:text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Sri Sri's Eternal Inspiration</p>
          </div>
        </div>
      </section>

      {/* extracted Pillars (Intellectual Foundations) component */}
      <Pillars 
        activeRoot={activeRoot} 
        setActiveRoot={setActiveRoot} 
        data={data} 
        works={works} 
        setActiveTab={setActiveTab} 
        setSelectedWork={setSelectedWork} 
      />

      {/* About Section */}
      <section className="py-20 md:py-24 bg-white border-b border-slate-50 px-4 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:gap-16 items-start">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-black mb-6 md:mb-8 uppercase tracking-tighter dark:text-white">About Dr. Prasada Murthy</h2>
            <div className="prose prose-sm md:prose-lg dark:prose-invert max-w-none">
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium italic mb-8 md:mb-10 dark:text-slate-300">
                "A distinguished public intellectual, celebrated poet, and veteran journalist whose career spans over four decades of scholarly and cultural discourse."
              </p>
              <div className="space-y-6 text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
                <p>
                  <strong>Dr. Bandaru Rama Vara Prasada Murthy</strong>, widely recognized as <strong>Dr. Prasada Murthy</strong>, was born on January 5, 1960, in Nidamarru, Andhra Pradesh. He is a formidable scholar of language and culture, holding an M.A. in Telugu, an M.A. in English, and a Ph.D. in Telugu Literature.
                </p>
                <p>
                  With over 20 years of leadership in digital and print journalism, Dr. Murthy has worked with prominent media outlets, earning widespread acclaim for his insightful commentary. In 2008, his dedication to Telugu heritage was honored with two prestigious <strong>Nandi Awards</strong> for his definitive documentary on the legendary poet <strong>Sri Sri</strong>.
                </p>
                <p>
                  A prolific author, he has published 19 poetry collections, a short story book, and a seminal Ph.D. thesis. Beyond his literary achievements, he is a passionate advocate for social justice, secularism, and human rights. Today, through his independent YouTube channel, <strong>"Pramu Talks,"</strong> he continues to inspire audiences by promoting rational thinking and progressive values across India.
                </p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-80 bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-red-600/10 blur-[80px] rounded-full" />
            <div className="relative z-10">
              <div className="bg-red-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-red-600/20">
                <Star size={24} />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight mb-2">Dr. Prasada Murthy</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">Telugu Poet, Journalist, & YouTuber</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Founded</span>
                  <span className="text-xs font-bold">Pramu Talks</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Exp.</span>
                  <span className="text-xs font-bold">40+ Years</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Awards</span>
                  <span className="text-xs font-bold text-red-500">2x Nandi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="py-20 md:py-24 bg-white border-b border-slate-50 px-4 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-16 px-4">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter dark:text-white">{data.awardsTitle}</h2>
              <div className="w-12 h-1 bg-red-600 mt-2 md:hidden" />
            </div>
            <div className="flex gap-2">
              <div onClick={handlePrev} className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 dark:border-slate-800 cursor-pointer hover:bg-slate-50 transition-colors"><ChevronLeft size={14} /></div>
              <div onClick={handleNext} className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 dark:border-slate-800 cursor-pointer hover:bg-slate-50 transition-colors"><ChevronRight size={14} /></div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-stretch mb-16">
            <div className="flex-1 min-w-0 overflow-hidden">
              <AwardsGallery awards={awards} onImageClick={setOverlayIndex} />
            </div>
            <NandiCard imageUrl={data.nandiImageUrl} title={data.nandiTitle} text={data.nandiText} />
          </div>
        </div>
      </section>

      <MediaGallery gallery={data.gallery} />

      {/* Overlay Carousel */}
      {overlayIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-300" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <button onClick={() => setOverlayIndex(null)} className="absolute top-6 right-6 md:top-12 md:right-12 text-white/40 hover:text-white transition-all p-4 bg-white/5 rounded-full backdrop-blur-md">
            <ChevronLeft className="rotate-45" size={24} />
          </button>
          
          <div className="w-full max-w-5xl aspect-video md:aspect-[16/9] relative group">
            <img src={awards[overlayIndex]?.url} className="w-full h-full object-contain drop-shadow-2xl animate-in zoom-in-95 duration-500" alt="" />
            
            <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 hidden md:block">
              <ChevronLeft size={24} />
            </button>
            <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 hidden md:block">
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="mt-8 md:mt-12 text-center max-w-2xl px-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">{awards[overlayIndex]?.year || 'Year Pending'}</span>
              <div className="w-12 h-[1px] bg-white/10" />
              <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">{overlayIndex + 1} / {awards.length}</p>
            </div>
            <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">{awards[overlayIndex]?.title || 'Untitled Award'}</h3>
            <p className="text-red-500 font-bold uppercase tracking-[0.2em] text-xs mb-6">{awards[overlayIndex]?.authority || 'Authority Pending'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeView;
