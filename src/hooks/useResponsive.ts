import { useEffect, useState } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};

export function useBreakpoint() {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>('2xl');

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < breakpoints.sm) setBreakpoint('sm');
            else if (width < breakpoints.md) setBreakpoint('md');
            else if (width < breakpoints.lg) setBreakpoint('lg');
            else if (width < breakpoints.xl) setBreakpoint('xl');
            else setBreakpoint('2xl');
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return breakpoint;
}

export function useIsMobile() {
    const breakpoint = useBreakpoint();
    return ['sm', 'md'].includes(breakpoint);
}

export function useIsTablet() {
    const breakpoint = useBreakpoint();
    return breakpoint === 'md' || breakpoint === 'lg';
}

export function useIsDesktop() {
    const breakpoint = useBreakpoint();
    return ['lg', 'xl', '2xl'].includes(breakpoint);
}
