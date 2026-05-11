import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { timeAgo } from '@/lib/utils';
import CodeBlock from '@/components/chat/code-block';

interface MessageBubbleProps {
	side: 'received' | 'sent';
	text: string;
	date: Date;
}

export default function MessageBubble({
	side,
	text,
	date,
}: MessageBubbleProps) {
	return (
		<div
			className={`flex items-end gap-3 ${side === 'received' ? 'flex-col md:flex-row' : 'md:flex-row-reverse'}`}
		>
			<div
				className={`rounded-xl text-sm leading-relaxed px-3 md:px-7 py-3 md:py-5 ${side === 'received' ? 'bg-slate-400/10 w-full md:w-4/5 rounded-bl-xs' : 'bg-rose-300/10 w-4/5 rounded-br-xs'}`}
			>
				<ReactMarkdown
					remarkPlugins={[remarkGfm]}
					components={{
						p: ({ children }) => (
							<p className="mb-2 last:mb-0">{children}</p>
						),
						ul: ({ children }) => (
							<ul className="list-disc pl-4 mb-2 last:mb-0 space-y-0.5">
								{children}
							</ul>
						),
						ol: ({ children }) => (
							<ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-0.5">
								{children}
							</ol>
						),
						li: ({ children }) => (
							<li className="leading-snug">{children}</li>
						),
						pre: ({ children }) => {
							const codeEl = children as React.ReactElement<{
								children?: React.ReactNode;
							}>;
							const text = String(codeEl?.props?.children ?? '');
							return <CodeBlock>{text}</CodeBlock>;
						},
						code: ({ children }) => (
							<code className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 text-xs font-mono">
								{children}
							</code>
						),
						strong: ({ children }) => (
							<strong className="font-semibold">
								{children}
							</strong>
						),
						a: ({ href, children }) => (
							<a
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								className="underline underline-offset-2 opacity-80 hover:opacity-100"
							>
								{children}
							</a>
						),
						blockquote: ({ children }) => (
							<blockquote className="border-l-2 border-current opacity-60 pl-3 my-2">
								{children}
							</blockquote>
						),
						table: ({ children }) => (
							<div className="overflow-x-auto my-2">
								<table className="text-xs border-collapse w-full">
									{children}
								</table>
							</div>
						),
						th: ({ children }) => (
							<th className="border border-current/20 px-2 py-1 font-semibold text-left">
								{children}
							</th>
						),
						td: ({ children }) => (
							<td className="border border-current/20 px-2 py-1">
								{children}
							</td>
						),
					}}
				>
					{text}
				</ReactMarkdown>
			</div>
			<time
				dateTime={date.toISOString()}
				className="text-xs text-neutral-400 mb-2"
			>
				{timeAgo(date)}
			</time>
		</div>
	);
}
