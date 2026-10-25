// Cari gambar. Pakai Pinterest API v5 jika PINTEREST_ACCESS_TOKEN diset, kalau tidak / gagal -> gambar cadangan.
module.exports = async (req, res) => {
  const q = String((req.query && req.query.q) || 'aesthetic').slice(0, 100);
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  const token = process.env.PINTEREST_ACCESS_TOKEN;

  if (token) {
    try {
      const r = await fetch('https://api.pinterest.com/v5/search/pins?' + new URLSearchParams({ query: q, country_code: 'ID', page_size: '12' }), {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (r.ok) {
        const j = await r.json();
        const urls = (j.items || []).map(p => {
          const im = p.media && p.media.images;
          const pick = im && (im['600x'] || im['400x300'] || im['150x150'] || Object.values(im)[0]);
          return pick && pick.url;
        }).filter(Boolean);
        if (urls.length) return res.status(200).json({ urls, source: 'pinterest' });
      }
    } catch (e) { /* jatuh ke fallback */ }
  }

  // Pexels (gratis): PEXELS_API_KEY
  if (process.env.PEXELS_API_KEY) {
    try {
      const r = await fetch('https://api.pexels.com/v1/search?' + new URLSearchParams({ query: q, per_page: '12', orientation: 'portrait' }), {
        headers: { Authorization: process.env.PEXELS_API_KEY }
      });
      if (r.ok) {
        const j = await r.json();
        const urls = (j.photos || []).map(p => p.src && (p.src.large || p.src.medium)).filter(Boolean);
        if (urls.length) return res.status(200).json({ urls, source: 'pexels' });
      }
    } catch (e) { /* lanjut */ }
  }

  // Unsplash (gratis): UNSPLASH_ACCESS_KEY
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY || 'ZT-cmS9hangRP_TdtULIWLYeVxxD-wx5bhf7iK512oQ';
  if (unsplashKey) {
    try {
      const r = await fetch('https://api.unsplash.com/search/photos?' + new URLSearchParams({ query: q, per_page: '12', orientation: 'portrait' }), {
        headers: { Authorization: 'Client-ID ' + unsplashKey }
      });
      if (r.ok) {
        const j = await r.json();
        const urls = (j.results || []).map(p => p.urls && (p.urls.regular || p.urls.small)).filter(Boolean);
        if (urls.length) return res.status(200).json({ urls, source: 'unsplash' });
      }
    } catch (e) { /* lanjut */ }
  }

  const urls = [0, 1, 2, 3, 4, 5, 6, 7].map(i => `https://picsum.photos/seed/${encodeURIComponent(q)}-${i}/600/800`);
  res.status(200).json({ urls, source: 'fallback' });
};
