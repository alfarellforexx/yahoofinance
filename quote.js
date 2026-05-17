export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker required' });

  let sym = String(ticker).trim().toUpperCase().replace(/\.JK$/i, '') + '.JK';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    });
    if (!response.ok) return res.status(response.status).json({ error: 'Yahoo error ' + response.status });
    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return res.status(404).json({ error: 'Data tidak tersedia untuk ' + sym });
    return res.status(200).json({
      price: parseFloat(meta.regularMarketPrice),
      prevClose: parseFloat(meta.chartPreviousClose || 0),
      date: new Date().toISOString().split('T')[0],
      symbol: sym
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
