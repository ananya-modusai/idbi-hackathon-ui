"use client";

import { FC, useEffect } from "react";
import { motion } from "framer-motion";
import { Workspace } from "@/app/layout/Workspace/Workspace";
import InvNotificationsTab from "./InvNotificationsTab";
import InvDashboard from "./InvDashboard";
import { useActiveContextStore } from "@/app/store/activeContextStore";
import InvWatchlistPage from "./InvWatchlistPage";
import InvMetricsTab from "./InvMetricsTab";
import OrderPipelineTab from "./OrderPipeline/OrderPipelineTab";
import { useWorkspaceStore } from "@/app/store/workspace/workspaceStore";
import { InvPipenlineTab } from "./InvPipenlineTab";
import InvPortfolioPage from "./InvPortfolioPage";
import BannedCategoryTab from "./BannedCategoryTab";
// import BannedCategoryTab from "./BannedCategoryTab";

interface InvAllCasesPageProps {
  merchantId?: string;
}

const InvBannedCategoryPage: FC<InvAllCasesPageProps> = ({ merchantId }) => {
  const initFromUrl = useActiveContextStore((state) => state.initFromUrl);
  const setActiveNavigation = useWorkspaceStore((state) => state.setActiveNavigation);
  const setActiveComponent = useWorkspaceStore((state) => state.setActiveComponent);

  useEffect(() => {
    setActiveComponent(null);
    setActiveNavigation({ group: "Underwriting", item: "Banned Categories" });
    initFromUrl();
  }, [initFromUrl, setActiveNavigation, setActiveComponent]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };
//check
  const tabs = [
    {
      id: "banned-categories",
      label: "Banned Categories",
      content: (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <BannedCategoryTab
            key="banned-categories"
          />
        </motion.div>
      ),
    },
   
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Workspace tabs={tabs} initialActiveTabId="banned-categories" />
    </motion.div>
  );
};

export default InvBannedCategoryPage;
