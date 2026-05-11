interface TabButtonProps {
	onClick: () => void;
	title: string;
	isActive: boolean;
}

export default function TabButton({
	onClick,
	title,
	isActive,
}: TabButtonProps) {
	return (
		<button
			className={`text-sm font-medium py-3 px-7 border-b-3 cursor-pointer ${isActive ? 'border-b-rose-500 text-rose-500 dark:text-rose-400 dark:border-b-rose-400' : 'border-b-neutral-300/50 hover:border-b-neutral-300/90 hover:bg-neutral-100/75 dark:hover:bg-neutral-100/10 active:border-b-neutral-500/25 active:bg-neutral-300/50'}`}
			onClick={onClick}
		>
			{title}
		</button>
	);
}
