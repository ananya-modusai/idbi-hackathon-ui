import { CustomCard } from "./CustomCard";
import { LucideIcon } from "lucide-react";

interface CaseInvestigationPriorityCardProps {
	title: string;
	icon: LucideIcon;
	lowPriorityCases: number;
	mediumPriorityCases: number;
	highPriorityCases: number;
}

export const CaseInvestigationPriorityCard = ({ title, icon: Icon, lowPriorityCases, mediumPriorityCases, highPriorityCases }: CaseInvestigationPriorityCardProps) => {

	return (
		<CustomCard className="p-6">
			<div className="flex items-center gap-2 mb-4">
				<Icon className="h-5 w-5 text-blue-500" />
				<h3 className="font-medium text-gray-900">{title}</h3>
			</div>
			<div className="grid grid-cols-3 gap-8">
				<div className="space-y-2">
					<p className="text-2xl font-semibold text-gray-900">
						{lowPriorityCases}
					</p>
					<p className="text-sm text-gray-500">Low Priority</p>
				</div>
				<div className="space-y-2">
					<p className="text-2xl font-semibold text-gray-900">
						{mediumPriorityCases}
					</p>
					<p className="text-sm text-gray-500">Medium Priority</p>
				</div>
                <div className="space-y-2">
                    <p className="text-2xl font-semibold text-gray-900">
                        {highPriorityCases}
                    </p>
                    <p className="text-sm text-gray-500">High Priority</p>
                </div>
			</div>
		</CustomCard>
	);
}