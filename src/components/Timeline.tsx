import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import TimelineCard from './TimelineCard';
import { TimelineEvent } from '../types';
import { format, parse, isValid } from 'date-fns';

interface TimelineProps {
  events: TimelineEvent[];
  currentDate: Date;
}

export default function Timeline({ events, currentDate }: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineLineRef = useRef<HTMLDivElement>(null);
  const timelineLinePastRef = useRef<HTMLDivElement>(null);
  const currentDateIndicatorRef = useRef<HTMLDivElement>(null);
  const [currentDatePosition, setCurrentDatePosition] = useState(0);
  const [showDateIndicator, setShowDateIndicator] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});
  const [exactDotDetails, setExactDotDetails] = useState<{ top: number; left: number } | null>(null);

  // Retry mechanism for edge cases where the dot might not be immediately available
  const retryRef = useRef({ count: 0, maxRetries: 5 });

  // Format the current date for display
  const formattedCurrentDate = format(currentDate, 'MMM d, yyyy');

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    // Check on initial render
    checkMobile();

    // Add listener for window resize
    window.addEventListener('resize', checkMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Memoize sorted events to prevent unnecessary re-renders
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  // --- Slider and Filter State ---
  // Calculate min/max year and quarters
  const minDate = sortedEvents[0]?.date;
  const maxDate = sortedEvents[sortedEvents.length - 1]?.date;
  const getQuarter = (date: Date) => Math.floor(date.getMonth() / 3) + 1;
  const getQuarterLabel = (date: Date) => `Q${getQuarter(date)} ${date.getFullYear()}`;
  // Build all quarters between min and max
  const buildQuarters = () => {
    if (!minDate || !maxDate) return [];
    const quarters = [];
    let year = minDate.getFullYear();
    let quarter = getQuarter(minDate);
    while (year < maxDate.getFullYear() || (year === maxDate.getFullYear() && quarter <= getQuarter(maxDate))) {
      quarters.push({ year, quarter, label: `Q${quarter} ${year}` });
      quarter++;
      if (quarter > 4) { quarter = 1; year++; }
    }
    return quarters;
  };
  const quarters = useMemo(buildQuarters, [minDate, maxDate]);
  const [quarterRange, setQuarterRange] = useState<[number, number]>([0, Math.max(0, quarters.length - 1)]);
  const [eventTypeFilter, setEventTypeFilter] = useState<{ Company: boolean; Policy: boolean }>({ Company: true, Policy: true });

  // Update quarterRange if quarters change
  useEffect(() => {
    setQuarterRange([0, Math.max(0, quarters.length - 1)]);
  }, [quarters.length]);

  // Filter and slice events for display
  const filteredEvents = useMemo(() => {
    // Filter by type first
    let filtered = sortedEvents.filter(e => eventTypeFilter[e.type]);
    // Then filter by quarter range
    if (quarters.length > 0) {
      const startQ = quarters[quarterRange[0]];
      const endQ = quarters[quarterRange[1]];
      filtered = filtered.filter(e => {
        const q = getQuarter(e.date);
        const y = e.date.getFullYear();
        const afterStart = (y > startQ.year) || (y === startQ.year && q >= startQ.quarter);
        const beforeEnd = (y < endQ.year) || (y === endQ.year && q <= endQ.quarter);
        return afterStart && beforeEnd;
      });
    }
    return filtered;
  }, [sortedEvents, eventTypeFilter, quarterRange, quarters]);

  // Handlers for slider and filter
  const handleQuarterSliderChange = (e: React.ChangeEvent<HTMLInputElement>, which: 'start' | 'end') => {
    const value = parseInt(e.target.value, 10);
    setQuarterRange(prev => {
      if (which === 'start') return [Math.min(value, prev[1]), prev[1]];
      else return [prev[0], Math.max(value, prev[0])];
    });
  };
  const handleFilterToggle = (type: 'Company' | 'Policy') => {
    setEventTypeFilter(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Find pending event (first event that hasn't happened yet)
  const pendingEventIndex = useMemo(() => {
    return sortedEvents.findIndex(event => event.date > currentDate);
  }, [sortedEvents, currentDate]);

  // Check if the pending event is same day as current date
  const isSameDayAsPendingEvent = useMemo(() => {
    if (pendingEventIndex >= 0 && sortedEvents.length > pendingEventIndex) {
      const pendingEvent = sortedEvents[pendingEventIndex];
      return (
        pendingEvent.date.getDate() === currentDate.getDate() &&
        pendingEvent.date.getMonth() === currentDate.getMonth() &&
        pendingEvent.date.getFullYear() === currentDate.getFullYear()
      );
    }
    return false;
  }, [pendingEventIndex, sortedEvents, currentDate]);

  // Function to calculate the current date position - memoized to use in dependency arrays
  const calculateCurrentDatePosition = useCallback(() => {
    if (!timelineRef.current) return;

    let newPosition = 0;
    let shouldShowIndicator = false;
    let exactDotPosition = null; // Store exact dot position for same-day events

    // Handle different timeline positioning scenarios
    if (pendingEventIndex <= 0) {
      // If current date is before first event or there are no future events
      if (sortedEvents.length > 0) {
        try {
          // Position at first event
          const firstEventElement = timelineRef.current.querySelector('.timeline-event-card');
          if (firstEventElement) {
            const firstElementRect = firstEventElement.getBoundingClientRect();
            const timelineRect = timelineRef.current.getBoundingClientRect();
            newPosition = firstElementRect.top - timelineRect.top - 20; // Position slightly above first event
            shouldShowIndicator = true;
          }
        } catch (error) {
          console.error('Error calculating first element position:', error);
        }
      }
    } else {
      try {
        // Get all event elements
        const eventElements = Array.from(timelineRef.current.querySelectorAll('.timeline-event-card'));
        
        // Check if the current date is on the exact same day as the pending event
        const pendingEvent = sortedEvents[pendingEventIndex];
        const isSameDay = pendingEvent &&
          pendingEvent.date.getDate() === currentDate.getDate() &&
          pendingEvent.date.getMonth() === currentDate.getMonth() &&
          pendingEvent.date.getFullYear() === currentDate.getFullYear();
        
        // If date is the same as pending event, position exactly at the dot's center
        if (isSameDay && eventElements.length > pendingEventIndex) {
          const currentEventElement = eventElements[pendingEventIndex];
          
          // Get the dot element first to ensure it exists
          const timelineDot = currentEventElement.querySelector('.timeline-dot.current');
          
          if (timelineDot) {
            const dotRect = timelineDot.getBoundingClientRect();
            const timelineRect = timelineRef.current.getBoundingClientRect();
            
            // Calculate the exact center of the dot
            exactDotPosition = {
              top: dotRect.top - timelineRect.top + (dotRect.height / 2),
              left: dotRect.left - timelineRect.left + (dotRect.width / 2),
              width: dotRect.width,
              height: dotRect.height
            };
            
            // Set position at dot center
            newPosition = exactDotPosition.top;
          } else {
            // Fallback if dot not found
            const eventRect = currentEventElement.getBoundingClientRect();
            const timelineRect = timelineRef.current.getBoundingClientRect();
            newPosition = eventRect.top - timelineRect.top + 50;
          }
        } 
        // Position between previous and next events based on date
        else if (eventElements.length > pendingEventIndex && pendingEventIndex > 0) {
          const prevEventElement = eventElements[pendingEventIndex - 1];
          const nextEventElement = eventElements[pendingEventIndex];
          
          // Get dots for more precise positioning
          const prevDot = prevEventElement.querySelector('.timeline-dot');
          const nextDot = nextEventElement.querySelector('.timeline-dot');
          const timelineRect = timelineRef.current.getBoundingClientRect();
          
          // Get timestamps for interpolation
          const prevEventDate = sortedEvents[pendingEventIndex - 1].date.getTime();
          const nextEventDate = sortedEvents[pendingEventIndex].date.getTime();
          const currentDateTime = currentDate.getTime();
          
          // Calculate position based on time difference ratio
          let timeRatio = (currentDateTime - prevEventDate) / (nextEventDate - prevEventDate);
          timeRatio = Math.min(Math.max(timeRatio, 0), 1); // Keep between 0 and 1
          
          // Determine positions using dots if available, otherwise use card positions
          let prevPos, nextPos;
          
          if (prevDot && nextDot) {
            const prevDotRect = prevDot.getBoundingClientRect();
            const nextDotRect = nextDot.getBoundingClientRect();
            
            prevPos = prevDotRect.top - timelineRect.top + (prevDotRect.height / 2);
            nextPos = nextDotRect.top - timelineRect.top + (nextDotRect.height / 2);
          } else {
            const prevEventRect = prevEventElement.getBoundingClientRect();
            const nextEventRect = nextEventElement.getBoundingClientRect();
            
            prevPos = prevEventRect.top - timelineRect.top + (prevEventRect.height / 2);
            nextPos = nextEventRect.top - timelineRect.top + (nextEventRect.height / 2);
          }
          
          // Calculate position with linear interpolation
          newPosition = prevPos + (nextPos - prevPos) * timeRatio;
          
          // Apply platform-specific fine-tuning
          if (isMobileView) {
            newPosition += 0; // No adjustment needed
          } else {
            newPosition += 0; // No adjustment needed
          }
        }
        // Fallback: position at pending event
        else if (eventElements.length > pendingEventIndex) {
          const pendingElement = eventElements[pendingEventIndex];
          const timelineDot = pendingElement.querySelector('.timeline-dot');
          const timelineRect = timelineRef.current.getBoundingClientRect();
          
          if (timelineDot) {
            const dotRect = timelineDot.getBoundingClientRect();
            // Adjust to align perfectly with dot center
            newPosition = dotRect.top - timelineRect.top + (dotRect.height / 2);
          } else {
            const elementRect = pendingElement.getBoundingClientRect();
            newPosition = elementRect.top - timelineRect.top - 20; // Position above the card
          }
        }
        
        shouldShowIndicator = true;
      } catch (error) {
        console.error('Error calculating date position:', error);
      }
    }      // Only update state when needed and ensure position is never negative
    if (shouldShowIndicator) {
      const safePosition = Math.max(0, newPosition);
      setCurrentDatePosition(safePosition);
      setShowDateIndicator(true);
      
      // Store the exact dot position in state and dataset for direct access
      if (exactDotPosition && timelineRef.current) {
        // Set exact dot details in state for reactive updates
        setExactDotDetails({
          top: exactDotPosition.top,
          left: exactDotPosition.left
        });
        
        // Also set as data attributes for immediate access during render
        timelineRef.current.dataset.dotCenterTop = String(exactDotPosition.top);
        timelineRef.current.dataset.dotCenterLeft = String(exactDotPosition.left);
        timelineRef.current.dataset.dotWidth = String(exactDotPosition.width);
        timelineRef.current.dataset.dotHeight = String(exactDotPosition.height);
      } else {
        // Clear dot position state and attributes
        setExactDotDetails(null);
        
        if (timelineRef.current) {
          delete timelineRef.current.dataset.dotCenterTop;
          delete timelineRef.current.dataset.dotCenterLeft;
          delete timelineRef.current.dataset.dotWidth;
          delete timelineRef.current.dataset.dotHeight;
        }
      }
    } else {
      setShowDateIndicator(false);
    }
  }, [pendingEventIndex, sortedEvents, currentDate, isMobileView, timelineRef]);

  // Handle card flip state with manual update of line position
  const handleCardFlip = (eventId: string, isFlipped: boolean) => {
    setFlippedCards(prev => ({
      ...prev,
      [eventId]: isFlipped
    }));

    // Force recalculation of timeline position after card flip animation finishes
    setTimeout(() => {
      calculateCurrentDatePosition();
    }, 650);
  };

  // Calculate current date position on component changes
  useEffect(() => {
    calculateCurrentDatePosition();

    // Also recalculate after a short delay to account for any DOM updates
    const timer = setTimeout(calculateCurrentDatePosition, 100);
    
    // Recalculate one more time after a longer delay to ensure all renders are complete
    const finalTimer = setTimeout(calculateCurrentDatePosition, 500);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(finalTimer);
    };
  }, [pendingEventIndex, sortedEvents, currentDate, flippedCards, isMobileView, calculateCurrentDatePosition]);
  
  // Recalculate on resize to ensure responsive alignment
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || !timelineRef.current) return;
    
    // Create a resize observer to detect changes in element dimensions
    const resizeObserver = new ResizeObserver(() => {
      // Use RAF to ensure we're not recalculating too frequently during resize
      requestAnimationFrame(() => {
        calculateCurrentDatePosition();
        
        // Extra call after a slight delay to ensure accurate calculation after all DOM updates
        setTimeout(calculateCurrentDatePosition, 100);
      });
    });
    
    // Observe the timeline element
    resizeObserver.observe(timelineRef.current);
    
    // Cleanup observer on unmount
    return () => resizeObserver.disconnect();
  }, [calculateCurrentDatePosition]);

  // Direct DOM manipulation to ensure alignment when same-day event is detected
  useEffect(() => {
    if (isSameDayAsPendingEvent && timelineRef.current && timelineLinePastRef.current && currentDateIndicatorRef.current) {
      // First attempt with requestAnimationFrame to capture after initial render
      requestAnimationFrame(() => {
        // Then use another RAF to ensure we're after ALL renders
        requestAnimationFrame(() => {
          if (!timelineRef.current) return;
          
          // Find the current dot in the DOM
          const currentEventElement = Array.from(timelineRef.current.querySelectorAll('.timeline-event-card'))[pendingEventIndex];
          if (!currentEventElement) return;
          
          const timelineDot = currentEventElement.querySelector('.timeline-dot.current');
          if (!timelineDot) return;
          
          // Get exact position relative to timeline
          const dotRect = timelineDot.getBoundingClientRect();
          const timelineRect = timelineRef.current.getBoundingClientRect();
          const exactTop = dotRect.top - timelineRect.top + (dotRect.height / 2);
          
          // Update the state with the exact position
          setCurrentDatePosition(exactTop);
          
          // Apply exact positioning directly to DOM elements for immediate visual update
          if (timelineLinePastRef.current) {
            timelineLinePastRef.current.style.height = `${exactTop}px`;
          }
          
          if (currentDateIndicatorRef.current) {
            currentDateIndicatorRef.current.style.top = `${exactTop}px`;
            currentDateIndicatorRef.current.style.zIndex = '9';
            
            // Adjust width based on viewport
            const width = isMobileView ? '25px' : '40px';
            currentDateIndicatorRef.current.style.width = width;
          }
        });
      });
      
      // Set up a mutation observer to detect any DOM changes that might affect positioning
      const observer = new MutationObserver(() => {
        requestAnimationFrame(() => {
          // Recalculate position if DOM changes
          calculateCurrentDatePosition();
        });
      });
      
      if (timelineRef.current) {
        // Watch for changes in the timeline's direct children (event cards)
        observer.observe(timelineRef.current, { 
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class']
        });
      }
      
      // Clean up the observer when component unmounts or dependencies change
      return () => observer.disconnect();
    }
  }, [isSameDayAsPendingEvent, pendingEventIndex, isMobileView, calculateCurrentDatePosition]);

  useEffect(() => {
    // If we're on the same day as an event but couldn't find the dot, retry a few times
    if (isSameDayAsPendingEvent && !exactDotDetails && retryRef.current.count < retryRef.current.maxRetries) {
      const retryTimer = setTimeout(() => {
        retryRef.current.count++;
        calculateCurrentDatePosition();
      }, 200 * retryRef.current.count); // Increasing delays between retries
      
      return () => clearTimeout(retryTimer);
    }
    
    // Reset retry counter when dependencies change
    retryRef.current.count = 0;
  }, [isSameDayAsPendingEvent, exactDotDetails, calculateCurrentDatePosition]);

  // State for showing the back-to-top button
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Show/hide back-to-top button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Show when user has scrolled 400px below the top of the page
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check scroll position to show/hide jump button
  useEffect(() => {
    if (!timelineRef.current || pendingEventIndex < 0) return;

    const handleScroll = () => {
      const eventElements = Array.from(timelineRef.current!.children).filter(
        child => child.className.includes('timeline-event-card')
      );

      if (eventElements.length > pendingEventIndex) {
        const pendingElement = eventElements[pendingEventIndex] as HTMLElement;
        const rect = pendingElement.getBoundingClientRect();

        // Show button when pending event is not visible in viewport
        const isOutOfView = rect.top < 0 || rect.bottom > window.innerHeight;
        setShowJumpButton(isOutOfView);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Check initial scroll position
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [pendingEventIndex]);

  // Function to jump to current pending event
  const jumpToCurrent = () => {
    if (timelineRef.current && pendingEventIndex >= 0) {
      const eventElements = Array.from(timelineRef.current.children).filter(
        child => child.className.includes('timeline-event-card')
      );

      if (eventElements.length > pendingEventIndex) {
        eventElements[pendingEventIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  };

  // Function to jump to a specific date in the timeline
  const jumpToDate = (dateText: string) => {
    if (!timelineRef.current) return;

    // Try to parse the date from text using various formats
    const possibleFormats = [
      'MMM d, yyyy', 'MMM d yyyy', 'MMMM d, yyyy', 'MMMM d yyyy',
      'MMM dd, yyyy', 'MMM dd yyyy', 'MMMM dd, yyyy', 'MMMM dd yyyy'
    ];

    let targetDate: Date | null = null;

    // Try each format until we find one that works
    for (const dateFormat of possibleFormats) {
      const parsedDate = parse(dateText, dateFormat, new Date());
      if (isValid(parsedDate)) {
        targetDate = parsedDate;
        break;
      }
    }

    if (!targetDate) return;

    // Find the event closest to this date
    const eventElements = Array.from(timelineRef.current.children)
      .filter(child => child.className.includes('timeline-event-card'));

    // Find index of event that matches this date, or is closest to it
    const targetIndex = sortedEvents.findIndex(event => {
      return format(event.date, 'MMM d, yyyy') === format(targetDate!, 'MMM d, yyyy');
    });

    if (targetIndex >= 0 && eventElements[targetIndex]) {
      eventElements[targetIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  return (
    <div className="container mx-auto px-1 md:px-6 py-4 md:py-8">
      <div className="text-center mb-6 md:mb-12">
        <h2 className="text-base md:text-xl text-gray-600 font-bold">
          Key Company and Policy Events
        </h2>
      </div>

      {/* --- TIMELINE CONTROLS: Slider & Filter --- */}
      <div className="timeline-controls">
        {/* Quarter Slider */}
        <div className="timeline-slider">
          <div className="timeline-slider-labels">
            <span>{quarters[quarterRange[0]]?.label}</span>
            <span>{quarters[quarterRange[1]]?.label}</span>
          </div>
          <div className="relative w-full flex items-center justify-center" style={{height: 40}}>
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 bg-gray-200 rounded-lg z-0" style={{width: '100%'}}></div>
            <div
              className="absolute top-1/2 -translate-y-1/2 h-2 bg-blue-500 rounded-lg z-0 transition-all duration-200"
              style={{
                left: `${(quarterRange[0] / (quarters.length - 1)) * 100}%`,
                right: `${100 - (quarterRange[1] / (quarters.length - 1)) * 100}%`,
              }}
            ></div>
            {/* Both slider thumbs visible and usable */}
            <input
              type="range"
              min={0}
              max={quarters.length - 1}
              value={quarterRange[0]}
              onChange={e => handleQuarterSliderChange(e, 'start')}
              className="timeline-slider-thumb"
              aria-label="Start of visible quarter range"
              style={{ position: 'absolute', left: 0, top: 0, zIndex: 2 }}
            />
            <input
              type="range"
              min={0}
              max={quarters.length - 1}
              value={quarterRange[1]}
              onChange={e => handleQuarterSliderChange(e, 'end')}
              className="timeline-slider-thumb"
              aria-label="End of visible quarter range"
              style={{ position: 'absolute', left: 0, top: 0, zIndex: 2 }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-2">Adjust to show a subset of events by quarter</div>
        </div>
        {/* Filter */}
        <div className="timeline-filter">
          <span className="timeline-filter-label">Filter by Type</span>
          <label className={`timeline-filter-checkbox${eventTypeFilter.Company ? ' active' : ''}`}>
            <input
              type="checkbox"
              checked={eventTypeFilter.Company}
              onChange={() => handleFilterToggle('Company')}
            />
            Company
          </label>
          <label className={`timeline-filter-checkbox${eventTypeFilter.Policy ? ' active' : ''}`}>
            <input
              type="checkbox"
              checked={eventTypeFilter.Policy}
              onChange={() => handleFilterToggle('Policy')}
            />
            Policy
          </label>
        </div>
      </div>
      {/* Add margin below filter/slider before timeline */}
      <div className="mb-8"></div>

      <div className="max-w-full md:max-w-2xl mx-auto">
        <div ref={timelineRef} className="relative py-6 md:py-8 overflow-visible px-0 md:px-0">
          {/* Continuous timeline line that spans the entire container */}
          <div className="timeline-line" ref={timelineLineRef}></div>

          {/* Past timeline line segment - ensure exact height to meet indicator */}
          {showDateIndicator && (
            <div
              ref={timelineLinePastRef}
              className={`timeline-line-past ${isSameDayAsPendingEvent ? 'same-day-event' : ''}`}
              style={{
                top: 0,
                display: 'block',
                // Directly use dot center position for perfect alignment when available
                height: isSameDayAsPendingEvent && timelineRef.current?.dataset.dotCenterTop 
                  ? `${timelineRef.current.dataset.dotCenterTop}px` 
                  : `${currentDatePosition}px`,
                // Make line width slightly thicker for visibility on same-day events
                width: isSameDayAsPendingEvent ? '4px' : undefined
              }}
            ></div>
          )}

          {/* Current date indicator with label - center horizontally on the timeline */}
          {showDateIndicator && (
            <div
              ref={currentDateIndicatorRef}
              className={`current-date-indicator ${isSameDayAsPendingEvent ? 'same-day-event' : ''}`}
              style={{
                // Directly use dot center position for perfect alignment when available
                top: isSameDayAsPendingEvent && timelineRef.current?.dataset.dotCenterTop 
                  ? `${timelineRef.current.dataset.dotCenterTop}px`
                  : `${currentDatePosition}px`,
                display: 'flex',
                // Center the indicator and ensure it crosses through the dot
                transform: 'translateX(-50%)',
                // For same-day events, adjust Z-index to appear behind the dot
                zIndex: isSameDayAsPendingEvent ? 9 : 20
              }}
            >
              {!isMobileView && (
                <span className="current-date-label">
                  {formattedCurrentDate}
                </span>
              )}
            </div>
          )}

          {filteredEvents.map((event, index) => (
            <div key={event.id} className="relative timeline-event-card">
              <TimelineCard
                event={event}
                isPending={index === pendingEventIndex}
                isPast={index < pendingEventIndex}
                onJumpToDate={jumpToDate}
                onFlip={(isFlipped) => handleCardFlip(event.id, isFlipped)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Floating "Jump to Current" button */}
      {showJumpButton && (
        <button
          onClick={jumpToCurrent}
          className="jump-to-current-button"
          aria-label="Jump to current event"
        >
          Jump to current
        </button>
      )}

      {/* Floating "Back to Top" button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="back-to-top-button"
          aria-label="Back to top"
          style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}
        >
          Back to top
        </button>
      )}
    </div>
  );
}