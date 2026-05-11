'use client';

import { useState } from 'react';
import { CopyIcon, CheckIcon } from '@phosphor-icons/react';

interface CodeBlockProps {
	children: string;
}

export default function CodeBlock({ children }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);

	function handleCopy() {
		navigator.clipboard.writeText(children).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}

	return (
		<div className="relative group my-3 rounded bg-white/40 dark:bg-white/20 border-l-4 border-l-neutral-300 dark:border-l-neutral-400">
			<button
				onClick={handleCopy}
				aria-label="Copy code"
				className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
			>
				{copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
			</button>
			<pre className="overflow-x-auto text-xs p-3 pr-8">
				<code>{children}</code>
			</pre>
		</div>
	);
}
