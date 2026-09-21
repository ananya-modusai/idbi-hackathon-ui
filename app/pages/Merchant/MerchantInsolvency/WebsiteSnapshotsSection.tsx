'use client';

import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Clock, ImageOff, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/app/pages/Investigation/Components/EmptyState';
import websiteSnapshots from '@/app/data/staticSnapshots/tarc/website-snapshots.json';

// Ported from the underwriting product's Website Snapshot section
// (InvWebAnalysisTab.tsx) — same grid layout and click-to-maximize dialog
// with prev/next navigation, adapted for our downloaded local image files
// (localPath) instead of inline base64.

type Snapshot = (typeof websiteSnapshots)[number];

const WebsiteSnapshotsSection: FC = () => {
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);

  return (
    <div>
      <SectionHeaderWithFlags
        title="Website Snapshot"
        icon={Camera}
        iconColorClass="text-gray-500"
        titleColorClass="text-blue-700"
        positiveFlags={[]}
        negativeFlags={[]}
        neutralFlags={[]}
        allowCollapse={false}
      />

      <div className="mt-6">
        {websiteSnapshots.length > 0 ? (
          <div
            className="grid gap-4 overflow-x-auto pb-4 w-full max-w-full"
            style={{ gridAutoFlow: 'column', gridAutoColumns: 'calc((100% - 3rem) / 4)' }}
          >
            {websiteSnapshots.map((result, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col w-full"
                onClick={() => setSelectedSnapshot(result)}
              >
                <div className="aspect-[4/3] w-full relative overflow-hidden bg-gray-50 shrink-0">
                  {result.localPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.localPath}
                      alt={result.step || `Snapshot ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                      <ImageOff className="h-8 w-8" />
                      <span className="text-xs">No screenshot available</span>
                    </div>
                  )}
                </div>
                {result.step && (
                  <div className="px-3 py-2 border-t border-gray-50 bg-gray-50/30 flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-[10px] font-medium text-gray-500 truncate">{result.step}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No website snapshots available" />
        )}
      </div>

      {/* Website Snapshot Maximize Dialog */}
      <Dialog open={!!selectedSnapshot} onOpenChange={(open) => !open && setSelectedSnapshot(null)}>
        <DialogContent className="max-w-7xl w-[95vw] h-auto max-h-[95vh] p-0 overflow-visible bg-white border-none shadow-2xl flex flex-col items-center justify-center z-[100] [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedSnapshot?.step || 'Website Snapshot'}</DialogTitle>
          </DialogHeader>

          <div className="relative w-full flex items-center justify-center p-0">
            <button
              onClick={() => setSelectedSnapshot(null)}
              className="absolute -top-4 -right-4 h-10 w-10 flex items-center justify-center rounded-xl bg-white hover:bg-gray-100 shadow-xl border border-gray-200 text-gray-800 transition-all active:scale-95 z-[110]"
            >
              <X className="h-5 w-5" />
            </button>

            {websiteSnapshots.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!selectedSnapshot) return;
                  const currentIndex = websiteSnapshots.indexOf(selectedSnapshot);
                  const prevIndex = (currentIndex - 1 + websiteSnapshots.length) % websiteSnapshots.length;
                  setSelectedSnapshot(websiteSnapshots[prevIndex]);
                }}
                className="absolute -left-16 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-2xl border border-gray-200 text-gray-800 transition-all active:scale-95 z-[110] group"
              >
                <ChevronLeft className="h-7 w-7 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}

            {websiteSnapshots.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!selectedSnapshot) return;
                  const currentIndex = websiteSnapshots.indexOf(selectedSnapshot);
                  const nextIndex = (currentIndex + 1) % websiteSnapshots.length;
                  setSelectedSnapshot(websiteSnapshots[nextIndex]);
                }}
                className="absolute -right-16 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-2xl border border-gray-200 text-gray-800 transition-all active:scale-95 z-[110] group"
              >
                <ChevronRight className="h-7 w-7 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {selectedSnapshot?.localPath && (
              <div className="relative group w-full h-full">
                <motion.img
                  key={selectedSnapshot.localPath}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  src={selectedSnapshot.localPath}
                  alt={selectedSnapshot.step || 'Website Snapshot'}
                  className="w-full h-full object-contain rounded-lg"
                />
                {selectedSnapshot.step && (
                  <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/20 shadow-2xl">
                    <Clock className="h-4 w-4 text-white/80" />
                    <span className="text-sm font-medium text-white tracking-wide">{selectedSnapshot.step}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebsiteSnapshotsSection;
