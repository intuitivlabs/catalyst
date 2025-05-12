interface Window {
  jumpToTimelineDate?: (dateText: string) => void;
  TradingView?: {
    widget: new (...args: unknown[]) => unknown;
    [key: string]: unknown;
  };
}
