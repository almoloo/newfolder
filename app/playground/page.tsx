'use client';

import { useState } from 'react';
import SummaryData from './components/summary-data';
import Topup from './components/topup';
import TransactionsData from './components/transactions';
import FileUpload from './components/file-upload';
import FileList from './components/file-list';

export default function PlaygroundPage() {
	const [refreshKey, setRefreshKey] = useState(0);

	return (
		<div>
			<h1>TESTING</h1>
			<SummaryData />
			<TransactionsData />
			<Topup />
			<FileUpload onSuccess={() => setRefreshKey((k) => k + 1)} />
			<FileList refreshKey={refreshKey} />
		</div>
	);
}
