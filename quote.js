export default async function handler(req, res) {
  // Allow CORS from anywhere
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { ticker } = req.query;
  if (!ticker) {
    return res.status(400).json({ error: 'ticker parameter required' });
  }

  // Normalisasi: BBCA → BBCA.JK
  let sym = String(ticker).trim().toUpperCase();
  if (!sym.endsWith('.JK')) sym = sym.replace(/\.JK$/i, '') + '.JK';

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Yahoo Finance error: ' + response.status });
    }

    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta) {
      return res.status(404).json({ error: 'Data tidak tersedia untuk ' + sym });
    }

    const price     = parseFloat(meta.regularMarketPrice);
    const prevClose = parseFloat(meta.chartPreviousClose || meta.previousClose || 0);
    const date      = new Date().toISOString().split('T')[0];

    return res.status(200).json({ price, prevClose, date, symbol: sym });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
