'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Timeline from '../../../components/Timeline';
import ThemeToggle from '../../../components/ThemeToggle';
import StockPriceSection from '../../../components/StockPriceSection';
import StockPriceGraph from '../../../components/StockPriceGraph';
import { tmcTimelineEvents } from '../../../data/TMCtimelineData';
import { tslaTimelineEvents } from '../../../data/TSLAtimelineData';
import { aaplTimelineEvents } from '../../../data/AAPLtimelineData';
import { amznTimelineEvents } from '../../../data/AMZNtimelineData';
import { msftTimelineEvents } from '../../../data/MSFTtimelineData';
import { googlTimelineEvents } from '../../../data/GOOGLtimelineData';
import { nvdaTimelineEvents } from '../../../data/NVDAtimelineData';
import { metaTimelineEvents } from '../../../data/METAtimelineData';
import { stocks } from '../../../data/stocksData';
import Link from 'next/link';

export default function StockTimelinePage() {
  const params = useParams();
  const ticker = params.ticker as string;
  
  // Find the stock info from our stocks data
  const stockInfo = stocks.find(stock => stock.ticker.toLowerCase() === ticker.toLowerCase());
  
  // Use client-side date to determine which events are in the past
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  if (!currentDate) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // If stock doesn't exist, show not found message
  if (!stockInfo) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ThemeToggle />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-3xl font-bold mb-6">Stock Not Found</h1>
          <p className="mb-8">We couldn't find information for ticker: {ticker}</p>
          <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  // Helper to get the correct timeline events array for each ticker
  const getTimelineEventsForTicker = (ticker: string) => {
    switch (ticker.toUpperCase()) {
      case 'TMC':
        return tmcTimelineEvents;
      case 'TSLA':
        return tslaTimelineEvents;
      case 'AAPL':
        return aaplTimelineEvents;
      case 'AMZN':
        return amznTimelineEvents;
      case 'MSFT':
        return msftTimelineEvents;
      case 'GOOGL':
        return googlTimelineEvents;
      case 'NVDA':
        return nvdaTimelineEvents;
      case 'META':
        return metaTimelineEvents;
      default:
        return null;
    }
  };

  // Only show the timeline if we have data for this ticker
  const timelineEvents = getTimelineEventsForTicker(ticker);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ThemeToggle />
      
      {/* Back button */}
      <div className="container mx-auto px-6 pt-8">
        <Link href="/" className="back-to-all-stocks">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to all stocks
        </Link>
      </div>
      
      {/* Stock header */}
      <div className="container mx-auto px-6 pt-4 pb-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
            {stockInfo.name}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 flex flex-col items-center justify-center gap-1">
            <span>
              {stockInfo.market}
              {stockInfo.ticker ? <span>: <span className="font-mono tracking-wide">{stockInfo.ticker}</span></span> : null}
            </span>
            <span className="text-base text-gray-500 dark:text-gray-400 mt-1">{stockInfo.sector}</span>
          </p>
        </div>
      </div>
      
      {/* Stock price section */}
      <StockPriceSection ticker={stockInfo.ticker} />

      {/* Stock price chart with time range selections */}
      <div className="stock-price-graph-container">
        <StockPriceGraph ticker={stockInfo.ticker} />
      </div>
      
      {/* Timeline section */}
      {timelineEvents ? (
        <Timeline events={timelineEvents} currentDate={currentDate} />
      ) : (
        <div className="container mx-auto px-6 py-20 text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Timeline data for {stockInfo.name} coming soon!
          </p>
        </div>
      )}
    </main>
  );
}