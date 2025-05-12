export interface StockInfo {
  name: string;
  ticker: string;
  market: string;
  logo?: string;
  sector: string;
  trending?: boolean;
}

// Initial stocks list including the Magnificent 7 + TMC
export const stocks: StockInfo[] = [
  {
    name: "The Metals Company",
    ticker: "TMC",
    market: "NASDAQ",
    sector: "Basic Materials", 
    trending: true,
  },
  {
    name: "Apple",
    ticker: "AAPL",
    market: "NASDAQ",
    sector: "Technology",
    trending: true,
  },
  {
    name: "Microsoft",
    ticker: "MSFT",
    market: "NASDAQ",
    sector: "Technology",
    trending: true,
  },
  {
    name: "Alphabet",
    ticker: "GOOGL",
    market: "NASDAQ",
    sector: "Technology",
    trending: true,
  },
  {
    name: "Amazon",
    ticker: "AMZN",
    market: "NASDAQ",
    sector: "Consumer Cyclical",
    trending: true,
  },
  {
    name: "Nvidia",
    ticker: "NVDA",
    market: "NASDAQ",
    sector: "Technology",
    trending: true,
  },
  {
    name: "Tesla",
    ticker: "TSLA",
    market: "NASDAQ",
    sector: "Automotive",
    trending: true,
  },
  {
    name: "Meta Platforms",
    ticker: "META",
    market: "NASDAQ",
    sector: "Technology",
    trending: true,
  },
];