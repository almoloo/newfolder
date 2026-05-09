'use client';

import type { BalanceSummaryResponse } from '@/lib/types/credits';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const BALANCE_QUERY_KEY = ['balance'] as const;

async function fetchBalance(): Promise<BalanceSummaryResponse> {
	const res = await fetch('/api/balance/summary');
	if (!res.ok) throw new Error('Failed to fetch balance');
	return res.json();
}

export function useBalance() {
	return useQuery({
		queryKey: BALANCE_QUERY_KEY,
		queryFn: fetchBalance,
	});
}

export function useInvalidateBalance() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: BALANCE_QUERY_KEY });
}
