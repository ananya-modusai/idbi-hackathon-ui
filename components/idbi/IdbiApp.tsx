"use client";

import { FC, useState } from "react";
import { IdbiShell } from "./IdbiShell";
import { CustomersScreen } from "./CustomersScreen";
import { CustomerWorkspace, WorkspaceCustomer } from "./CustomerWorkspace";
import { SelectCustomerState } from "./SelectCustomerState";

type Section = "Customers" | "Customer";

export const IdbiApp: FC = () => {
  const [section, setSection] = useState<Section>("Customers");
  const [customer, setCustomer] = useState<WorkspaceCustomer | null>(null);

  // Opening a customer from the list moves into the Customer space, which is its own
  // sidebar section — the three workspace tabs live there rather than replacing the list.
  const openCustomer = (c: WorkspaceCustomer) => {
    setCustomer(c);
    setSection("Customer");
  };

  const navigate = (label: string) => {
    if (label === "Customers" || label === "Customer") setSection(label as Section);
  };

  const breadcrumb =
    section === "Customer"
      ? ["Relationship Management", "Customer", ...(customer ? [customer.name] : [])]
      : ["Relationship Management", "Customers"];

  return (
    <IdbiShell active={section} breadcrumb={breadcrumb} onNavigate={navigate}>
      {section === "Customers" ? (
        <CustomersScreen onOpenCustomer={(c) => openCustomer(c as WorkspaceCustomer)} />
      ) : customer ? (
        <CustomerWorkspace customer={customer} onBack={() => setSection("Customers")} />
      ) : (
        <SelectCustomerState onGoToCustomers={() => setSection("Customers")} />
      )}
    </IdbiShell>
  );
};

export default IdbiApp;
