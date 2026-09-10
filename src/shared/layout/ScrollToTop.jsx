import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // If returning via POP or if a saved scroll position exists,
    // let the destination page handle scroll restoration after loading its data.
    const hasSavedScroll = sessionStorage.getItem('scroll_pos_' + pathname);
    if (navType === 'POP' || hasSavedScroll) {
      return;
    }

    if (hash) {
      const timer = setTimeout(() => {
        const el = document.getElementById(hash.replace('#', ''));
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, navType]);

  return null;
}

