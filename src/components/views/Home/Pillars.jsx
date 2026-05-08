import React from 'react';
import ReactMarkdown from 'react-markdown';
import { GraduationCap, History, BookOpen, ChevronRight } from 'lucide-react';

const Pillars = ({ activeRoot, setActiveRoot, data, works, setActiveTab, setSelectedWork }) => {
  const pillarsData = [
    {
      id: 'edu',
      icon: GraduationCap,
      title: 'Academic Excellence',
      desc: 'Doctoral research and university-level scholarly background.',
      content: data.rootsEducation,
      featured: works.find(w => w.id === data.featuredWorkId)
    },
    {
      id: 'media',
      icon: History,
      title: 'Media Evolution',
      desc: 'Two decades of leadership in digital and print journalism.',
      content: data.rootsExperience
    },
    {
      id: 'lit',
      icon: BookOpen,
      title: 'Literary Legacy',
      desc: 'Authoring and analyzing seminal works in Telugu literature.',
      content: data.rootsLiterature,
      stats: works.reduce((acc, w) => {
        const types = [].concat(w.type);
        types.forEach(t => acc[t] = (acc[t] || 0) + 1);
        return acc;
      }, { total: works.length })
    }
  ];

  return (
    <section className="py-20 md:py-24 bg-slate-50 px-4 border-b border-slate-100 dark:bg-slate-950 dark:border-slate-800 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4 uppercase tracking-tighter dark:text-white">Intellectual Foundations</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-xs">A Synthesis of Academia, Media, and Literary Excellence</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-red-600/5 blur-[60px] md:blur-[120px] rounded-full pointer-events-none" />
          {pillarsData.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoot === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveRoot(isActive ? null : item.id)}
                className={`relative p-8 rounded-[3rem] shadow-sm border transition-all duration-500 cursor-pointer group overflow-hidden ${isActive ? 'bg-slate-900 border-slate-700 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 hover:shadow-2xl hover:-translate-y-1 dark:bg-slate-900 dark:border-slate-800'}`}
              >
                {isActive && <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[80px] rounded-full -mr-20 -mt-20 animate-pulse" />}

                <div className="relative z-10">
                  <div className={`p-5 rounded-2xl w-fit mb-8 transition-all duration-500 ${isActive ? 'bg-red-600 text-white rotate-6 shadow-lg shadow-red-600/20' : 'bg-slate-50 text-red-600 group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 dark:bg-slate-950 shadow-inner'}`}>
                    <Icon size={36} />
                  </div>

                  <h3 className={`text-2xl font-black mb-4 uppercase tracking-tighter transition-colors ${isActive ? 'text-white' : 'dark:text-white'}`}>{item.title}</h3>

                  {isActive ? (
                    <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="prose prose-sm prose-invert max-w-none">
                        {(() => {
                          let liCount = 0;
                          return (
                            <ReactMarkdown components={{
                              p: ({ node, ...props }) => <p className="text-slate-300 text-base leading-relaxed mb-6" {...props} />,
                              li: ({ node, ...props }) => {
                                liCount++;
                                const isThirdBullet = liCount === 3 && item.id === 'edu' && item.featured;
                                return (
                                  <li className="text-slate-300 text-sm mb-3 list-disc ml-4 marker:text-red-500" {...props}>
                                    {props.children}
                                    {isThirdBullet && (
                                      <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 group/item hover:bg-white/10 transition-all cursor-pointer" onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('works');
                                        setSelectedWork(item.featured);
                                      }}>
                                        <img src={item.featured.thumbnail} className="w-10 h-12 object-cover rounded-lg shadow-xl" alt="" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[8px] font-black uppercase tracking-widest text-red-500 mb-0.5">Ph.D Thesis</p>
                                          <p className="text-white font-black text-xs truncate">{item.featured.title}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-white/30" />
                                      </div>
                                    )}
                                  </li>
                                );
                              }
                            }}>{item.content || 'Details coming soon...'}</ReactMarkdown>
                          );
                        })()}

                        {item.id === 'lit' && item.stats && (
                          <div className="mt-8 grid grid-cols-2 gap-3">
                            {Object.entries(item.stats).filter(([k]) => k !== 'total').map(([type, count]) => {
                              const pluralType = type === 'Book' ? 'Books' :
                                type === 'Review' ? 'Reviews' :
                                  type === 'Essay' ? 'Essays' :
                                    type.endsWith('s') ? type : `${type}s`;
                              return (
                                <div key={type} className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group/stat">
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 group-hover/stat:text-red-400 transition-colors">{pluralType}</p>
                                  <p className="text-white font-black text-2xl">{count}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-base leading-relaxed dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">{item.desc}</p>
                  )}

                  <div className={`mt-10 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all ${isActive ? 'text-red-400' : 'text-slate-400 group-hover:text-red-600'}`}>
                    <div className={`w-12 h-[2px] rounded-full transition-all ${isActive ? 'bg-red-600 w-16' : 'bg-slate-200 group-hover:bg-red-600'}`} />
                    {isActive ? 'Minimize' : 'Explore Details'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pillars;
