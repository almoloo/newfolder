import WalletAuthButton from '@/components/wallet/wallet-auth-button';

export default function LayoutHeader() {
	return (
		<header className="border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/70">
			<div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
				<div>
					<p className="text-xs font-mono uppercase tracking-[0.24em] text-zinc-500">
						AI Vault
					</p>
					<h1 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
						NewFolder
					</h1>
				</div>
				<WalletAuthButton />
			</div>
		</header>
	);
}
