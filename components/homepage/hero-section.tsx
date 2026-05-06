'use client';

import { ChatTextIcon } from '@phosphor-icons/react';

export default function HeroSection() {
	return (
		<section className="centered-container flex flex-col-reverse lg:flex-row justify-between items-center text-center lg:text-start gap-10 lg:gap-20 py-0 mt-24 mb-30">
			<div>
				<h2 className="flex flex-col gap-2 text-3xl font-black mb-5">
					<span>Chat with Your Documents</span>
					<span className="">Decentralized. Intelligent.</span>
				</h2>
				<p className="text-slate-600">
					Powered by decentralized storage and verifiable AI
					inference. Your data stays yours.
				</p>
			</div>
			<div className="flex aspect-square rounded-full bg-linear-to-t from-0% to-75% from-rose-300/10 to-rose-50/0 border-b border-b-rose-300/15 p-7">
				<div className="flex items-end m-auto">
					<ChatTextIcon
						size={100}
						weight="duotone"
						className="text-rose-400"
						mirrored
					/>

					<ChatTextIcon
						size={60}
						weight="duotone"
						className="text-rose-300"
					/>
				</div>
			</div>
		</section>
	);
}
