# Case Management (SidebarCategory)
We are going to build a case management system for the merchant fraud investigation team. You are supposed to design the UI for the case management system. A new category will be added to the sidebar called "Case Management". And multiple tabs will be added to the category. The tabs under each of those pages are also described below. 

## Page 1: Queue Manager
- Workspace Tab 1: Queues Overview (queue type, status, priority, case aging, SLA, etc.)
- Workspace Tab 2: Case Assignment Interface
- Workspace Tab 3: SLA Monitoring View

## Page 2: Investigation Hub

- Workspace Tab 1: Add Investigation Notes (for a particular case ID)
    - Show details of the case ID selected in the Active Context. Show "No Case ID Selected" if the Case ID is null
    - Ability to add investigation notes & findings

- Workspace Tab 2: Case Timeline (for a particular case ID)
    - Show details of the case ID selected in the Active Context. Show "No Case ID Selected" if the Case ID is null
    - Unified timeline of all case-related events (investigation trigger datetime and channel, investigation status change event, docs added event, communication event, account status change event, notes added event by anyone, etc.)

- Workspace Tab 3: Docs & Communications (for a particular case ID)
    - Show a single list of communications (email, chat, call) (sort descending on timestamp) on the case ID selected in the Active Context. Show "No Case ID Selected" if the Case ID is null
    - Any communication may optionally contain a document. If so, indicate the document ID in the Communication List. 
    - Each case ID only stores the list of document & communication IDs & descriptions associated with it. Upon clicking the documnent/communication, it fetches the actual document/communication from the database and renders into a new artifact
    - Each commication list item will have a summary of the communication & document content. More detailed insights (and the actual document/communication) can be accessed in a new artifact by clicking the item.
    - Allow replying to the communication chain (with only text as input for now). This will initiate a new communication ID (under the same case ID) and add it to the communication list.

- Workspace Tab 4: Related Cases (to the case ID selected in the Active Context)
    - Show a list of related cases to the case ID selected in the Active Context. Show "No Case ID Selected" if the Case ID is null
    - Easy implementation - Related cases = all other cases that share the same merchant ID (can think of more ways to find related cases later)
    - Upon clicking the related case ID, it fetches the actual related case ID from the database and redirects to Case Details Tab (with the case ID as an input from the Active Context)

## Page 3: Assgined Cases
- Workspace Tab 1: Assigned Cases (all case IDs for a particular investigator)
    - Clicking on a case ID sets the Case ID in the Active Context and redirects to Case Details Tab (with the case ID as an input from the Active Context)





