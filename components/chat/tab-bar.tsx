import TabBalance from '@/components/chat/tab-balance';
import TabButton from '@/components/chat/tab-button';

type Tab = 'chat' | 'archive';

interface TabBarProps {
	activeTab: Tab;
	onTabChange: (tab: Tab) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
	return (
		<div className="flex">
			<TabButton
				title="Chat"
				isActive={activeTab === 'chat'}
				onClick={() => onTabChange('chat')}
			/>
			<TabButton
				title="History"
				isActive={activeTab === 'archive'}
				onClick={() => onTabChange('archive')}
			/>
			<div className="grow border-b-3 border-b-neutral-300/50"></div>
			<TabBalance />
		</div>
	);
}
