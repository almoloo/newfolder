'use client';

import { useRef, useEffect } from 'react';
import { ArrowUpIcon } from '@phosphor-icons/react';

interface ChatFormProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	disabled?: boolean;
	error?: string | null;
}

export default function ChatForm({
	value,
	onChange,
	onSubmit,
	disabled,
	error,
}: ChatFormProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-resize textarea
	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = 'auto';
		el.style.height = `${el.scrollHeight}px`;
	}, [value]);

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (!disabled && value.trim()) onSubmit();
		}
	}

	return (
		<div className="flex flex-col border-t border-neutral-200 dark:border-neutral-800">
			{error && <p className="text-xs text-red-500 px-4 pt-2">{error}</p>}
			<div className="flex items-end gap-2">
				<textarea
					ref={textareaRef}
					rows={1}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={disabled}
					placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
					className="flex-1 resize-none bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none max-h-40 overflow-y-auto align-middle h-full px-4 py-3"
				/>
				<div className="flex items-center gap-3 shrink-0 m-2">
					<button
						onClick={onSubmit}
						disabled={disabled || !value.trim()}
						className="shrink-0 rounded-lg p-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 disabled:opacity-30 transition-opacity"
						aria-label="Send"
					>
						<ArrowUpIcon
							size={16}
							weight="bold"
						/>
					</button>
				</div>
			</div>
		</div>
	);
}
