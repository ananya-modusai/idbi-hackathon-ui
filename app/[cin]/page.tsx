"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useActiveContext } from "@/app/layout/ActiveContext/useActiveContext";
import InsolvencyOverviewTab from "@/app/pages/Merchant/MerchantInsolvency/InsolvencyOverviewTab";

export default function MerchantPage() {
	const params = useParams();
	// route is [cin] so use params.cin; fall back to merchant_id if present for compatibility
	const displayed = (params?.cin || params?.merchant_id) as string;
	const { handleSelect } = useActiveContext();
	const [resolvedMerchantId, setResolvedMerchantId] = useState<string | null>(null);
	const [resolutionAttempted, setResolutionAttempted] = useState(false);

	useEffect(() => {
			if (!displayed) return;

			// Try to resolve displayed value (may be CIN) to actual merchantId
			(async () => {
				const { merchantIdList, fetchMerchantIdList } = (await import('@/app/store/merchant/merchantIdStore')).useMerchantIdStore.getState();

				let resolved = merchantIdList.find(m => m.id === displayed)?.id;
				if (!resolved) {
					try {
						await fetchMerchantIdList(0, 100);
						const updated = (await import('@/app/store/merchant/merchantIdStore')).useMerchantIdStore.getState().merchantIdList;
						resolved = updated.find(m => m.id === displayed)?.id || updated.find(m => m.cin === displayed)?.id;
							} catch {
								// ignore and fallback
							}
				}

				const merchantIdToUse = resolved || null;
				setResolvedMerchantId(merchantIdToUse);
				setResolutionAttempted(true);
				// Only call handleSelect with a resolved merchant UUID — do not pass CIN.
				if (merchantIdToUse) {
					handleSelect('merchant', merchantIdToUse, null);
				} else {
					// Merchant not resolved — do not call handleSelect with CIN to avoid 422s.
					console.warn('Could not resolve CIN to merchant UUID; not selecting merchant to avoid using CIN in API calls:', displayed);
				}
			})();
		}, [displayed, handleSelect]);

	// Handle invalid merchant ID
		if (!displayed) {
		return (
			<div className="p-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-red-600">Invalid Merchant ID</h1>
					<p className="text-gray-600 mt-2">Please provide a valid merchant ID in the URL.</p>
				</div>
			</div>
		);
	}

		return (
			<div className="p-8">
				{!resolutionAttempted ? (
					<div className="text-center">Resolving merchant...</div>
				) : resolvedMerchantId ? (
					// Only render insolvency UI when we have a UUID merchant id to use for APIs
					<InsolvencyOverviewTab merchantId={resolvedMerchantId} />
				) : (
					<div className="text-center text-red-600">Merchant not found — cannot load insolvency data.</div>
				)}
			</div>
		);
}
