import { FilesIcon, WalletIcon } from '@phosphor-icons/react';
import NavigationLink from '@/components/layout/navigation-link';
import NavigationFile from '@/components/layout/navigation-file';

export default function NavigationMenu({
	fileTitle,
}: {
	fileTitle?: string | null;
}) {
	return (
		<section className="centered-container flex py-0">
			<nav className="flex">
				<NavigationLink
					href="/dashboard"
					title="Files"
					icon={
						<FilesIcon
							weight="duotone"
							size={20}
						/>
					}
				/>
				<NavigationLink
					href="/dashboard/balance"
					title="Balance"
					icon={
						<WalletIcon
							weight="duotone"
							size={20}
						/>
					}
				/>
			</nav>
			<div className="grow border-b-3 border-b-neutral-300/50"></div>
			{fileTitle != null && <NavigationFile title={fileTitle} />}
		</section>
	);
}
