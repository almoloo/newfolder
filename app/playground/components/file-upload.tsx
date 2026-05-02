'use client';

import { useRef, useState } from 'react';

interface Props {
	onSuccess?: () => void;
}

export default function FileUpload({ onSuccess }: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [result, setResult] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleUpload() {
		const file = inputRef.current?.files?.[0];
		if (!file) {
			setError('Select a file first');
			return;
		}

		setUploading(true);
		setError(null);
		setResult(null);

		try {
			const form = new FormData();
			form.append('file', file);

			const res = await fetch('/api/files', {
				method: 'POST',
				body: form,
			});

			const json = await res.json();

			if (!res.ok) {
				setError(json.error ?? `Upload failed (${res.status})`);
				return;
			}

			setResult(json);
			if (inputRef.current) inputRef.current.value = '';
			onSuccess?.();
		} catch (e) {
			setError(String(e));
		} finally {
			setUploading(false);
		}
	}

	return (
		<div className="border p-5 m-5 flex flex-col gap-2">
			<h2>Upload File</h2>
			<input
				ref={inputRef}
				type="file"
				className="border p-2"
			/>
			<button
				className="bg-sky-500 p-3 disabled:bg-gray-500"
				onClick={handleUpload}
				disabled={uploading}
			>
				{uploading ? 'UPLOADING…' : 'UPLOAD'}
			</button>
			{error && <p className="text-red-500">{error}</p>}
			{result && (
				<pre>
					<code>{JSON.stringify(result, null, 2)}</code>
				</pre>
			)}
		</div>
	);
}
