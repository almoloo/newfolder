'use client';

import { useState, useRef, useEffect } from 'react';
import { useInvalidateBalance } from '@/lib/hooks/use-balance';
import MessageBubble from '@/components/chat/message-bubble';
import ChatForm from '@/components/chat/chat-form';

interface Message {
	role: 'user' | 'assistant';
	content: string;
	date: Date;
}

interface ChatTabProps {
	fileId: string;
	filename: string;
}

export default function ChatTab({ fileId, filename }: ChatTabProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [streaming, setStreaming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const invalidateBalance = useInvalidateBalance();

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	async function handleSend() {
		const text = input.trim();
		if (!text || streaming) return;

		const userMessage: Message = {
			role: 'user',
			content: text,
			date: new Date(),
		};
		const history = [...messages, userMessage];
		setMessages(history);
		setInput('');
		setError(null);
		setStreaming(true);
		setMessages((prev) => [
			...prev,
			{ role: 'assistant', content: '', date: new Date() },
		]);

		try {
			const res = await fetch(`/api/files/${fileId}/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: history.map(({ role, content }) => ({
						role,
						content,
					})),
				}),
			});

			if (!res.ok) {
				const json = await res.json();
				setError(json.error ?? `Request failed (${res.status})`);
				setMessages((prev) => prev.slice(0, -1));
				return;
			}

			const reader = res.body!.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() ?? '';
				for (const line of lines) {
					if (!line.startsWith('data: ')) continue;
					const data = line.slice(6).trim();
					if (data === '[DONE]') break;
					try {
						const delta: string =
							JSON.parse(data).choices?.[0]?.delta?.content ?? '';
						if (delta) {
							setMessages((prev) => {
								const updated = [...prev];
								updated[updated.length - 1] = {
									...updated[updated.length - 1],
									content:
										updated[updated.length - 1].content +
										delta,
								};
								return updated;
							});
						}
					} catch {
						// ignore malformed chunks
					}
				}
			}
		} catch (e) {
			setError(String(e));
			setMessages((prev) => prev.slice(0, -1));
		} finally {
			setStreaming(false);
			invalidateBalance();
		}
	}

	return (
		<div className="flex flex-col min-h-120">
			<div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
				{messages.length === 0 && (
					<p className="text-sm text-neutral-400 text-center m-auto">
						Ask anything about{' '}
						<span className="font-medium text-neutral-600 dark:text-neutral-300">
							{filename}
						</span>
					</p>
				)}
				{messages.map((m, i) => (
					<MessageBubble
						key={i}
						side={m.role === 'user' ? 'sent' : 'received'}
						text={m.content}
						date={m.date}
						isStreaming={
							streaming &&
							m.role === 'assistant' &&
							i === messages.length - 1
						}
					/>
				))}
				<div ref={bottomRef} />
			</div>
			<ChatForm
				value={input}
				onChange={setInput}
				onSubmit={handleSend}
				disabled={streaming}
				error={error}
			/>
		</div>
	);
}
