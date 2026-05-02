'use client';

import { useEffect, useState } from 'react';

interface FileItem {
	id: string;
	filename: string;
	mimeType: string | null;
	sizeBytes: string;
	quotedFee: string;
	chargedFee: string;
	status: string;
	createdAt: string;
}

interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasPreviousPage: boolean;
	hasNextPage: boolean;
}

interface ListResponse {
	items: FileItem[];
	pagination: Pagination;
}

interface Props {
	refreshKey?: number;
}

export default function FileList({ refreshKey }: Props) {
	const [data, setData] = useState<ListResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [error, setError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	// Re-fetch when parent signals a refresh (e.g. after a successful upload)
	useEffect(() => {
		if (data !== null) {
			fetchPage(page);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refreshKey]);

	async function fetchPage(p: number) {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/files?page=${p}&limit=10`);
			const json = await res.json();
			if (!res.ok) {
				setError(json.error ?? `Request failed (${res.status})`);
				return;
			}
			setData(json);
			setPage(p);
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Remove this file record?')) return;
		setDeletingId(id);
		try {
			const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				const json = await res.json();
				alert(json.error ?? `Delete failed (${res.status})`);
				return;
			}
			await fetchPage(page);
		} catch (e) {
			alert(String(e));
		} finally {
			setDeletingId(null);
		}
	}

	function handleDownload(id: string, filename: string) {
		const a = document.createElement('a');
		a.href = `/api/files/${id}/download`;
		a.download = filename;
		a.click();
	}

	return (
		<div className="border p-5 m-5 flex flex-col gap-2">
			<h2>Files</h2>
			<button
				className="bg-sky-500 p-3 disabled:bg-gray-500"
				onClick={() => fetchPage(1)}
				disabled={loading}
			>
				{loading ? 'LOADING…' : 'GET FILES'}
			</button>

			{error && <p className="text-red-500">{error}</p>}

			{data && (
				<>
					<p className="text-sm text-gray-500">
						{data.pagination.total} file(s) — page{' '}
						{data.pagination.page} of{' '}
						{data.pagination.totalPages || 1}
					</p>

					{data.items.length === 0 ? (
						<p>No files yet.</p>
					) : (
						<table className="w-full text-sm border-collapse">
							<thead>
								<tr className="text-left border-b">
									<th className="p-1">Filename</th>
									<th className="p-1">Size</th>
									<th className="p-1">Status</th>
									<th className="p-1">Actions</th>
								</tr>
							</thead>
							<tbody>
								{data.items.map((f) => (
									<tr
										key={f.id}
										className="border-b"
									>
										<td className="p-1 font-mono">
											{f.filename}
										</td>
										<td className="p-1">
											{Number(
												f.sizeBytes,
											).toLocaleString()}{' '}
											B
										</td>
										<td className="p-1">{f.status}</td>
										<td className="p-1 flex gap-2">
											<button
												className="bg-green-600 px-2 py-1 text-white"
												onClick={() =>
													handleDownload(
														f.id,
														f.filename,
													)
												}
											>
												Download
											</button>
											<button
												className="bg-red-600 px-2 py-1 text-white disabled:bg-gray-500"
												onClick={() =>
													handleDelete(f.id)
												}
												disabled={deletingId === f.id}
											>
												{deletingId === f.id
													? '…'
													: 'Delete'}
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}

					<div className="flex gap-2">
						<button
							className="bg-gray-600 px-3 py-1 text-white disabled:bg-gray-400"
							onClick={() => fetchPage(page - 1)}
							disabled={
								!data.pagination.hasPreviousPage || loading
							}
						>
							Prev
						</button>
						<button
							className="bg-gray-600 px-3 py-1 text-white disabled:bg-gray-400"
							onClick={() => fetchPage(page + 1)}
							disabled={!data.pagination.hasNextPage || loading}
						>
							Next
						</button>
					</div>
				</>
			)}
		</div>
	);
}
