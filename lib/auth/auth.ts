import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { siwe } from 'better-auth/plugins/siwe';
import { generateNonce, SiweMessage } from 'siwe';
import { db, schema } from '@/lib/db';

const authSecret = process.env.BETTER_AUTH_SECRET;

if (!authSecret) {
	throw new Error('BETTER_AUTH_SECRET is not set');
}

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
