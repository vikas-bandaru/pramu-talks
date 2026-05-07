import React, { useState } from 'react';
import { Search, Filter, Calendar, ArrowRight, Clock, Trash2, X, BookOpen, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../../../constants/categories';

const ArchiveView = ({ works, isAdmin, onDelete, setFilter, currentFilter, onSelect }) => {
  // 1. Move Search State to the top
  const [searchTerm, setSearchTerm] = useState('');

  // 2. Define Filtered Logic BEFORE the return
  const filteredWorks = works.filter(work => {
    const s = searchTerm.toLowerCase();
    return (
      work.title?.toLowerCase().includes(s) ||
      work.description?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative group mb-6">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search by title, year, or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-96 pl-14 pr-12 py-5 bg-slate-100 rounded-[2rem] text-sm font-medium outline-none focus:ring-2 focus:ring-red-600/20 transition-all dark:bg-slate-900 dark:text-white shadow-inner"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 dark:text-white">
              Literary <span className="text-red-600 underline decoration-slate-200 underline-offset-8">Archives</span>
            </h2>
            <p className="text-slate-500 font-medium text-lg leading-relaxed dark:text-slate-400">
              Explore a comprehensive collection of modern Telugu literature.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 bg-slate-50 p-1.5 rounded-2xl dark:bg-slate-900 shadow-inner">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentFilter === 'all' ? 'bg-white text-red-600 shadow-md dark:bg-slate-800' : 'text-slate-500 hover:text-slate-900'}`}
          >
            All Works
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentFilter === cat.id ? 'bg-white text-red-600 shadow-md dark:bg-slate-800' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Use filteredWorks in the Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredWorks.map((work) => (
          <div key={work.id} onClick={() => onSelect(work)} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer dark:bg-slate-900 dark:border-slate-800 flex flex-col h-full">
            <div className="aspect-[16/10] overflow-hidden relative bg-slate-100 dark:bg-slate-950">
              <img src={work.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={work.title} />
              <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                {[].concat(work.type).map((t, idx) => {
                  const category = CATEGORIES.find(c => c.id === t?.trim());
                  return (
                    <span key={idx} className="bg-white/90 backdrop-blur-md text-slate-900 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                      {category ? category.label : t}
                    </span>
                  );
                })}
              </div>
              {isAdmin && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(work.id); }}
                  className="absolute top-6 right-6 p-3 bg-red-600 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-xl"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-xl font-black uppercase tracking-tight group-hover:text-red-600 transition-colors line-clamp-2 leading-tight dark:text-white mb-4">{work.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 dark:text-slate-400 mb-8 flex-1">{work.description}</p>
              <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center dark:bg-slate-800">
                    <BookOpen size={14} className="text-slate-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Read More</span>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArchiveView;
