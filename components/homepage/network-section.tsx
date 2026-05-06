import zeroGLogo from '@/public/0G-Logo-White.svg';
import Image from 'next/image';
import Link from 'next/link';

export default function NetworkSection() {
	return (
		<section className="bg-zinc-700 text-slate-50 px-20 py-20 rounded-4xl">
			<div className="flex flex-col justify-center text-center">
				<Link
					href="https://0g.ai"
					target="_blank"
				>
					<Image
						src={zeroGLogo}
						alt="0G Logo"
						className="w-36 mx-auto text-white"
					/>
				</Link>
				<h3 className="text-sm font-bold">
					Made Possible By 0G Network
				</h3>
			</div>
			<div className="flex flex-col gap-4 my-10 leading-relaxed text-center text-balance">
				<p>
					This app wouldn&apos;t exist without 0G&apos;s modular Web3
					infrastructure. Storage, compute, and AI inference - all
					decentralized, secure, and verifiable on-chain.
				</p>
				<p>
					The 0G Storage SDK handles file uploads directly to a
					decentralized network, while the 0G Compute Network routes
					AI queries to verifiable inference providers.
				</p>
				{/* <p>
					By building on 0G, we ensure your data stays yours - no
					centralized servers, no hidden fees, just truly
					decentralized AI-powered document interaction.
				</p> */}
			</div>
		</section>
	);
}
