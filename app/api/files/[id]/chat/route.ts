import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { and, asc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { db, schema } from '@/lib/db';
import { createIndexer, decodeStorageHash } from '@/lib/storage/client';
import {
	createBroker,
	checkAndRefillComputeLedger,
	ZG_COMPUTE_PROVIDER_ADDRESS,
	ZG_COMPUTE_VISION_PROVIDER_ADDRESS,
} from '@/lib/ai/client';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import {
	getFileContext,
	setFileContext,
	type CachedFileContext,
} from '@/lib/chat/file-context-cache';

export const dynamic = 'force-dynamic';
const _require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// File category helpers
// ---------------------------------------------------------------------------

// Category 1 — Images: forwarded to vision provider with base64 content
const IMAGE_MIME_PREFIX = 'image/';

// Category 2 — Pure text: content inlined as-is (capped at MAX_INLINE_BYTES)
const TEXT_MIME_PREFIXES = [
	'text/',
	'application/json',
	'application/xml',
	'application/javascript',
	'application/typescript',
];

// Category 3 — Documents: text extracted then inlined
const DOCUMENT_MIMES = new Set([
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.oasis.opendocument.spreadsheet',
]);

// Category 4 — Unsupported: chat is not available
// (everything else — video, audio, zip, executables, etc.)

const MAX_INLINE_BYTES = 128 * 1024; // 128 KB

type FileCategory = 'image' | 'text' | 'document' | 'unsupported';

function classifyMime(mime: string | null): FileCategory {
	if (!mime) return 'unsupported';
	if (mime.startsWith(IMAGE_MIME_PREFIX)) return 'image';
	if (TEXT_MIME_PREFIXES.some((p) => mime.startsWith(p))) return 'text';
	if (DOCUMENT_MIMES.has(mime)) return 'document';
	return 'unsupported';
}

// ---------------------------------------------------------------------------
// Document text extraction
// ---------------------------------------------------------------------------

async function extractDocumentText(
	filePath: string,
	mime: string,
): Promise<string> {
	const buf = await fs.readFile(filePath);

	if (mime === 'application/pdf') {
		const officeParser = _require('officeparser');
		return await officeParser.parseOffice(filePath);
	}

	if (
		mime ===
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	) {
		const result = await mammoth.extractRawText({ buffer: buf });
		return result.value;
	}

	if (mime === 'application/msword') {
		const officeParser = _require('officeparser');
		return await officeParser.parseOffice(filePath);
	}

	// Spreadsheets (xlsx, xls, ods)
	const workbook = XLSX.read(buf, { type: 'buffer' });
	const parts: string[] = [];
	for (const sheetName of workbook.SheetNames) {
		const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
		parts.push(`=== Sheet: ${sheetName} ===\n${csv}`);
	}
	return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContentPart =
	| { type: 'text'; text: string }
	| { type: 'image_url'; image_url: { url: string } };

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string | ContentPart[];
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	let tempPath: string | null = null;

	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session?.user?.id) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;

		let body: { messages?: ChatMessage[]; providerAddress?: string };
		try {
			body = await request.json();
		} catch {
			return Response.json(
				{ error: 'Invalid JSON body' },
				{ status: 400 },
			);
		}

		const userMessages: ChatMessage[] = Array.isArray(body.messages)
			? body.messages
			: [];
		if (userMessages.length === 0) {
			return Response.json(
				{ error: 'messages array is required and must not be empty' },
				{ status: 400 },
			);
		}

		const explicitProvider = body.providerAddress ?? null;

		// Fetch file record
		const file = await db.query.file.findFirst({
			where: and(
				eq(schema.file.id, id),
				eq(schema.file.ownerId, session.user.id),
			),
			columns: {
				storageHash: true,
				filename: true,
				mimeType: true,
				sizeBytes: true,
			},
		});
		if (!file) {
			return Response.json({ error: 'File not found' }, { status: 404 });
		}

		const category = classifyMime(file.mimeType);

		// Category 4 — Unsupported: reject early, no provider call
		if (category === 'unsupported') {
			return Response.json(
				{
					error:
						`Chat is not supported for files of type "${file.mimeType ?? 'unknown'}". ` +
						`Supported types: plain text, JSON, XML, code files, PDF, Word documents, spreadsheets, and images (with a vision provider).`,
				},
				{ status: 422 },
			);
		}

		// Resolve provider — images go to vision provider if set
		const providerAddress =
			explicitProvider ??
			(category === 'image'
				? ZG_COMPUTE_VISION_PROVIDER_ADDRESS
				: ZG_COMPUTE_PROVIDER_ADDRESS);
		if (!providerAddress) {
			return Response.json(
				{
					error: 'providerAddress is required (or set ZG_COMPUTE_PROVIDER_ADDRESS in env)',
				},
				{ status: 400 },
			);
		}

		// Fixed pricing: CHAT_PRICE_PER_100_CHARS stars per 100 characters.
		// 1 star = 10^12 neuron (1 A0GI = 10^18 neuron = 10^6 stars).
		const NEURON_PER_STAR = 10n ** 12n;
		const starsPerHundredChars = BigInt(
			process.env.CHAT_PRICE_PER_100_CHARS ?? '1',
		);
		const neuronPerHundredChars = starsPerHundredChars * NEURON_PER_STAR;

		const userCreditBalance = await db.query.creditBalance.findFirst({
			where: eq(schema.creditBalance.userId, session.user.id),
			columns: { availableAmount: true, id: true, totalDebited: true },
		});
		const available = BigInt(userCreditBalance?.availableAmount ?? '0');

		const lastMsg = userMessages[userMessages.length - 1];
		const msgText =
			typeof lastMsg.content === 'string'
				? lastMsg.content
				: (lastMsg.content as ContentPart[])
						.filter(
							(p): p is { type: 'text'; text: string } =>
								p.type === 'text',
						)
						.map((p) => p.text)
						.join(' ');
		const estimatedHundreds = BigInt(
			Math.max(1, Math.ceil(msgText.length / 100)),
		);
		const minRequired = neuronPerHundredChars * estimatedHundreds;
		if (available < minRequired) {
			return Response.json(
				{
					error: 'Insufficient balance. Please top up to continue chatting.',
					required: String(minRequired),
					available: String(available),
				},
				{ status: 402 },
			);
		}

		// Check cache — skip download/extraction if we already processed this file
		let cached = getFileContext(session.user.id, id);

		if (!cached) {
			// Download file from 0G storage (retry up to 3 times for transient errors)
			const storageKey = decodeStorageHash(file.storageHash);

			let downloadErr: unknown = null;
			for (let attempt = 1; attempt <= 3; attempt++) {
				// Fresh temp path each attempt so the SDK cannot reuse a stale/corrupted file
				const attemptPath = path.join(
					os.tmpdir(),
					`zg-chat-${crypto.randomUUID()}`,
				);
				// tempPath is updated so the finally-block always cleans the last-used path
				tempPath = attemptPath;
				try {
					const indexer = createIndexer();
					const err = await indexer.download(
						storageKey,
						attemptPath,
						false,
					);
					if (err !== null) {
						downloadErr = err;
						console.warn(
							`[files/[id]/chat] download attempt ${attempt} returned error:`,
							err,
						);
						await fs.unlink(attemptPath).catch(() => {});
						continue;
					}
					// Verify the downloaded file is not empty or zero-filled
					const stat = await fs.stat(attemptPath).catch(() => null);
					if (!stat || stat.size === 0) {
						downloadErr = new Error('Downloaded file is empty');
						console.warn(
							`[files/[id]/chat] download attempt ${attempt}: file is empty`,
						);
						await fs.unlink(attemptPath).catch(() => {});
						continue;
					}
					// Check first 4 bytes are not all zeros (corrupted node response)
					const handle = await fs.open(attemptPath, 'r');
					const header = Buffer.alloc(4);
					await handle.read(header, 0, 4, 0);
					await handle.close();
					if (header.readUInt32BE(0) === 0) {
						downloadErr = new Error(
							'Downloaded file has zero-filled header (corrupted)',
						);
						console.warn(
							`[files/[id]/chat] download attempt ${attempt}: file header is zero-filled`,
						);
						await fs.unlink(attemptPath).catch(() => {});
						continue;
					}
					// For ZIP-based formats (DOCX, XLSX, ODS) load the ZIP and
					// actually decompress the first file entry to verify local
					// file headers are intact.  JSZip.loadAsync alone only
					// reads the central directory (at the end of the file) and
					// succeeds even when the body is zero-filled; reading an
					// entry forces it to seek to the local header in the body.
					const ZIP_MIME_SET = new Set([
						'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
						'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
						'application/vnd.oasis.opendocument.spreadsheet',
					]);
					if (file.mimeType && ZIP_MIME_SET.has(file.mimeType)) {
						try {
							const JSZip = (await import('jszip')).default;
							const zipBuf = await fs.readFile(attemptPath);
							const zip = await JSZip.loadAsync(zipBuf);
							// Read the first non-directory entry to validate
							// that local file headers in the body are intact.
							const firstEntry = Object.values(zip.files).find(
								(f) => !f.dir,
							);
							if (firstEntry) {
								await firstEntry.async('nodebuffer');
							}
						} catch (zipErr) {
							downloadErr = new Error(
								`corrupt zip: ${(zipErr as Error).message}`,
							);
							console.warn(
								`[files/[id]/chat] download attempt ${attempt}: ${(downloadErr as Error).message}`,
							);
							await fs.unlink(attemptPath).catch(() => {});
							continue;
						}
					}
					downloadErr = null;
					break;
				} catch (e) {
					downloadErr = e;
					console.warn(
						`[files/[id]/chat] download attempt ${attempt} threw:`,
						(e as Error).message ?? e,
					);
					await fs.unlink(attemptPath).catch(() => {});
				}
			}

			if (downloadErr !== null) {
				console.error(
					'[files/[id]/chat] 0G download failed after retries:',
					downloadErr,
				);
				return Response.json(
					{
						error: 'Failed to retrieve file from storage network. The storage nodes may be temporarily unavailable — please try again.',
					},
					{ status: 502 },
				);
			}

			// Process by category and populate cache
			const resolvedPath = tempPath as string;
			if (category === 'image') {
				const imgBuffer = await fs.readFile(resolvedPath);
				const base64 = imgBuffer.toString('base64');
				const dataUrl = `data:${file.mimeType};base64,${base64}`;
				const imageSystemContent =
					`You are analyzing an image file uploaded by the user.\n` +
					`Filename: ${file.filename}\n` +
					`Type: ${file.mimeType}\n` +
					`Size: ${file.sizeBytes} bytes\n\n` +
					`Describe and answer questions about the image shown.`;
				cached = {
					category: 'image',
					imageDataUrl: dataUrl,
					imageSystemContent,
				};
			} else if (category === 'text') {
				const raw = await fs.readFile(resolvedPath);
				const text = raw
					.subarray(0, MAX_INLINE_BYTES)
					.toString('utf-8');
				const truncated = raw.byteLength > MAX_INLINE_BYTES;
				cached = {
					category: 'text',
					systemContent:
						`You are analyzing the following file:\n` +
						`Filename: ${file.filename}\n` +
						`Type: ${file.mimeType}\n` +
						`Size: ${file.sizeBytes} bytes\n\n` +
						`--- FILE CONTENT${truncated ? ' (truncated to first 128 KB)' : ''} ---\n` +
						text +
						`\n--- END OF FILE ---\n\n` +
						`Answer the user's questions about this file. If asked to modify it, produce the full modified content.`,
				};
			} else {
				// document — validate magic bytes before extraction to detect
				// corrupt data returned by 0G storage nodes
				const MAGIC: Record<string, number> = {
					'application/pdf': 0x25504446, // %PDF
					'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 0x504b0304, // PK\x03\x04 (ZIP)
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 0x504b0304,
					'application/vnd.oasis.opendocument.spreadsheet': 0x504b0304,
				};
				const expectedMagic = file.mimeType
					? MAGIC[file.mimeType]
					: undefined;
				if (expectedMagic !== undefined) {
					const fh = await fs.open(resolvedPath, 'r');
					const magicBuf = Buffer.alloc(4);
					await fh.read(magicBuf, 0, 4, 0);
					await fh.close();
					const actual = magicBuf.readUInt32BE(0);
					if (actual !== expectedMagic) {
						console.error(
							`[files/[id]/chat] corrupt file: expected magic 0x${expectedMagic.toString(16)}, got 0x${actual.toString(16)}`,
						);
						return Response.json(
							{
								error: 'The downloaded file appears corrupted (storage node returned invalid data). Please try again — if this persists, re-upload the file.',
							},
							{ status: 502 },
						);
					}
				}

				let extractedText: string;
				try {
					extractedText = await extractDocumentText(
						resolvedPath,
						file.mimeType!,
					);
				} catch (err) {
					console.error('[files/[id]/chat] extraction error:', err);
					return Response.json(
						{ error: 'Failed to extract text from document' },
						{ status: 422 },
					);
				}
				const truncated = extractedText.length > MAX_INLINE_BYTES;
				const text = truncated
					? extractedText.slice(0, MAX_INLINE_BYTES)
					: extractedText;
				cached = {
					category: 'document',
					systemContent:
						`You are analyzing the following document:\n` +
						`Filename: ${file.filename}\n` +
						`Type: ${file.mimeType}\n` +
						`Size: ${file.sizeBytes} bytes\n\n` +
						`--- EXTRACTED TEXT${truncated ? ' (truncated to first 128 KB)' : ''} ---\n` +
						text +
						`\n--- END OF DOCUMENT ---\n\n` +
						`Answer the user's questions about this document. If asked to summarize or modify it, use only the extracted text above.`,
				};
			}

			setFileContext(session.user.id, id, cached);
		}

		// Build messages from cached context
		const ctx = cached as CachedFileContext;
		let messages: ChatMessage[];

		if (ctx.category === 'image') {
			const [firstMsg, ...restMsgs] = userMessages;
			const firstContent: ContentPart[] = [
				{
					type: 'image_url',
					image_url: { url: ctx.imageDataUrl! },
				},
				{ type: 'text', text: String(firstMsg.content) },
			];
			messages = [
				{ role: 'system', content: ctx.imageSystemContent! },
				{ role: 'user', content: firstContent },
				...restMsgs,
			];
		} else {
			messages = [
				{ role: 'system', content: ctx.systemContent! },
				...userMessages,
			];
		}

		// Check ledger balance and refill if needed (non-blocking)
		checkAndRefillComputeLedger();

		// Get 0G compute provider endpoint + auth headers
		const broker = await createBroker();
		const { endpoint, model } =
			await broker.inference.getServiceMetadata(providerAddress);
		const authHeaders =
			await broker.inference.getRequestHeaders(providerAddress);

		// Proxy streaming request to 0G compute (retry up to 3 times for ECONNRESET)
		let upstream: Response | null = null;
		let upstreamErr: unknown = null;
		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				upstream = await fetch(`${endpoint}/chat/completions`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						...authHeaders,
					},
					body: JSON.stringify({ model, messages, stream: true }),
				});
				upstreamErr = null;
				break;
			} catch (e) {
				upstreamErr = e;
				console.warn(
					`[files/[id]/chat] upstream fetch attempt ${attempt} threw:`,
					(e as Error).message ?? e,
				);
			}
		}

		if (upstreamErr !== null || upstream === null) {
			console.error(
				'[files/[id]/chat] upstream fetch failed after retries:',
				upstreamErr,
			);
			return Response.json(
				{
					error: 'Compute provider is temporarily unreachable. Please try again.',
				},
				{ status: 502 },
			);
		}

		if (!upstream.ok) {
			const errText = await upstream.text();
			console.error(
				'[files/[id]/chat] upstream error:',
				upstream.status,
				errText,
			);
			return Response.json(
				{ error: `Compute provider returned ${upstream.status}` },
				{ status: 502 },
			);
		}

		// Intercept stream to persist messages after it completes
		const lastUserMsg = userMessages[userMessages.length - 1];
		const userMessageContent =
			typeof lastUserMsg.content === 'string'
				? lastUserMsg.content
				: (lastUserMsg.content as ContentPart[])
						.filter(
							(p): p is { type: 'text'; text: string } =>
								p.type === 'text',
						)
						.map((p) => p.text)
						.join(' ');

		const sseChunks: string[] = [];
		const decoder = new TextDecoder();
		const fileId = id;
		const userId = session.user.id;

		const { readable, writable } = new TransformStream<
			Uint8Array,
			Uint8Array
		>({
			transform(chunk, controller) {
				sseChunks.push(decoder.decode(chunk, { stream: true }));
				controller.enqueue(chunk);
			},
			async flush() {
				const fullSse = sseChunks.join('');
				let assistantText = '';
				for (const line of fullSse.split('\n')) {
					if (line.startsWith('data: ') && !line.includes('[DONE]')) {
						try {
							const data = JSON.parse(line.slice(6));
							const delta = data.choices?.[0]?.delta?.content;
							if (delta) assistantText += delta;
						} catch {
							// ignore malformed SSE lines
						}
					}
				}
				// Persist conversation messages
				if (userMessageContent && assistantText) {
					try {
						await db.insert(schema.chatMessage).values([
							{
								fileId,
								userId,
								role: 'user',
								content: userMessageContent,
							},
							{
								fileId,
								userId,
								role: 'assistant',
								content: assistantText,
							},
						]);
					} catch (dbErr) {
						console.error(
							'[files/[id]/chat] failed to save messages:',
							dbErr,
						);
					}
				}
				// Deduct fee: CHAT_PRICE_PER_100_CHARS stars per 100 chars of (input + response)
				const NEURON_PER_STAR = 10n ** 12n;
				const starsPerHundred = BigInt(
					process.env.CHAT_PRICE_PER_100_CHARS ?? '1',
				);
				const totalChars =
					userMessageContent.length + assistantText.length;
				const hundreds = BigInt(
					Math.max(1, Math.ceil(totalChars / 100)),
				);
				const fee = starsPerHundred * NEURON_PER_STAR * hundreds;
				if (fee > 0n) {
					try {
						await db.transaction(async (tx) => {
							const bal = await tx.query.creditBalance.findFirst({
								where: eq(schema.creditBalance.userId, userId),
								columns: {
									id: true,
									availableAmount: true,
									totalDebited: true,
								},
							});
							if (!bal) return;
							const current = BigInt(bal.availableAmount);
							const deducted = current >= fee ? fee : current;
							const after = String(current - deducted);
							const now = new Date();
							await tx
								.update(schema.creditBalance)
								.set({
									availableAmount: after,
									totalDebited: String(
										BigInt(bal.totalDebited) + deducted,
									),
									updatedAt: now,
								})
								.where(eq(schema.creditBalance.id, bal.id));
							await tx.insert(schema.creditTransaction).values({
								userId,
								balanceId: bal.id,
								type: 'debit',
								status: 'confirmed',
								amount: String(deducted),
								balanceBefore: bal.availableAmount,
								balanceAfter: after,
								referenceType: 'chat',
								referenceId: fileId,
								transactionKey: `chat:${crypto.randomUUID()}`,
								description: `Chat: ${totalChars} chars`,
							});
						});
					} catch (feeErr) {
						console.error(
							'[files/[id]/chat] fee deduction failed:',
							feeErr,
						);
					}
				}
			},
		});

		upstream.body!.pipeTo(writable).catch(() => {});

		return new Response(readable, {
			status: 200,
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'X-Accel-Buffering': 'no',
			},
		});
	} catch (error) {
		console.error('[files/[id]/chat POST]', error);
		return Response.json(
			{ error: 'Unable to process chat request' },
			{ status: 500 },
		);
	} finally {
		if (tempPath !== null) {
			await fs.unlink(tempPath).catch(() => {});
		}
	}
}

// ---------------------------------------------------------------------------
// GET /api/files/[id]/chat — return persisted chat history
// ---------------------------------------------------------------------------

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session?.user?.id) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;

		const file = await db.query.file.findFirst({
			where: and(
				eq(schema.file.id, id),
				eq(schema.file.ownerId, session.user.id),
			),
			columns: { id: true },
		});
		if (!file) {
			return Response.json({ error: 'File not found' }, { status: 404 });
		}

		const messages = await db.query.chatMessage.findMany({
			where: and(
				eq(schema.chatMessage.fileId, id),
				eq(schema.chatMessage.userId, session.user.id),
			),
			orderBy: [asc(schema.chatMessage.createdAt)],
			columns: { role: true, content: true, createdAt: true },
		});

		return Response.json({ messages });
	} catch (error) {
		console.error('[files/[id]/chat GET]', error);
		return Response.json(
			{ error: 'Unable to fetch chat history' },
			{ status: 500 },
		);
	}
}
