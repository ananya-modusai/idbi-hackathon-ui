import { CustomCard } from "./CustomCard";
import { LucideIcon } from "lucide-react";

interface CaseInvestigationCardProps {
	title: string;
	icon: LucideIcon;
	openCases: number;
	inProgressCases: number;
	closedCases: number;
}

export const CaseInvestigationCard = ({ title, icon: Icon, openCases, inProgressCases, closedCases }: CaseInvestigationCardProps) => {

	return (
		<CustomCard className="p-6">
			<div className="flex items-center gap-2 mb-4">
				<Icon className="h-5 w-5 text-blue-500" />
				<h3 className="font-medium text-gray-900">{title}</h3>
			</div>
			<div className="grid grid-cols-3 gap-8">
				<div className="space-y-2">
					<p className="text-2xl font-semibold text-gray-900">
						{openCases}
					</p>
					<p className="text-sm text-gray-500">Open Cases</p>
				</div>
				<div className="space-y-2">
					<p className="text-2xl font-semibold text-gray-900">
						{inProgressCases}
					</p>
					<p className="text-sm text-gray-500">In Progress</p>
				</div>
				<div className="space-y-2">
					<p className="text-2xl font-semibold text-gray-900">
						{closedCases}
					</p>
					<p className="text-sm text-gray-500">Closed Cases</p>
				</div>
			</div>
		</CustomCard>
	);
};