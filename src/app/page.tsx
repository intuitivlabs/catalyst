'use client';

import { useState } from 'react';
import NavMenu from '../components/NavMenu';
import { stocks } from '../data/stocksData';
import StockCard from '../components/StockCard';

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
                <p className="text-gray-600 dark:text-gray-400">No stocks found matching &quot;{searchTerm}&quot;</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}