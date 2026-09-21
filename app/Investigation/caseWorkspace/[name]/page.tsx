import React from 'react'
import InvCaseWorkspacePage from '@/app/pages/Investigation/InvWorkspace/InvCaseWorkspacePage'

// Accept either a plain params object or a Promise-wrapped params (the generated types
// sometimes treat params as Promise). Make the page async and resolve params if needed.
export default async function CaseWorkspaceWithName(props: any) {
  const rawParams = props?.params
  const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams

  const name: string | undefined = params?.name

  return <InvCaseWorkspacePage name={name} />
}
