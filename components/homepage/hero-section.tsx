'use client';

import { ChatTextIcon } from '@phosphor-icons/react';

export default function HeroSection() {
	return (
		<section className="centered-container flex flex-col-reverse lg:flex-row justify-between items-center text-center lg:text-start gap-10 lg:gap-20 py-0 mt-16 mb-20 lg:mt-24 lg:mb-30">
			<div>
				<h2 className="flex flex-col gap-2 text-2xl lg:text-3xl font-black dark:text-slate-200 mb-5">
					<span>Chat with Your Documents</span>
					<span className="">Decentralized. Intelligent.</span>
				</h2>
				<p className="text-slate-600 dark:text-slate-400">
					Powered by decentralized storage and verifiable AI
					inference. Your data stays yours.
				</p>
			</div>
			<div className="flex aspect-square rounded-full bg-linear-to-t from-0% to-75% from-rose-300/10 dark:from-rose-300/5 to-rose-50/0 border-b border-b-rose-300/15 dark:border-b-rose-300/10 p-7">
				<div className="flex items-end m-auto">
					<ChatTextIcon
						size={100}
						weight="duotone"
						className="text-rose-400 dark:text-rose-400/75"
						mirrored
					/>

					<ChatTextIcon
						size={60}
						weight="duotone"
						className="text-rose-300 dark:text-rose-300/75"
					/>
				</div>
			</div>
		</section>
	);
}
