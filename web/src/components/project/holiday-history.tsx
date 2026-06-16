"use client";

import { useState } from "react";
import HistoryHolidayModal from "@/components/modals/history-holiday-modal";
import { ProjectHoliday } from "@/types/project.type";

interface HolidayHistoryProps {
  pastHistories?: ProjectHoliday[];
  limit?: number;
}

export default function HolidayHistory({
  pastHistories = [],
  limit = 6,
}: HolidayHistoryProps) {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
        Riwayat Libur ({pastHistories.length})
      </p>

      {pastHistories.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {pastHistories.slice(0, limit).map((history) => {
              const formatted = new Date(history.date).toLocaleDateString(
                "id-ID",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                },
              );

              return (
                <span
                  key={history.id}
                  className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[11px] font-medium"
                >
                  {formatted}
                </span>
              );
            })}
          </div>

          {pastHistories.length > limit && (
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-[11px] text-purple-600 font-bold hover:text-purple-700 mt-2 bg-transparent border-none cursor-pointer block p-0"
            >
              Lihat riwayat lainnya ({pastHistories.length - limit})
            </button>
          )}
        </>
      ) : (
        <p className="text-xs text-gray-400 italic">
          Belum ada riwayat hari libur.
        </p>
      )}

      {/* MODAL DIPANGGIL DI DALAM KOMPONEN INI */}
      <HistoryHolidayModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        histories={pastHistories}
      />
    </div>
  );
}
