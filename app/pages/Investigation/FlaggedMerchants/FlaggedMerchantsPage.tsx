"use client";

import { FC, useEffect } from "react";
import { motion } from "framer-motion";
import { Workspace } from "@/app/layout/Workspace/Workspace";
import { useWorkspaceStore } from "@/app/store/workspace/workspaceStore";
import FlaggedMerchantsTab from "./FlaggedMerchantsTab";

const FlaggedMerchantsPage: FC = () => {
  const setActiveNavigation = useWorkspaceStore((state) => state.setActiveNavigation);
  const setActiveComponent = useWorkspaceStore((state) => state.setActiveComponent);

  useEffect(() => {
    setActiveComponent(null);
    setActiveNavigation({ group: "Underwriting", item: "Flagged Merchants" });
  }, [setActiveNavigation, setActiveComponent]);

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

  const tabs = [
    {
      id: "flagged-merchants",
      label: "Flagged Merchants",
      content: (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <FlaggedMerchantsTab key="flagged-merchants" />
        </motion.div>
      ),
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Workspace tabs={tabs} initialActiveTabId="flagged-merchants" />
    </motion.div>
  );
};

export default FlaggedMerchantsPage;
