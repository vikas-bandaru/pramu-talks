import React from 'react';
import { ImageIcon } from 'lucide-react';

const NandiCard = ({ imageUrl, title, text }) => (
  <div className="w-[280px] md:w-80 h-[450px] bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl flex flex-col items-stretch justify-start text-center text-white relative overflow-hidden group border border-slate-800 shrink-0 mx-auto md:mx-0">
    <div className="w-full h-[65%] relative overflow-hidden bg-slate-800">
      {imageUrl ? (
        <img src={imageUrl} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110" alt="Nandi Award" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-700">
          <ImageIcon size={48} />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
    </div>
    
    <div className="flex-1 p-8 flex flex-col items-center justify-center bg-slate-900 relative">
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-red-600 rounded-full shadow-xl">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Literary Excellence</p>
      </div>
      
      <p className="font-black text-2xl uppercase tracking-tighter leading-none mb-3 mt-2">{title || "Nandi Awardee"}</p>
      
      {text ? (
        <p className="text-slate-400 text-[10px] leading-relaxed max-w-[220px] font-medium transition-colors group-hover:text-slate-300 line-clamp-3">
          {text}
        </p>
      ) : (
        <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mt-2">Prestigious State Honor</p>
      )}
    </div>
  </div>
);

export default NandiCard;
