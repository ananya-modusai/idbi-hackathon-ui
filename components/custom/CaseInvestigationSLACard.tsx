import { CustomCard } from "./CustomCard";
import { LucideIcon } from "lucide-react";

interface CaseInvestigationSLACardProps {
	title: string;
	icon: LucideIcon;
	withinSLA: number;
	riskCases: number;
	breachedCases: number;
}

export const CaseInvestigationSLACard = ({ title, icon: Icon, withinSLA, riskCases, breachedCases }: CaseInvestigationSLACardProps) => {

	return (
		<CustomCard className="p-6">
			<div className="flex items-center gap-2 mb-4">
				<Icon className="h-5 w-5 text-blue-500" />
				<h3 className="font-medium text-gray-900">{title}</h3>
			</div>
			<div className="grid grid-cols-3 gap-8">
				<div className="space-y-2">
					<p className="text-2xl font-semibold text-gray-900">
						{withinSLA}
					</p>
					<p className="text-sm text-gray-500">Within SLA</p>
				</div>
				<div className="space-y-2">
					<p className="text-2xl font-semibold text-gray-900">
						{riskCases}
					</p>
					<p className="text-sm text-gray-500">At Risk</p>
				</div>
                <div className="space-y-2">
                    <p className="text-2xl font-semibold text-gray-900">
                        {breachedCases}
                    </p>
                    <p className="text-sm text-gray-500">SLA Breached</p>
                </div>
			</div>
		</CustomCard>
	);
};