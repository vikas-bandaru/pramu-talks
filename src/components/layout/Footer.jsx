import React from 'react';
import { Mic2 } from 'lucide-react';

const Footer = ({ socials }) => (
  <footer className="bg-slate-900 text-white py-24 px-4 overflow-hidden relative dark:bg-black">
    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 relative z-10">
      <div>
        <div className="flex items-center gap-3 mb-8">
          <Mic2 className="text-red-600 w-8 h-8" />
          <h2 className="text-3xl font-black tracking-tighter">Pramu Talks</h2>
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
        <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-12 dark:text-slate-600">© 2026 Pramu Talks. Official Dr. Prasada Murthy Archive.</p>
      </div>
    </div>
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 blur-[100px] rounded-full -mr-64 -mt-64" />
  </footer>
);

export default Footer;
