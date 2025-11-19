import { useEffect, useRef, useState } from "react";

/**
 * Hook that automatically adjusts font size to fit content within container
 * @param containerHeight - Maximum height of the container
 * @param minFontSize - Minimum font size in rem (default: 0.75rem)
 * @param maxFontSize - Maximum font size in rem (default: 1.125rem)
 */
export function useAutoFitText(
  containerHeight: number,
  minFontSize = 0.75,
  maxFontSize = 1.125,
) {
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useEffect(() => {
    if (!textRef.current) return;

    const element = textRef.current;
    
    const adjustFontSize = () => {
      if (!element) return;
      
      // Reset to max size first
      element.style.fontSize = `${maxFontSize}rem`;
      const contentHeight = element.scrollHeight;
      const availableHeight = containerHeight || 200;

      if (contentHeight > availableHeight) {
        // Binary search for optimal font size
        let low = minFontSize;
        let high = maxFontSize;
        let optimalSize = minFontSize;

        while (high - low > 0.01) {
          const mid = (low + high) / 2;
          element.style.fontSize = `${mid}rem`;
          const testHeight = element.scrollHeight;

          if (testHeight <= availableHeight) {
            optimalSize = mid;
            low = mid;
          } else {
            high = mid;
          }
        }

        element.style.fontSize = `${optimalSize}rem`;
        setFontSize(optimalSize);
      } else {
        setFontSize(maxFontSize);
      }
    };

    // Initial adjustment
    adjustFontSize();

    const resizeObserver = new ResizeObserver(() => {
      adjustFontSize();
    });

    resizeObserver.observe(element);

    // Also adjust on window resize
    window.addEventListener("resize", adjustFontSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", adjustFontSize);
    };
  }, [containerHeight, minFontSize, maxFontSize]);

  return { textRef, fontSize };
}

