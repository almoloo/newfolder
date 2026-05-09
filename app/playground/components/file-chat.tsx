'use client';

import { useBalance, useInvalidateBalance } from '@/lib/hooks/use-balance';
import { useEffect, useRef, useState } from 'react';

interface Message {
	role: 'user' | 'assistant';
	content: string;
}

interface Pricing {
	pricePerHundredChars: string; // integer stars per 100 chars
}

interface Props {
	fileId: string;
	filename: string;
	providerAddress?: string;
}

// 1 star = 10^12 neuron (1 A0GI = 10^18 neuron = 10^6 stars)
const NEURON_PER_STAR = 10n ** 12n;

function formatStars(neuronStr: string): string {
	try {
		const stars = BigInt(neuronStr) / NEURON_PER_STAR;
		return `★ ${stars.toLocaleString()}`;
	} catch (e) {
		console.error('[formatStars] invalid input', neuronStr, e);
		return '★ 0';
	}
}

// Estimate fee in neuron for a given text length.
function estimateFee(text: string, pricePerHundredChars: bigint): bigint {
	const hundreds = BigInt(Math.max(1, Math.ceil(text.length / 100)));
	return pricePerHundredChars * NEURON_PER_STAR * hundreds;
}

export default function FileChat({ fileId, filename, providerAddress }: Props) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [streaming, setStreaming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loadingHistory, setLoadingHistory] = useState(true);
	const [pricing, setPricing] = useState<Pricing | null>(null);
	const [lastFee, setLastFee] = useState<string | null>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	const { data: balanceData } = useBalance();
	const invalidateBalance = useInvalidateBalance();
	const balance = balanceData?.availableAmount ?? '0';

	// Fetch pricing once on mount
	useEffect(() => {
		fetch('/api/ai/pricing')
			.then((r) => r.json())
			.then((d) => {
				if (d.pricePerHundredChars) setPricing(d as Pricing);
			})
			.catch(() => {});
	}, []);

	// Compute estimated fee for current input text
	const estimatedFee: bigint =
		pricing && input.trim()
			? estimateFee(input, BigInt(pricing.pricePerHundredChars))
			: 0n;
	const hasEnoughBalance =
		pricing && input.trim() ? BigInt(balance) >= estimatedFee : true;
	useEffect(() => {
		let cancelled = false;
		setLoadingHistory(true);
		fetch(`/api/files/${fileId}/chat`)
			.then((r) => r.json())
			.then((data) => {
				if (!cancelled && Array.isArray(data.messages)) {
					setMessages(
						data.messages.map(
							(m: {
								role: 'user' | 'assistant';
								content: string;
							}) => ({
								role: m.role,
								content: m.content,
							}),
						),
					);
				}
			})
			.catch(() => {
				// ignore — start with empty history on error
			})
			.finally(() => {
				if (!cancelled) setLoadingHistory(false);
			});
		return () => {
			cancelled = true;
		};
	}, [fileId]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	async function handleSend() {
		const text = input.trim();
		if (!text || streaming) return;

		const preSendBalance = balance;

		const userMessage: Message = { role: 'user', content: text };
		const nextMessages = [...messages, userMessage];
		setMessages(nextMessages);
		setInput('');
		setError(null);
		setStreaming(true);

		// Placeholder for the assistant reply being streamed in
		setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

		try {
			const res = await fetch(`/api/files/${fileId}/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: nextMessages,
					...(providerAddress ? { providerAddress } : {}),
				}),
			});

			if (!res.ok) {
				const json = await res.json();
				setError(json.error ?? `Request failed (${res.status})`);
				// Remove the empty assistant placeholder
				setMessages((prev) => prev.slice(0, -1));
				return;
			}

			// Parse SSE stream
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
					if (data === '[DONE]') {
						break;
					}

					try {
						const json = JSON.parse(data);
						const delta: string =
							json.choices?.[0]?.delta?.content ?? '';
						if (delta) {
							setMessages((prev) => {
								const updated = [...prev];
								updated[updated.length - 1] = {
									role: 'assistant',
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
			// Invalidate balance query and compute actual amount charged
			const before = BigInt(preSendBalance);
			invalidateBalance()
				.then(() => {
					const after = BigInt(balanceData?.availableAmount ?? '0');
					const charged = before - after;
					if (charged > 0n) setLastFee(String(charged));
				})
				.catch(() => {});
		}
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	return (
		<div className="border p-4 flex flex-col gap-3 h-125">
			<div className="flex items-center justify-between">
				<h3 className="font-semibold text-sm">
					Chat about: <span className="font-mono">{filename}</span>
				</h3>
				{/* Balance + fee indicator */}
				<div className="text-xs text-gray-500 flex gap-3">
					<span>
						Balance:{' '}
						<span
							className={
								BigInt(balance) === 0n
									? 'text-red-500'
									: 'text-green-600'
							}
						>
							{formatStars(balance)}
						</span>
					</span>
					{pricing && input.trim() && (
						<span>
							~{formatStars(String(estimatedFee))}
							{!hasEnoughBalance && (
								<span className="text-red-500 ml-1">
									(insufficient)
								</span>
							)}
						</span>
					)}
					{lastFee && !streaming && !input.trim() && (
						<span className="text-gray-400">
							Last: -{formatStars(lastFee)}
						</span>
					)}
				</div>
			</div>

			{/* Message list */}
			<div className="flex-1 overflow-y-auto flex flex-col gap-2 text-sm">
				{loadingHistory && (
					<p className="text-gray-400 text-xs">Loading history…</p>
				)}
				{!loadingHistory && messages.length === 0 && (
					<p className="text-gray-400 text-xs">
						Ask anything about this file…
					</p>
				)}
				{messages.map((m, i) => (
					<div
						key={i}
						className={`rounded p-2 whitespace-pre-wrap wrap-anywhere min-w-0 overflow-hidden ${
							m.role === 'user'
								? 'bg-sky-100 self-end max-w-[80%]'
								: 'bg-gray-100 self-start max-w-[90%]'
						}`}
					>
						{m.content ||
							(streaming && m.role === 'assistant' ? '▍' : '')}
					</div>
				))}
				{error && <p className="text-red-500 text-xs">{error}</p>}
				<div ref={bottomRef} />
			</div>

			{/* Input */}
			<div className="flex gap-2">
				<textarea
					className="flex-1 border p-2 text-sm resize-none"
					rows={2}
					placeholder="Ask about the file… (Enter to send, Shift+Enter for newline)"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={streaming}
				/>
				<button
					className="bg-sky-500 px-4 text-white text-sm disabled:bg-gray-400"
					onClick={handleSend}
					disabled={streaming || !input.trim() || !hasEnoughBalance}
				>
					{streaming ? '…' : 'Send'}
				</button>
			</div>
		</div>
	);
}
