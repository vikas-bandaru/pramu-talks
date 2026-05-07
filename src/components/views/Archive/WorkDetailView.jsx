import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, Calendar, ExternalLink, 
  BookOpen, PlayCircle, Globe, ShoppingCart, 
  FileText, Headphones, Timer, Clock, Share2,
  Maximize2, X, Check
} from 'lucide-react';
import { CATEGORIES } from '../../../constants/categories';

const WorkDetailView = ({ work, onBack }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [work.id]);

  const workTypes = [].concat(work.type);
  const isBook = workTypes.includes('book');
  const isAudio = workTypes.includes('audiobook');
  const isEssayOrStory = workTypes.includes('essay') || workTypes.includes('story');
  const isReview = workTypes.includes('review');
  
  const isMovieReview = isReview && (
    work.title?.toLowerCase().includes('movie') || 
    work.title?.toLowerCase().includes('film') || 
    work.title?.toLowerCase().includes('cinema')
  );

  const isPortrait = isBook && !isAudio;

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = '';
    if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const embedUrl = getYoutubeEmbedUrl(work.youtubeLink || work.link);

  const estimateReadTime = () => {
    if (isBook) return null;
    const text = (work.description || "") + (work.fullText || "");
    if (text.length < 100) return null;
    return Math.max(3, Math.ceil(text.length / 500));
  };

  const readTime = estimateReadTime();

  const handleShare = async () => {
    const shareData = {
      title: `Pramu Talks: ${work.title}`,
      text: work.description || work.brief,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.log('Share failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 animate-in fade-in duration-700 pb-20 relative">
      
      {/* Lightbox Overlay */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in zoom-in duration-300"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <X size={32} />
          </button>
          <img 
            src={work.thumbnail} 
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
            alt="Archival Scan" 
          />
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-[10px] uppercase font-black tracking-widest">
            Scholarly Archival View
          </p>
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-50 px-4 py-4 dark:bg-slate-950/80 dark:border-slate-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-3 text-slate-500 hover:text-red-600 transition-all font-black uppercase tracking-widest text-[10px]"
          >
            <ArrowLeft size={16} /> Back to Archive
          </button>
          <div className="flex gap-2">
            {workTypes.map(t => {
              const cat = CATEGORIES.find(c => c.id === t);
              return (
                <span key={t} className="px-4 py-1.5 bg-slate-100 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-400 dark:bg-slate-900">
                  {cat ? cat.label : t}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8 md:mt-16">
        {/* Full-Width Title Header - Always First */}
        <div className="mb-8 md:mb-16 text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tighter mb-4 md:mb-6 leading-[1.1] dark:text-white">
            {work.title}
          </h1>
          
          {work.isTranslation && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg dark:bg-slate-900">
              <Globe size={12} className="text-red-600" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Translated Work</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20 items-start">
          
          {/* Column 1: Media & Actions - Priority 1 on Mobile */}
          <div className="lg:col-span-5 xl:col-span-4 order-1">
            <div 
              className={`relative group ${isPortrait ? 'aspect-[2/3] w-[60%] mx-auto lg:w-full' : 'aspect-video w-full'} rounded-[1.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl bg-slate-100 dark:bg-slate-900 border-4 md:border-8 border-white dark:border-slate-800 ${!embedUrl ? 'cursor-zoom-in' : ''}`}
              onClick={() => !embedUrl && setIsLightboxOpen(true)}
            >
              {embedUrl ? (
                <iframe 
                  src={embedUrl}
                  className="w-full h-full border-none"
                  allowFullScreen
                />
              ) : (
                <>
                  <img src={work.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={work.title} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Maximize2 className="text-white" size={32} />
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons - Priority 2 on Mobile */}
            <div className="mt-6 md:mt-8 space-y-2 md:space-y-3">
              {work.purchaseLink && (
                <a href={work.purchaseLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-4 md:py-5 bg-red-600 text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95">
                  <ShoppingCart size={16} /> Get Physical Copy
                </a>
              )}
              {work.pdfUrl && (
                <a href={work.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-4 md:py-5 bg-slate-900 text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-black transition-all shadow-xl dark:bg-slate-800 active:scale-95">
                  <FileText size={16} /> Download PDF
                </a>
              )}
              {work.audioUrl && (
                <a href={work.audioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-4 md:py-5 border-2 border-slate-200 text-slate-900 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-slate-50 transition-all dark:border-slate-800 dark:text-white active:scale-95">
                  <Headphones size={16} /> Listen to Audio
                </a>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 md:gap-4">
              {(work.magazine || work.sourceName) && (
                <div className="p-4 md:p-6 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] dark:bg-slate-900/50 flex items-center gap-3 md:gap-4 border border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-red-600 shadow-sm flex-shrink-0">
                    <Globe size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Published In</p>
                    <p className="font-bold text-[10px] md:text-base text-slate-900 dark:text-white truncate">{work.magazine || work.sourceName}</p>
                  </div>
                </div>
              )}
              {(work.pubYear || work.createdAt) && (
                <div className="p-4 md:p-6 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] dark:bg-slate-900/50 flex items-center gap-3 md:gap-4 border border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-red-600 shadow-sm flex-shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Date</p>
                    <p className="font-bold text-[10px] md:text-base text-slate-900 dark:text-white">
                      {work.pubMonth ? `${work.pubMonth} ` : ''}{work.pubYear || (work.createdAt ? new Date(work.createdAt).getFullYear() : 'N/A')}
                    </p>
                  </div>
                </div>
              )}
              {readTime && (
                <div className="p-4 md:p-6 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] dark:bg-slate-900/50 flex items-center gap-3 md:gap-4 border border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-red-600 shadow-sm flex-shrink-0">
                    {isMovieReview ? <Clock size={18} /> : <Timer size={18} />}
                  </div>
                  <div>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Estimate</p>
                    <p className="font-bold text-[10px] md:text-base text-slate-900 dark:text-white">{readTime} min {isMovieReview ? 'watch' : 'read'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Content - Priority 3 on Mobile */}
          <div className="lg:col-span-7 xl:col-span-8 order-2">
            <div className="mb-6 md:mb-12">
              {(work.description || work.brief) && (
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-slate-400 font-medium italic leading-relaxed mb-6 md:mb-12">
                  "{work.description || work.brief}"
                </p>
              )}
            </div>

            <div className="prose prose-base sm:prose-lg md:prose-xl dark:prose-invert max-w-none">
              <div className="text-slate-600 dark:text-slate-300 space-y-6 md:space-y-8 leading-relaxed md:leading-loose text-left">
                <ReactMarkdown components={{
                  h2: ({ node, ...props }) => <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight mt-10 md:mt-16 mb-4 md:mb-8 text-slate-900 dark:text-white border-l-4 border-red-600 pl-4 md:pl-6" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-6 md:mb-8 text-left" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc ml-6 md:ml-8 space-y-3 md:space-y-4 mb-8 md:mb-10 text-left" {...props} />,
                  strong: ({ node, ...props }) => <span className="font-black text-slate-900 dark:text-white" {...props} />,
                  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-slate-200 dark:border-slate-800 pl-6 md:pl-8 italic text-slate-400 my-8 md:my-12 text-left" {...props} />
                }}>
                  {work.fullText || "Archival analysis for this literary entry is currently being digitized. Full text will be available shortly."}
                </ReactMarkdown>
              </div>
            </div>

            {/* Bottom Utility Bar */}
            <div className="mt-20 pt-10 border-t border-slate-100 dark:border-slate-900 flex flex-wrap gap-8 items-center justify-between">
              <div className="flex items-center gap-6">
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 text-slate-400 hover:text-red-600 transition-all uppercase font-black text-[10px] tracking-widest group"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-green-500" />
                      <span className="text-green-500">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={16} className="group-hover:rotate-12 transition-transform" />
                      <span>Share Archive</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkDetailView;

