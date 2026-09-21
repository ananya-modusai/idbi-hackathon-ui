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

interface InvAllCasesPageProps {
  merchantId?: string;
}

const InvAllCasesPage: FC<InvAllCasesPageProps> = ({ merchantId }) => {
  const initFromUrl = useActiveContextStore((state) => state.initFromUrl);
  const setActiveNavigation = useWorkspaceStore((state) => state.setActiveNavigation);
  const setActiveComponent = useWorkspaceStore((state) => state.setActiveComponent);

  useEffect(() => {
    setActiveComponent(null);
    setActiveNavigation({ group: "Underwriting", item: "All Cases" });
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
      id: "portfolio",
      label: "Portfolio",
      content: (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <InvPortfolioPage
            key={`portfolio-${merchantId}`}
            merchantId={merchantId}
          />
        </motion.div>
      ),
    },
    {
      id: "watchlist",
      label: "Processing Manager",
      content: (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <InvWatchlistPage
            key={`watchlist-${merchantId}`}
            merchantId={merchantId}
          />
        </motion.div>
      ),
    },
    {
      id: "dashboard",
      label: "Dashboard",
      content: (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <InvDashboard
            key={`dashboard-${merchantId}`}
            merchantId={merchantId}
          />
        </motion.div>
      ),
    },
    // {
    //   id: "banned-category",
    //   label: "Banned Category",
    //   content: (
    //     <motion.div
    //       variants={itemVariants}
    //       initial="hidden"
    //       animate="visible"
    //       transition={{ duration: 0.3 }}
    //     >
    //       <BannedCategoryTab />
    //     </motion.div>
    //   ),
    // },
    
    //  {
    //   id: "order-pipeline",
    //   label: "Order Pipeline",
    //   content: (
    //     <motion.div
    //       variants={itemVariants}
    //       initial="hidden"
    //       animate="visible"
    //       transition={{ duration: 0.3 }}
    //     >
    //       <OrderPipelineTab />
    //     </motion.div>
    //   ),
    // },
    // {
    //   id: "pipeline",
    //   label: "Investigation Pipeline",
    //   content: (
    //     <motion.div
    //       variants={itemVariants}
    //       initial="hidden"
    //       animate="visible"
    //       transition={{ duration: 0.3 }}
    //     >
    //       <InvPipenlineTab
    //       />
    //     </motion.div>
    //   ),
    // },
    // {
    //   id: "Metrics",
    //   label: "Metrics",
    //   content: (
    //     <motion.div
    //       variants={itemVariants}
    //       initial="hidden"
    //       animate="visible"
    //       transition={{ duration: 0.3 }}
    //     >
    //       <InvMetricsTab
    //         key={`metrics-${merchantId}`}
    //         merchantId={merchantId}
    //       />
    //     </motion.div>
    //   ),
    // },
   
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Workspace tabs={tabs} initialActiveTabId="portfolio" />
    </motion.div>
  );
};

export default InvAllCasesPage;
