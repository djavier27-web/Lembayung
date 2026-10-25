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

  const urls = [0, 1, 2, 3, 4, 5, 6, 7].map(i => `https://picsum.photos/seed/${encodeURIComponent(q)}-${i}/600/800`);
  res.status(200).json({ urls, source: 'fallback' });
};
