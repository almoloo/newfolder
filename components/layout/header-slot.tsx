'use client';

import { usePathname } from 'next/navigation';
import HeroSection from '@/components/homepage/hero-section';

export default function HeaderSlot() {
	const pathname = usePathname();
	const isHome = pathname === '/';

	if (isHome) {
		return <HeroSection />;
	}

	return null;
}
