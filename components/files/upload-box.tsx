'use client';

import CreditAmount from '@/components/balance/credit-amount';
import UploadForm from '@/components/files/upload-form';
import { useBalance } from '@/lib/hooks/use-balance';

export default function UploadBox() {
	const { data: balance } = useBalance();
	const availableAmount = balance?.availableAmount ?? '0';

	return (
		<div className="flex flex-col gap-3 bg-white dark:bg-zinc-900 rounded-xl shadow p-4">
			<div className="flex items-center justify-between">
				<h3 className="font-bold">Upload File</h3>
				<CreditAmount
					amount={availableAmount}
					size="small"
				/>
			</div>
			<UploadForm />
		</div>
	);
}
