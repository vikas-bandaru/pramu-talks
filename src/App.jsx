import React, { useState, useEffect, useRef } from 'react';
import SEO from './components/layout/SEO';
import Footer from './components/layout/Footer';
import HomeView from './components/views/Home/HomeView';
import ArchiveView from './components/views/Archive/ArchiveView';
import WorkDetailView from './components/views/Archive/WorkDetailView';
import ResearchLab from './components/views/Research/ResearchLab';
import CreatorStudio from './components/views/Studio/CreatorStudio';

import { initializeApp } from 'firebase/app';

import {
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, setDoc, getDocs, 
  doc, deleteDoc, updateDoc, query, orderBy, initializeFirestore, writeBatch 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


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
  heroTitle: "Dr. **Prasada Murthy**",
  heroSubtitle: "Poet • Journalist • YouTuber",
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

const App = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [works, setWorks] = useState([]);
  const [topVideos, setTopVideos] = useState(FALLBACK_VIDEOS);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [filter, setFilter] = useState('book');
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
                <h1 className="text-xl font-black tracking-tighter leading-none dark:text-white">Pramu Talks</h1>
                <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest leading-none mt-1 dark:text-red-500">Official Website</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              {[
                { id: 'home', label: 'Home', icon: Home },
                { id: 'works', label: 'Literature', icon: Library },
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
                { id: 'works', label: 'Literature', icon: Library },
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
        {activeTab === 'works' && !selectedWork && <ArchiveView works={works.filter(w => filter === 'all' || [].concat(w.type).some(t => t?.trim() === filter))} isAdmin={isAdmin} onDelete={handleDelete} setFilter={setFilter} currentFilter={filter} onSelect={setSelectedWork} />}
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
            storage={storage}
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

export default App;