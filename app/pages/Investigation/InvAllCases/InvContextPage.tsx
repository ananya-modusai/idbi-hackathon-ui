"use client";

import { FC, useEffect } from "react";
import { motion } from "framer-motion";
import { Workspace } from "@/app/layout/Workspace/Workspace";
import { useActiveContextStore } from "@/app/store/activeContextStore";
import { useWorkspaceStore } from "@/app/store/workspace/workspaceStore";
import ContextTab from "./ContextTab";

interface InvContextPageProps {
  merchantId?: string;
}

const InvContextPage: FC<InvContextPageProps> = ({ merchantId }) => {
  const initFromUrl = useActiveContextStore((state) => state.initFromUrl);
  const setActiveNavigation = useWorkspaceStore((state) => state.setActiveNavigation);
  const setActiveComponent = useWorkspaceStore((state) => state.setActiveComponent);

  useEffect(() => {
    setActiveComponent(null);
    setActiveNavigation({ group: "Underwriting", item: "Context" });
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

  const tabs = [
    {
      id: "context",
      label: "Context",
      content: (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <ContextTab key="context" />
        </motion.div>
      ),
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Workspace tabs={tabs} initialActiveTabId="context" />
    </motion.div>
  );
};

export default InvContextPage;
