import React, { useEffect, useRef } from 'react';

interface StockPriceGraphProps {
  ticker: string;
}

export default function StockPriceGraph({ ticker }: StockPriceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Remove any previous widget
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    // Create script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        // Set default chart type to Line
        new window.TradingView.widget({
          autosize: true,
          symbol: ticker,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'light',
          style: "2", // Use string '2' for Line chart (per TradingView docs)
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: `tradingview_${ticker}`,
        });
      }
    };
    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }
  }, [ticker]);

  return (
    <div className="stock-price-graph">
      <div
        className="stock-price-graph-chart"
        style={{ width: '100%', minHeight: 400, padding: 0 }}
      >
        <div
          id={`tradingview_${ticker}`}
          ref={containerRef}
          style={{ width: '100%', height: 400, borderRadius: '1rem', overflow: 'hidden', background: 'white' }}
        />
      </div>
      <div className="chart-placeholder" style={{ marginTop: 12, fontSize: '0.95rem', opacity: 0.7 }}>
        Interactive chart provided by TradingView
      </div>
    </div>
  );
}
