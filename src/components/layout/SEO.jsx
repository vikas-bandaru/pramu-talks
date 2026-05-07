import React, { useEffect } from 'react';

const SEO = ({ tab }) => {
  useEffect(() => {
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

    const activeTitle = titles[tab] || titles.home;
    const activeDesc = descriptions[tab] || descriptions.home;

    // Update Title
    document.title = activeTitle;

    // Update Meta Tags
    const updateMeta = (name, content, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    updateMeta('description', activeDesc);
    updateMeta('og:title', activeTitle, 'property');
    updateMeta('og:description', activeDesc, 'property');

    // Update JSON-LD Structured Data
    let scriptEl = document.getElementById('json-ld-seo');
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'json-ld-seo';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Dr. Prasada Murthy",
      "jobTitle": ["Journalist", "Poet", "Scholar"],
      "award": "Nandi Award",
      "url": "https://pramu-talks.web.app/",
      "description": descriptions.home,
      "sameAs": ["https://www.youtube.com/@pramutalks"]
    };
    scriptEl.text = JSON.stringify(schemaData);
  }, [tab]);

  return null;
};

export default SEO;
