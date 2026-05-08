import CreditAmount from '@/components/balance/credit-amount';
import TopupForm from '@/components/balance/topup-form';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface TopupSectionProps {
	userId: string;
}

export default async function TopupSection({ userId }: TopupSectionProps) {
	const balance = await db.query.creditBalance.findFirst({
		where: eq(schema.creditBalance.userId, userId),
		columns: { availableAmount: true },
	});

	const availableAmount = balance?.availableAmount ?? '0';

	return (
		<div className="bg-white dark:bg-zinc-900 rounded-xl shadow">
			<div className="flex flex-col">
				<div className="py-2 px-5 mx-auto border border-t-0 border-neutral-300/50 dark:border-neutral-700/50 bg-slate-50 dark:bg-zinc-800/30 rounded-b-xl">
					<h2 className="text-xs font-semibold text-neutral-500">
						Your Credit
					</h2>
				</div>
				<div className="pb-8 pt-6 flex justify-center items-center">
					<CreditAmount
						amount={availableAmount}
						size="large"
					/>
				</div>
			</div>
			<div className="border-t border-neutral-300/50 dark:border-t-neutral-700/50 bg-slate-50 dark:bg-zinc-800/30 rounded-b-xl p-5">
				<TopupForm />
			</div>
		</div>
	);
}
