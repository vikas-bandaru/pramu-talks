import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';

import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, onSnapshot, setDoc, getDocs,
  doc, deleteDoc, updateDoc, query, orderBy, initializeFirestore, writeBatch
} from 'firebase/firestore';
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from 'firebase/storage';
import {
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged
} from 'firebase/auth';
import {
  Book, Mic2, Search, Home, Award,
  PlayCircle, Menu, X, ChevronRight, ChevronLeft, Plus,
  Database, Library, Settings, Trash2,
  BookOpen, Newspaper, Film, PenTool, Lock, Key, Star, Loader2,
  School, Heart, Image as ImageIcon, GraduationCap, History,
  Calendar, Link as LinkIcon, FileText, ShoppingCart, Headphones,
  AlertCircle, CheckCircle2, Filter, Edit3, UploadCloud, Zap, Link2,
  Cpu, Globe, Copy, Fingerprint, Video, Camera, Share2,
  ArrowUp, ArrowDown, MoveVertical
} from 'lucide-react';

// =============================================================
// SETUP: PASTE YOUR KEYS HERE
// =============================================================

const myFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: "pramu-talks.firebaseapp.com",
  projectId: "pramu-talks",
  storageBucket: "pramu-talks.firebasestorage.app",
  messagingSenderId: "623377707902",
  appId: "1:623377707902:web:0f9e68a76635d19258392f",
  measurementId: "G-73TG2NMQMF"
};

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; // Get from https://aistudio.google.com/

// =============================================================

const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    try {
      const parsed = JSON.parse(__firebase_config);
      if (parsed.apiKey) return parsed;
    } catch (e) {
      console.error("Firebase environmental config parse error:", e);
    }
  }
  return myFirebaseConfig;
};

const firebaseConfig = getFirebaseConfig();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
const storage = getStorage(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'pramu-talks-v2';

const DEFAULT_HOME_CONTENT = {
  heroTitle: "Poetry & **Journalism.** Truth in Words.",
  heroSubtitle: "Bridging the gap between the progressive literature and the dynamic world of digital media.",
  heroBadge: "Nandi Awardee 2008",
  philosophyTitle: "Core Philosophy",
  philosophyQuote: "Literature is not just words on a page; it is the heartbeat of society.",
  philosophyText: "Dr. Murthy's philosophy centers on 'Sahitya-Samaja'—the inevitable bond between art and social responsibility. Masterfully bridging classroom pedagogy with digital ethics.",
  philosophyAccent: "శ్రమయే జీవన సౌందర్యము",
  rootsEducation: "- **Ph.D in Telugu Literature** from Andhra University\n- **MA Telugu & MA English**\n- Specialized research on modern prose poetry and Ph.D thesis on **Oka Satabdaanni Kudipesina Dalita Kavitvam** in Telugu Literature.",
  rootsLiterature: "Published numerous poetry collections, essays, articles, translations, short story collections, and book forewords in modern Telugu literature. Active contributor to literary journals and literary criticism.",
  rootsExperience: "- YouTube: Founder of Pramu Talks channel (3+ years, 83.7K+ subscribers)\n- Digital Media: 20 years in digital journalism and content strategy\n- Print Media: 5 years experience as Senior Sub-editor",
  featuredWorkId: "",
  watchChannelLink: "https://www.youtube.com/@pramutalks",
  awardsTitle: "Awards & Honors",
  nandiTitle: "Prestigious Nandi Award",
  nandiText: "Recognized for the acclaimed digital documentary series on Revolutionary Poet Sri Sri. Celebrated for historical depth and narrative excellence.",
  nandiImageUrl: "",
  samratTitle: "Sahitya Samrat",
  samratText: "Conferred by state literary circles for significant contribution to poetry research and book analysis.",
  samratImageUrl: "",
  heroBgUrl: "",
  awardsGallery: [],
  gallery: [
    { url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400', label: 'Studio' },
    { url: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=400', label: 'Literature' },
    { url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', label: 'Teaching' },
    { url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400', label: 'Archive' }
  ],
};

const YoutubeIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 2-2 10 10 0 0 1 15 0 2 2 0 0 1 2 2 24.12 24.12 0 0 1 0 10 2 2 0 0 1-2 2 10 10 0 0 1-15 0 2 2 0 0 1-2-2Z" /><path d="m10 15 5-3-5-3z" /></svg>
);

const FALLBACK_VIDEOS = [
  { id: 'v1', title: 'Sri Sri: The Great Revolutionary Poet - Nandi Award Program', thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600', url: 'https://www.youtube.com/@pramutalks' },
  { id: 'v2', title: 'Philosophy of Mahaprasthanam - Detailed Analysis', thumbnail: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600', url: 'https://www.youtube.com/@pramutalks' },
  { id: 'v3', title: 'Journalism Ethics in the Digital Era', thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600', url: 'https://www.youtube.com/@pramutalks' }
];
// --- View Components ---

const HomeView = ({ setActiveTab, data, works, setSelectedWork }) => {
  const [activeRoot, setActiveRoot] = useState(null);
  const [overlayIndex, setOverlayIndex] = useState(null);
  const [touchStart, setTouchStart] = useState(null);

  const awards = data.awardsGallery || [];
  const hasAwards = awards.length > 0;

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

  return (
    <div className="animate-in fade-in duration-700">
      <section className="bg-slate-900 text-white py-32 relative overflow-hidden dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 text-red-500 text-[10px] font-black uppercase tracking-widest mb-8 border border-red-600/20"><Award className="w-3.5 h-3.5" /> {data.heroBadge}</div>
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tight uppercase">
              <ReactMarkdown components={{ p: ({ node, ...props }) => <React.Fragment {...props} />, strong: ({ node, ...props }) => <span className="text-red-600 underline decoration-white/10 underline-offset-8" {...props} /> }}>{data.heroTitle}</ReactMarkdown>
            </h1>
            <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl font-medium">{data.heroSubtitle}</p>
            <div className="flex flex-wrap gap-5">
              <button onClick={() => window.open(data.watchChannelLink || 'https://www.youtube.com/@pramutalks', '_blank')} className="bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-red-600/20 active:scale-95">Watch Channel</button>
              <button onClick={() => setActiveTab('works')} className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/10 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95">The Archive</button>
            </div>
          </div>
        </div>
        {data.heroBgUrl && <img src={data.heroBgUrl} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="" />}
        <div className="absolute -bottom-48 -right-48 w-[800px] h-[800px] bg-red-600/5 blur-[120px] rounded-full" />
      </section>

      {/* Philosophy */}
      <section className="py-24 bg-white border-b border-slate-50 px-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-black mb-6 uppercase tracking-tighter dark:text-white">{data.philosophyTitle}</h2>
            <div className="w-12 h-1 bg-red-600 mb-8" />
            <p className="text-xl text-slate-600 leading-relaxed font-medium italic mb-6 dark:text-slate-300">"{data.philosophyQuote}"</p>
            <p className="text-slate-500 leading-relaxed dark:text-slate-400">{data.philosophyText}</p>
          </div>
          <div className="bg-slate-50 rounded-[3rem] p-12 border border-slate-100 flex flex-col items-center justify-center text-center dark:bg-slate-950 dark:border-slate-800">
            <BookOpen className="w-16 h-16 text-red-600 mb-4" />
            <p className="text-2xl font-black text-slate-900 uppercase dark:text-white">{data.philosophyAccent}</p>
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Sri Sri's Eternal Inspiration</p>
          </div>
        </div>
      </section>

      {/* Academic Roots */}
      <section className="py-24 bg-slate-50 px-4 border-b border-slate-100 dark:bg-slate-950 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter dark:text-white">Intellectual Foundations</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">A Synthesis of Academia, Media, and Literary Excellence</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />
            {[
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
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeRoot === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveRoot(isActive ? null : item.id)}
                  className={`relative p-8 rounded-[3rem] shadow-sm border transition-all duration-500 cursor-pointer group overflow-hidden ${isActive ? 'bg-slate-900 border-slate-700 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 hover:shadow-2xl hover:-translate-y-1 dark:bg-slate-900 dark:border-slate-800'}`}
                >
                  {/* Decorative Gradient Background for Active State */}
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
                                            <p className="text-[8px] font-black uppercase tracking-widest text-red-500 mb-0.5">Featured Work</p>
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

      {/* About Section */}
      <section className="py-24 bg-white border-b border-slate-50 px-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-start">
          <div className="flex-1">
            <h2 className="text-4xl font-black mb-8 uppercase tracking-tighter dark:text-white">About Dr. Prasada Murthy</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-xl text-slate-600 leading-relaxed font-medium italic mb-10 dark:text-slate-300">
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
          {/* Featured Profile Card in About Section */}
          <div className="w-full md:w-80 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-red-600/10 blur-[80px] rounded-full" />
            <div className="relative z-10">
              <div className="bg-red-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-red-600/20">
                <Star size={24} />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight mb-2">Dr. Prasada Murthy</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">Telugu Poet & Journalist</p>
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

      {/* Awards & Honors Enhanced */}
      <section className="py-24 bg-white border-b border-slate-50 px-4 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-16 items-center mb-16">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-black uppercase tracking-tighter dark:text-white">{data.awardsTitle}</h2>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 dark:border-slate-800"><ChevronLeft size={14} /></div>
                  <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 dark:border-slate-800"><ChevronRight size={14} /></div>
                </div>
              </div>
              
              {/* Award Carousel Relocated Here */}
              <div className="relative group/carousel">
                <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory">
                  {hasAwards ? awards.filter(Boolean).map((award, idx) => (
                    <div key={idx} className="flex-shrink-0 w-[240px] md:w-[280px] snap-center">
                      <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 dark:bg-slate-950 dark:border-slate-800 group h-full shadow-sm hover:shadow-xl transition-all">
                        <div 
                          className="aspect-[4/3] overflow-hidden cursor-pointer relative bg-slate-200 dark:bg-slate-900"
                          onClick={() => setOverlayIndex(idx)}
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
            </div>
            <div className="w-full md:w-80 h-[450px] bg-slate-900 rounded-[3rem] shadow-2xl flex flex-col items-stretch justify-start text-center text-white relative overflow-hidden group border border-slate-800 shrink-0">
              <div className="w-full h-[55%] relative overflow-hidden bg-slate-800">
                {data.nandiImageUrl ? (
                  <img src={data.nandiImageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Nandi Award" />
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
                
                <p className="font-black text-2xl uppercase tracking-tighter leading-none mb-3 mt-2">{data.nandiTitle || "Nandi Awardee"}</p>
                
                {data.nandiText ? (
                  <p className="text-slate-400 text-[10px] leading-relaxed max-w-[220px] font-medium transition-colors group-hover:text-slate-300 line-clamp-3">
                    {data.nandiText}
                  </p>
                ) : (
                  <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mt-2">Prestigious State Honor</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Award Zoom Overlay */}
      {overlayIndex !== null && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => setOverlayIndex(null)}
        >
          <button 
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-4"
            onClick={() => setOverlayIndex(null)}
          >
            <X size={32} />
          </button>

          <button 
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-4 z-10 hidden md:block"
            onClick={handlePrev}
          >
            <ChevronLeft size={48} />
          </button>

          <button 
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-4 z-10 hidden md:block"
            onClick={handleNext}
          >
            <ChevronRight size={48} />
          </button>

          <div 
            className="max-w-5xl w-full flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative w-full aspect-[4/3] md:aspect-video rounded-[2rem] overflow-hidden shadow-2xl mb-8">
              <img 
                src={awards[overlayIndex].url} 
                className="w-full h-full object-contain bg-slate-900"
                alt={awards[overlayIndex].title}
              />
            </div>
            <div className="text-center">
              <span className="text-red-500 font-black uppercase tracking-widest text-xs mb-2 block">{awards[overlayIndex].year}</span>
              <h3 className="text-white text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">{awards[overlayIndex].title}</h3>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">{awards[overlayIndex].authority}</p>
            </div>
          </div>

          <div className="absolute bottom-8 flex gap-2">
            {awards.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all ${i === overlayIndex ? 'bg-red-600 w-8' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Global Gallery Refactor */}
      <section className="py-24 bg-slate-50 px-4 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter dark:text-white">Moments in Media</h2>
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-[0.2em] mt-2">Visual Chronicles</p>
            </div>
            <div className="hidden md:flex gap-2 text-slate-400">
              <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center dark:border-slate-800"><ChevronLeft size={16} /></div>
              <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center dark:border-slate-800"><ChevronRight size={16} /></div>
            </div>
          </div>

          <div className="flex md:grid md:grid-cols-4 gap-6 overflow-x-auto pb-8 no-scrollbar snap-x snap-mandatory md:overflow-visible">
            {(data.gallery || []).map((item, i) => (
              <div key={i} className="flex-shrink-0 w-[85%] md:w-auto group relative aspect-square bg-slate-200 rounded-[2.5rem] overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all dark:bg-slate-900 snap-center">
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
    </div>
  );
};

// SEO Component
const SEO = ({ tab }) => {
  const titles = {
    home: "Pramu Talks | Official Dr. Prasada Murthy Archive",
    archive: "Pramu Talks | Literary Archive & Work",
    research: "Pramu Talks | Research Lab",
    studio: "Pramu Talks | Creator Studio"
  };

  const descriptions = {
    home: "The digital legacy of Dr. Prasada Murthy. Nandi Award-winning journalist and poet exploring the intersection of literature and social responsibility.",
    archive: "Explore books, essays, and critical reviews by Dr. Prasada Murthy. A comprehensive collection of modern Telugu literature.",
    research: "AI-powered research assistant for deep literary analysis and news grounding using Gemini 3 Flash.",
    studio: "Administrative management portal for the Pramu Talks official archive."
  };

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Dr. Prasada Murthy",
    "jobTitle": ["Journalist", "Poet", "Scholar"],
    "award": "Nandi Award",
    "url": "https://pramu-talks.web.app/",
    "description": descriptions.home,
    "sameAs": [
      "https://www.youtube.com/@pramutalks"
    ]
  };

  return (
    <Helmet>
      <title>{titles[tab] || titles.home}</title>
      <meta name="description" content={descriptions[tab] || descriptions.home} />
      <meta property="og:title" content={titles[tab] || titles.home} />
      <meta property="og:description" content={descriptions[tab] || descriptions.home} />
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [works, setWorks] = useState([]);
  const [topVideos, setTopVideos] = useState(FALLBACK_VIDEOS);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [socialLinks, setSocialLinks] = useState({ youtube: '', twitter: '', facebook: '', instagram: '' });

  const [clickCount, setClickCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);

  // New States
  const [homeData, setHomeData] = useState(DEFAULT_HOME_CONTENT);
  const [systemConfig, setSystemConfig] = useState({ geminiApiKey: '' });
  const [featuredVideos, setFeaturedVideos] = useState(FALLBACK_VIDEOS);
  const [systemStatus, setSystemStatus] = useState({ type: 'online', message: '' });
  const [theme, setTheme] = useState('light');

  const activeApiKey = systemConfig.geminiApiKey || geminiApiKey;

  useEffect(() => {
    const checkTheme = () => {
      const hour = new Date().getHours();
      const isNight = hour >= 18 || hour < 6;
      const newTheme = isNight ? 'dark' : 'light';
      setTheme(newTheme);
      if (isNight) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    checkTheme();
    const interval = setInterval(checkTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth Failed:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const worksRef = collection(db, 'artifacts', appId, 'public', 'data', 'works');
    const worksQuery = query(worksRef, orderBy('sortOrder', 'desc'));
    const worksUnsub = onSnapshot(worksQuery, (snapshot) => {
      const dbWorks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorks(dbWorks);
    });

    // Centralized Sync Listener
    const syncDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'youtube_sync');
    const syncUnsub = onSnapshot(syncDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.videos) setTopVideos(data.videos);
      }
    });

    // Social Links Sync
    const socialRef = doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'social_config');
    const socialUnsub = onSnapshot(socialRef, (snap) => {
      if (snap.exists()) setSocialLinks(snap.data());
    });

    // System Config Sync
    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'system_config');
    const configUnsub = onSnapshot(configRef, (snap) => {
      if (snap.exists()) setSystemConfig(snap.data());
    });

    // Home Content Sync
    const homeRef = doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'home_content');
    const homeUnsub = onSnapshot(homeRef, (snap) => {
      if (snap.exists()) setHomeData({ ...DEFAULT_HOME_CONTENT, ...snap.data() });
    });

    // Featured Videos Sync
    const videoRef = doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'featured_videos');
    const videoUnsub = onSnapshot(videoRef, (snap) => {
      if (snap.exists() && snap.data().videos) setFeaturedVideos(snap.data().videos);
    });

    return () => { worksUnsub(); syncUnsub(); socialUnsub(); configUnsub(); homeUnsub(); videoUnsub(); };
  }, [user]);

  const handleLogout = () => {
    setIsAdmin(false);
    setActiveTab('home');
    setIsMenuOpen(false);
  };

  const copyUid = async () => {
    if (user?.uid) {
      try {
        await navigator.clipboard.writeText(user.uid);
        setCopiedUid(true);
        setTimeout(() => setCopiedUid(false), 2000);
      } catch (err) {
        // Fallback for older browsers or restricted contexts
        const el = document.createElement('textarea');
        el.value = user.uid;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopiedUid(true);
        setTimeout(() => setCopiedUid(false), 2000);
      }
    }
  };

  const fetchTopVideos = async (retries = 0) => {
    setIsVideoLoading(true);
    if (!activeApiKey) {
      setIsVideoLoading(false);
      return;
    }
    console.log("🎬 Syncing with @pramutalks YouTube channel...");
    const prompt = "Search for YouTube channel '@pramutalks'. Find the top 6 most popular/recent videos. Return the results ONLY as a JSON array of objects with keys: id, title, thumbnail, url. Do not include any other text.";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${activeApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ "google_search_retrieval": { "dynamic_retrieval_config": { "mode": "MODE_DYNAMIC", "dynamic_threshold": 0.3 } } }]
        })
      });
      clearTimeout(timeoutId);
      const result = await response.json();

      if (result.error) {
        if (result.error.code === 429 || result.error.status === 'RESOURCE_EXHAUSTED') {
          setSystemStatus({ type: 'warning', message: 'API limits reached. AI features are in manual mode.' });
        } else if (result.error.code === 401) {
          setSystemStatus({ type: 'error', message: 'Invalid API Key. Please update in System Settings.' });
        }
        console.error("YouTube Sync API Error:", result.error.message);
        throw new Error(result.error.message);
      }
      setSystemStatus({ type: 'online', message: '' });

      let text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const jsonStart = text.indexOf('[');
        const jsonEnd = text.lastIndexOf(']') + 1;
        if (jsonStart !== -1) {
          const videoData = JSON.parse(text.substring(jsonStart, jsonEnd));
          if (Array.isArray(videoData) && videoData.length > 0) {
            // Save to Firestore Cache
            const syncDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'youtube_sync');
            await setDoc(syncDocRef, { videos: videoData, lastUpdated: new Date().toISOString() });
            console.log("✅ YouTube Sync Success: Cached", videoData.length, "videos in Firestore.");
          }
        } else {
          console.warn("YouTube Sync: AI response did not contain a valid JSON array.");
        }
      }
    } catch (error) {
      console.error("YouTube Sync Failed:", error.message);
    } finally {
      setIsVideoLoading(false);
    }
  };

  const clickTimerRef = useRef(null);
  const handleInitializeSort = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'works'), orderBy('createdAt', 'asc')));
      let count = 0;
      for (const d of snapshot.docs) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'works', d.id), { sortOrder: count++ });
      }
      alert("Sort order initialized successfully!");
    } catch (error) {
      console.error("Error initializing sort order:", error);
      alert("Failed to initialize sort order.");
    }
  };

  const handleReorderWorks = async (newWorks) => {
    try {
      const batch = writeBatch(db);
      newWorks.forEach((work, idx) => {
        const reversedIdx = newWorks.length - 1 - idx;
        const workRef = doc(db, 'artifacts', appId, 'public', 'data', 'works', work.id);
        batch.update(workRef, { sortOrder: reversedIdx });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error saving new order:", error);
    }
  };

  const handleMoveWork = () => { }; // No longer used

  const handleLogoClick = () => {
    setActiveTab('home');
    setClickCount(prev => {
      const next = prev + 1;
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

      if (next >= 3) {
        setShowLoginModal(true);
        return 0;
      }

      clickTimerRef.current = setTimeout(() => setClickCount(0), 1000);
      return next;
    });
  };


  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (passkey === 'pramu123') {
      setIsAdmin(true);
      setShowLoginModal(false);
      setPasskey('');
    } else {
      setLoginError(true);
    }
  };

  const handleAddWork = async (data) => {
    try {
      const worksRef = collection(db, 'artifacts', appId, 'public', 'data', 'works');
      const nextOrder = works.length > 0 ? Math.max(...works.map(w => w.sortOrder || 0), -1) + 1 : 0;
      await addDoc(worksRef, { ...data, sortOrder: nextOrder, createdAt: new Date().toISOString() });
      return { success: true };
    } catch (error) {
      console.error("Error adding work:", error);
      return { success: false, error: error.message };
    }
  };

  const handleUpdateWork = async (id, data) => {
    try {
      if (id.startsWith('s')) {
        setWorks(works.map(w => w.id === id ? { ...w, ...data } : w));
      } else {
        const workDoc = doc(db, 'artifacts', appId, 'public', 'data', 'works', id);
        await updateDoc(workDoc, data);
      }
      return { success: true };
    } catch (error) {
      console.error("Error updating work:", error);
      return { success: false, error: error.message };
    }
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'works', id));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-red-100 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
      <SEO tab={activeTab} />
      {systemStatus.message && (
        <div className={`fixed top-16 left-0 right-0 z-[60] px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top duration-300 ${systemStatus.type === 'error' ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-900'}`}>
          <span className="flex items-center justify-center gap-2"><AlertCircle size={12} /> {systemStatus.message}</span>
        </div>
      )}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 z-50 dark:bg-slate-900/90 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handleLogoClick}>
              <div className="bg-red-600 p-2 rounded-xl shadow-lg active:scale-95 transition-transform dark:bg-red-700">
                <Mic2 className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter leading-none uppercase dark:text-white">Pramu Talks</h1>
                <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest leading-none mt-1 dark:text-red-500">Official Archive</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              {[
                { id: 'home', label: 'Home', icon: Home },
                { id: 'works', label: 'Archive', icon: Library },
                { id: 'studio', label: 'Studio', icon: Settings, admin: true },
                { id: 'research', label: 'Research', icon: Database, admin: true },
              ].filter(item => !item.admin || isAdmin).map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 text-sm font-bold transition-all ${activeTab === item.id ? 'text-red-600' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {item.admin && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-1 text-white" />}
                </button>
              ))}
              {isAdmin && <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Lock & Logout"><Lock size={16} /></button>}
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 dark:text-white">{isMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 animate-in slide-in-from-top duration-300 dark:bg-slate-900/95 dark:border-slate-800">
            <div className="px-4 pt-2 pb-6 space-y-1">
              {[
                { id: 'home', label: 'Home', icon: Home },
                { id: 'works', label: 'Archive', icon: Library },
                { id: 'studio', label: 'Studio', icon: Settings, admin: true },
                { id: 'research', label: 'Research', icon: Database, admin: true },
              ].filter(item => !item.admin || isAdmin).map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMenuOpen(false); }}
                  className={`flex items-center gap-4 w-full p-4 rounded-2xl text-base font-bold transition-all ${activeTab === item.id ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-500' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5'}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.admin && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                </button>
              ))}
              {isAdmin && (
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="flex items-center gap-4 w-full p-4 rounded-2xl text-slate-400 hover:text-red-600 text-base font-black uppercase tracking-widest transition-all"
                >
                  <Lock size={20} />
                  System Lock
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter dark:text-white"><Key className="text-red-600" /> Access Portal</h3>
              <button onClick={() => setShowLoginModal(false)} className="dark:text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-4 mb-6">
              <input autoFocus type="password" placeholder="Passkey" className={`w-full p-4 bg-slate-50 rounded-2xl border-2 outline-none font-bold dark:bg-slate-950 dark:border-slate-800 ${loginError ? 'border-red-500' : 'border-slate-100 focus:border-red-600'}`} value={passkey} onChange={e => { setPasskey(e.target.value); setLoginError(false); }} />
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-all">Unlock</button>
            </form>
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><Fingerprint size={12} /> Admin Identity (UID)</p>
              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100 group dark:bg-slate-950 dark:border-slate-800">
                <code className="text-[9px] font-bold text-slate-500 truncate w-48">{user?.uid || "Connecting..."}</code>
                <button onClick={copyUid} className="p-1.5 hover:bg-white rounded-lg text-slate-400 dark:hover:bg-slate-900">{copiedUid ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-16">
        {activeTab === 'home' && <HomeView setActiveTab={setActiveTab} data={homeData} works={works} setSelectedWork={setSelectedWork} />}
        {activeTab === 'works' && !selectedWork && <ArchiveView works={works.filter(w => filter === 'all' || [].concat(w.type).includes(filter))} isAdmin={isAdmin} onDelete={handleDelete} setFilter={setFilter} currentFilter={filter} onSelect={setSelectedWork} />}
        {activeTab === 'works' && selectedWork && <WorkDetailView work={selectedWork} onBack={() => setSelectedWork(null)} />}
        {/* {activeTab === 'videos' && <VideosView works={featuredVideos} />} */}
        {activeTab === 'studio' && isAdmin && (
          <CreatorStudio
            onAdd={handleAddWork}
            onUpdate={handleUpdateWork}
            works={works}
            onDelete={handleDelete}
            isVideoLoading={isVideoLoading}
            onSync={fetchTopVideos}
            socialLinks={socialLinks}
            homeData={homeData}
            systemConfig={systemConfig}
            db={db}
            appId={appId}
            featuredVideos={featuredVideos}
            user={user}
            onCopyUid={copyUid}
            copiedUid={copiedUid}
            onInitializeSort={handleInitializeSort}
            onReorder={handleReorderWorks}
          />
        )}
        {activeTab === 'research' && isAdmin && <ResearchLab apiKey={activeApiKey} />}
      </div>
      <Footer socials={socialLinks} />
    </div>
  );
};


const WorkDetailView = ({ work, onBack }) => {
  const workTypes = [].concat(work.type);
  const isLandscapeMedia = (workTypes.includes('review') || workTypes.includes('audiobook')) && (
    (work.youtubeLink && (work.youtubeLink.includes('youtube.com') || work.youtubeLink.includes('youtu.be'))) ||
    (work.link && (work.link.includes('youtube.com') || work.link.includes('youtu.be')))
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-20 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-red-600 font-black uppercase tracking-widest text-[10px] mb-12 transition-all active:scale-95">
        <ChevronLeft size={16} /> Back to Archive
      </button>

      <div className="grid md:grid-cols-2 gap-16 items-start">
        <div className="space-y-8">
          <div className={`${isLandscapeMedia ? 'aspect-video' : 'aspect-[3/4]'} bg-slate-100 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white dark:bg-slate-900 dark:border-slate-800 relative`}>
            <img src={work.thumbnail || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800'} className="w-full h-full object-cover" alt={work.title} />
            <div className="absolute top-6 left-6 px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">
              {[].concat(work.type).join(' / ')}
            </div>
          </div>

          {work.rating && workTypes.includes('review') && (
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex text-amber-500 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill={i < parseInt(work.rating) ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-amber-900 font-black uppercase tracking-widest text-xs dark:text-amber-500">{work.rating}/5 Critic Score</span>
              </div>
              <p className="text-[10px] text-amber-700 font-bold dark:text-amber-600/80 uppercase tracking-tight">Official analysis from the Pramu Talks Research Lab.</p>
            </div>
          )}
        </div>

        <div className="space-y-10">
          <div>
            <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9] mb-6 dark:text-white lg:text-6xl">{work.title}</h2>
            <div className="flex flex-wrap gap-4 items-center">
              {work.pubYear && <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-400"><Calendar className="inline mr-2" size={12} /> {work.pubYear}</div>}
              {work.magazine && <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest dark:bg-red-900/10 dark:text-red-500"><Newspaper className="inline mr-2" size={12} /> {work.magazine}</div>}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 border-b border-red-600/10 pb-2">Full Summary & Synthesis</h4>
            <p className="text-lg text-slate-600 leading-relaxed font-medium dark:text-slate-300">{work.brief || "No summary provided for this archive entry."}</p>
          </div>

          {work.awards && (
            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group">
              <Award className="text-amber-500 mb-4 transition-transform group-hover:scale-110" size={32} />
              <h4 className="font-black uppercase tracking-tighter text-xl mb-2">Recognition</h4>
              <p className="text-slate-400 text-sm leading-relaxed">{work.awards}</p>
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[40px] rounded-full" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {work.pdfUrl && (
              <a href={work.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 bg-red-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all active:scale-95 shadow-xl shadow-red-600/20">
                <FileText size={18} /> Read PDF
              </a>
            )}
            {work.audioUrl && (
              <a href={work.audioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-black transition-all active:scale-95 dark:bg-slate-800">
                <Headphones size={18} /> Listen
              </a>
            )}
            {work.purchaseLink && (
              <a href={work.purchaseLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 bg-white text-slate-900 border-2 border-slate-900 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all active:scale-95 dark:border-white dark:bg-transparent dark:text-white dark:hover:bg-white/10">
                <ShoppingCart size={18} /> Buy Copy
              </a>
            )}
            {(work.link || work.youtubeLink) && !work.pdfUrl && !work.audioUrl && (
              <a href={work.link || work.youtubeLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 bg-slate-100 text-slate-900 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all active:scale-95 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
                <Globe size={18} /> Visit Link
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ArchiveView = ({ works, isAdmin, onDelete, setFilter, currentFilter, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWorks = works.filter(work => {
    const s = searchTerm.toLowerCase();
    return work.title.toLowerCase().includes(s) ||
      (work.pubYear && work.pubYear.toString().includes(s)) ||
      (work.magazine && work.magazine.toLowerCase().includes(s)) ||
      (work.type && work.type.toString().toLowerCase().includes(s));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 animate-in slide-in-from-bottom-6 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
        <div className="flex flex-wrap gap-2 items-center">
          {['all', 'book', 'essay', 'story', 'review', 'audiobook'].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} className={`px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all border ${currentFilter === cat ? 'bg-red-600 text-white border-red-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-600'}`}>{cat}</button>
          ))}
        </div>

        <div className="relative w-full md:w-72 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={16} />
          <input
            type="text"
            placeholder="Search by title, year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-xs font-bold outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredWorks.map(work => {
          const workTypes = [].concat(work.type);
          const isLandscape = (workTypes.includes('review') || workTypes.includes('audiobook')) && (
            (work.youtubeLink && (work.youtubeLink.includes('youtube.com') || work.youtubeLink.includes('youtu.be'))) ||
            (work.link && (work.link.includes('youtube.com') || work.link.includes('youtu.be')))
          );

          return (
            <div key={work.id} onClick={() => onSelect(work)} className="group bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col dark:bg-slate-900 dark:border-slate-800 cursor-pointer">
              <div className={`${isLandscape ? 'aspect-video' : 'aspect-[4/5]'} bg-slate-100 rounded-[2rem] overflow-hidden relative mb-6 dark:bg-slate-950`}>
                <img src={work.thumbnail || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400'} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt={work.title} />
                <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 dark:text-white">
                  {[].concat(work.type).join(' / ')}
                </div>
                {isAdmin && <button onClick={(e) => { e.stopPropagation(); onDelete(work.id); }} className="absolute top-4 right-4 p-2.5 bg-red-600 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"><Trash2 size={16} /></button>}
              </div>
              <div className="px-3 pb-4 flex-1 flex flex-col">
                <h3 className="font-black text-slate-900 leading-tight line-clamp-2 h-10 mb-2 uppercase text-sm tracking-tight dark:text-white uppercase tracking-tighter">{work.title}</h3>
                <div className="space-y-1 mb-4">
                  {(workTypes.includes('review')) && work.rating && <div className="flex gap-1 text-amber-500"><Star size={10} fill="currentColor" /><span className="text-[9px] font-black">{work.rating}/5 Rating</span></div>}
                  {work.magazine && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter dark:text-slate-500">{work.magazine}</div>}
                  {work.pubYear && <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{work.pubYear}</div>}
                  {work.brief && <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-3 mt-3 leading-relaxed font-medium">{work.brief}</p>}
                </div>
                <div className="mt-auto">
                  {(work.pdfUrl || work.audioUrl || work.link || work.purchaseLink || work.youtubeLink) && (
                    <a href={work.pdfUrl || work.audioUrl || work.link || work.purchaseLink || work.youtubeLink} target="_blank" rel="noopener noreferrer" className="block w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[8px] hover:bg-red-600 transition-colors text-center active:scale-95 dark:bg-slate-800 dark:hover:bg-red-600">
                      {work.pdfUrl ? 'Read PDF' : work.audioUrl ? 'Listen Now' : 'Access Work'}
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const VideosView = ({ works, isLoading }) => (
  <div className="max-w-7xl mx-auto px-4 py-16 animate-in fade-in duration-500">
    <div className="flex items-center gap-6 mb-16">
      <div className="w-16 h-16 bg-red-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-red-600/20 dark:bg-red-700"><YoutubeIcon className="text-white w-8 h-8" /></div>
      <div>
        <h2 className="text-4xl font-black tracking-tight leading-none uppercase tracking-tighter dark:text-white">Trending Now</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] dark:text-slate-500">Curated Playlist</p>
        </div>
      </div>
    </div>

    {/* Manual Playlist Display */}

    <div className="grid md:grid-cols-3 gap-8 mb-16">
      {works.map((video, idx) => (
        <a key={idx} href={video.url} target="_blank" rel="noopener noreferrer" className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl transition-all dark:bg-slate-900 dark:border-slate-800">
          <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-950">
            <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
            <div className="absolute inset-0 bg-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <PlayCircle className="text-white w-12 h-12 drop-shadow-2xl" />
            </div>
          </div>
          <div className="p-8">
            <h3 className="font-black text-lg leading-tight line-clamp-2 group-hover:text-red-600 transition-colors uppercase italic dark:text-white">{video.title}</h3>
          </div>
        </a>
      ))}
    </div>
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] border border-slate-100 text-center space-y-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
      <Video className="w-12 h-12 text-red-600" />
      <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Visit the Official Channel</h3>
      <p className="text-slate-400 font-medium max-w-sm">For the latest updates and full episodes, explore the YouTube hub of Dr. Prasada Murthy.</p>
      <a href="https://www.youtube.com/@pramutalks" target="_blank" rel="noopener noreferrer" className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-all shadow-xl shadow-slate-900/20 active:scale-95 dark:bg-slate-800 dark:hover:bg-red-600">Open YouTube Channel</a>
    </div>
  </div>
);

const Footer = ({ socials }) => (
  <footer className="bg-slate-900 text-white py-24 px-4 overflow-hidden relative dark:bg-black">
    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 relative z-10">
      <div>
        <div className="flex items-center gap-3 mb-8">
          <Mic2 className="text-red-600 w-8 h-8" />
          <h2 className="text-3xl font-black uppercase tracking-tighter">Pramu Talks</h2>
        </div>
        <p className="text-xl text-slate-400 font-medium mb-12 max-w-sm italic tracking-tight dark:text-slate-500">"Literature is not just words on a page; it is the heartbeat of society."</p>
        <div className="flex gap-4">
          {socials.youtube && (
            <a href={socials.youtube} target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 rounded-2xl hover:bg-red-600 transition-all text-white group" title="YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="opacity-90 group-hover:opacity-100"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
          )}
          {socials.twitter && (
            <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 rounded-2xl hover:bg-slate-800 transition-all text-white group" title="X (Twitter)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-90 group-hover:opacity-100"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" /></svg>
            </a>
          )}
          {socials.facebook && (
            <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 rounded-2xl hover:bg-blue-600 transition-all text-white group" title="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="opacity-90 group-hover:opacity-100"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            </a>
          )}
          {socials.instagram && (
            <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 rounded-2xl hover:bg-pink-600 transition-all text-white group" title="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-white transition-colors"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
          )}
        </div>
      </div>
      <div className="flex flex-col md:items-end justify-between">
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 mb-2">Academic & Literary Portal</p>
          <h3 className="text-4xl font-black uppercase tracking-tighter italic lg:text-5xl">Poetry & <span className="text-red-600 underline decoration-white/10 underline-offset-4">Journalism.</span></h3>
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-12 dark:text-slate-600">© 2026 Pramu Talks. Official Dr. Prasada Murthy Archive.</p>
      </div>
    </div>
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 blur-[100px] rounded-full -mr-64 -mt-64" />
  </footer>
);

const InputField = ({ label, name, placeholder, type = "text", value, onChange, id }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{label}</label>
    <input id={id} name={name} className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none shadow-inner text-sm dark:bg-slate-950 dark:text-white" placeholder={placeholder} value={value} onChange={onChange} type={type} />
  </div>
);

const CreatorStudio = ({
  onAdd, onUpdate, works, onDelete, isVideoLoading,
  onSync, socialLinks, homeData, systemConfig, db,
  appId, featuredVideos, user, onCopyUid, copiedUid,
  onInitializeSort, onReorder
}) => {
  const [studioTab, setStudioTab] = useState('archive');
  const [activeTypes, setActiveTypes] = useState(['book']);
  const [managerSearch, setManagerSearch] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [fetchingCount, setFetchingCount] = useState(0);
  const isFetching = isVideoLoading || fetchingCount > 0;
  const startLoading = () => setFetchingCount(prev => prev + 1);
  const stopLoading = () => setFetchingCount(prev => Math.max(0, prev - 1));
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '', thumbnail: '', brief: '', pubYear: '', pubMonth: '',
    purchaseLink: '', awards: '', link: '', magazine: '',
    sourceName: '', availableAt: '', rating: '', youtubeLink: '', bookLink: '',
    pdfUrl: '', audioUrl: ''
  });

  const [homeForm, setHomeForm] = useState(homeData);
  const [systemForm, setSystemForm] = useState(systemConfig);
  const [uploadingItem, setUploadingItem] = useState(null);
  const [successItem, setSuccessItem] = useState(null);

  useEffect(() => { setHomeForm(homeData); }, [homeData]);
  useEffect(() => { setSystemForm(systemConfig); }, [systemConfig]);

  // --- Drag and Drop Handlers ---
  const handleGenericDragStart = (e, index, type) => {
    e.dataTransfer.setData('draggedIndex', index);
    e.dataTransfer.setData('draggedType', type);
    e.currentTarget.classList.add('opacity-40');
  };

  const handleGenericDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-40');
  };

  const handleGenericDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-red-50', 'dark:bg-red-900/10', 'ring-2', 'ring-red-500/20');
  };

  const handleGenericDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-red-50', 'dark:bg-red-900/10', 'ring-2', 'ring-red-500/20');
  };

  const handleGenericDrop = (e, targetIndex, type) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-red-50', 'dark:bg-red-900/10', 'ring-2', 'ring-red-500/20');

    const draggedIndexString = e.dataTransfer.getData('draggedIndex');
    const draggedType = e.dataTransfer.getData('draggedType');

    if (!draggedIndexString || draggedType !== type) return;
    const draggedIndex = parseInt(draggedIndexString);
    if (draggedIndex === targetIndex) return;

    const listKey = type === 'award' ? 'awardsGallery' : 'gallery';
    const newList = [...(homeForm[listKey] || [])];
    const [movedItem] = newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, movedItem);

    setHomeForm({ ...homeForm, [listKey]: newList });
  };

  const uploadImage = async (file, folder) => {
    startLoading();
    
    return new Promise((resolve, reject) => {
      const cleanup = () => stopLoading();
      
      // Safety timeout (45 seconds - increased for larger files)
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Upload timed out after 45 seconds. Please try a smaller file or check your connection."));
      }, 45000);

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Optimized Resizing (1600px max)
            const MAX_DIM = 1600; 
            if (width > height) {
              if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
            } else {
              if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // High-quality downscaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to Blob with 0.85 quality (Great balance of size/quality)
            canvas.toBlob(async (blob) => {
              if (!blob) { 
                clearTimeout(timeout);
                cleanup();
                reject(new Error("Failed to process image blob.")); 
                return; 
              }
              
              try {
                // Sanitize filename
                const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
                const fileName = `${Date.now()}_${safeName}`;
                const storageRef = ref(storage, `artifacts/${appId}/images/${folder}/${fileName}`);
                
                const snapshot = await uploadBytes(storageRef, blob);
                const url = await getDownloadURL(snapshot.ref);
                
                clearTimeout(timeout);
                cleanup();
                resolve(url);
              } catch (err) {
                console.error("Firebase Storage Error:", err);
                clearTimeout(timeout);
                cleanup();
                reject(err);
              }
            }, 'image/jpeg', 0.85);
          } catch (err) {
            clearTimeout(timeout);
            cleanup();
            reject(err);
          }
        };
        img.onerror = () => {
          clearTimeout(timeout);
          cleanup();
          reject(new Error("The image file is corrupted or not a valid format."));
        };
        img.src = event.target.result;
      };
      reader.onerror = () => {
        clearTimeout(timeout);
        cleanup();
        reject(new Error("Failed to read the file."));
      };
      reader.readAsDataURL(file);
    });
  };

  const apiKey = systemConfig.geminiApiKey || geminiApiKey;

  const extractYTThumbnail = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://i.ytimg.com/vi/${match[2]}/maxresdefault.jpg` : '';
  };

  useEffect(() => {
    const thumb = extractYTThumbnail(form.link || form.youtubeLink || '');
    if (thumb && thumb !== form.thumbnail) setForm(prev => ({ ...prev, thumbnail: thumb }));
  }, [form.link, form.youtubeLink]);

  const fetchMetadataFromLink = async () => {
    const targetUrl = form.link || form.purchaseLink || form.youtubeLink;
    if (!targetUrl || !apiKey) return;
    startLoading();
    const prompt = `Visit URL: ${targetUrl}. Extract featured image URL and headline. Return raw JSON with keys: title, image_url.`;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ "google_search_retrieval": { "dynamic_retrieval_config": { "mode": "MODE_DYNAMIC", "dynamic_threshold": 0.3 } } }]
        })
      });
      const result = await response.json();
      const data = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text);
      setForm(prev => ({ ...prev, title: data.title || prev.title, thumbnail: data.image_url || prev.thumbnail }));
    } catch (err) { console.error("Sync failed:", err); } finally { stopLoading(); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    startLoading();

    // Clean data based on type
    const cleanedData = { ...form, type: activeTypes };
    if (!activeTypes.includes('review')) delete cleanedData.rating;

    let result;
    if (editingId) {
      result = await onUpdate(editingId, cleanedData);
    } else {
      result = await onAdd(cleanedData);
    }

    stopLoading();
    if (result && result.success) {
      setEditingId(null);
      setForm({ title: '', thumbnail: '', brief: '', pubYear: '', pubMonth: '', purchaseLink: '', awards: '', link: '', magazine: '', sourceName: '', availableAt: '', rating: '', youtubeLink: '', bookLink: '', pdfUrl: '', audioUrl: '' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      alert(`Failed to save: ${result?.error || 'Unknown error'}`);
    }
  };

  const handleHomeSubmit = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'home_content'), homeForm);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Firestore Save Error:", err);
      if (err.code === 'permission-denied') {
        alert("Error: Permission denied. Please check if you are logged in as admin.");
      } else if (err.message && err.message.includes("too large")) {
        alert("Error: Total page data is too large for Firestore (1MB limit). Please reduce the number of high-res images in the gallery.");
      } else {
        alert(`Failed to save: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const handleSystemSubmit = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'system_config'), systemForm);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Firestore Save Error:", err);
      alert(`Failed to save system config: ${err.message || 'Unknown error'}`);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSizeMap = {
      'pdf': 10 * 1024 * 1024, // 10MB
      'audio': 20 * 1024 * 1024 // 20MB
    };

    if (file.size > maxSizeMap[type]) {
      alert(`File too large! Max limit for ${type.toUpperCase()} is ${maxSizeMap[type] / (1024 * 1024)}MB to comply with system limits.`);
      return;
    }

    startLoading();
    try {
      const storageRef = ref(storage, `artifacts/${appId}/${type}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      if (type === 'pdf') setForm(prev => ({ ...prev, pdfUrl: url }));
      else if (type === 'audio') setForm(prev => ({ ...prev, audioUrl: url }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please check your connection.");
    } finally {
      stopLoading();
    }
  };

  const types = [
    { id: 'book', label: 'Book', icon: Book },
    { id: 'essay', label: 'Essay/Article', icon: Newspaper },
    { id: 'story', label: 'Story', icon: PenTool },
    { id: 'review', label: 'Review', icon: Star },
    { id: 'audiobook', label: 'Audiobook', icon: Headphones }
  ];

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 space-y-12 animate-in zoom-in-95 duration-300">
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
        {[
          { id: 'archive', label: 'Archive Studio', icon: Library },
          { id: 'home', label: 'Home Editor', icon: Home },
          { id: 'video', label: 'Video Manager', icon: Video },
          { id: 'system', label: 'System Settings', icon: Cpu }
        ].map(tab => (
          <button key={tab.id} onClick={() => setStudioTab(tab.id)} className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap shadow-sm border ${studioTab === tab.id ? 'bg-red-600 text-white border-red-600 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {studioTab === 'video' && (
        <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-14 border border-slate-100 relative overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          {showSuccess && <div className="absolute top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-xs animate-in slide-in-from-right">Playlist Updated</div>}
          <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4 mb-4 dark:text-white"><Video className="text-red-600" /> Video Manager</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-10">Curate featured videos for the Trending Now section.</p>

          <div className="space-y-12">
            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 dark:bg-slate-950 dark:border-slate-800 shadow-inner">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 mb-8 border-b border-red-600/10 pb-4">New Featured Video</h3>
              <div className="grid md:grid-cols-2 gap-8 items-end">
                <div className="space-y-6">
                  <InputField label="Video Title" placeholder="e.g. Revolutionary Poetry Analysis" id="new-video-title" />
                  <InputField label="YouTube URL" placeholder="https://youtube.com/watch?v=..." id="new-video-url" />
                </div>
                <button onClick={async () => {
                  const title = document.getElementById('new-video-title').value;
                  const url = document.getElementById('new-video-url').value;
                  if (!title || !url) return;
                  const thumb = extractYTThumbnail(url);
                  const newVideo = { id: Date.now().toString(), title, url, thumbnail: thumb || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600' };
                  const updated = [...featuredVideos, newVideo];
                  await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'featured_videos'), { videos: updated });
                  document.getElementById('new-video-title').value = '';
                  document.getElementById('new-video-url').value = '';
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3000);
                }} className="bg-slate-900 text-white h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg">
                  <Plus size={16} /> Add to Playlist
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVideos.map(vid => (
                <div key={vid.id} className="group bg-slate-50 rounded-[2.5rem] p-4 border border-slate-100 dark:bg-slate-950 dark:border-slate-800 transition-all hover:shadow-xl">
                  <div className="aspect-video bg-slate-200 rounded-[1.5rem] overflow-hidden mb-4 relative">
                    <img src={vid.thumbnail} className="w-full h-full object-cover" />
                    <button onClick={async () => {
                      const updated = featuredVideos.filter(v => v.id !== vid.id);
                      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'featured_videos'), { videos: updated });
                    }} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h4 className="font-black text-xs uppercase tracking-tighter line-clamp-2 dark:text-white">{vid.title}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {studioTab === 'archive' && (
        <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-14 border border-slate-100 relative overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          {showSuccess && <div className="absolute top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-xs animate-in slide-in-from-right">Archive Updated</div>}
          <div className="flex flex-wrap gap-2 mb-10 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {types.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    const current = [...activeTypes];
                    if (current.includes(t.id)) {
                      if (current.length > 1) setActiveTypes(current.filter(id => id !== t.id));
                    } else {
                      setActiveTypes([...current, t.id]);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black uppercase tracking-widest text-[8px] transition-all ${activeTypes.includes(t.id) ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-400'}`}
                >
                  <t.icon size={12} /> {t.label}
                </button>
              ))}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="aspect-[4/3] rounded-[2rem] bg-slate-100 overflow-hidden relative group border-2 border-slate-50 shadow-inner dark:bg-slate-950 dark:border-slate-800">
                  {form.thumbnail ? <img src={form.thumbnail} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-300"><ImageIcon size={48} /><p className="text-[10px] font-black uppercase mt-2">Preview Area</p></div>}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button type="button" onClick={() => fileInputRef.current.click()} className="p-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase">Upload</button>
                    <button type="button" onClick={fetchMetadataFromLink} disabled={isFetching} className="p-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase">Sync</button>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setUploadingItem('work-thumb');
                    try {
                      const url = await uploadImage(file, 'works');
                      setForm(f => ({ ...f, thumbnail: url }));
                      setSuccessItem('work-thumb');
                      setTimeout(() => setSuccessItem(null), 3000);
                    } catch (err) {
                      alert("Thumbnail upload failed.");
                    } finally {
                      setUploadingItem(null);
                    }
                  }} />
                </div>
                <InputField label="Primary URL (Content Link)" name="link" placeholder="YouTube or Article URL" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} />
                <InputField label="Work Title" name="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-6">
                {activeTypes.includes('book') && <>
                  <InputField label="Publishing Year" name="pubYear" value={form.pubYear} onChange={e => setForm({ ...form, pubYear: e.target.value })} />
                  <InputField label="Purchase Link" name="purchaseLink" value={form.purchaseLink} onChange={e => setForm({ ...form, purchaseLink: e.target.value })} />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">PDF Upload (Max 10MB)</label>
                    <div className="flex gap-2">
                      <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 'pdf')} className="hidden" id="pdf-upload" />
                      <button type="button" onClick={() => document.getElementById('pdf-upload').click()} className="flex-1 p-4 bg-slate-100 rounded-2xl border-none font-bold text-xs dark:bg-slate-950 dark:text-white flex items-center justify-center gap-2">
                        {isFetching ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} {form.pdfUrl ? 'Update PDF' : 'Upload PDF'}
                      </button>
                      {form.pdfUrl && <div className="p-4 bg-green-500/10 text-green-500 rounded-2xl flex items-center px-4"><CheckCircle2 size={14} /></div>}
                    </div>
                  </div>
                  <InputField label="Awards" name="awards" value={form.awards} onChange={e => setForm({ ...form, awards: e.target.value })} />
                </>}
                {(activeTypes.includes('essay') || activeTypes.includes('story')) && <><InputField label="Magazine / Website" name="magazine" value={form.magazine} onChange={e => setForm({ ...form, magazine: e.target.value })} /><InputField label="Pub Date" name="pubYear" value={form.pubYear} onChange={e => setForm({ ...form, pubYear: e.target.value })} /></>}
                {activeTypes.includes('review') && <>
                  <InputField label="Source Name" name="sourceName" value={form.sourceName} onChange={e => setForm({ ...form, sourceName: e.target.value })} />
                  <InputField label="Publish Date" name="pubYear" value={form.pubYear} onChange={e => setForm({ ...form, pubYear: e.target.value })} />
                  <InputField label="Rating (1-5)" name="rating" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} />
                  <InputField label="Video Link" name="youtubeLink" value={form.youtubeLink} onChange={e => setForm({ ...form, youtubeLink: e.target.value })} />
                </>}
                {activeTypes.includes('audiobook') && <>
                  <InputField label="Narrator / Author" name="sourceName" value={form.sourceName} onChange={e => setForm({ ...form, sourceName: e.target.value })} />
                  <InputField label="Publish Date" name="pubYear" value={form.pubYear} onChange={e => setForm({ ...form, pubYear: e.target.value })} />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Audio Upload (Max 20MB)</label>
                    <div className="flex gap-2">
                      <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'audio')} className="hidden" id="audio-upload" />
                      <button type="button" onClick={() => document.getElementById('audio-upload').click()} className="flex-1 p-4 bg-slate-100 rounded-2xl border-none font-bold text-xs dark:bg-slate-950 dark:text-white flex items-center justify-center gap-2">
                        {isFetching ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} {form.audioUrl ? 'Update Audio' : 'Upload Audio'}
                      </button>
                      {form.audioUrl && <div className="p-4 bg-green-500/10 text-green-500 rounded-2xl flex items-center px-4"><CheckCircle2 size={14} /></div>}
                    </div>
                  </div>
                </>}
                <textarea className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none h-32 shadow-inner text-sm dark:bg-slate-950 dark:text-white" placeholder="Summary..." value={form.brief || ''} onChange={e => setForm({ ...form, brief: e.target.value })} />
                <InputField label="Manual Thumbnail URL" name="thumbnail" value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-4">
              {editingId && <button type="button" onClick={() => setEditingId(null)} className="flex-1 bg-slate-100 text-slate-500 py-6 rounded-[2rem] font-black text-xs">Cancel</button>}
              <button type="submit" disabled={isFetching} className="flex-[2] bg-red-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 shadow-2xl shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {isFetching ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                {isFetching ? (editingId ? 'Updating...' : 'Publishing...') : (editingId ? 'Update Entry' : 'Publish Live')}
              </button>
            </div>
          </form>
        </div>
      )}

      {studioTab === 'home' && (
        <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-14 border border-slate-100 relative overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          {showSuccess && <div className="absolute top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-xs animate-in slide-in-from-right">Home Updated</div>}
          <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4 mb-4 dark:text-white"><Home className="text-red-600" /> Home Editor</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-10">Manage landing page strings and infrequent media links.</p>

          <form onSubmit={handleHomeSubmit} className="space-y-12">
            <div className="space-y-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-red-600 pb-2 border-b border-red-600/10">Hero Section</h3>
              <div className="grid md:grid-cols-3 gap-8">
                <InputField label="Badge Text" value={homeForm.heroBadge} onChange={e => setHomeForm({ ...homeForm, heroBadge: e.target.value })} />
                <InputField label="Watch Channel Link" value={homeForm.watchChannelLink} onChange={e => setHomeForm({ ...homeForm, watchChannelLink: e.target.value })} />
                <InputField label="Hero Background URL" value={homeForm.heroBgUrl} onChange={e => setHomeForm({ ...homeForm, heroBgUrl: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Hero Headline (Use **text** for Red underline)</label>
                <input className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none shadow-inner text-sm dark:bg-slate-950 dark:text-white" value={homeForm.heroTitle} onChange={e => setHomeForm({ ...homeForm, heroTitle: e.target.value })} />
              </div>
              <textarea className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none h-32 shadow-inner text-sm dark:bg-slate-950 dark:text-white" placeholder="Hero Subtitle..." value={homeForm.heroSubtitle} onChange={e => setHomeForm({ ...homeForm, heroSubtitle: e.target.value })} />
            </div>

            <div className="space-y-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-red-600 pb-2 border-b border-red-600/10">Philosophy & Moments</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <InputField label="Philosophy Title" value={homeForm.philosophyTitle} onChange={e => setHomeForm({ ...homeForm, philosophyTitle: e.target.value })} />
                <InputField label="Philosophy Accent (Telugu)" value={homeForm.philosophyAccent} onChange={e => setHomeForm({ ...homeForm, philosophyAccent: e.target.value })} />
              </div>
              <InputField label="Philosophy Quote" value={homeForm.philosophyQuote} onChange={e => setHomeForm({ ...homeForm, philosophyQuote: e.target.value })} />
              <textarea className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none h-32 shadow-inner text-sm dark:bg-slate-950 dark:text-white" placeholder="Philosophy details..." value={homeForm.philosophyText} onChange={e => setHomeForm({ ...homeForm, philosophyText: e.target.value })} />

              <h3 className="text-xs font-black uppercase tracking-widest text-red-600 pb-2 border-b border-red-600/10">Academic Roots</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Education Background (Markdown)</label>
                  <textarea className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none h-32 shadow-inner text-sm dark:bg-slate-950 dark:text-white" value={homeForm.rootsEducation || ''} onChange={e => setHomeForm({ ...homeForm, rootsEducation: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Literature Experience (Markdown)</label>
                  <textarea className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none h-32 shadow-inner text-sm dark:bg-slate-950 dark:text-white" value={homeForm.rootsLiterature || ''} onChange={e => setHomeForm({ ...homeForm, rootsLiterature: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Media Experience (Markdown)</label>
                  <textarea className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none h-32 shadow-inner text-sm dark:bg-slate-950 dark:text-white" value={homeForm.rootsExperience || ''} onChange={e => setHomeForm({ ...homeForm, rootsExperience: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Featured Work (Education Link)</label>
                  <select className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none shadow-inner text-sm dark:bg-slate-950 dark:text-white" value={homeForm.featuredWorkId || ''} onChange={e => setHomeForm({ ...homeForm, featuredWorkId: e.target.value })}>
                    <option value="">Select a work to link...</option>
                    {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
                  </select>
                </div>
              </div>


            </div>

            <div className="space-y-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-red-600 pb-2 border-b border-red-600/10">Awards & Honors Highlights</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <InputField label="Nandi Awardee Image URL" value={homeForm.nandiImageUrl || ''} onChange={e => setHomeForm({ ...homeForm, nandiImageUrl: e.target.value })} />
                  <input type="file" accept="image/*" className="hidden" id="nandi-upload-input" onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                      const url = await uploadImage(file, 'home');
                      setHomeForm(prev => ({ ...prev, nandiImageUrl: url }));
                      e.target.value = '';
                    } catch (err) {
                      alert("Image upload failed.");
                    }
                  }} />
                  <button 
                    type="button" 
                    onClick={() => document.getElementById('nandi-upload-input').click()} 
                    disabled={uploadingItem === 'nandi'}
                    className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${successItem === 'nandi' ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-950 dark:text-white hover:bg-slate-200'} disabled:opacity-50`}
                  >
                    {uploadingItem === 'nandi' ? <Loader2 size={12} className="animate-spin" /> : (successItem === 'nandi' ? <Check size={12} /> : null)}
                    {uploadingItem === 'nandi' ? 'Uploading...' : (successItem === 'nandi' ? 'Upload Complete' : 'Upload Nandi Photo')}
                  </button>
                </div>
                <div className="space-y-4">
                  <InputField label="Nandi Highlight Title" value={homeForm.nandiTitle || ''} onChange={e => setHomeForm({ ...homeForm, nandiTitle: e.target.value })} />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nandi Highlight Text</label>
                    <textarea 
                      className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none h-24 shadow-inner text-sm dark:bg-slate-950 dark:text-white" 
                      value={homeForm.nandiText || ''} 
                      onChange={e => setHomeForm({ ...homeForm, nandiText: e.target.value })} 
                      placeholder="Enter award description..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex justify-between items-end pb-2 border-b border-red-600/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-red-600">Awards Gallery Manager</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{(homeForm.awardsGallery || []).length} Awards</p>
              </div>

              <div className="space-y-4">
                {(homeForm.awardsGallery || []).map((award, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => handleGenericDragStart(e, idx, 'award')}
                    onDragEnd={handleGenericDragEnd}
                    onDragOver={handleGenericDragOver}
                    onDragLeave={handleGenericDragLeave}
                    onDrop={(e) => handleGenericDrop(e, idx, 'award')}
                    className="group flex flex-col md:flex-row gap-6 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 dark:bg-slate-950 dark:border-slate-800 relative transition-all hover:shadow-lg cursor-grab active:cursor-grabbing"
                  >
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                      <MoveVertical size={20} />
                    </div>
                    <div className="w-full md:w-32 aspect-square bg-slate-200 rounded-2xl overflow-hidden relative flex-shrink-0">
                      {award.url ? <img src={award.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon size={24} /></div>}
                      <button type="button" onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file'; input.accept = 'image/*';
                        input.onchange = async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          setUploadingItem(`award-${idx}`);
                          try {
                            const url = await uploadImage(file, 'awards');
                            const next = [...homeForm.awardsGallery];
                            next[idx] = { ...next[idx], url: url };
                            setHomeForm({ ...homeForm, awardsGallery: next });
                            setSuccessItem(`award-${idx}`);
                            setTimeout(() => setSuccessItem(null), 3000);
                          } catch (err) {
                            alert("Award image upload failed.");
                          } finally {
                            setUploadingItem(null);
                          }
                        };
                        input.click();
                      }} className={`absolute inset-0 transition-opacity flex items-center justify-center text-white text-[8px] font-black uppercase ${uploadingItem === `award-${idx}` ? 'bg-slate-900/80 opacity-100' : 'bg-slate-900/40 opacity-0 group-hover:opacity-100'}`}>
                        {uploadingItem === `award-${idx}` ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            <span>Uploading...</span>
                          </div>
                        ) : (successItem === `award-${idx}` ? 'Complete!' : 'Replace Image')}
                      </button>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Award Title</label>
                        <input className="w-full p-3 bg-white rounded-xl border border-slate-100 focus:ring-1 focus:ring-red-500 font-bold outline-none text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={award.title} onChange={e => {
                          const next = [...homeForm.awardsGallery];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setHomeForm({ ...homeForm, awardsGallery: next });
                        }} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Year</label>
                        <input className="w-full p-3 bg-white rounded-xl border border-slate-100 focus:ring-1 focus:ring-red-500 font-bold outline-none text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={award.year} onChange={e => {
                          const next = [...homeForm.awardsGallery];
                          next[idx] = { ...next[idx], year: e.target.value };
                          setHomeForm({ ...homeForm, awardsGallery: next });
                        }} />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Awarding Authority</label>
                        <input className="w-full p-3 bg-white rounded-xl border border-slate-100 focus:ring-1 focus:ring-red-500 font-bold outline-none text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={award.authority} onChange={e => {
                          const next = [...homeForm.awardsGallery];
                          next[idx] = { ...next[idx], authority: e.target.value };
                          setHomeForm({ ...homeForm, awardsGallery: next });
                        }} />
                      </div>
                    </div>

                    <button type="button" onClick={() => {
                      const next = [...homeForm.awardsGallery];
                      next.splice(idx, 1);
                      setHomeForm({ ...homeForm, awardsGallery: next });
                    }} className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all dark:hover:bg-red-900/20"><Trash2 size={16} /></button>
                  </div>
                ))}

                <button type="button" onClick={() => {
                  setHomeForm(prev => ({
                    ...prev,
                    awardsGallery: [...(prev.awardsGallery || []), { title: '', year: '', authority: '', url: '' }]
                  }));
                }} className="w-full p-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-red-600 hover:text-red-600 transition-all dark:border-slate-800">
                  <Plus size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Add New Award to Gallery</span>
                </button>
              </div>
            </div>

            <div className="space-y-8">

              <div className="flex justify-between items-end pb-2 border-b border-red-600/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-red-600">Media Moments Gallery</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{homeForm.gallery?.length || 0} Moments</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {(homeForm.gallery || []).map((moment, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => handleGenericDragStart(e, idx, 'moment')}
                    onDragEnd={handleGenericDragEnd}
                    onDragOver={handleGenericDragOver}
                    onDragLeave={handleGenericDragLeave}
                    onDrop={(e) => handleGenericDrop(e, idx, 'moment')}
                    className="group relative aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 dark:bg-slate-950 dark:border-slate-800 cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-red-500 transition-all"
                  >
                    <img src={moment.url} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 p-2 backdrop-blur-sm">
                      <p className="text-[8px] text-white font-bold truncate uppercase">{moment.label}</p>
                    </div>
                    <button type="button" onClick={() => {
                      const next = [...homeForm.gallery];
                      next.splice(idx, 1);
                      setHomeForm({ ...homeForm, gallery: next });
                    }} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                  </div>
                ))}

                  <button type="button" onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setUploadingItem('moment-add');
                      try {
                        const url = await uploadImage(file, 'gallery');
                        const label = prompt("Enter a label for this moment (e.g. Studio, Event):") || "Media Moment";
                        setHomeForm(prev => ({ ...prev, gallery: [...(prev.gallery || []), { url, label }] }));
                      } catch (err) {
                        alert("Gallery upload failed.");
                      } finally {
                        setUploadingItem(null);
                      }
                    };
                    input.click();
                  }} className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:border-red-600 hover:text-red-600 transition-all cursor-pointer dark:border-slate-800 disabled:opacity-50" disabled={uploadingItem === 'moment-add'}>
                    {uploadingItem === 'moment-add' ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} />}
                    <span className="text-[8px] font-black uppercase mt-2">{uploadingItem === 'moment-add' ? 'Uploading...' : 'Add Moment'}</span>
                  </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isFetching}
              className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 shadow-2xl shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-400 disabled:shadow-none"
            >
              {isFetching ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              {isFetching ? 'Processing Uploads...' : 'Save Home Changes'}
            </button>
          </form>
        </div>
      )}

      {studioTab === 'system' && (
        <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-14 border border-slate-100 relative overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          {showSuccess && <div className="absolute top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-xs animate-in slide-in-from-right">System Config Saved</div>}
          <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4 mb-4 dark:text-white"><Settings className="text-red-600" /> System Settings</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-10">Advanced Developer Controls for API and Security.</p>

          <form onSubmit={handleSystemSubmit} className="space-y-12">
            <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 space-y-4 dark:bg-red-900/10 dark:border-red-900/20">
              <div className="flex items-center gap-3 text-red-600 font-black uppercase tracking-widest text-[10px]"><Zap size={16} /> Gemini API Overrides</div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Entering a key here will override the `VITE_GEMINI_API_KEY` defined in the build environment. This persists across all your devices.</p>
              <InputField label="Gemini API Key" placeholder="Paste key here..." value={systemForm.geminiApiKey} onChange={e => setSystemForm({ ...systemForm, geminiApiKey: e.target.value })} />
            </div>

            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-6 dark:bg-slate-950 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Content Synchronization</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Manually trigger a sync with external platforms.</p>
                </div>
                <button type="button" onClick={() => onSync()} disabled={isVideoLoading} className="flex items-center gap-2 px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg shadow-red-600/20">
                  {isVideoLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                  {isVideoLoading ? 'Syncing...' : 'Refresh YouTube Feed'}
                </button>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2"><Fingerprint className="text-red-600" size={14} /> Security & Identity</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Use this UID to whitelist your device in Firebase Security Rules.</p>
                </div>
                <button type="button" onClick={onCopyUid} disabled={!user?.uid} className="flex items-center gap-2 px-6 py-4 bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all border border-white/5 disabled:opacity-50">
                  <Copy size={12} /> {copiedUid ? 'Copied!' : 'Copy Device UID'}
                </button>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                <code className="text-[10px] text-red-400 font-mono break-all">{user?.uid || 'Initializing Secure Session...'}</code>
                {!user?.uid && <Loader2 size={12} className="text-red-600 animate-spin" />}
              </div>
            </div>

            <button type="submit" className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 shadow-2xl shadow-red-600/20 flex items-center justify-center gap-3">
              <Settings size={18} />
              Apply System Config
            </button>
          </form>
        </div>
      )}

      {studioTab === 'home' && (
        <div className="bg-slate-900 rounded-[3rem] shadow-2xl p-8 md:p-14 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4 mb-10"><Globe className="text-red-600" /> Social Hub</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">YouTube Channel</label>
                  <input className="w-full p-5 bg-white/5 rounded-2xl border border-white/10 focus:ring-2 focus:ring-red-500 font-bold outline-none text-sm text-white" value={socialLinks.youtube || ''} onChange={async (e) => {
                    const val = e.target.value;
                    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'social_config'), { ...socialLinks, youtube: val });
                  }} placeholder="https://youtube.com/@..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Twitter / X</label>
                  <input className="w-full p-5 bg-white/5 rounded-2xl border border-white/10 focus:ring-2 focus:ring-red-500 font-bold outline-none text-sm text-white" value={socialLinks.twitter || ''} onChange={async (e) => {
                    const val = e.target.value;
                    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'social_config'), { ...socialLinks, twitter: val });
                  }} />
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Facebook</label>
                  <input className="w-full p-5 bg-white/5 rounded-2xl border border-white/10 focus:ring-2 focus:ring-red-500 font-bold outline-none text-sm text-white" value={socialLinks.facebook || ''} onChange={async (e) => {
                    const val = e.target.value;
                    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'social_config'), { ...socialLinks, facebook: val });
                  }} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Instagram</label>
                  <input className="w-full p-5 bg-white/5 rounded-2xl border border-white/10 focus:ring-2 focus:ring-red-500 font-bold outline-none text-sm text-white" value={socialLinks.instagram || ''} onChange={async (e) => {
                    const val = e.target.value;
                    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'social_config'), { ...socialLinks, instagram: val });
                  }} />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-600/20 blur-[100px] rounded-full -mb-32 -mr-32" />
        </div>
      )}

      {studioTab !== 'home' && studioTab !== 'system' && (
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="p-8 bg-slate-50/5 flex justify-between items-center border-b border-slate-50 dark:bg-slate-950/50 dark:border-slate-800">
            <div className="flex flex-col">
              <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Live Manager</h3>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest">Managing {studioTab === 'video' ? 'Videos' : 'Archive Entries'}</p>
                {studioTab !== 'video' && (
                  <button
                    onClick={onInitializeSort}
                    className="text-[8px] bg-slate-100 hover:bg-slate-200 text-slate-500 px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter"
                    title="Run this if works are missing from the list"
                  >
                    Fix Sort Order
                  </button>
                )}
              </div>
            </div>
            <input value={managerSearch} onChange={e => setManagerSearch(e.target.value)} placeholder="Filter entries..." className="pl-6 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {(studioTab === 'video' ? featuredVideos : works).filter(w => (studioTab === 'video' ? w.title : w.title)?.toLowerCase().includes(managerSearch.toLowerCase())).map((work, idx) => (
                  <tr
                    key={work.id}
                    draggable={studioTab !== 'video'}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', idx);
                      e.currentTarget.classList.add('opacity-40');
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.classList.remove('opacity-40');
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (studioTab !== 'video') e.currentTarget.classList.add('bg-red-50', 'dark:bg-red-900/10');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('bg-red-50', 'dark:bg-red-900/10');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('bg-red-50', 'dark:bg-red-900/10');
                      if (studioTab === 'video') return;

                      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                      const toIdx = idx;

                      if (fromIdx === toIdx) return;

                      const newWorks = [...works];
                      const [movedItem] = newWorks.splice(fromIdx, 1);
                      newWorks.splice(toIdx, 0, movedItem);
                      onReorder(newWorks);
                    }}
                    className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-grab active:cursor-grabbing ${editingId === work.id ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                  >
                    <td className="px-8 py-4 flex items-center gap-3">
                      {studioTab !== 'video' && (
                        <div className="mr-2 text-slate-300">
                          <MoveVertical size={14} />
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden dark:bg-slate-800">
                        <img src={work.thumbnail} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold text-sm line-clamp-1 dark:text-white">{work.title}</span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-wrap gap-1">
                        {studioTab === 'video' ? (
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded dark:bg-slate-800 dark:text-slate-400">VIDEO CONTENT</span>
                        ) : (
                          [].concat(work.type).map(t => (
                            <span key={t} className="px-2 py-1 bg-red-100 text-red-600 text-[9px] font-black uppercase rounded dark:bg-red-900/20 dark:text-red-400">{t}</span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4 hidden md:table-cell">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {work.pubYear || '—'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      {studioTab !== 'video' && (
                        <button onClick={() => {
                          setEditingId(work.id);
                          setActiveTypes([].concat(work.type));
                          setForm({ ...work });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} className="p-2 text-slate-300 hover:text-blue-600 mr-2 transition-all">
                          <Edit3 size={16} />
                        </button>
                      )}
                      <button onClick={async () => {
                        if (studioTab === 'video') {
                          const updated = featuredVideos.filter(v => v.id !== work.id);
                          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'featured_videos'), { videos: updated });
                        } else {
                          onDelete(work.id);
                        }
                      }} className="p-2 text-slate-300 hover:text-red-600 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody></table>
          </div>
        </div>
      )}
    </div>
  );
};

const ResearchLab = ({ apiKey }) => {
  const [prompt, setPrompt] = useState('');
  const [useOllama, setUseOllama] = useState(false);
  const [chat, setChat] = useState([{ role: 'ai', text: 'Namaste, Dr. Prasada Murthy. Your private research lab is ready.' }]);
  const [isCooldown, setIsCooldown] = useState(false);
  const [requestLog, setRequestLog] = useState([]);

  const getRiskLevel = () => {
    const now = Date.now();
    const recent = requestLog.filter(time => now - time < 3600000); // Last hour
    if (recent.length >= 12) return { label: 'High Risk', color: 'text-red-500', bg: 'bg-red-500/10' };
    if (recent.length >= 6) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { label: 'Optimal', color: 'text-green-500', bg: 'bg-green-500/10' };
  };

  const ask = async () => {
    if (!prompt || isCooldown) return;
    const history = [...chat, { role: 'user', text: prompt }];
    setChat(history); setPrompt('');
    if (useOllama) {
      try {
        const response = await fetch('http://localhost:11434/api/generate', { method: 'POST', body: JSON.stringify({ model: 'llama3', prompt: prompt, stream: false }) });
        const data = await response.json();
        setChat([...history, { role: 'ai', text: data.response }]);
      } catch (err) { setChat([...history, { role: 'ai', text: "Error connecting to local Ollama." }]); }
    } else {
      try {
        const systemPrompt = `You are the Research Intelligence of Pramu Talks. 
        MISSION: Provide ultra-concise research summaries (<150 words). 
        CONSTRAINTS: 1. Use bullet points for Key Insights. 2. Synthesis must be 1 short paragraph. 3. Always list sources. 
        Note: Only expand if user explicitly says "elaborate" or "deep dive".
        Analyze: ${prompt}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            tools: [{ "google_search_retrieval": { "dynamic_retrieval_config": { "mode": "MODE_DYNAMIC", "dynamic_threshold": 0.3 } } }]
          })
        });
        setRequestLog(prev => [...prev, Date.now()]);
        const result = await response.json();

        if (result.error && (result.error.code === 429 || result.error.status === 'RESOURCE_EXHAUSTED')) {
          setChat([...history, { role: 'ai', text: "Namaste. I'm currently reflecting on your recent queries to stay within my processing limits. Please wait about 60 seconds before our next analysis." }]);
          setIsCooldown(true);
          setTimeout(() => setIsCooldown(false), 60000);
          return;
        }

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis complete.";
        setChat([...history, { role: 'ai', text }]);
      } catch (err) {
        setChat([...history, { role: 'ai', text: "Gemini Cloud connection failed. Please check your API key." }]);
      }
    }
  };
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 h-[75vh] flex flex-col animate-in zoom-in-95 duration-300">
      <div className="bg-slate-900 rounded-[3rem] p-10 flex-1 flex flex-col shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-6 border-b border-white/10 text-white gap-4">
          <div className="flex items-center gap-4">
            <Database className="text-red-600" />
            <div>
              <h2 className="font-black text-xl uppercase tracking-tighter">Research Intelligence</h2>
              <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${getRiskLevel().bg} border border-white/5`}>
                <div className={`w-1 h-1 rounded-full animate-pulse ${getRiskLevel().color.replace('text-', 'bg-')}`} />
                <span className={`text-[8px] font-black uppercase tracking-widest ${getRiskLevel().color}`}>Quota: {getRiskLevel().label}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl px-4 border border-white/10">
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${useOllama ? 'text-amber-500' : 'text-blue-500'}`}>{useOllama ? <Cpu size={14} /> : <Globe size={14} />} {useOllama ? 'Ollama' : 'Gemini'}</div>
            <button onClick={() => setUseOllama(!useOllama)} className={`w-10 h-5 rounded-full relative transition-all ${useOllama ? 'bg-amber-600' : 'bg-slate-700'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useOllama ? 'left-6' : 'left-1'}`} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-6 pr-4 mb-8 custom-scrollbar">
          {chat.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-6 rounded-[2rem] max-w-[85%] text-sm font-medium ${m.role === 'user' ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-slate-300 border border-white/10 backdrop-blur-sm'}`}>
                {m.role === 'ai' ? (
                  <div className="markdown-content space-y-3">
                    <ReactMarkdown components={{
                      h1: ({ node, ...props }) => <h1 className="text-xl font-black uppercase tracking-tight text-white mb-4" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-lg font-black uppercase tracking-tight text-white mb-3" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-md font-bold text-red-500 mb-2" {...props} />,
                      p: ({ node, ...props }) => <p className="leading-relaxed opacity-90" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 ml-4" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 ml-4" {...props} />,
                      li: ({ node, ...props }) => <li className="marker:text-red-500" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-black text-red-500" {...props} />,
                      a: ({ node, ...props }) => <a className="text-red-500 font-bold underline decoration-red-500/30 hover:decoration-red-500 underline-offset-4 transition-all" target="_blank" rel="noopener noreferrer" {...props} />,
                      code: ({ node, ...props }) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                    }}>{m.text}</ReactMarkdown>
                  </div>
                ) : (
                  m.text
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="relative group">
          <div className="absolute -top-6 left-2 flex items-center gap-2 opacity-60 group-focus-within:opacity-100 transition-opacity">
            <Zap size={10} className="text-amber-500" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Smart Efficiency Mode Active • Concise Summaries Forced</span>
          </div>
          <div className="flex gap-4">
            <input className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium disabled:opacity-50" placeholder={isCooldown ? "Cooling down..." : "Query archives..."} value={prompt} onChange={e => setPrompt(e.target.value)} onKeyPress={e => e.key === 'Enter' && ask()} disabled={isCooldown} />
            <button onClick={ask} disabled={isCooldown} className="bg-white text-slate-900 px-10 rounded-2xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest disabled:opacity-50">
              {isCooldown ? <Loader2 size={12} className="animate-spin inline mr-2" /> : null}
              {isCooldown ? 'Cooldown' : 'Execute'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;