interface Window {
  jumpToTimelineDate?: (dateText: string) => void;
  TradingView?: {
    widget: (...args: unknown[]) => void;
    [key: string]: unknown;
  };
}
