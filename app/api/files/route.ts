import { count, desc, eq } from 'drizzle-orm';
import { MemData } from '@0gfoundation/0g-ts-sdk';
import { auth } from '@/lib/auth/auth';
import { db, schema } from '@/lib/db';
import {
	createIndexer,
	createSigner,
	encodeStorageHash,
	UPLOAD_FEE_PER_BYTE,
	ZG_EVM_RPC,
} from '@/lib/storage/client';

export const dynamic = 'force-dynamic';
// POST — upload a file to 0G storage, deduct credits, record in DB.
// GET  — list the authenticated user's files (paginated).

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function sanitizeFilename(name: string): string {
	return name.replace(/[^a-zA-Z0-9._\-\s]/g, '_').trim() || 'file';
}

export async function POST(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		let formData: FormData;
		try {
			formData = await request.formData();
		} catch {
			return Response.json(
				{ error: 'Request must be multipart/form-data' },
				{ status: 400 },
			);
		}

		const fileField = formData.get('file');
		if (!(fileField instanceof File)) {
			return Response.json(
				{ error: 'Missing required field: file' },
				{ status: 400 },
			);
		}

		if (fileField.size === 0) {
			return Response.json(
				{ error: 'File must not be empty' },
				{ status: 400 },
			);
		}

		if (fileField.size > MAX_FILE_SIZE) {
			return Response.json(
				{
					error: `File exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024} MB`,
				},
				{ status: 413 },
			);
		}

		const filename = sanitizeFilename(fileField.name || 'file');
		const mimeType = fileField.type || 'application/octet-stream';
		const sizeBytes = String(fileField.size);

		// Calculate fee with same rounding logic as frontend:
		// Round up to nearest whole star, minimum 1 star (if fee is enabled)
		const NEURON_PER_STAR = 10n ** 12n;
		let quotedFee: string;
		if (UPLOAD_FEE_PER_BYTE > 0n) {
			const rawNeuron = BigInt(sizeBytes) * UPLOAD_FEE_PER_BYTE;
			const stars = (rawNeuron + NEURON_PER_STAR - 1n) / NEURON_PER_STAR;
			quotedFee = String(
				BigInt(Math.max(1, Number(stars))) * NEURON_PER_STAR,
			);
		} else {
			quotedFee = '0';
		}

		// Check user has sufficient credit balance
		if (UPLOAD_FEE_PER_BYTE > 0n) {
			const balance = await db.query.creditBalance.findFirst({
				where: eq(schema.creditBalance.userId, session.user.id),
				columns: { id: true, availableAmount: true },
			});

			if (
				!balance ||
				BigInt(balance.availableAmount) < BigInt(quotedFee)
			) {
				return Response.json(
					{ error: 'Insufficient credit balance' },
					{ status: 402 },
				);
			}
		}

		// Upload to 0G storage
		const buffer = Buffer.from(await fileField.arrayBuffer());
		const memData = new MemData(buffer);

		const indexer = createIndexer();
		const signer = createSigner();

		const [uploadResult, uploadErr] = await indexer.upload(
			memData,
			ZG_EVM_RPC,
			signer,
			{ finalityRequired: false },
		);

		if (uploadErr !== null) {
			console.error('[files] 0G upload error:', uploadErr);
			return Response.json(
				{ error: 'Failed to upload file to storage network' },
				{ status: 502 },
			);
		}

		const storageHash = encodeStorageHash(uploadResult);

		// Record file and deduct credits in one transaction
		const record = await db.transaction(async (tx) => {
			const [file] = await tx
				.insert(schema.file)
				.values({
					ownerId: session.user.id,
					storageHash,
					filename,
					mimeType,
					sizeBytes,
					quotedFee,
					chargedFee: quotedFee,
					status: 'uploaded',
				})
				.returning({
					id: schema.file.id,
					ownerId: schema.file.ownerId,
					storageHash: schema.file.storageHash,
					filename: schema.file.filename,
					mimeType: schema.file.mimeType,
					sizeBytes: schema.file.sizeBytes,
					quotedFee: schema.file.quotedFee,
					chargedFee: schema.file.chargedFee,
					status: schema.file.status,
					createdAt: schema.file.createdAt,
					updatedAt: schema.file.updatedAt,
				});

			if (UPLOAD_FEE_PER_BYTE > 0n && quotedFee !== '0') {
				const balance = await tx.query.creditBalance.findFirst({
					where: eq(schema.creditBalance.userId, session.user.id),
					columns: {
						id: true,
						availableAmount: true,
						totalDebited: true,
					},
				});

				if (balance) {
					const balanceBefore = balance.availableAmount;
					const balanceAfter = String(
						BigInt(balanceBefore) - BigInt(quotedFee),
					);

					await tx
						.update(schema.creditBalance)
						.set({
							availableAmount: balanceAfter,
							totalDebited: String(
								BigInt(balance.totalDebited) +
									BigInt(quotedFee),
							),
							updatedAt: new Date(),
						})
						.where(eq(schema.creditBalance.id, balance.id));

					await tx.insert(schema.creditTransaction).values({
						userId: session.user.id,
						balanceId: balance.id,
						type: 'debit',
						status: 'confirmed',
						amount: quotedFee,
						balanceBefore,
						balanceAfter,
						referenceType: 'upload',
						referenceId: file.id,
						transactionKey: `upload:${file.id}`,
						description: `Storage fee for ${filename}`,
					});
				}
			}

			return file;
		});

		return Response.json(record, { status: 201 });
	} catch (error) {
		console.error('[files POST]', error);
		return Response.json(
			{ error: 'Unable to upload file' },
			{ status: 500 },
		);
	}
}

export async function GET(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);

		const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
		const limit = Math.min(
			MAX_LIMIT,
			Math.max(
				1,
				Number(searchParams.get('limit') ?? String(DEFAULT_LIMIT)),
			),
		);
		const offset = (page - 1) * limit;

		const [{ total }] = await db
			.select({ total: count() })
			.from(schema.file)
			.where(eq(schema.file.ownerId, session.user.id));

		const files = await db.query.file.findMany({
			where: eq(schema.file.ownerId, session.user.id),
			columns: {
				id: true,
				storageHash: true,
				filename: true,
				mimeType: true,
				sizeBytes: true,
				quotedFee: true,
				chargedFee: true,
				status: true,
				createdAt: true,
				updatedAt: true,
			},
			orderBy: (f) => [desc(f.createdAt)],
			limit,
			offset,
		});

		const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

		return Response.json({
			items: files,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasPreviousPage: page > 1,
				hasNextPage: page < totalPages,
			},
		});
	} catch (error) {
		console.error('[files GET]', error);
		return Response.json(
			{ error: 'Unable to list files' },
			{ status: 500 },
		);
	}
}
