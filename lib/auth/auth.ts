import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { siwe } from 'better-auth/plugins/siwe';
import { generateNonce, SiweMessage } from 'siwe';
import { db, schema } from '@/lib/db';

const authSecret = process.env.BETTER_AUTH_SECRET ?? '';

const baseURL =
	process.env.BETTER_AUTH_URL ??
	process.env.NEXT_PUBLIC_APP_URL ??
	'http://localhost:3000';

const siweDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost:3000';

export const auth = betterAuth({
	baseURL,
	secret: authSecret,
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema,
		camelCase: true,
	}),
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					if (user.walletAddress) {
						return {
							data: {
								...user,
								walletAddress: (
									user.walletAddress as string
								).toLowerCase(),
							},
						};
					}
				},
				after: async (user) => {
					// Grant every new user 100 stars (100 × 10^12 neuron) as initial credit
					const initialGrant = '100000000000000';
					const [balance] = await db
						.insert(schema.creditBalance)
						.values({
							userId: user.id,
							availableAmount: initialGrant,
							totalCredited: initialGrant,
						})
						.returning({ id: schema.creditBalance.id });
					await db.insert(schema.creditTransaction).values({
						userId: user.id,
						balanceId: balance.id,
						type: 'adjustment',
						status: 'confirmed',
						amount: initialGrant,
						balanceBefore: '0',
						balanceAfter: initialGrant,
						referenceType: 'adjustment',
						transactionKey: `initial_grant:${user.id}`,
						description:
							'Initial ★ 100 credit grant on registration',
					});
				},
			},
			update: {
				before: async (user) => {
					if (user.walletAddress) {
						return {
							data: {
								...user,
								walletAddress: (
									user.walletAddress as string
								).toLowerCase(),
							},
						};
					}
				},
			},
		},
		account: {
			create: {
				before: async (account) => {
					if (account.providerId === 'siwe') {
						return {
							data: {
								...account,
								accountId: account.accountId.toLowerCase(),
							},
						};
					}
				},
			},
		},
	},
	plugins: [
		siwe({
			domain: siweDomain,
			emailDomainName: 'wallet.local',
			getNonce: async () => generateNonce(),
			verifyMessage: async ({ address, chainId, message, signature }) => {
				const siweMessage = new SiweMessage(message);

				const verification = await siweMessage.verify({
					signature,
					domain: siweDomain,
				});

				return (
					verification.success &&
					siweMessage.address.toLowerCase() ===
						address.toLowerCase() &&
					Number(siweMessage.chainId) === chainId
				);
			},
		}),
	],
});
