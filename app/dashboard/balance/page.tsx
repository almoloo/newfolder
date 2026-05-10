import TopupSection from '@/components/balance/topup-section';
import TransactionList from '@/components/balance/transaction-list';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function BalancePage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect('/');

	const { page: pageParam } = await searchParams;
	const page = Math.max(1, Number(pageParam ?? 1));

	return (
		<div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-10">
			<main className="col-span-2">
				<h2 className="font-bold text-lg mb-5">Credit History</h2>
				<Suspense
					fallback={
						<p className="text-sm text-neutral-500">
							Loading transactions...
						</p>
					}
				>
					<TransactionList
						userId={session.user.id}
						page={page}
					/>
				</Suspense>
			</main>
			<aside>
				<TopupSection />
			</aside>
		</div>
	);
}
