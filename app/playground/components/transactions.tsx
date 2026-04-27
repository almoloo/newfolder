'use client';

import { CreditTransactionHistoryItem } from '@/lib/types';
import { useState } from 'react';

export default function TransactionsData() {
	const [data, setData] = useState<
		Array<CreditTransactionHistoryItem> | undefined
	>();
	const [fetchingData, setFetchingData] = useState(false);

	async function handleGetData() {
		setFetchingData(true);
		try {
			const dataFetch = await fetch('/api/balance/transactions');
			const jsonData = await dataFetch.json();

			setData(jsonData);
		} catch (e) {
			console.error(e);
		} finally {
			setFetchingData(false);
		}
	}

	return (
		<div className="border p-5 m-5 flex flex-col">
			<h2>Transactions</h2>
			<button
				className="bg-sky-500 p-3 disabled:bg-gray-500"
				onClick={handleGetData}
				disabled={fetchingData}
			>
				GET DATA
			</button>
			<pre>
				<code>{data && JSON.stringify(data)}</code>
			</pre>
		</div>
	);
}
