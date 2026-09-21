"use client";

import { FC, useEffect } from "react";
import { motion } from "framer-motion";
import { Workspace } from "@/app/layout/Workspace/Workspace";
import { useWorkspaceStore } from "@/app/store/workspace/workspaceStore";
import ProcessingTab from "./ProcessingTab";

const ProcessingPage: FC = () => {
  const setActiveNavigation = useWorkspaceStore((state) => state.setActiveNavigation);
  const setActiveComponent = useWorkspaceStore((state) => state.setActiveComponent);

  useEffect(() => {
    setActiveComponent(null);
    setActiveNavigation({ group: "Underwriting", item: "Processing" });
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
      id: "processing",
      label: "Processing Workspace",
      content: (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <ProcessingTab />
        </motion.div>
      ),
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="h-full bg-slate-50/50">
      <Workspace tabs={tabs} initialActiveTabId="processing" />
    </motion.div>
  );
};

export default ProcessingPage;
