"use client";

import { FC, useEffect } from "react";
import { motion } from "framer-motion";
import { Workspace } from "@/app/layout/Workspace/Workspace";
import { useActiveContextStore } from "@/app/store/activeContextStore";
import { useWorkspaceStore } from "@/app/store/workspace/workspaceStore";
import RestrictedCategoryTab from "./RestrictedCategoryTab";

interface InvAllCasesPageProps {
  merchantId?: string;
}

const InvRestrictedCategoryPage: FC<InvAllCasesPageProps> = ({ merchantId }) => {
  const initFromUrl = useActiveContextStore((state) => state.initFromUrl);
  const setActiveNavigation = useWorkspaceStore((state) => state.setActiveNavigation);
  const setActiveComponent = useWorkspaceStore((state) => state.setActiveComponent);

  useEffect(() => {
    setActiveComponent(null);
    setActiveNavigation({ group: "Underwriting", item: "Restricted Categories" });
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
      id: "restricted-categories",
      label: "Restricted Categories",
      content: (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <RestrictedCategoryTab
            key="restricted-categories"
          />
        </motion.div>
      ),
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Workspace tabs={tabs} initialActiveTabId="restricted-categories" />
    </motion.div>
  );
};

export default InvRestrictedCategoryPage;
