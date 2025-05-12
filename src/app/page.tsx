'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NavMenu from '../components/NavMenu';
import { stocks } from '../data/stocksData';
import { fetchFinnhubQuote } from '../utils/Finnhub';
import type { StockInfo } from '../data/stocksData';

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter stocks based on search term
  const filteredStocks = stocks.filter(stock => 
    stock.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    stock.ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get trending stocks
  const trendingStocks = stocks.filter(stock => stock.trending);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 home-page">
      <NavMenu />
      
      <div className="container mx-auto px-4 py-8">
        <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-8">
          Track key events that could impact stock performance
        </p>
        
        {/* Search bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search for a stock..."
            className="stock-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="search-icon">
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
        </div>
        
        {/* Trending stocks section */}
        {searchTerm.length === 0 && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Trending Stocks
            </h2>
            <div className="stock-grid">
              {trendingStocks.map((stock) => (
                <StockCard key={stock.ticker} stock={stock} />
              ))}
            </div>
          </>
        )}
        
        {/* Search results */}
        {searchTerm.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Search Results
            </h2>
            {filteredStocks.length > 0 ? (
              <div className="stock-grid">
                {filteredStocks.map((stock) => (
                  <StockCard key={stock.ticker} stock={stock} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-600 dark:text-gray-400">No stocks found matching "{searchTerm}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Stock card component
function StockCard({ stock }: { stock: StockInfo }) {
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
            <span className="flex flex-col items-end">
              <span className={priceClass}>${price.toFixed(2)}</span>
              {percent !== null && (
                <span className={percentClass}>
                  {change !== null && change > 0 ? '+' : ''}{percent.toFixed(2)}%
                </span>
              )}
            </span>
          ) : '—'}
        </div>
      </div>
    </Link>
  );
}