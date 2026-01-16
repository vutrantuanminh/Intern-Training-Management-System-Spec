import { useEffect, useState } from 'react';
import { useIsMobile } from '../hooks/useResponsive';

export function ResponsiveSidebar({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const isMobile = useIsMobile();

    // Lock body scroll when mobile drawer is open
    useEffect(() => {
        if (isMobile) {
            if (isOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }
        return () => {
            // restore on unmount
            document.body.style.overflow = '';
        };
    }, [isOpen, isMobile]);

    // Close on Escape for mobile drawer
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) setIsOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen]);

    if (!isMobile) {
        return (
            <aside
                className={`bg-gray-50 border-r min-h-screen transition-all duration-200 ease-in-out ${collapsed ? 'w-20' : 'w-64'}`}
            >
                <div className="flex items-center justify-between p-3">
                    <div className="text-sm font-semibold truncate">{/* optional brand */}</div>
                    <button
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1 rounded hover:bg-gray-100"
                    >
                        {collapsed ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 00-1.414 0L8 8.586 11.293 11.88a1 1 0 001.414-1.414L10.414 9l2.293-2.293a1 1 0 000-1.414z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                </div>
                <div className="overflow-hidden h-full">
                    {children}
                </div>
            </aside>
        );
    }

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md md:hidden"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer */}
            <aside
                className={`
          fixed top-0 left-0 h-full w-64 bg-white z-50
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                {children}
            </aside>
        </>
    );
}
