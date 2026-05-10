import { desc, eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import EmptyState from '@/components/layout/empty-state';
import FileItem from '@/components/files/file-item';
import PaginationButton from '@/components/balance/pagination-button';

const LIMIT = 20;

interface FilesListProps {
	userId: string;
	page?: number;
}

export default async function FilesList({ userId, page = 1 }: FilesListProps) {
	const offset = (page - 1) * LIMIT;

	const files = await db.query.file.findMany({
		where: eq(schema.file.ownerId, userId),
		columns: {
			id: true,
			filename: true,
			mimeType: true,
			sizeBytes: true,
			status: true,
			createdAt: true,
		},
		orderBy: (f) => [desc(f.createdAt)],
		limit: LIMIT + 1,
		offset,
	});

	const hasNextPage = files.length > LIMIT;
	const items = hasNextPage ? files.slice(0, LIMIT) : files;

	if (items.length === 0) {
		return (
			<EmptyState
				title="No files uploaded yet"
				description="Upload a file to get started. Your files will appear here."
				icon="filedashed"
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col">
				{items.map((file) => (
					<FileItem
						key={file.id}
						file={file}
					/>
				))}
			</div>
			{(page > 1 || hasNextPage) && (
				<div className="grid grid-cols-3 text-sm">
					<div className="flex justify-start">
						{page > 1 && (
							<PaginationButton
								type="previous"
								href={`?page=${page - 1}`}
							/>
						)}
					</div>
					<div />
					<div className="flex justify-end">
						{hasNextPage && (
							<PaginationButton
								type="next"
								href={`?page=${page + 1}`}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
