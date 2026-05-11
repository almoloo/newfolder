'use client';

import { use, Suspense, useState } from 'react';
import MessageBubble from '@/components/chat/message-bubble';

interface Message {
	role: 'user' | 'assistant';
	content: string;
	createdAt: string;
}

const PAGE_SIZE = 10;

// Module-level cache keeps the promise stable across re-renders.
const cache = new Map<string, Promise<Message[]>>();

function fetchMessages(fileId: string): Promise<Message[]> {
	if (!cache.has(fileId)) {
		cache.set(
			fileId,
			fetch(`/api/files/${fileId}/chat`)
				.then((r) => {
					if (!r.ok) throw new Error('Failed to load history');
					return r.json();
				})
				.then((d) => d.messages as Message[]),
		);
	}
	return cache.get(fileId)!;
}

function ArchiveTabContent({ fileId }: { fileId: string }) {
	const allMessages = use(fetchMessages(fileId));
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

	if (allMessages.length === 0) {
		return (
			<p className="text-sm text-neutral-400 text-center py-8">
				No chat history yet.
			</p>
		);
	}

	const start = Math.max(0, allMessages.length - visibleCount);
	const visible = allMessages.slice(start);
	const hasMore = start > 0;

	return (
		<div className="flex flex-col gap-5 p-5">
			{hasMore && (
				<button
					className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 self-center py-1"
					onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
				>
					Show more
				</button>
			)}
			{visible.map((m, i) => (
				<MessageBubble
					key={start + i}
					side={m.role === 'user' ? 'sent' : 'received'}
					text={m.content}
					date={new Date(m.createdAt)}
				/>
			))}
		</div>
	);
}

interface ArchiveTabProps {
	fileId: string;
}

export default function ArchiveTab({ fileId }: ArchiveTabProps) {
	return (
		<Suspense
			fallback={
				<p className="text-sm text-neutral-400 text-center py-8">
					Loading history…
				</p>
			}
		>
			<ArchiveTabContent fileId={fileId} />
		</Suspense>
	);
}
