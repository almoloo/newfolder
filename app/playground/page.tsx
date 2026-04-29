import SummaryData from './components/summary-data';
import Topup from './components/topup';
import TransactionsData from './components/transactions';

export default function PlaygroundPage() {
	return (
		<div>
			<h1>TESTING</h1>
			<SummaryData />
			<TransactionsData />
			<Topup />
		</div>
	);
}
