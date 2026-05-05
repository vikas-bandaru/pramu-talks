import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, setDoc,
  doc, deleteDoc, updateDoc, query, orderBy, initializeFirestore
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
  Cpu, Globe, Copy, Fingerprint, Video, Camera, Share2
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
  heroTitle: "Poetry in **Journalism.** Truth in Verse.",
  heroSubtitle: "Bridging the gap between the revolutionary literature of Sri Sri and the dynamic world of digital media.",
  heroBadge: "Nandi Awardee 2024",
  philosophyTitle: "Core Philosophy",
  philosophyQuote: "Literature is not just words on a page; it is the heartbeat of society.",
  philosophyText: "Dr. Murthy's philosophy centers on 'Sahitya-Samaja'—the inevitable bond between art and social responsibility. Masterfully bridging classroom pedagogy with digital ethics.",
  philosophyAccent: "శ్రమయే జీవన సౌందర్యము",
  awardsTitle: "Awards & Honors",
  nandiTitle: "Prestigious Nandi Award",
  nandiText: "Recognized for the acclaimed digital documentary series on Revolutionary Poet Sri Sri. Celebrated for historical depth and narrative excellence.",
  samratTitle: "Sahitya Samrat",
  samratText: "Conferred by state literary circles for significant contribution to poetry research and book analysis.",
  heroBgUrl: "",
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
    const worksQuery = query(worksRef, orderBy('createdAt', 'desc'));
    const worksUnsub = onSnapshot(worksQuery, (snapshot) => {
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
      await addDoc(worksRef, { ...data, createdAt: new Date().toISOString() });
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
    if (id.startsWith('s')) {
      setWorks(works.filter(w => w.id !== id));
    } else {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'works', id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-red-100 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
      {systemStatus.message && (
        <div className={`fixed top-16 left-0 right-0 z-[60] px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top duration-300 ${systemStatus.type === 'error' ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-900'}`}>
           <span className="flex items-center justify-center gap-2"><AlertCircle size={12}/> {systemStatus.message}</span>
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
                { id: 'videos', label: 'Videos', icon: PlayCircle },
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
                { id: 'videos', label: 'Videos', icon: PlayCircle },
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
        {activeTab === 'home' && <HomeView setActiveTab={setActiveTab} data={homeData} />}
        {activeTab === 'works' && <ArchiveView works={works.filter(w => filter === 'all' || w.type === filter)} isAdmin={isAdmin} onDelete={handleDelete} setFilter={setFilter} currentFilter={filter} />}
        {activeTab === 'videos' && <VideosView works={featuredVideos} />}
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
          />
        )}
        {activeTab === 'research' && isAdmin && <ResearchLab apiKey={activeApiKey} />}
      </div>
      <Footer socials={socialLinks} />
    </div>
  );
};

// --- View Components ---

const HomeView = ({ setActiveTab, data }) => (
  <div className="animate-in fade-in duration-700">
    <section className="bg-slate-900 text-white py-32 relative overflow-hidden dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 text-red-500 text-[10px] font-black uppercase tracking-widest mb-8 border border-red-600/20"><Award className="w-3.5 h-3.5" /> {data.heroBadge}</div>
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tight uppercase">
            <ReactMarkdown components={{ p: ({node, ...props}) => <React.Fragment {...props}/>, strong: ({node, ...props}) => <span className="text-red-600 underline decoration-white/10 underline-offset-8" {...props} /> }}>{data.heroTitle}</ReactMarkdown>
          </h1>
          <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl font-medium">{data.heroSubtitle}</p>
          <div className="flex flex-wrap gap-5">
            <button onClick={() => setActiveTab('videos')} className="bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-red-600/20 active:scale-95">Watch Channel</button>
            <button onClick={() => setActiveTab('works')} className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/10 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95">The Archive</button>
          </div>
        </div>
      </div>
      {data.heroBgUrl && <img src={data.heroBgUrl} className="absolute inset-0 w-full h-full object-cover opacity-20" alt=""/>}
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
          <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter dark:text-white">Academic Roots</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">The Journey of a Scholar</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: GraduationCap, title: 'PhD, Telugu Literature', desc: 'Specializing in modern poetry and the cultural shift of the 1940s-60s.' },
            { icon: School, title: 'JNV Mentorship', desc: 'Decades of shaping young minds in Jawahar Navodaya Vidyalayas across regions.' },
            { icon: History, title: 'Media Evolution', desc: 'From the precision of print newsrooms to the viral impact of YouTube journalism.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group dark:bg-slate-900 dark:border-slate-800">
              <div className="bg-slate-50 p-4 rounded-2xl w-fit mb-6 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors dark:bg-slate-950"><item.icon size={32} /></div>
              <h3 className="text-xl font-black mb-3 uppercase tracking-tighter dark:text-white">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed dark:text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Awards Restored */}
    <section className="py-24 bg-white border-b border-slate-50 px-4 dark:bg-slate-900 dark:border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
        <div className="flex-1">
          <h2 className="text-4xl font-black mb-8 uppercase tracking-tighter dark:text-white">{data.awardsTitle}</h2>
          <div className="flex gap-6 items-start mb-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-sm dark:bg-slate-950 dark:border-slate-800">
            <div className="bg-amber-100 p-4 rounded-2xl text-amber-600 flex-shrink-0 dark:bg-amber-900/20"><Award size={32} /></div>
            <div>
              <h4 className="font-black text-xl uppercase tracking-tight dark:text-white">{data.nandiTitle}</h4>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed dark:text-slate-400">{data.nandiText}</p>
            </div>
          </div>
          <div className="flex gap-6 items-start bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 border-dashed dark:bg-slate-950/50 dark:border-slate-800">
            <div className="bg-slate-200 p-4 rounded-2xl text-slate-600 flex-shrink-0 dark:bg-slate-800"><Star size={32} /></div>
            <div>
              <h4 className="font-black text-xl uppercase tracking-tight dark:text-white">{data.samratTitle}</h4>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed dark:text-slate-400">{data.samratText}</p>
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

    {/* Global Gallery Refactor */}
    <section className="py-24 bg-slate-50 px-4 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
           <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter dark:text-white">Moments in Media</h2>
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-[0.2em] mt-2">Visual Chronicles</p>
           </div>
           <div className="hidden md:flex gap-2 text-slate-400">
              <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center dark:border-slate-800"><ChevronLeft size={16}/></div>
              <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center dark:border-slate-800"><ChevronRight size={16}/></div>
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

const ArchiveView = ({ works, isAdmin, onDelete, setFilter, currentFilter }) => (
  <div className="max-w-7xl mx-auto px-4 py-16 animate-in slide-in-from-bottom-6 duration-500">
    <div className="flex flex-wrap gap-2 mb-16 items-center">
      {['all', 'book', 'essay', 'story', 'review', 'audiobook'].map(cat => (
        <button key={cat} onClick={() => setFilter(cat)} className={`px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all border ${currentFilter === cat ? 'bg-red-600 text-white border-red-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-600'}`}>{cat}</button>
      ))}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {works.map(work => (
        <div key={work.id} className="group bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <div className="aspect-[4/5] bg-slate-100 rounded-[2rem] overflow-hidden relative mb-6 dark:bg-slate-950">
            <img src={work.thumbnail || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400'} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt={work.title} />
            <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 dark:text-white">{work.type}</div>
            {isAdmin && <button onClick={() => onDelete(work.id)} className="absolute top-4 right-4 p-2.5 bg-red-600 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"><Trash2 size={16} /></button>}
          </div>
          <div className="px-3 pb-4 flex-1 flex flex-col">
            <h3 className="font-black text-slate-900 leading-tight line-clamp-2 h-10 mb-2 uppercase text-sm tracking-tight dark:text-white uppercase tracking-tighter">{work.title}</h3>
            <div className="space-y-1 mb-4">
              {work.type === 'review' && work.rating && <div className="flex gap-1 text-amber-500"><Star size={10} fill="currentColor" /><span className="text-[9px] font-black">{work.rating}/5 Rating</span></div>}
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
      ))}
    </div>
  </div>
);

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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="opacity-90 group-hover:opacity-100"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          )}
          {socials.twitter && (
            <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 rounded-2xl hover:bg-slate-800 transition-all text-white group" title="X (Twitter)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-90 group-hover:opacity-100"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z"/></svg>
            </a>
          )}
          {socials.facebook && (
            <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 rounded-2xl hover:bg-blue-600 transition-all text-white group" title="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="opacity-90 group-hover:opacity-100"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
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

const InputField = ({ label, name, placeholder, type="text", value, onChange, id }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{label}</label>
    <input id={id} name={name} className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none shadow-inner text-sm dark:bg-slate-950 dark:text-white" placeholder={placeholder} value={value} onChange={onChange} type={type} />
  </div>
);

const CreatorStudio = ({ onAdd, onUpdate, works, onDelete, isVideoLoading, onSync, socialLinks, homeData, systemConfig, db, appId, featuredVideos, user, onCopyUid, copiedUid }) => {
  const [studioTab, setStudioTab] = useState('archive');
  const [activeType, setActiveType] = useState('book');
  const [managerSearch, setManagerSearch] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '', thumbnail: '', brief: '', pubYear: '', pubMonth: '', 
    purchaseLink: '', awards: '', link: '', magazine: '', 
    sourceName: '', availableAt: '', rating: '', youtubeLink: '', bookLink: '',
    pdfUrl: '', audioUrl: ''
  });

  const [homeForm, setHomeForm] = useState(homeData);
  const [systemForm, setSystemForm] = useState(systemConfig);

  useEffect(() => { setHomeForm(homeData); }, [homeData]);
  useEffect(() => { setSystemForm(systemConfig); }, [systemConfig]);

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
    setIsFetching(true);
    
    // Clean data based on type
    const cleanedData = { ...form, type: activeType };
    if (activeType !== 'review') delete cleanedData.rating;
    
    let result;
    if (editingId) {
      result = await onUpdate(editingId, cleanedData);
    } else {
      result = await onAdd(cleanedData);
    }
    
    setIsFetching(false);
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
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'home_content'), homeForm);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSystemSubmit = async (e) => {
    e.preventDefault();
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'metadata', 'system_config'), systemForm);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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

    setIsFetching(true);
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
      setIsFetching(false);
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
                <button key={t.id} onClick={() => setActiveType(t.id)} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black uppercase tracking-widest text-[8px] transition-all ${activeType === t.id ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-400'}`}><t.icon size={12} /> {t.label}</button>
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
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { 
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const reader = new FileReader(); 
                    reader.onload = (event) => {
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        
                        // Limit dimensions to 1200px max
                        const MAX_DIM = 1200;
                        if (width > height) {
                          if (width > MAX_DIM) {
                            height *= MAX_DIM / width;
                            width = MAX_DIM;
                          }
                        } else {
                          if (height > MAX_DIM) {
                            width *= MAX_DIM / height;
                            height = MAX_DIM;
                          }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Iteratively compress if needed (target < 800KB)
                        let quality = 0.8;
                        let dataUrl = canvas.toDataURL('image/jpeg', quality);
                        
                        // Approx check: base64 string length / 1.33 = bytes
                        while (dataUrl.length > 800000 && quality > 0.1) {
                          quality -= 0.1;
                          dataUrl = canvas.toDataURL('image/jpeg', quality);
                        }
                        
                        if (dataUrl.length > 1000000) {
                          alert("Image is still too large after compression. Please use a smaller image file.");
                        } else {
                          setForm(f => ({...f, thumbnail: dataUrl}));
                        }
                      };
                      img.src = event.target.result;
                    }; 
                    reader.readAsDataURL(file); 
                  }} />
                </div>
                <InputField label="Primary URL (Content Link)" name="link" placeholder="YouTube or Article URL" value={form.link} onChange={e => setForm({...form, link: e.target.value})} />
                <InputField label="Work Title" name="title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="space-y-6">
                {activeType === 'book' && <>
                  <InputField label="Publishing Year" name="pubYear" value={form.pubYear} onChange={e => setForm({...form, pubYear: e.target.value})} />
                  <InputField label="Purchase Link" name="purchaseLink" value={form.purchaseLink} onChange={e => setForm({...form, purchaseLink: e.target.value})} />
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
                  <InputField label="Awards" name="awards" value={form.awards} onChange={e => setForm({...form, awards: e.target.value})} />
                </>}
                {(activeType === 'essay' || activeType === 'story') && <><InputField label="Magazine / Website" name="magazine" value={form.magazine} onChange={e => setForm({...form, magazine: e.target.value})} /><InputField label="Pub Date" name="pubYear" value={form.pubYear} onChange={e => setForm({...form, pubYear: e.target.value})} /></>}
                {activeType === 'review' && <><InputField label="Source Name" name="sourceName" value={form.sourceName} onChange={e => setForm({...form, sourceName: e.target.value})} /><InputField label="Rating (1-5)" name="rating" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} /><InputField label="Video Link" name="youtubeLink" value={form.youtubeLink} onChange={e => setForm({...form, youtubeLink: e.target.value})} /></>}
                {activeType === 'audiobook' && <>
                  <InputField label="Narrator / Author" name="sourceName" value={form.sourceName} onChange={e => setForm({...form, sourceName: e.target.value})} />
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
                <textarea className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none h-32 shadow-inner text-sm dark:bg-slate-950 dark:text-white" placeholder="Summary..." value={form.brief || ''} onChange={e => setForm({...form, brief: e.target.value})} />
                <InputField label="Manual Thumbnail URL" name="thumbnail" value={form.thumbnail} onChange={e => setForm({...form, thumbnail: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4">
              {editingId && <button type="button" onClick={() => setEditingId(null)} className="flex-1 bg-slate-100 text-slate-500 py-6 rounded-[2rem] font-black text-xs">Cancel</button>}
              <button type="submit" disabled={isFetching} className="flex-[2] bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 shadow-xl disabled:opacity-50 flex items-center justify-center gap-2">
                {isFetching ? <Loader2 size={16} className="animate-spin" /> : null}
                {isFetching ? (editingId ? 'Updating...' : 'Publishing...') : (editingId ? 'Apply Update' : 'Publish Live')}
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
                 <div className="grid md:grid-cols-2 gap-8">
                    <InputField label="Badge Text" value={homeForm.heroBadge} onChange={e => setHomeForm({...homeForm, heroBadge: e.target.value})} />
                    <InputField label="Hero Background URL" value={homeForm.heroBgUrl} onChange={e => setHomeForm({...homeForm, heroBgUrl: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Hero Headline (Use **text** for Red underline)</label>
                    <input className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none shadow-inner text-sm dark:bg-slate-950 dark:text-white" value={homeForm.heroTitle} onChange={e => setHomeForm({...homeForm, heroTitle: e.target.value})} />
                 </div>
                 <textarea className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none h-32 shadow-inner text-sm dark:bg-slate-950 dark:text-white" placeholder="Hero Subtitle..." value={homeForm.heroSubtitle} onChange={e => setHomeForm({...homeForm, heroSubtitle: e.target.value})} />
              </div>

              <div className="space-y-8">
                 <h3 className="text-xs font-black uppercase tracking-widest text-red-600 pb-2 border-b border-red-600/10">Philosophy & Moments</h3>
                 <div className="grid md:grid-cols-2 gap-8">
                    <InputField label="Philosophy Title" value={homeForm.philosophyTitle} onChange={e => setHomeForm({...homeForm, philosophyTitle: e.target.value})} />
                    <InputField label="Philosophy Accent (Telugu)" value={homeForm.philosophyAccent} onChange={e => setHomeForm({...homeForm, philosophyAccent: e.target.value})} />
                 </div>
                 <InputField label="Philosophy Quote" value={homeForm.philosophyQuote} onChange={e => setHomeForm({...homeForm, philosophyQuote: e.target.value})} />
                 <textarea className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none h-32 shadow-inner text-sm dark:bg-slate-950 dark:text-white" placeholder="Philosophy details..." value={homeForm.philosophyText} onChange={e => setHomeForm({...homeForm, philosophyText: e.target.value})} />
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
                    <InputField label="Gallery 1 (Studio)" value={homeForm.gallery1} onChange={e => setHomeForm({...homeForm, gallery1: e.target.value})} />
                    <InputField label="Gallery 2 (Literature)" value={homeForm.gallery2} onChange={e => setHomeForm({...homeForm, gallery2: e.target.value})} />
                    <InputField label="Gallery 3 (Teaching)" value={homeForm.gallery3} onChange={e => setHomeForm({...homeForm, gallery3: e.target.value})} />
                    <InputField label="Gallery 4 (Archive)" value={homeForm.gallery4} onChange={e => setHomeForm({...homeForm, gallery4: e.target.value})} />
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="flex justify-between items-end pb-2 border-b border-red-600/10">
                    <h3 className="text-xs font-black uppercase tracking-widest text-red-600">Media Moments Gallery</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{homeForm.gallery?.length || 0} Moments</p>
                 </div>
                 
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {(homeForm.gallery || []).map((moment, idx) => (
                       <div key={idx} className="group relative aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 dark:bg-slate-950 dark:border-slate-800">
                          <img src={moment.url} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 p-2 backdrop-blur-sm">
                             <p className="text-[8px] text-white font-bold truncate uppercase">{moment.label}</p>
                          </div>
                          <button type="button" onClick={() => {
                             const next = [...homeForm.gallery];
                             next.splice(idx, 1);
                             setHomeForm({...homeForm, gallery: next});
                          }} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                       </div>
                    ))}
                    
                    <button type="button" onClick={() => {
                       const input = document.createElement('input');
                       input.type = 'file';
                       input.accept = 'image/*';
                       input.onchange = (e) => {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onload = (event) => {
                             const img = new Image();
                             img.onload = () => {
                                const canvas = document.createElement('canvas');
                                const MAX_WIDTH = 1000;
                                let width = img.width;
                                let height = img.height;
                                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                                canvas.width = width; canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                ctx.drawImage(img, 0, 0, width, height);
                                const compressed = canvas.toDataURL('image/jpeg', 0.8);
                                const label = prompt("Enter a label for this moment (e.g. Studio, Event):") || "Media Moment";
                                setHomeForm(prev => ({...prev, gallery: [...(prev.gallery || []), { url: compressed, label }] }));
                             };
                             img.src = event.target.result;
                          };
                          reader.readAsDataURL(file);
                       };
                       input.click();
                    }} className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:border-red-600 hover:text-red-600 transition-all cursor-pointer dark:border-slate-800">
                       <Plus size={24} />
                       <span className="text-[8px] font-black uppercase mt-2">Add Moment</span>
                    </button>
                 </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 shadow-xl">Save Home Changes</button>
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
                 <div className="flex items-center gap-3 text-red-600 font-black uppercase tracking-widest text-[10px]"><Zap size={16}/> Gemini API Overrides</div>
                 <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Entering a key here will override the `VITE_GEMINI_API_KEY` defined in the build environment. This persists across all your devices.</p>
                 <InputField label="Gemini API Key" placeholder="Paste key here..." value={systemForm.geminiApiKey} onChange={e => setSystemForm({...systemForm, geminiApiKey: e.target.value})} />
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
                    <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2"><Fingerprint className="text-red-600" size={14}/> Security & Identity</h3>
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
              
              <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 shadow-xl">Apply System Config</button>
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
               <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mt-1">Context: Managing {studioTab === 'video' ? 'Videos' : 'Archive Entries'}</p>
            </div>
            <input value={managerSearch} onChange={e => setManagerSearch(e.target.value)} placeholder="Filter entries..." className="pl-6 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {(studioTab === 'video' ? featuredVideos : works).filter(w => (studioTab === 'video' ? w.title : w.title)?.toLowerCase().includes(managerSearch.toLowerCase())).map(work => (
                <tr key={work.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${editingId === work.id ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                  <td className="px-8 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden dark:bg-slate-800">
                      <img src={work.thumbnail} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-sm line-clamp-1 dark:text-white">{work.title}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded dark:bg-slate-800 dark:text-slate-400">
                      {studioTab === 'video' ? 'VIDEO CONTENT' : work.type}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    {studioTab !== 'video' && (
                      <button onClick={() => { setEditingId(work.id); setActiveType(work.type); setForm({...work}); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-2 text-slate-300 hover:text-blue-600 mr-2 transition-all">
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
        <div className="relative group">
           <div className="absolute -top-6 left-2 flex items-center gap-2 opacity-60 group-focus-within:opacity-100 transition-opacity">
              <Zap size={10} className="text-amber-500" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Smart Efficiency Mode Active • Concise Summaries Forced</span>
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
    </div>
  );
};

export default App;