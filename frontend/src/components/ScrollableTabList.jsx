/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Chakra from '@chakra-ui/react';
import { centerTabLeft, fadeMask, hiddenEdges } from '../tabFade';

// A tab strip that says so when more tabs are out of view. On a phone four of the
// six main tabs are off-screen, and a thin scrollbar is easy to miss. This adds:
//  - a soft fade at each edge that still has tabs hidden beyond it, and
//  - scrolling the selected tab into view whenever the selection changes (for
//    example when "Use this HRR in…" jumps to another tab).
// It must be rendered inside <Tabs>. Extra props go to the underlying TabList.

const ScrollableTabList = ({ children, ...props }) => {
  const { selectedIndex } = Chakra.useTabsContext();
  const listRef = useRef(null);
  const [fade, setFade] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const next = hiddenEdges(list);
    setFade((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
  }, []);

  // Keep the fades right when the window is resized or the tab names change width.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    measure();
    list.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(list);
    return () => {
      list.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [measure]);

  // Bring the selected tab into view. Done by hand (not scrollIntoView) so only the
  // strip scrolls, never the page.
  useEffect(() => {
    const list = listRef.current;
    const tab = list?.children[selectedIndex];
    if (!tab || list.scrollWidth <= list.clientWidth) return;
    const left = centerTabLeft({ tabLeft: tab.offsetLeft, tabWidth: tab.offsetWidth, clientWidth: list.clientWidth });
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    list.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [selectedIndex]);

  const mask = fadeMask(fade);

  return (
    <Chakra.TabList
      ref={listRef}
      overflowX="auto"
      overflowY="hidden"
      position="relative" // so each tab's offsetLeft is measured from this strip
      sx={{
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': { height: '4px' },
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
      {...props}
    >
      {children}
    </Chakra.TabList>
  );
};

export default ScrollableTabList;
