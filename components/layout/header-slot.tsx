'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import HeroSection from '@/components/homepage/hero-section';
import NavigationMenu from '@/components/layout/navigation-menu';

const FILE_ROUTE = /^\/dashboard\/files\/([^\/]+)$/;

export default function HeaderSlot() {
	const pathname = usePathname();
	const isHome = pathname === '/';
	const fileMatch = FILE_ROUTE.exec(pathname);
	const fileId = fileMatch?.[1] ?? null;

	const [filename, setFilename] = useState<string | null>(null);

	useEffect(() => {
		if (!fileId) return;
		let cancelled = false;
		fetch(`/api/files/${fileId}`)
			.then((r) => r.json())
			.then((data) => {
				if (!cancelled) setFilename(data.filename ?? null);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
			setFilename(null);
		};
	}, [fileId]);

	if (isHome) {
		return <HeroSection />;
	}

	return <NavigationMenu fileTitle={filename} />;
}
