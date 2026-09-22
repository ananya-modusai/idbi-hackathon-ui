"use client";

import { FC, useState } from "react";
import { IdbiShell } from "./IdbiShell";
import { CustomersScreen } from "./CustomersScreen";
import { CustomerWorkspace, WorkspaceCustomer } from "./CustomerWorkspace";
import { SelectCustomerState } from "./SelectCustomerState";
import { useIdbiActiveContextStore } from "./ActiveContext/store";

type Section = "Workspace" | "Customer";

export const IdbiApp: FC = () => {
  const [section, setSection] = useState<Section>("Workspace");
  const [customer, setCustomer] = useState<WorkspaceCustomer | null>(null);
  const setContext = useIdbiActiveContextStore((s) => s.setContext);

  // Opening a customer from the list moves into the Customer space, which is its own
  // sidebar section — the three workspace tabs live there rather than replacing the list.
  const openCustomer = (c: WorkspaceCustomer) => {
    setCustomer(c);
    setSection("Customer");
    // The topbar names whoever is open, set here rather than by each screen.
    setContext("customer", c.name);
  };

  const navigate = (label: string) => {
    if (label === "Workspace" || label === "Customer") setSection(label as Section);
  };

  const breadcrumb =
    section === "Customer"
      ? ["Relationship Management", "Customer", ...(customer ? [customer.name] : [])]
      : ["Relationship Management", "Workspace"];

  return (
    <IdbiShell
      active={section}
      breadcrumb={breadcrumb}
      onNavigate={navigate}
      onSelectCustomer={(c) => openCustomer(c as WorkspaceCustomer)}
    >
      {section === "Workspace" ? (
        <CustomersScreen onOpenCustomer={(c) => openCustomer(c as WorkspaceCustomer)} />
      ) : customer ? (
        <CustomerWorkspace customer={customer} onBack={() => setSection("Workspace")} />
      ) : (
        <SelectCustomerState onGoToCustomers={() => setSection("Workspace")} />
      )}
    </IdbiShell>
  );
};

export default IdbiApp;
