'use client';

import {
	ChatCircleDotsIcon,
	CoinsIcon,
	HardDrivesIcon,
} from '@phosphor-icons/react';

function FeatureItem({
	title,
	description,
	icon,
}: {
	title: string;
	description: string;
	icon: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center text-center gap-4 p-6 ">
			<div>{icon}</div>
			<h4 className="text-base font-semibold">{title}</h4>
			<p className="text-sm text-slate-600 dark:text-slate-300">
				{description}
			</p>
		</div>
	);
}

export default function FeaturesSection() {
	const features = [
		{
			title: 'Truly Decentralized Storage',
			description:
				'Files are stored on 0G network. No one can take them down.',
			icon: (
				<HardDrivesIcon
					size={48}
					weight="duotone"
					className="text-rose-400"
				/>
			),
		},
		{
			title: 'Ask Your Documents Anything',
			description: 'Interact with your documents using AI on-chain.',
			icon: (
				<ChatCircleDotsIcon
					size={48}
					weight="duotone"
					className="text-rose-400"
				/>
			),
		},
		{
			title: 'Pay Only for What You Use',
			description:
				'Top up with 0G and spend credits per request. No subscriptions.',
			icon: (
				<CoinsIcon
					size={48}
					weight="duotone"
					className="text-rose-400"
				/>
			),
		},
	];

	return (
		<section className="flex flex-col gap-10 my-20">
			<div className="flex flex-col justify-center text-center gap-2">
				<h3 className="text-xl font-bold dark:text-slate-200">
					Why It&apos;s Different
				</h3>
				<span className="text-slate-600 dark:text-slate-300">
					Just your wallet, your files, and AI that works on-chain.
				</span>
			</div>
			<div className="flex flex-col lg:grid lg:grid-cols-3 ">
				{features.map((feature, index) => (
					<FeatureItem
						key={index}
						title={feature.title}
						description={feature.description}
						icon={feature.icon}
					/>
				))}
			</div>
		</section>
	);
}
