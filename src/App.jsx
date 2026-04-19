import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, setDoc,
  doc, deleteDoc, updateDoc, query, orderBy 
} from 'firebase/firestore';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Book, Mic2, Search, Home, Award, 
  PlayCircle, Menu, X, ChevronRight, 
  Database, Library, Settings, Trash2,
  BookOpen, Newspaper, Film, PenTool, Lock, Key, Star, Loader2,
  School, Heart, Image as ImageIcon, GraduationCap, History,
  Calendar, Link as LinkIcon, FileText, ShoppingCart, Headphones,
  AlertCircle, CheckCircle2, Filter, Edit3, UploadCloud, Zap, Link2,
  Cpu, Globe, Copy, Fingerprint, Video, Camera, Share2
} from 'lucide-react';

// =============================================================
// SETUP: PASTE YOUR KEYS HERE
// =============================================================

const myFirebaseConfig = {
  apiKey: "AIzaSyBaGXWQTKxveH0DrMh0EVlzZAis_q4feVs",
  authDomain: "pramu-talks.firebaseapp.com",
  projectId: "pramu-talks",
  storageBucket: "pramu-talks.firebasestorage.app",
  messagingSenderId: "623377707902",
  appId: "1:623377707902:web:0f9e68a76635d19258392f",
  measurementId: "G-73TG2NMQMF"
};

const geminiApiKey = "AIzaSyBn7bzfc_oa1y-HojLQG_kkWs5JM9sWjNs"; // Get from https://aistudio.google.com/

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
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'pramu-talks-v2';
const apiKey = geminiApiKey;

const YoutubeIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 2-2 10 10 0 0 1 15 0 2 2 0 0 1 2 2 24.12 24.12 0 0 1 0 10 2 2 0 0 1-2 2 10 10 0 0 1-15 0 2 2 0 0 1-2-2Z" /><path d="m10 15 5-3-5-3z" /></svg>
);

const FALLBACK_VIDEOS = [
  { id: 'v1', title: 'Sri Sri: The Great Revolutionary Poet - Nandi Award Program', thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600', url: 'https://www.youtube.com/@pramutalks' },
  { id: 'v2', title: 'Philosophy of Mahaprasthanam - Detailed Analysis', thumbnail: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600', url: 'https://www.youtube.com/@pramutalks' },
  { id: 'v3', title: 'Journalism Ethics in the Digital Era', thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600', url: 'https://www.youtube.com/@pramutalks' }
];

const INITIAL_SAMPLES = [
  { id: 's1', title: 'The Evolution of Sri Sri', type: 'essay', category: 'Articles', thumbnail: 'https://images.unsplash.com/photo-1455391727132-f3cf7339e38c?w=400', magazine: 'Andhra Jyothi', pubYear: '2023', link: '#' },
  { id: 's2', title: 'Mahaprasthanam Revisited', type: 'book', category: 'Novel', thumbnail: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', pubYear: '2021', purchaseLink: '#' }
];

const App = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [works, setWorks] = useState(INITIAL_SAMPLES);
  const [topVideos, setTopVideos] = useState(FALLBACK_VIDEOS);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [socialLinks, setSocialLinks] = useState({ youtube: '', twitter: '', facebook: '', instagram: '' });
  
  const [clickCount, setClickCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

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
    const worksUnsub = onSnapshot(worksRef, (snapshot) => {
      const dbWorks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorks([...INITIAL_SAMPLES, ...dbWorks]);
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

    return () => { worksUnsub(); syncUnsub(); socialUnsub(); };
  }, [user]);

  const handleLogout = () => {
    setIsAdmin(false);
    setActiveTab('home');
    setIsMenuOpen(false);
  };

  const copyUid = () => {
    if (user?.uid) {
      const el = document.createElement('textarea');
      el.value = user.uid;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const fetchTopVideos = async (retries = 0) => {
    setIsVideoLoading(true);
    if (!apiKey) {
      setIsVideoLoading(false);
      return;
    }
    console.log("🎬 Syncing with @pramutalks YouTube channel...");
    const prompt = "Search for YouTube channel '@pramutalks'. Find the top 6 most popular/recent videos. Return the results ONLY as a JSON array of objects with keys: id, title, thumbnail, url. Do not include any other text.";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
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
        console.error("YouTube Sync API Error:", result.error.message);
        throw new Error(result.error.message);
      }

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
    const worksRef = collection(db, 'artifacts', appId, 'public', 'data', 'works');
    await addDoc(worksRef, { ...data, createdAt: new Date().toISOString() });
  };

  const handleUpdateWork = async (id, data) => {
    if (id.startsWith('s')) {
      setWorks(works.map(w => w.id === id ? { ...w, ...data } : w));
    } else {
      const workDoc = doc(db, 'artifacts', appId, 'public', 'data', 'works', id);
      await updateDoc(workDoc, data);
    }
  };

  const handleDelete = async (id) => {
    if (id.startsWith('s')) {
      setWorks(works.filter(w => w.id !== id));
    } else {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'works', id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-red-100">
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handleLogoClick}>
              <div className="bg-red-600 p-2 rounded-xl shadow-lg active:scale-95 transition-transform">
                <Mic2 className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter leading-none uppercase">Pramu Talks</h1>
                <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest leading-none mt-1">Official Archive</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              {[
                { id: 'home', label: 'Home', icon: Home },
                { id: 'works', label: 'Archive', icon: Library },
                { id: 'videos', label: 'Videos', icon: PlayCircle },
                { id: 'studio', label: 'Studio', icon: Settings, admin: true },
                { id: 'research', label: 'Research', icon: Database, admin: true },
              ].filter(item => !item.admin || isAdmin).map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 text-sm font-bold transition-all ${activeTab === item.id ? 'text-red-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {item.admin && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-1" />}
                </button>
              ))}
              {isAdmin && <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Lock & Logout"><Lock size={16} /></button>}
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2">{isMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 animate-in slide-in-from-top duration-300">
            <div className="px-4 pt-2 pb-6 space-y-1">
              {[
                { id: 'home', label: 'Home', icon: Home },
                { id: 'works', label: 'Archive', icon: Library },
                { id: 'videos', label: 'Videos', icon: PlayCircle },
                { id: 'studio', label: 'Studio', icon: Settings, admin: true },
                { id: 'research', label: 'Research', icon: Database, admin: true },
              ].filter(item => !item.admin || isAdmin).map(item => (
                <button 
                  key={item.id} 
                  onClick={() => { setActiveTab(item.id); setIsMenuOpen(false); }}
                  className={`flex items-center gap-4 w-full p-4 rounded-2xl text-base font-bold transition-all ${activeTab === item.id ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-50'}`}
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
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter"><Key className="text-red-600" /> Access Portal</h3>
              <button onClick={() => setShowLoginModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-4 mb-6">
              <input autoFocus type="password" placeholder="Passkey" className={`w-full p-4 bg-slate-50 rounded-2xl border-2 outline-none font-bold ${loginError ? 'border-red-500' : 'border-slate-100 focus:border-red-600'}`} value={passkey} onChange={e => { setPasskey(e.target.value); setLoginError(false); }} />
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-all">Unlock</button>
            </form>
            <div className="pt-6 border-t border-slate-100">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><Fingerprint size={12} /> Admin Identity (UID)</p>
               <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100 group">
                  <code className="text-[9px] font-bold text-slate-500 truncate w-48">{user?.uid || "Connecting..."}</code>
                  <button onClick={copyUid} className="p-1.5 hover:bg-white rounded-lg text-slate-400">{copiedUid ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}</button>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-16">
        {activeTab === 'home' && <HomeView setActiveTab={setActiveTab} />}
        {activeTab === 'works' && <ArchiveView works={works.filter(w => filter === 'all' || w.type === filter)} isAdmin={isAdmin} onDelete={handleDelete} setFilter={setFilter} currentFilter={filter} />}
        {activeTab === 'videos' && <VideosView works={topVideos} isLoading={isVideoLoading} />}
        {activeTab === 'studio' && isAdmin && (
          <CreatorStudio 
            onAdd={handleAddWork} 
            onUpdate={handleUpdateWork} 
            works={works} 
            onDelete={handleDelete} 
            isVideoLoading={isVideoLoading}
            onSync={fetchTopVideos}
            socialLinks={socialLinks}
          />
        )}
        {activeTab === 'research' && isAdmin && <ResearchLab />}
      </div>
      <Footer socials={socialLinks} />
    </div>
  );
};

// --- View Components ---

const HomeView = ({ setActiveTab }) => (
  <div className="animate-in fade-in duration-700">
    <section className="bg-slate-900 text-white py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 text-red-500 text-[10px] font-black uppercase tracking-widest mb-8 border border-red-600/20"><Award className="w-3.5 h-3.5" /> Nandi Awardee 2024</div>
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tight uppercase">Poetry in <span className="text-red-600 underline decoration-white/10 underline-offset-8">Journalism.</span><br/>Truth in Verse.</h1>
          <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl font-medium">Bridging the gap between the revolutionary literature of Sri Sri and the dynamic world of digital media.</p>
          <div className="flex flex-wrap gap-5">
            <button onClick={() => setActiveTab('videos')} className="bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-red-600/20 active:scale-95">Watch Channel</button>
            <button onClick={() => setActiveTab('works')} className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/10 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95">The Archive</button>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-48 -right-48 w-[800px] h-[800px] bg-red-600/5 blur-[120px] rounded-full" />
    </section>

    {/* Philosophy */}
    <section className="py-24 bg-white border-b border-slate-50 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-4xl font-black mb-6 uppercase tracking-tighter">Core Philosophy</h2>
          <div className="w-12 h-1 bg-red-600 mb-8" />
          <p className="text-xl text-slate-600 leading-relaxed font-medium italic mb-6">"Literature is not just words on a page; it is the heartbeat of society."</p>
          <p className="text-slate-500 leading-relaxed">Dr. Murthy's philosophy centers on 'Sahitya-Samaja'—the inevitable bond between art and social responsibility. Masterfully bridging classroom pedagogy with digital ethics.</p>
        </div>
        <div className="bg-slate-50 rounded-[3rem] p-12 border border-slate-100 flex flex-col items-center justify-center text-center">
          <BookOpen className="w-16 h-16 text-red-600 mb-4" />
          <p className="text-2xl font-black text-slate-900 uppercase">శ్రమయే జీవన సౌందర్యము</p>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Sri Sri's Eternal Inspiration</p>
        </div>
      </div>
    </section>

    {/* Academic Roots */}
    <section className="py-24 bg-slate-50 px-4 border-b border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Academic Roots</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">The Journey of a Scholar</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: GraduationCap, title: 'PhD, Telugu Literature', desc: 'Specializing in modern poetry and the cultural shift of the 1940s-60s.' },
            { icon: School, title: 'JNV Mentorship', desc: 'Decades of shaping young minds in Jawahar Navodaya Vidyalayas across regions.' },
            { icon: History, title: 'Media Evolution', desc: 'From the precision of print newsrooms to the viral impact of YouTube journalism.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
              <div className="bg-slate-50 p-4 rounded-2xl w-fit mb-6 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors"><item.icon size={32} /></div>
              <h3 className="text-xl font-black mb-3 uppercase tracking-tighter">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Awards Restored */}
    <section className="py-24 bg-white border-b border-slate-50 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
        <div className="flex-1">
          <h2 className="text-4xl font-black mb-8 uppercase tracking-tighter">Awards & Honors</h2>
          <div className="flex gap-6 items-start mb-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="bg-amber-100 p-4 rounded-2xl text-amber-600 flex-shrink-0"><Award size={32} /></div>
            <div>
              <h4 className="font-black text-xl uppercase tracking-tight">Prestigious Nandi Award</h4>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">Recognized for the acclaimed digital documentary series on Revolutionary Poet Sri Sri. Celebrated for historical depth and narrative excellence.</p>
            </div>
          </div>
          <div className="flex gap-6 items-start bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 border-dashed">
            <div className="bg-slate-200 p-4 rounded-2xl text-slate-600 flex-shrink-0"><Star size={32} /></div>
            <div>
              <h4 className="font-black text-xl uppercase tracking-tight">Sahitya Samrat</h4>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">Conferred by state literary circles for significant contribution to poetry research and book analysis.</p>
            </div>
          </div>
        </div>
        <div className="w-full md:w-96 h-96 bg-slate-900 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-12 text-center text-white relative overflow-hidden group">
           <Award className="w-24 h-24 text-amber-500 mb-6 z-10 transition-transform group-hover:scale-110" />
           <p className="font-black text-3xl uppercase tracking-tighter z-10 leading-none">Nandi Awardee</p>
           <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-3 z-10">Literary Excellence</p>
           <div className="absolute -top-10 -right-10 w-48 h-48 bg-red-600/10 blur-[80px] rounded-full" />
        </div>
      </div>
    </section>

    {/* Gallery */}
    <section className="py-24 bg-slate-50 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-black mb-12 uppercase tracking-tighter">Moments in Media</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { img: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400', label: 'Studio' },
            { img: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=400', label: 'Literature' },
            { img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', label: 'Teaching' },
            { img: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400', label: 'Archive' }
          ].map((item, i) => (
            <div key={i} className="group relative aspect-square bg-slate-200 rounded-[2.5rem] overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all">
              <img src={item.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={item.label} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <span className="text-white text-xs font-black uppercase tracking-widest">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

const ArchiveView = ({ works, isAdmin, onDelete, setFilter, currentFilter }) => (
  <div className="max-w-7xl mx-auto px-4 py-16 animate-in slide-in-from-bottom-6 duration-500">
    <div className="flex flex-wrap gap-2 mb-16 items-center">
      {['all', 'book', 'essay', 'story', 'review', 'audiobook'].map(cat => (
        <button key={cat} onClick={() => setFilter(cat)} className={`px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all border ${currentFilter === cat ? 'bg-red-600 text-white border-red-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>{cat}</button>
      ))}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {works.map(work => (
        <div key={work.id} className="group bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col">
          <div className="aspect-[4/5] bg-slate-100 rounded-[2rem] overflow-hidden relative mb-6">
            <img src={work.thumbnail || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400'} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt={work.title} />
            <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-slate-200">{work.type}</div>
            {isAdmin && <button onClick={() => onDelete(work.id)} className="absolute top-4 right-4 p-2.5 bg-red-600 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"><Trash2 size={16} /></button>}
          </div>
          <div className="px-3 pb-4 flex-1 flex flex-col">
            <h3 className="font-black text-slate-900 leading-tight line-clamp-2 h-10 mb-2 uppercase text-sm tracking-tight">{work.title}</h3>
            <div className="space-y-1 mb-4">
              {work.rating && <div className="flex gap-1 text-amber-500"><Star size={10} fill="currentColor" /><span className="text-[9px] font-black">{work.rating}/5 Rating</span></div>}
              {work.magazine && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{work.magazine}</div>}
              {work.pubYear && <div className="text-[10px] font-bold text-slate-400">{work.pubYear}</div>}
            </div>
            <div className="mt-auto">
              {(work.link || work.purchaseLink || work.youtubeLink) && (
                <a href={work.link || work.purchaseLink || work.youtubeLink} target="_blank" rel="noopener noreferrer" className="block w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[8px] hover:bg-red-600 transition-colors text-center active:scale-95">Access Work</a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const VideosView = ({ works, isLoading }) => (
  <div className="max-w-7xl mx-auto px-4 py-16 animate-in fade-in duration-500">
    <div className="flex items-center gap-6 mb-16">
      <div className="w-16 h-16 bg-red-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-red-600/20"><YoutubeIcon className="text-white w-8 h-8" /></div>
      <div>
        <h2 className="text-4xl font-black tracking-tight leading-none uppercase tracking-tighter">Trending Now</h2>
        <div className="flex items-center gap-2 mt-2">
           <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{isLoading ? 'Syncing with @pramutalks...' : 'Live Channel Feed'}</p>
        </div>
      </div>
    </div>
    
    {isLoading && (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-100">
         <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
         <p className="text-xs font-black uppercase tracking-widest text-slate-400">Updating Archive...</p>
      </div>
    )}

    <div className="grid md:grid-cols-3 gap-8 mb-16">
        {works.map((video, idx) => (
          <a key={idx} href={video.url} target="_blank" rel="noopener noreferrer" className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl transition-all">
            <div className="aspect-video relative overflow-hidden bg-slate-100">
              <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
              <div className="absolute inset-0 bg-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <PlayCircle className="text-white w-12 h-12 drop-shadow-2xl" />
              </div>
            </div>
            <div className="p-8">
              <h3 className="font-black text-lg leading-tight line-clamp-2 group-hover:text-red-600 transition-colors uppercase italic">{video.title}</h3>
            </div>
          </a>
        ))}
      </div>
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] border border-slate-100 text-center space-y-6 shadow-sm">
        <Video className="w-12 h-12 text-red-600" />
        <h3 className="text-2xl font-black uppercase tracking-tighter">Visit the Official Channel</h3>
        <p className="text-slate-400 font-medium max-w-sm">For the latest updates and full episodes, explore the YouTube hub of Dr. Prasada Murthy.</p>
        <a href="https://www.youtube.com/@pramutalks" target="_blank" rel="noopener noreferrer" className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-all shadow-xl shadow-slate-900/20 active:scale-95">Open YouTube Channel</a>
      </div>
  </div>
);

const Footer = ({ socials }) => (
  <footer className="bg-slate-900 text-white py-24 px-4 overflow-hidden relative">
    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 relative z-10">
      <div>
        <div className="flex items-center gap-3 mb-8">
          <Mic2 className="text-red-600 w-8 h-8" />
          <h2 className="text-3xl font-black uppercase tracking-tighter">Pramu Talks</h2>
        </div>
        <p className="text-xl text-slate-400 font-medium mb-12 max-w-sm italic tracking-tight">"Literature is not just words on a page; it is the heartbeat of society."</p>
        <div className="flex gap-4">
          {socials.youtube && <a href={socials.youtube} target="_blank" className="p-4 bg-white/5 rounded-2xl hover:bg-red-600 transition-all text-white"><Video size={20}/></a>}
          {socials.twitter && <a href={socials.twitter} target="_blank" className="p-4 bg-white/5 rounded-2xl hover:bg-red-600 transition-all text-white"><Share2 size={20}/></a>}
          {socials.facebook && <a href={socials.facebook} target="_blank" className="p-4 bg-white/5 rounded-2xl hover:bg-red-600 transition-all text-white"><Globe size={20}/></a>}
          {socials.instagram && <a href={socials.instagram} target="_blank" className="p-4 bg-white/5 rounded-2xl hover:bg-red-600 transition-all text-white"><Camera size={20}/></a>}
        </div>
      </div>
      <div className="flex flex-col md:items-end justify-between">
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 mb-2">Academic & Literary Portal</p>
          <h3 className="text-4xl font-black uppercase tracking-tighter italic">Poetry in <span className="text-red-600 underline decoration-white/10 underline-offset-4">Journalism.</span></h3>
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-12">© 2026 Pramu Talks. Official Dr. Prasada Murthy Archive.</p>
      </div>
    </div>
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 blur-[100px] rounded-full -mr-64 -mt-64" />
  </footer>
);

const CreatorStudio = ({ onAdd, onUpdate, works, onDelete, isVideoLoading, onSync, socialLinks }) => {
  const [activeType, setActiveType] = useState('book');
  const [managerSearch, setManagerSearch] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '', thumbnail: '', brief: '', pubYear: '', pubMonth: '', 
    purchaseLink: '', awards: '', link: '', magazine: '', 
    sourceName: '', availableAt: '', rating: '5', youtubeLink: '', bookLink: ''
  });

  const extractYTThumbnail = (url) => {
    if (!url) return null;
    const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg` : null;
  };

  useEffect(() => {
    const thumb = extractYTThumbnail(form.link || form.youtubeLink || '');
    if (thumb && thumb !== form.thumbnail) setForm(prev => ({ ...prev, thumbnail: thumb }));
  }, [form.link, form.youtubeLink]);

  const fetchMetadataFromLink = async () => {
    const targetUrl = form.link || form.purchaseLink || form.youtubeLink;
    if (!targetUrl || !apiKey) return;
    setIsFetching(true);
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
    } catch (err) { console.error("Sync failed:", err); } finally { setIsFetching(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) await onUpdate(editingId, { ...form, type: activeType });
    else await onAdd({ ...form, type: activeType });
    setEditingId(null);
    setForm({ title: '', thumbnail: '', brief: '', pubYear: '', pubMonth: '', purchaseLink: '', awards: '', link: '', magazine: '', sourceName: '', availableAt: '', rating: '5', youtubeLink: '', bookLink: '' });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const types = [
    { id: 'book', label: 'Book', icon: Book },
    { id: 'essay', label: 'Essay/Article', icon: Newspaper },
    { id: 'story', label: 'Story', icon: PenTool },
    { id: 'review', label: 'Review', icon: Star },
    { id: 'audiobook', label: 'Audiobook', icon: Headphones }
  ];

  const InputField = ({ label, name, placeholder, type="text" }) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{label}</label>
      <input className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none shadow-inner text-sm" placeholder={placeholder} value={form[name] || ''} onChange={e => setForm({...form, [name]: e.target.value})} type={type} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-16 px-4 space-y-12 animate-in zoom-in-95 duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-14 border border-slate-100 relative overflow-hidden">
        {showSuccess && <div className="absolute top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-xs animate-in slide-in-from-right">Archive Updated</div>}
        <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4 mb-4"><PenTool className="text-red-600" /> {editingId ? 'Edit Entry' : 'Studio'}</h2>
        {!editingId && (
            <div className="flex flex-wrap gap-2 mb-10 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {types.map(t => (
                  <button key={t.id} onClick={() => setActiveType(t.id)} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black uppercase tracking-widest text-[8px] transition-all ${activeType === t.id ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><t.icon size={12} /> {t.label}</button>
                ))}
              </div>
              <button type="button" onClick={() => onSync()} disabled={isVideoLoading} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[8px] hover:bg-red-600 transition-all disabled:opacity-50">
                {isVideoLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                {isVideoLoading ? 'Syncing...' : 'Refresh YouTube Feed'}
              </button>
            </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="aspect-[4/3] rounded-[2rem] bg-slate-100 overflow-hidden relative group border-2 border-slate-50 shadow-inner">
                {form.thumbnail ? <img src={form.thumbnail} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-300"><ImageIcon size={48} /><p className="text-[10px] font-black uppercase mt-2">Preview Area</p></div>}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button type="button" onClick={() => fileInputRef.current.click()} className="p-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase">Upload</button>
                  <button type="button" onClick={fetchMetadataFromLink} disabled={isFetching} className="p-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase">Sync</button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const reader = new FileReader(); reader.onloadend = () => setForm(f => ({...f, thumbnail: reader.result})); reader.readAsDataURL(e.target.files[0]); }} />
              </div>
              <InputField label="Primary URL (Content Link)" name="link" placeholder="YouTube or Article URL" />
              <InputField label="Work Title" name="title" />
            </div>
            <div className="space-y-6">
              {activeType === 'book' && <><InputField label="Publishing Year" name="pubYear" /><InputField label="Purchase Link" name="purchaseLink" /><InputField label="Awards" name="awards" /></>}
              {(activeType === 'essay' || activeType === 'story') && <><InputField label="Magazine / Website" name="magazine" /><InputField label="Pub Date" name="pubYear" /></>}
              {activeType === 'review' && <><InputField label="Source Name" name="sourceName" /><InputField label="Rating (1-5)" name="rating" /><InputField label="Video Link" name="youtubeLink" /></>}
              <textarea className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none h-32 shadow-inner text-sm" placeholder="Summary..." value={form.brief || ''} onChange={e => setForm({...form, brief: e.target.value})} />
              <InputField label="Manual Thumbnail URL" name="thumbnail" />
            </div>
          </div>
          <div className="flex gap-4">
            {editingId && <button type="button" onClick={() => setEditingId(null)} className="flex-1 bg-slate-100 text-slate-500 py-6 rounded-[2rem] font-black text-xs">Cancel</button>}
            <button type="submit" className="flex-[2] bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 shadow-xl">{editingId ? 'Apply Update' : 'Publish Live'}</button>
          </div>
        </form>
      </div>

      <div className="bg-slate-900 rounded-[3rem] shadow-2xl p-8 md:p-14 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4 mb-10"><Globe className="text-red-600" /> Social Hub</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">YouTube Channel</label>
                <input className="w-full p-5 bg-white/5 rounded-2xl border border-white/10 focus:ring-2 focus:ring-red-500 font-bold outline-none text-sm text-white" value={socialLinks.youtube || ''} onChange={async (e) => {
                  const val = e.target.value;
                  await setDoc(doc(getFirestore(), 'artifacts', appId, 'public', 'data', 'metadata', 'social_config'), { ...socialLinks, youtube: val });
                }} placeholder="https://youtube.com/@..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Twitter / X</label>
                <input className="w-full p-5 bg-white/5 rounded-2xl border border-white/10 focus:ring-2 focus:ring-red-500 font-bold outline-none text-sm text-white" value={socialLinks.twitter || ''} onChange={async (e) => {
                  const val = e.target.value;
                  await setDoc(doc(getFirestore(), 'artifacts', appId, 'public', 'data', 'metadata', 'social_config'), { ...socialLinks, twitter: val });
                }} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Facebook</label>
                <input className="w-full p-5 bg-white/5 rounded-2xl border border-white/10 focus:ring-2 focus:ring-red-500 font-bold outline-none text-sm text-white" value={socialLinks.facebook || ''} onChange={async (e) => {
                  const val = e.target.value;
                  await setDoc(doc(getFirestore(), 'artifacts', appId, 'public', 'data', 'metadata', 'social_config'), { ...socialLinks, facebook: val });
                }} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Instagram</label>
                <input className="w-full p-5 bg-white/5 rounded-2xl border border-white/10 focus:ring-2 focus:ring-red-500 font-bold outline-none text-sm text-white" value={socialLinks.instagram || ''} onChange={async (e) => {
                  const val = e.target.value;
                  await setDoc(doc(getFirestore(), 'artifacts', appId, 'public', 'data', 'metadata', 'social_config'), { ...socialLinks, instagram: val });
                }} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-600/20 blur-[100px] rounded-full -mb-32 -mr-32" />
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 bg-slate-50/5 flex justify-between items-center border-b border-slate-50"><h3 className="text-2xl font-black uppercase tracking-tighter">Live Manager</h3><input value={managerSearch} onChange={e => setManagerSearch(e.target.value)} placeholder="Filter..." className="pl-6 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" /></div>
        <div className="overflow-x-auto"><table className="w-full text-left"><tbody className="divide-y divide-slate-50">
          {works.filter(w => w.title?.toLowerCase().includes(managerSearch.toLowerCase())).map(work => (
            <tr key={work.id} className={`group hover:bg-slate-50 transition-colors ${editingId === work.id ? 'bg-red-50' : ''}`}>
              <td className="px-8 py-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden"><img src={work.thumbnail} className="w-full h-full object-cover" /></div><span className="font-bold text-sm line-clamp-1">{work.title}</span></td>
              <td className="px-8 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded">{work.type}</span></td>
              <td className="px-8 py-4 text-right">
                <button onClick={() => { setEditingId(work.id); setActiveType(work.type); setForm({...work}); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-2 text-slate-300 hover:text-blue-600 mr-2 transition-all"><Edit3 size={16} /></button>
                <button onClick={() => onDelete(work.id)} className="p-2 text-slate-300 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody></table></div>
      </div>
    </div>
  );
};

const ResearchLab = () => {
  const [prompt, setPrompt] = useState('');
  const [useOllama, setUseOllama] = useState(false);
  const [chat, setChat] = useState([{ role: 'ai', text: 'Namaste, Dr. Prasada Murthy. Your private research lab is ready.' }]);
  const [isCooldown, setIsCooldown] = useState(false);

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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `You are the Research Intelligence of Pramu Talks Official Archive. Analyze this query, focusing on Dr. Prasada Murthy's vision or relevant news. When using search results, provide direct source links at the end: ${prompt}` }] }],
            tools: [{ "google_search_retrieval": { "dynamic_retrieval_config": { "mode": "MODE_DYNAMIC", "dynamic_threshold": 0.3 } } }]
          })
        });
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
          <div className="flex items-center gap-4"><Database className="text-red-600" /> <h2 className="font-black text-xl uppercase tracking-tighter">Research Intelligence</h2></div>
          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl px-4 border border-white/10">
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${useOllama ? 'text-amber-500' : 'text-blue-500'}`}>{useOllama ? <Cpu size={14}/> : <Globe size={14}/>} {useOllama ? 'Ollama' : 'Gemini'}</div>
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
                      h1: ({node, ...props}) => <h1 className="text-xl font-black uppercase tracking-tight text-white mb-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-black uppercase tracking-tight text-white mb-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-md font-bold text-red-500 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="leading-relaxed opacity-90" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 ml-4" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 ml-4" {...props} />,
                      li: ({node, ...props}) => <li className="marker:text-red-500" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-black text-red-500" {...props} />,
                      a: ({node, ...props}) => <a className="text-red-500 font-bold underline decoration-red-500/30 hover:decoration-red-500 underline-offset-4 transition-all" target="_blank" rel="noopener noreferrer" {...props} />,
                      code: ({node, ...props}) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                    }}>{m.text}</ReactMarkdown>
                  </div>
                ) : (
                  m.text
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <input className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium disabled:opacity-50" placeholder={isCooldown ? "Cooling down..." : "Query archives..."} value={prompt} onChange={e => setPrompt(e.target.value)} onKeyPress={e => e.key === 'Enter' && ask()} disabled={isCooldown} />
          <button onClick={ask} disabled={isCooldown} className="bg-white text-slate-900 px-10 rounded-2xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest disabled:opacity-50">
            {isCooldown ? <Loader2 size={12} className="animate-spin inline mr-2"/> : null}
            {isCooldown ? 'Cooldown' : 'Execute'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;