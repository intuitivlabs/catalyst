import { useEffect, useState } from 'react';
import { fetchFinnhubQuote } from '../utils/Finnhub';

interface StockPriceSectionProps {
  ticker: string;
}

export default function StockPriceSection({ ticker }: StockPriceSectionProps) {
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetchFinnhubQuote(ticker)
      .then((quoteData) => {
        if (isMounted) {
          setQuote(quoteData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error fetching stock data');
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [ticker]);

  if (loading) return <div>Loading price...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!quote) return <div>No price data available.</div>;

  // Calculate daily change and percent
  const price = typeof quote.c === 'number' ? quote.c : null;
  const prevClose = typeof quote.pc === 'number' ? quote.pc : null;
  const change = price !== null && prevClose !== null ? price - prevClose : null;
  const percent = change !== null && prevClose !== 0 ? (change / prevClose) * 100 : null;
  const isGain = change !== null && change > 0;
  const isLoss = change !== null && change < 0;

  // Color classes
  const priceClass = isGain ? 'text-green-600' : isLoss ? 'text-red-600' : 'text-gray-700 dark:text-gray-200';
  const percentClass = isGain ? 'text-green-600' : isLoss ? 'text-red-600' : 'text-gray-500 dark:text-gray-400';

  return (
    <div className="stock-price-card stock-price-card-wide">
      <h2 className="text-xl font-bold mb-3 text-blue-900 dark:text-blue-200 tracking-tight">Current Price</h2>
      <div className="stock-price-main flex flex-col items-center gap-1">
        <span className={priceClass}>${price !== null ? price.toFixed(2) : '--'}</span>
        {percent !== null && (
          <span className={percentClass}>
            {change !== null && change > 0 ? '+' : ''}{percent.toFixed(2)}%
          </span>
        )}
      </div>
      <div className="stock-price-meta">
        <span>Open: <span className="font-semibold">${quote.o?.toFixed(2) ?? '--'}</span></span>
        <span>High: <span className="font-semibold">${quote.h?.toFixed(2) ?? '--'}</span></span>
        <span>Low: <span className="font-semibold">${quote.l?.toFixed(2) ?? '--'}</span></span>
      </div>
      <div className="stock-price-updated">Last updated: {new Date().toLocaleTimeString()}</div>
    </div>
  );
}
