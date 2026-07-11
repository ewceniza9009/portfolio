import { useState, useEffect, useCallback } from 'react';
import { ACCENT_THEMES, type AccentKey } from '../data/accents';
import { getSafeItem, setSafeItem } from '../utils/storage';

export function useGlobalTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document === 'undefined') return 'dark';
    const saved = getSafeItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    const isThemeRotEnabled = getSafeItem('rotation_theme_enabled') !== 'false';
    if (!isThemeRotEnabled) {
      const def = getSafeItem('default_theme');
      if (def === 'light' || def === 'dark') return def;
    }
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  });
  
  const [accent, setAccent] = useState<AccentKey>(() => {
    if (typeof document === 'undefined') return 'gold';
    const saved = getSafeItem('accent') as AccentKey;
    if (saved && ACCENT_THEMES[saved]) return saved;
    const isAccentRotEnabled = getSafeItem('rotation_accent_enabled') === 'true';
    if (!isAccentRotEnabled) {
      const def = getSafeItem('default_accent') as AccentKey;
      if (def && ACCENT_THEMES[def]) return def;
    }
    return (document.documentElement.getAttribute('data-accent') as AccentKey) || 'gold';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName === 'data-theme') {
          setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
        }
        if (m.attributeName === 'data-accent') {
          setAccent((document.documentElement.getAttribute('data-accent') as AccentKey) || 'gold');
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-accent'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback((event?: React.MouseEvent) => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = currentTheme === 'dark' ? 'light' : 'dark';
    
    const isAppearanceTransition = (document as any).startViewTransition && 
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isAppearanceTransition) {
      document.documentElement.setAttribute('data-theme', next);
      setSafeItem('theme', next);
      return;
    }

    const x = event && typeof event.clientX === 'number' ? event.clientX : window.innerWidth / 2;
    const y = event && typeof event.clientY === 'number' ? event.clientY : window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      document.documentElement.setAttribute('data-theme', next);
      setSafeItem('theme', next);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        { clipPath: next === 'dark' ? [...clipPath].reverse() : clipPath },
        {
          duration: 400,
          easing: 'ease-out',
          pseudoElement: next === 'dark' ? '::view-transition-old(root)' : '::view-transition-new(root)',
        }
      );
    });
  }, []);

  const changeAccent = useCallback((val: AccentKey) => {
    document.documentElement.setAttribute('data-accent', val);
    const themeSet = ACCENT_THEMES[val]?.[document.documentElement.getAttribute('data-theme') as 'dark' | 'light' || 'dark'];
    if (themeSet) {
      document.documentElement.style.setProperty('--accent', themeSet.accent);
      document.documentElement.style.setProperty('--accent-hover', themeSet.accentHover);
      document.documentElement.style.setProperty('--accent-dim', themeSet.accentDim);
      document.documentElement.style.setProperty('--accent-secondary', themeSet.accentSecondary);
      document.documentElement.style.setProperty('--accent-secondary-hover', themeSet.accentSecondaryHover);
      document.documentElement.style.setProperty('--accent-secondary-dim', themeSet.accentSecondaryDim);
    }
    setSafeItem('accent', val);
  }, []);

  const changeTheme = useCallback((val: 'dark' | 'light') => {
    document.documentElement.setAttribute('data-theme', val);
    setSafeItem('theme', val);
  }, []);

  return { theme, accent, toggleTheme, setAccent: changeAccent, setTheme: changeTheme };
}
