type Tab = 'chat' | 'archive';

interface TabBarProps {
	activeTab: Tab;
	onTabChange: (tab: Tab) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
	return (
		<div className="flex border-b border-neutral-200 dark:border-neutral-800">
			<button
				className={`px-4 py-2.5 text-sm font-medium transition-colors ${
					activeTab === 'chat'
						? 'text-neutral-900 dark:text-neutral-100 border-b-2 border-neutral-900 dark:border-neutral-100 -mb-px'
						: 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
				}`}
				onClick={() => onTabChange('chat')}
			>
				Chat
			</button>
			<button
				className={`px-4 py-2.5 text-sm font-medium transition-colors ${
					activeTab === 'archive'
						? 'text-neutral-900 dark:text-neutral-100 border-b-2 border-neutral-900 dark:border-neutral-100 -mb-px'
						: 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
				}`}
				onClick={() => onTabChange('archive')}
			>
				History
			</button>
		</div>
	);
}
