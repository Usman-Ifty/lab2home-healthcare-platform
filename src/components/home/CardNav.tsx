import React, { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

type CardNavLink = {
  label: string;
  href: string;
  ariaLabel: string;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  logo: string;
  logoAlt?: string;
  items: CardNavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  onExpandChange?: (isExpanded: boolean) => void;
}

const CardNav: React.FC<CardNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  ease = 'power3.out',
  baseColor = '#fff',
  menuColor,
  onExpandChange
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement;
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    // Ensure cards are set to initial state
    const validCards = cardsRef.current.filter(card => card != null);
    
    // Set initial states - IMPORTANT: use pixels for consistency
    gsap.set(navEl, { height: '60px', overflow: 'hidden' });
    gsap.set(validCards, { y: 50, opacity: 0, visibility: 'visible', display: 'flex' });

    const tl = gsap.timeline({ paused: true });

    const targetHeight = calculateHeight();

    tl.to(navEl, {
      height: targetHeight + 'px',
      duration: 0.4,
      ease
    });

    tl.to(validCards, { 
      y: 0, 
      opacity: 1, 
      duration: 0.4, 
      ease, 
      stagger: 0.08
    }, '-=0.1');

    return tl;
  };

  useLayoutEffect(() => {
    // Only create timeline once on mount
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }
    };
  }, []); // Empty deps - only run once on mount

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      
      // Only handle actual window resize, not state changes
      const newHeight = calculateHeight();
      
      if (isExpanded) {
        gsap.set(navRef.current, { height: newHeight + 'px' });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    
    if (!isExpanded) {
      // Opening menu
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      if (onExpandChange) onExpandChange(true);
      
      // Reset to beginning and play forward
      tl.progress(0);
      tl.timeScale(1);
      tl.play();
    } else {
      // Closing menu
      setIsHamburgerOpen(false);
      setIsExpanded(false);
      if (onExpandChange) onExpandChange(false);
      
      // Reverse from current position
      tl.timeScale(1);
      tl.reverse();
    }
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div
      className={`card-nav-container absolute left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] z-[9999] top-[1.2em] md:top-[2em] ${className}`}
    >
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? 'open' : ''} block p-0 rounded-2xl border border-white/20 dark:border-white/10 shadow-soft relative overflow-hidden will-change-[height] bg-white/70 dark:bg-card/70 backdrop-blur-xl transition-shadow duration-300 hover:shadow-medium`}
      >
        <div className="card-nav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between p-2 pl-[1.1rem] z-[2]">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''} group h-full flex flex-col items-center justify-center cursor-pointer gap-[6px] order-2 md:order-none`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            tabIndex={0}
            style={{ color: menuColor || '#000' }}
          >
            <div
              className={`hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] ${
                isHamburgerOpen ? 'translate-y-[4px] rotate-45' : ''
              } group-hover:opacity-75`}
            />
            <div
              className={`hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] ${
                isHamburgerOpen ? '-translate-y-[4px] -rotate-45' : ''
              } group-hover:opacity-75`}
            />
          </div>

          <Link to="/" className="logo-container flex items-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 order-1 md:order-none">
            <img src={logo} alt={logoAlt} className="logo h-[28px]" />
          </Link>

          <div className="hidden md:flex gap-3 items-center pr-2">
            <Button
              asChild
              variant="outline"
              className="h-[40px] rounded-full px-6 border-primary/20 hover:bg-primary/5 text-primary text-sm font-medium transition-all"
            >
              <Link to="/login">
                Sign In
              </Link>
            </Button>
            <Button
              asChild
              className="h-[40px] rounded-full px-6 shadow-soft hover:shadow-medium transition-all group text-sm font-medium"
            >
              <Link to="/signup">
                Get Started
                <GoArrowUpRight className="ml-1.5 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>

        <div
          className="card-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col items-stretch gap-2 justify-start z-[1] md:flex-row md:items-end md:gap-[12px]"
          style={{ 
            pointerEvents: isExpanded ? 'auto' : 'none',
            visibility: 'visible'
          }}
          aria-hidden={!isExpanded}
        >
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card select-none relative flex flex-col gap-2 p-[16px_20px] rounded-[calc(1rem-0.2rem)] min-w-0 flex-[1_1_auto] h-auto min-h-[60px] md:h-full md:min-h-0 md:flex-[1_1_0%] hover:-translate-y-1 hover:shadow-medium transition-all duration-300"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label font-normal tracking-[-0.5px] text-[18px] md:text-[22px]">
                {item.label}
              </div>
              <div className="nav-card-links mt-auto flex flex-col gap-[2px]">
                {item.links?.map((lnk, i) => (
                  <Link
                    key={`${lnk.label}-${i}`}
                    to={lnk.href}
                    className="nav-card-link inline-flex items-center gap-[6px] no-underline cursor-pointer transition-opacity duration-300 hover:opacity-75 text-[15px] md:text-[16px]"
                    aria-label={lnk.ariaLabel}
                    style={{ color: item.textColor }}
                  >
                    <GoArrowUpRight className="nav-card-link-icon shrink-0" aria-hidden="true" />
                    {lnk.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;

