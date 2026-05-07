import React, { useState } from 'react';
import { 
  Search, Filter, Calendar, ArrowRight, Clock, Trash2, X, 
  BookOpen, ChevronRight, ShoppingCart, FileText, 
  Headphones, Timer, Globe, Sparkles 
} from 'lucide-react';
import { CATEGORIES } from '../../../constants/categories';

const ArchiveView = ({ works, isAdmin, onDelete, setFilter, currentFilter, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Refined "New" Badge Logic based on Publication Date
  const isNew = (work) => {
    const year = parseInt(work.pubYear);
    if (!year) return false;

    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const monthIndex = work.pubMonth ? months.indexOf(work.pubMonth.toLowerCase()) : 0;
    
    // Assume 1st of the month for calculation
    const pubDate = new Date(year, monthIndex === -1 ? 0 : monthIndex, 1);
    const now = new Date();
    
    // Difference in months
    const diffMonths = (now.getFullYear() - pubDate.getFullYear()) * 12 + (now.getMonth() - pubDate.getMonth());
    // Difference in days
    const diffDays = (now - pubDate) / (1000 * 60 * 60 * 24);

    const isMajorWork = work.type?.includes('book') || work.type?.includes('audiobook');
    
    // Books/Audiobooks: New if published in last 6 months
    if (isMajorWork) return diffMonths >= 0 && diffMonths <= 6;
    // Others: New if published in last 7 days
    return diffDays >= 0 && diffDays <= 7;
  };

  const filteredWorks = works.filter(work => {
    // 1. First, respect the category filter
    const matchesFilter = !currentFilter || work.type?.includes(currentFilter);
    if (!matchesFilter) return false;

    // 2. Then, perform the Universal Search
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    
    const searchableContent = [
      work.title,
      work.description,
      work.brief,
      work.magazine,
      work.sourceName,
      work.pubYear?.toString(),
      work.pubMonth,
      ...(Array.isArray(work.type) ? work.type : [work.type]),
      work.isTranslation ? 'translation' : '',
      work.audioUrl ? 'audio' : '',
      work.pdfUrl ? 'pdf' : ''
    ].filter(Boolean).join(' ').toLowerCase();

    return searchableContent.includes(s);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Reorganized Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-12 mb-16">

        {/* Left Side: Title and Subtitle */}
        <div className="max-w-2xl">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 dark:text-white leading-[0.9]">
            Literary <br />
            <span className="text-red-600 underline decoration-slate-200 underline-offset-8">Archives</span>
          </h2>
          <p className="text-slate-500 font-medium text-lg leading-relaxed dark:text-slate-400 max-w-lg">
            Explore a comprehensive collection of modern Telugu literature,
            research papers, and award-winning journalism.
          </p>
        </div>

        {/* Right Side: Search and Filters Stacked */}
        <div className="flex flex-col items-start lg:items-end gap-6 w-full lg:max-w-[720px]">
          
          {/* Search Bar - Width expanded to match 1-row filters */}
          <div className="relative group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-12 py-5 bg-slate-100 rounded-[2rem] text-sm font-bold outline-none focus:ring-2 focus:ring-red-600/20 transition-all dark:bg-slate-900 dark:text-white shadow-inner"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Tabs - Forced into single row */}
          <div className="flex flex-nowrap gap-1.5 md:gap-2 bg-slate-50 p-1.5 rounded-2xl dark:bg-slate-900 shadow-inner w-full overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`px-3 md:px-6 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex-1 text-center whitespace-nowrap ${currentFilter === cat.id ? 'bg-white text-red-600 shadow-md dark:bg-slate-800' : 'text-slate-500 hover:text-red-600 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Enhanced Grid Logic - Now 4 columns on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {filteredWorks.map((work) => {
          const isBook = work.type?.includes('book');
          const isAudio = work.type?.includes('audiobook');
          const isEssayOrStory = work.type?.includes('essay') || work.type?.includes('story');
          const isReview = work.type?.includes('review');
          const isMovieReview = isReview && (
            work.title?.toLowerCase().includes('movie') || 
            work.title?.toLowerCase().includes('film') || 
            work.title?.toLowerCase().includes('cinema') ||
            work.description?.toLowerCase().includes('movie')
          );
          
          const isPortrait = isBook && !isAudio;

          // Helper: Get Meta Label (Bottom Left)
          const getMetaLabel = () => {
            if (isAudio) return { label: 'Listen', icon: <Headphones size={12} /> };
            if (isBook) return null; // No time label for books
            if (isEssayOrStory) {
              const text = work.description || work.brief || "";
              const time = Math.max(3, Math.ceil(text.length / 400));
              return { label: `${time} min read`, icon: <Timer size={12} /> };
            }
            if (isReview) {
              return isMovieReview 
                ? { label: 'Watch', icon: <Clock size={12} /> } 
                : { label: 'Quick Read', icon: <Timer size={12} /> };
            }
            return { label: 'Explore', icon: <Timer size={12} /> };
          };

          // Helper: Get Action Details (Bottom Right)
          const getAction = () => {
            if (work.purchaseLink) return { label: 'Get Copy', icon: <ShoppingCart size={14} /> };
            if (work.pdfUrl) return { label: 'Read PDF', icon: <FileText size={14} /> };
            if (work.audioUrl) return { label: 'Listen Now', icon: <Headphones size={14} /> };
            return { label: 'Full Access', icon: <ChevronRight size={14} /> };
          };

          const meta = getMetaLabel();
          const action = getAction();
          
          return (
            <div key={work.id} onClick={() => onSelect(work)} className="group bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer dark:bg-slate-900 dark:border-slate-800 flex flex-col h-full relative">
              
              {/* New Badge Overlay */}
              {isNew(work) && (
                <div className="absolute top-3 right-3 z-20 bg-red-600 text-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xl animate-pulse">
                  <Sparkles size={10} />
                  <span className="text-[7px] font-black uppercase tracking-widest">New</span>
                </div>
              )}

              <div className={`${isPortrait ? 'aspect-[2/3]' : 'aspect-[16/10]'} overflow-hidden relative bg-slate-100 dark:bg-slate-950`}>
                <img src={work.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={work.title} />
                
                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  {[].concat(work.type).map((t, idx) => {
                    const category = CATEGORIES.find(c => c.id === t?.trim());
                    return (
                      <span key={idx} className="bg-white/90 backdrop-blur-md text-slate-900 text-[6px] md:text-[8px] font-black px-2 py-0.5 md:py-1 rounded-full uppercase tracking-widest shadow-sm">
                        {category ? category.label : t}
                      </span>
                    );
                  })}
                </div>

                <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
                  {work.purchaseLink && <div className="p-1.5 md:p-2 bg-white/95 backdrop-blur-md rounded-lg shadow-lg text-slate-900 hover:scale-110 transition-transform"><ShoppingCart size={10} /></div>}
                  {work.pdfUrl && <div className="p-1.5 md:p-2 bg-white/95 backdrop-blur-md rounded-lg shadow-lg text-slate-900 hover:scale-110 transition-transform"><FileText size={10} /></div>}
                  {work.audioUrl && <div className="p-1.5 md:p-2 bg-white/95 backdrop-blur-md rounded-lg shadow-lg text-red-600 hover:scale-110 transition-transform"><Headphones size={10} /></div>}
                </div>

                {isAdmin && (
                  <button onClick={(e) => { e.stopPropagation(); onDelete(work.id); }} className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              <div className="p-4 md:p-6 flex-1 flex flex-col">
                {isEssayOrStory && (work.magazine || work.sourceName) && (
                  <span className="text-[7px] md:text-[9px] font-black text-red-600 uppercase tracking-widest mb-1.5 italic flex items-center gap-1">
                    <Globe size={10} /> {work.magazine || work.sourceName}
                  </span>
                )}
                
                {work.isTranslation && (
                  <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest mb-2 w-max">
                    Translation
                  </span>
                )}

                <h3 className="text-xs md:text-lg font-black uppercase tracking-tight group-hover:text-red-600 transition-colors line-clamp-2 leading-tight dark:text-white mb-2 md:mb-3">{work.title}</h3>
                
                <p className="text-slate-500 text-[9px] md:text-xs leading-relaxed line-clamp-2 dark:text-slate-400 mb-4 flex-1">
                  {work.description || work.brief}
                </p>

                <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-1 text-[7px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {meta?.icon}
                    <span>{meta?.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[7px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-600 transition-colors">
                    <span>{action.label}</span>
                    {action.icon}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ArchiveView;

