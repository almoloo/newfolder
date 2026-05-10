import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
import FilesList from '@/components/files/files-list';
import UploadBox from '@/components/files/upload-box';

export default async function DashboardPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect('/');

	const { page: pageParam } = await searchParams;
	const page = Math.max(1, Number(pageParam ?? 1));

	return (
		<div className="flex flex-col gap-10">
			<UploadBox />
			<div>
				<h2 className="font-bold text-lg mb-3">Files</h2>
				<Suspense
					fallback={
						<p className="text-sm text-neutral-500">
							Loading files...
						</p>
					}
				>
					<FilesList
						userId={session.user.id}
						page={page}
					/>
				</Suspense>
			</div>
		</div>
	);
}
