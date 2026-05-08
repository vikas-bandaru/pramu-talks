import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MediaGallery = ({ gallery, onImageClick }) => (
  <section className="py-20 md:py-24 bg-slate-50 px-0 md:px-4 dark:bg-slate-950 overflow-hidden">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 px-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter dark:text-white">Moments in Media</h2>
          <p className="text-[9px] md:text-[10px] text-red-600 font-bold uppercase tracking-[0.2em] mt-2">Visual Chronicles</p>
        </div>
        <div className="hidden md:flex gap-2 text-slate-400">
          <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center dark:border-slate-800"><ChevronLeft size={16} /></div>
          <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center dark:border-slate-800"><ChevronRight size={16} /></div>
        </div>
      </div>

      <div className="flex md:grid md:grid-cols-4 gap-6 overflow-x-auto pb-8 no-scrollbar snap-x snap-mandatory md:overflow-visible px-4">
        {(gallery || []).map((item, i) => (
          <div 
            key={i} 
            onClick={() => onImageClick && onImageClick(i)}
            className="flex-shrink-0 w-[260px] md:w-auto group relative aspect-square bg-slate-200 rounded-[2.5rem] overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all dark:bg-slate-900 snap-center"
          >
            <img src={item.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={item.label} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
              <div>
                <p className="text-white text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Moment</p>
                <span className="text-white text-lg font-black uppercase tracking-tighter italic">{item.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default MediaGallery;
