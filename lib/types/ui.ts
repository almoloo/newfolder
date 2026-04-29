export type TopupStep =
	| 'idle'
	| 'switching-chain'
	| 'awaiting-signature'
	| 'awaiting-confirmation'
	| 'registering'
	| 'done';

export const topupStepLabels: Record<TopupStep, string> = {
	idle: 'PAY',
	'switching-chain': 'Switching network…',
	'awaiting-signature': 'Confirm in wallet…',
	'awaiting-confirmation': 'Waiting for confirmation…',
	registering: 'Registering…',
	done: 'Done!',
};
