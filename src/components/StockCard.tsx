import { useEffect, useState } from 'react';
import { fetchFinnhubQuote } from '../utils/Finnhub';
import Link from 'next/link';
import { StockInfo } from '../data/stocksData';

interface StockCardProps {
  stock: StockInfo;
}

export default function StockCard({ stock }: StockCardProps) {
  const [price, setPrice] = useState<number | null>(null);
  const [prevClose, setPrevClose] = useState<number | null>(null);
  useEffect(() => {
    let isMounted = true;
    fetchFinnhubQuote(stock.ticker).then((data) => {
      if (isMounted && data && typeof data.c === 'number' && typeof data.pc === 'number') {
        setPrice(data.c);
        setPrevClose(data.pc);
      } else if (isMounted && data && typeof data.c === 'number') {
        setPrice(data.c);
        setPrevClose(null);
      }
    }).catch(() => {
      if (isMounted) {
        setPrice(null);
        setPrevClose(null);
      }
    });
    return () => { isMounted = false; };
  }, [stock.ticker]);

  let percent = null;
  let change = null;
  if (price !== null && prevClose !== null && prevClose !== 0) {
    change = price - prevClose;
    percent = (change / prevClose) * 100;
  }
  const isGain = change !== null && change > 0;
  const isLoss = change !== null && change < 0;
  const priceClass = isGain ? 'text-green-600' : isLoss ? 'text-red-600' : 'text-gray-700 dark:text-gray-200';
  const percentClass = isGain ? 'text-green-600' : isLoss ? 'text-red-600' : 'text-gray-500 dark:text-gray-400';

  return (
    <Link href={`/stocks/${stock.ticker}`} className="block">
      <div className="stock-card">
        <div className="stock-card-header">
          <div className="stock-card-name">{stock.name}</div>
          <div className="stock-card-ticker">{stock.ticker}</div>
        </div>
        <div className="stock-card-details">
          <div className="stock-card-market">{stock.market}</div>
          <div className="stock-card-sector">{stock.sector}</div>
        </div>
        <div className="stock-card-price">
          {price !== null ? (
            <span className={priceClass}>
              ${price.toFixed(2)}
              {percent !== null && (
                <span className={percentClass}>
                  {' '}({change !== null && change > 0 ? '+' : ''}{percent.toFixed(2)}%)
                </span>
              )}
            </span>
          ) : '—'}
        </div>
      </div>
    </Link>
  );
}