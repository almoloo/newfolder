'use client';

import { usePathname } from 'next/navigation';
import HeroSection from '@/components/homepage/hero-section';
import NavigationMenu from '@/components/layout/navigation-menu';

export default function HeaderSlot() {
	const pathname = usePathname();
	const isHome = pathname === '/';

	if (isHome) {
		return <HeroSection />;
	}

	return <NavigationMenu />;
}
