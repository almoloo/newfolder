'use client';

import { BalanceSummaryResponse } from '@/lib/types';
import { useState } from 'react';

export default function SummaryData() {
	const [summaryData, setSummaryData] = useState<
		BalanceSummaryResponse | undefined
	>();
	const [fetchingSummary, setFetchingSummary] = useState(false);

	async function handleGetSummary() {
		setFetchingSummary(true);
		try {
			const summaryDataFetch = await fetch('/api/balance/summary');
			const jsonData = await summaryDataFetch.json();

			setSummaryData(jsonData);
		} catch (e) {
			console.error(e);
		} finally {
			setFetchingSummary(false);
		}
	}

	return (
		<div className="border p-5 m-5 flex flex-col">
			<h2>balance summary</h2>
			<button
				className="bg-sky-500 p-3 disabled:bg-gray-500"
				onClick={handleGetSummary}
				disabled={fetchingSummary}
			>
				GET DATA
			</button>
			<pre>
				<code>{summaryData && JSON.stringify(summaryData)}</code>
			</pre>
		</div>
	);
}
