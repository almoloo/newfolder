import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import Script from 'next/script';
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import LayoutHeader from '@/components/layout/layout-header';
import LayoutFooter from '@/components/layout/layout-footer';
import AppProviders from '@/components/providers/app-providers';

const manrope = Manrope({
	variable: '--font-manrope',
	subsets: ['latin'],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const description =
	'Decentralized file storage with AI-powered chat, powered by 0G Network';

export const metadata: Metadata = {
	metadataBase: new URL(APP_URL),
	title: {
		default: 'NewFolder',
		template: '%s · NewFolder',
	},
	description,
	openGraph: {
		type: 'website',
		siteName: 'NewFolder',
		title: 'NewFolder',
		description,
		url: APP_URL,
	},
	twitter: {
		card: 'summary',
		title: 'NewFolder',
		description,
	},
	icons: {
		icon: [
			{ url: '/favicon.ico' },
			{ url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
			{ url: '/favicon.svg', type: 'image/svg+xml' },
		],
		apple: { url: '/apple-touch-icon.png' },
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${manrope.variable} h-full antialiased`}
			suppressHydrationWarning
		>
			<head>
				<Script
					id="theme-init"
					strategy="beforeInteractive"
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&d)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
					}}
				/>
			</head>
			<body className="min-h-full flex flex-col">
				<AppProviders>
					<LayoutHeader />
					<div className="flex flex-col grow centered-container my-5">
						{children}
					</div>
					<LayoutFooter />
				</AppProviders>
			</body>
		</html>
	);
}
