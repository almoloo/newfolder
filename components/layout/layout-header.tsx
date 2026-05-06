import WalletAuthButton from '@/components/wallet/wallet-auth-button';
import Logo from '@/components/layout/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import HeaderSlot from '@/components/layout/header-slot';

export default function LayoutHeader() {
	return (
		<header className="bg-white border-b border-b-neutral-300/50 dark:bg-zinc-900 dark:border-b-neutral-700/50">
			<div className="flex  items-center justify-between centered-container">
				<Logo />
				<div className="flex items-center gap-3">
					<ThemeToggle />
					<WalletAuthButton />
				</div>
			</div>
			<HeaderSlot />
		</header>
	);
}
