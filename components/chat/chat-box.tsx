'use client';

import { useState } from 'react';
import { isChatSupported } from '@/lib/utils';
import TabBar from '@/components/chat/tab-bar';
import ChatTab from '@/components/chat/chat-tab';
import ArchiveTab from '@/components/chat/archive.tab';

interface ChatBoxProps {
	fileId: string;
	filename: string;
	mimeType: string | null;
}

type Tab = 'chat' | 'archive';

export default function ChatBox({ fileId, filename, mimeType }: ChatBoxProps) {
	const [activeTab, setActiveTab] = useState<Tab>('chat');

	if (!isChatSupported(mimeType)) {
		return (
			<p className="text-sm text-neutral-400 text-center py-6 border border-neutral-200 dark:border-neutral-800 rounded-lg">
				Chat is only available for documents and text files.
			</p>
		);
	}

	return (
		<div className="border border-neutral-300/50 dark:border-neutral-700/50 rounded-lg overflow-hidden flex flex-col">
			<TabBar
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>
			{activeTab === 'chat' ? (
				<ChatTab
					fileId={fileId}
					filename={filename}
				/>
			) : (
				<ArchiveTab fileId={fileId} />
			)}
		</div>
	);
}
