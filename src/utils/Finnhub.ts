// Utility to fetch stock price data from Finnhub
// Requires FINNHUB_API_KEY to be set in environment variables

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

export async function fetchFinnhubQuote(ticker: string) {
  if (!FINNHUB_API_KEY) {
    throw new Error('Finnhub API key is not set. Please set NEXT_PUBLIC_FINNHUB_API_KEY in your environment.');
  }
  const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch Finnhub quote');
  }
  return res.json();
}

// Fetch historical price data for a ticker and time range
export async function fetchFinnhubHistorical(ticker: string, range: string, resolution?: string, from?: number, to?: number) {
  if (!FINNHUB_API_KEY) {
    throw new Error('Finnhub API key is not set. Please set NEXT_PUBLIC_FINNHUB_API_KEY in your environment.');
  }
  let _resolution = resolution;
  let _from = from;
  const _to = to ?? Math.floor(Date.now() / 1000);
  if (!_resolution || !_from) {
    // fallback to old logic if not provided
    const now = Math.floor(Date.now() / 1000);
    _resolution = 'D';
    switch (range) {
      case '1d':
        _resolution = '5';
        _from = now - 60 * 60 * 7;
        break;
      case '5d':
        _resolution = '15';
        _from = now - 60 * 60 * 24 * 5;
        break;
      case '1m':
        _resolution = '30';
        _from = now - 60 * 60 * 24 * 30;
        break;
      case '3m':
        _resolution = 'D';
        _from = now - 60 * 60 * 24 * 90;
        break;
      case '6m':
        _resolution = 'D';
        _from = now - 60 * 60 * 24 * 180;
        break;
      case 'ytd': {
        _resolution = 'D';
        const y = new Date().getFullYear();
        _from = Math.floor(new Date(`${y}-01-01`).getTime() / 1000);
        break;
      }
      case '1y':
        _resolution = 'D';
        _from = now - 60 * 60 * 24 * 365;
        break;
      case '5y':
        _resolution = 'W';
        _from = now - 60 * 60 * 24 * 365 * 5;
        break;
      case 'max':
        _resolution = 'M';
        _from = now - 60 * 60 * 24 * 365 * 10;
        break;
      default:
        _resolution = 'D';
        _from = now - 60 * 60 * 24 * 30;
    }
  }
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=${_resolution}&from=${_from}&to=${_to}&token=${FINNHUB_API_KEY}`;
  const res = await fetch(url);
  let errorMsg = '';
  if (!res.ok) {
    try {
      const errJson = await res.json();
      errorMsg = errJson.error || JSON.stringify(errJson);
    } catch {
      errorMsg = await res.text();
    }
    throw new Error(`Failed to fetch Finnhub historical data: ${errorMsg}`);
  }
  const json = await res.json();
  if (json.s && json.s !== 'ok') {
    throw new Error(`Finnhub API error: ${json.s}${json.error ? ' - ' + json.error : ''}`);
  }
  return json;
}
