'use client';

import {
	CheckSquareOffsetIcon,
	WarningIcon,
	XIcon,
} from '@phosphor-icons/react';
import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
} from 'react';

type ToastType = 'success' | 'error';

interface Toast {
	id: number;
	type: ToastType;
	message: string;
}

interface ToastContextValue {
	success: (message: string) => void;
	error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);
	const counter = useRef(0);

	const dismiss = useCallback((id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const show = useCallback(
		(type: ToastType, message: string) => {
			const id = ++counter.current;
			setToasts((prev) => [...prev, { id, type, message }]);
			setTimeout(() => dismiss(id), DURATION_MS);
		},
		[dismiss],
	);

	const ctx: ToastContextValue = {
		success: (msg) => show('success', msg),
		error: (msg) => show('error', msg),
	};

	return (
		<ToastContext.Provider value={ctx}>
			{children}
			{/* Portal-like fixed container */}
			<div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
				{toasts.map((t) => (
					<div
						key={t.id}
						className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm leading-relaxed max-w-sm animate-in fade-in slide-in-from-bottom-2 ${
							t.type === 'success'
								? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300/50 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-200'
								: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300/50 dark:border-rose-700/50 text-rose-800 dark:text-rose-200'
						}`}
					>
						{t.type === 'success' ? (
							<CheckSquareOffsetIcon
								size={18}
								weight="bold"
								className="text-emerald-500 shrink-0 mt-0.5"
							/>
						) : (
							<WarningIcon
								size={18}
								weight="fill"
								className="text-rose-400 shrink-0 mt-0.5"
							/>
						)}
						<span className="grow min-w-0 break-words">
							{t.message}
						</span>
						<button
							onClick={() => dismiss(t.id)}
							className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
							aria-label="Dismiss"
						>
							<XIcon
								size={14}
								weight="bold"
							/>
						</button>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast(): ToastContextValue {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error('useToast must be used inside ToastProvider');
	return ctx;
}
