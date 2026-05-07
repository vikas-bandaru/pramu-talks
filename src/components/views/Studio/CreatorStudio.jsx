import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Settings, Database, Save, Trash2, 
  RefreshCw, Link, Image as ImageIcon, CheckCircle2,
  AlertCircle, LayoutGrid, List, SortAsc, Activity,
  Key, Globe, Share2, Upload, FileText, Check, Copy, User,
  Library, Home, Video, Cpu, Book, Newspaper, PenTool, Star, 
  Headphones, Loader2, UploadCloud, MoveVertical, Edit3, Zap, Fingerprint
} from 'lucide-react';

import {
  getFirestore, collection, addDoc, onSnapshot, setDoc, getDocs,
  doc, deleteDoc, updateDoc, query, orderBy, initializeFirestore, writeBatch
} from 'firebase/firestore';
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from 'firebase/storage';

import InputField from '../../shared/InputField';
import { CATEGORIES } from '../../../constants/categories';

const CreatorStudio = ({
  onAdd, onUpdate, works, onDelete, isVideoLoading,
  onSync, socialLinks, homeData, systemConfig, db,
  storage,
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

  const types = CATEGORIES.map(cat => ({
    ...cat,
    icon: cat.id === 'book' ? Book :
          cat.id === 'essay' ? Newspaper :
          cat.id === 'story' ? PenTool :
          cat.id === 'review' ? Star :
          Headphones
  }));

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
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl p-6 md:p-14 border border-slate-100 relative overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          {showSuccess && <div className="absolute top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-xs animate-in slide-in-from-right">Playlist Updated</div>}
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-4 mb-4 dark:text-white"><Video className="text-red-600" /> Video Manager</h2>
          <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-10">Curate featured videos for the Trending Now section.</p>

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
                          <div className="flex flex-wrap gap-1">
                            {[].concat(work.type || []).map(t => {
                              const label = CATEGORIES.find(c => c.id === t)?.label || t;
                              return <span key={t} className="px-2 py-1 bg-red-50 text-red-600 text-[8px] font-black uppercase rounded-lg border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30">{label}</span>
                            })}
                          </div>
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

export default CreatorStudio;