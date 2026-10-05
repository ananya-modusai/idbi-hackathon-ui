"use client";

import { FC, useState } from "react";
import { IdbiShell } from "./IdbiShell";
import { CustomersScreen } from "./CustomersScreen";
import { CustomerWorkspace, WorkspaceCustomer } from "./CustomerWorkspace";
import { SelectCustomerState } from "./SelectCustomerState";
import { SalesAlertsScreen } from "./SalesAlertsScreen";
import { PortfolioSignalsScreen } from "./mis-portfolio/PortfolioSignalsScreen";
import screenData from "@/app/idbi-data/customer-screen-1.json";
import { useIdbiActiveContextStore } from "./ActiveContext/store";

type Section = "Workspace" | "Customer" | "Opportunity Signals" | "Portfolio Signals";

const SECTIONS: Section[] = ["Workspace", "Customer", "Opportunity Signals", "Portfolio Signals"];

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
    //
    // ⚠️ DEMO-SHORTCUT / PRODUCTION-BLOCKER — raise before any real build.
    // This stores the customer's NAME as the active-context value, and downstream
    // screens (notably CustomerLinkagesTab, which reads activeContexts.customer)
    // then use it as the identity KEY for data lookups.
    // Risk: names are not unique. Two customers sharing a name collide on the same
    // key, and one will silently render the other's data — wrong-customer disclosure.
    // Kept for the demo because the context value also drives the topbar label,
    // breadcrumb and command palette; re-pointing it is not a safe pre-demo change.
    // Fix: carry customer_id as the context identity and keep the name display-only.
    setContext("customer", c.name);
  };

  // Portfolio Signals hands back a CID; look up the full record so the customer
  // space opens exactly as it does from the Workspace list.
  const openCustomerById = (customerId: string) => {
    const match = (screenData.customers as any[]).find((c) => c.customer_id === customerId);
    if (match) openCustomer(match as WorkspaceCustomer);
  };

  const navigate = (label: string) => {
    if ((SECTIONS as string[]).includes(label)) setSection(label as Section);
  };

  const breadcrumb =
    section === "Customer"
      ? ["Relationship Management", "Customer", ...(customer ? [customer.name] : [])]
      : ["Relationship Management", section];

  return (
    <IdbiShell
      active={section}
      breadcrumb={breadcrumb}
      onNavigate={navigate}
      onSelectCustomer={(c) => openCustomer(c as WorkspaceCustomer)}
    >
      {section === "Portfolio Signals" ? (
        <PortfolioSignalsScreen onOpenCustomer={openCustomerById} />
      ) : section === "Opportunity Signals" ? (
        <SalesAlertsScreen onGoToCustomers={() => setSection("Workspace")} />
      ) : section === "Workspace" ? (
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
