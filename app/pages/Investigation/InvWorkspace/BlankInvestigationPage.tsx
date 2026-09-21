"use client"

import { Store } from 'lucide-react'
import React from 'react'

// Simple blank state shown when there is no investigation selected
export default function BlankInvestigationPage() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="text-center py-20">
        <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-lg bg-gray-50">
        <Store className="h-12 w-12 text-gray-300 mx-auto" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Investigation Selected</h2>
        <p className="text-gray-400">Please select an investigation case from the search bar or from the All Cases page to view details.</p>
      </div>
    </div>
  )
}
