import React from 'react';
import { ImageIcon, Award } from 'lucide-react';

const AwardsGallery = ({ awards, onImageClick }) => {
  const hasAwards = awards && awards.length > 0;

  return (
    <div className="relative group/carousel">
      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory px-4">
        {hasAwards ? awards.filter(Boolean).map((award, idx) => (
          <div key={idx} className="flex-shrink-0 w-[200px] md:w-[280px] snap-center">
            <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 dark:bg-slate-950 dark:border-slate-800 group h-full shadow-sm hover:shadow-xl transition-all">
              <div 
                className="aspect-[4/3] overflow-hidden cursor-pointer relative bg-slate-200 dark:bg-slate-900"
                onClick={() => onImageClick(idx)}
              >
                {award.url ? (
                  <img src={award.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={award.title || 'Award Image'} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 group-hover:text-red-500 transition-colors">
                    <ImageIcon size={32} className="mb-2 opacity-20" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Image Pending</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white"><ImageIcon size={20} /></div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{award.year || 'N/A'}</span>
                  <Award size={14} className="text-slate-300" />
                </div>
                <h4 className="font-black text-lg uppercase tracking-tight mb-1 dark:text-white line-clamp-1">{award.title || 'Untitled Award'}</h4>
                <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest truncate">{award.authority || 'Awarding Authority'}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="w-full h-64 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 dark:bg-slate-950 dark:border-slate-800">
            <ImageIcon size={32} className="mb-4 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest">No Awards in Gallery</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AwardsGallery;
