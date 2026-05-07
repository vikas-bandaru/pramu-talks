import React from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, Calendar, ExternalLink, 
  BookOpen, PlayCircle, Hash 
} from 'lucide-react';

const WorkDetailView = ({ work, onBack }) => {
  const workTypes = [].concat(work.type);
  const isLandscapeMedia = (workTypes.includes('review') || workTypes.includes('audiobook')) && (
    (work.youtubeLink && (work.youtubeLink.includes('youtube.com') || work.youtubeLink.includes('youtu.be'))) ||
    (work.link && (work.link.includes('youtube.com') || work.link.includes('youtu.be')))
  );

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = '';
    if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const embedUrl = getYoutubeEmbedUrl(work.youtubeLink || work.link);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 animate-in fade-in duration-700 pb-20">
      {/* Header Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-50 px-4 py-4 dark:bg-slate-950/80 dark:border-slate-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-3 text-slate-500 hover:text-red-600 transition-all font-black uppercase tracking-widest text-[10px]"
          >
            <ArrowLeft size={16} /> Back to Archive
          </button>
          <div className="flex gap-2">
            {workTypes.map(t => (
              <span key={t} className="px-4 py-1.5 bg-slate-100 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-400 dark:bg-slate-900">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12">
        <div className={`grid grid-cols-1 ${isLandscapeMedia ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-12 md:gap-16 items-start`}>
          
          {/* Cover / Media Section */}
          <div className={`${isLandscapeMedia ? 'w-full' : 'lg:col-span-4'}`}>
            <div className={`relative group ${isLandscapeMedia ? 'aspect-video w-full' : 'aspect-[3/4]'} rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-900`}>
              {isLandscapeMedia && embedUrl ? (
                <iframe 
                  src={embedUrl}
                  className="w-full h-full border-none shadow-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img src={work.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={work.title} />
              )}
            </div>
            
            {/* Meta Stats (Below Cover) */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 rounded-3xl dark:bg-slate-900/50">
                <Calendar size={18} className="text-red-600 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Created</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {work.createdAt ? new Date(work.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Archive Entry'}
                </p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl dark:bg-slate-900/50">
                <Hash size={18} className="text-red-600 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Index</p>
                <p className="font-bold text-slate-900 dark:text-white">#{work.id.slice(-4).toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className={`${isLandscapeMedia ? 'w-full max-w-4xl mx-auto' : 'lg:col-span-8'}`}>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-[0.9] dark:text-white">{work.title}</h1>
            <div className="flex flex-wrap gap-4 mb-10 pb-10 border-b border-slate-100 dark:border-slate-900">
              <div className="flex items-center gap-2 text-red-600">
                <PlayCircle size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Official Entry</span>
              </div>
              {work.link && (
                <a href={work.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <ExternalLink size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Source Link</span>
                </a>
              )}
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-xl md:text-2xl text-slate-500 font-medium italic mb-12 leading-relaxed dark:text-slate-400">
                {work.description}
              </p>
              <div className="text-slate-600 dark:text-slate-300 space-y-8 leading-loose">
                <ReactMarkdown components={{
                  h2: ({ node, ...props }) => <h2 className="text-2xl font-black uppercase tracking-tight mt-12 mb-6" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-6" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc ml-6 space-y-3 mb-8" {...props} />,
                  strong: ({ node, ...props }) => <span className="font-black text-slate-900 dark:text-white" {...props} />
                }}>{work.fullText || "Full literary analysis and archival content for this work are currently being synthesized. Please check back soon for the complete scholarly review."}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkDetailView;
