'use client';

import React, { useEffect } from 'react';
import { FileText, Pause, Play, X, Sparkles, UploadCloud } from 'lucide-react';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { useOrderPipelineStore, QueueItem } from '@/app/store/orderPipeline/orderPipelineStore';

function SourcePill({ source }: { source: string }) {
  const isAuto = source === 'auto';
  return (
    <BubbleTag
      text={isAuto ? 'Detected from Web/Email' : 'Manually Uploaded'}
      color={isAuto ? 'blue' : 'purple'}
      withBorder={false}
      hasInsideIcon={true}
      icon={isAuto ? <Sparkles className="h-3.5 w-3.5" /> : <UploadCloud className="h-3.5 w-3.5" />}
    />
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; color: any }> = {
    queued: { label: 'Queued', color: 'gray' },
    processing: { label: 'Processing', color: 'yellow' },
    processed: { label: 'Processed', color: 'green' },
    paused: { label: 'Paused', color: 'red' },
  };
  const c = config[status] || config.queued;
  return <BubbleTag text={c.label} color={c.color} withBorder={false} />;
}

function ProgressBar({ progress, status }: { progress: number; status: string }) {
  const isQueued = status === 'queued';
  const isPaused = status === 'paused';
  const isProcessed = status === 'processed';

  const bgClass = isQueued
    ? 'bg-gray-200'
    : isPaused
    ? 'bg-yellow-500'
    : isProcessed
    ? 'bg-green-500'
    : 'bg-blue-600';

  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${bgClass}`}
        style={{ width: `${Math.max(progress, 2)}%` }}
      />
    </div>
  );
}

export function ProcessingQueue() {
  const { items, removeItem, togglePause, moveToHistory } = useOrderPipelineStore();

  // Progress simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useOrderPipelineStore.getState();

      const updatedItems = state.items.map((item) => {
        if (item.paused || item.status === 'processed') return item;

        let newProgress = item.progress + (Math.floor(Math.random() * 5) + 5);
        if (newProgress >= 100) newProgress = 100;

        let newStatus: QueueItem['status'] = item.status;
        let newStep = item.step;

        if (newProgress < 20) {
          newStatus = 'queued';
          newStep = 'in Queue';
        } else if (newProgress < 40) {
          newStatus = 'processing';
          newStep = 'Order OCR Extraction';
        } else if (newProgress < 60) {
          newStatus = 'processing';
          newStep = 'Order Analysis';
        } else if (newProgress < 80) {
          newStatus = 'processing';
          newStep = 'AI Summary';
        } else if (newProgress < 100) {
          newStatus = 'processing';
          newStep = 'Recommending Actions to be taken';
        } else {
          newStatus = 'processed';
          newStep = 'Processing complete, updating orders';

          // 5-second delay before moving to history
          setTimeout(() => {
            moveToHistory(item.id);
          }, 5000);
        }

        return { ...item, progress: newProgress, status: newStatus, step: newStep };
      });

      useOrderPipelineStore.setState({ items: updatedItems });
    }, 1500);

    return () => clearInterval(interval);
  }, [moveToHistory]);

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-lg border border-gray-100 shadow-sm mt-4">
        No orders in queue
      </div>
    );
  }

  return (
    <div className="w-full mt-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-row items-center justify-between w-full px-5 py-3 bg-white border border-gray-200 mb-2.5 rounded-xl shadow-sm transition-colors hover:bg-gray-50/50"
        >
          {/* Left part */}
          <div className="flex items-center gap-3 shrink-0">
            <FileText className="h-[18px] w-[18px] text-blue-700 shrink-0" />
            <span className="text-[15px] font-semibold text-blue-600 leading-none truncate tracking-tight max-w-[250px]">
              {item.file}
            </span>
            <div className="shrink-0 ml-1">
              <SourcePill source={item.source} />
            </div>
          </div>

          {/* Middle part - Progress Bar */}
          <div className="flex-1 w-full mx-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[12px] text-gray-500 font-medium leading-none">{item.step}...</span>
              <span className="text-[12px] font-bold text-gray-700 font-mono tracking-tight leading-none">
                {item.progress}%
              </span>
            </div>
            <ProgressBar progress={item.progress} status={item.status} />
          </div>

          {/* Right part */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="shrink-0">
              <StatusPill status={item.status} />
            </div>

            <div className="flex items-center gap-1 border-l border-gray-200 pl-3 ml-1 shrink-0">
              <button
                title={item.paused ? 'Resume' : 'Pause'}
                onClick={() => togglePause(item.id)}
                className="p-1 rounded cursor-pointer hover:bg-gray-100 text-gray-600 transition-colors"
              >
                {item.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button
                title="Cancel"
                onClick={() => removeItem(item.id)}
                className="p-1 rounded cursor-pointer hover:bg-red-50 text-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
