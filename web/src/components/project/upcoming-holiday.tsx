"use client";

import { useState } from "react";
import { FiLoader, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";
import {
  deleteProjectHoliday,
  bulkDeleteProjectHolidays,
} from "@/services/project.service";
import { ProjectHoliday } from "@/types/project.type";

interface UpcomingHolidaysProps {
  projectId: string;
  projectStatus: string;
  holidays?: ProjectHoliday[];
  onRefresh: () => Promise<void>;
}

export default function UpcomingHolidays({
  projectId,
  projectStatus,
  holidays = [],
  onRefresh,
}: UpcomingHolidaysProps) {
  const [deletingHolidayId, setDeletingHolidayId] = useState<string | null>(
    null,
  );
  const [selectedHolidayIds, setSelectedHolidayIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleDeleteHoliday = async (
    holidayId: string,
    dateString: string,
    formattedDate: string,
  ) => {
    if (deletingHolidayId !== null) return;

    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus hari libur pada tanggal ${formattedDate}?`,
    );
    if (!isConfirmed) return;

    setDeletingHolidayId(holidayId);

    try {
      // Parsing string ISO dari DB ke objek Date
      const d = new Date(dateString);

      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();

      // Satukan menjadi format DD-MM-YYYY sesuai request Backend
      const cleanDateParam = `${day}-${month}-${year}`;

      await deleteProjectHoliday(projectId, cleanDateParam);

      // Bersihkan ID dari daftar terpilih jika sebelumnya sempat dicentang
      setSelectedHolidayIds((prev) => prev.filter((id) => id !== holidayId));

      await onRefresh();
      toast.success(`Hari libur tanggal ${formattedDate} berhasil dihapus`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Gagal menghapus hari libur",
        );
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Terjadi kesalahan yang tidak terduga");
      }
    } finally {
      setDeletingHolidayId(null);
    }
  };

  const handleToggleSelectHoliday = (id: string) => {
    setSelectedHolidayIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAllHolidays = () => {
    // Cek apakah semua libur sudah terpilih
    if (selectedHolidayIds.length === holidays.length) {
      setSelectedHolidayIds([]);
    } else {
      // Jika belum, ambil semua ID libur dan masukkan ke state
      setSelectedHolidayIds(holidays.map((h) => h.id));
    }
  };

  const handleBulkDeleteHolidays = async () => {
    if (selectedHolidayIds.length === 0) return;

    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${selectedHolidayIds.length} hari libur yang terpilih?`,
    );
    if (!isConfirmed) return;

    setIsBulkDeleting(true);

    try {
      // Filter data libur dari state utama yang ID-nya masuk daftar centang
      const targets = holidays.filter((h) => selectedHolidayIds.includes(h.id));

      // 2. Format menjadi array of string ["DD-MM-YYYY", ...]
      const formattedDates = targets.map((holiday) => {
        const d = new Date(holiday.date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      });

      // Eksekusi bulk delete lewat 1 request tunggal
      const res = await bulkDeleteProjectHolidays(projectId, {
        dates: formattedDates,
      });

      await onRefresh();

      toast.success(
        res.message || `${formattedDates.length} hari libur berhasil dihapus`,
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Gagal menghapus hari libur massal",
        );
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Terjadi kesalahan yang tidak terduga");
      }
    } finally {
      setSelectedHolidayIds([]);
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="border-t border-gray-100 pt-4 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            Jadwal Libur{" "}
            {selectedHolidayIds.length > 0 && `(${selectedHolidayIds.length})`}
          </p>

          {holidays.length > 0 && projectStatus !== "SELESAI" && (
            <button
              type="button"
              onClick={handleSelectAllHolidays}
              disabled={isBulkDeleting || deletingHolidayId !== null}
              className="text-[10px] text-purple-600 font-bold hover:text-purple-700 bg-transparent border-none cursor-pointer disabled:opacity-50 transition-colors"
            >
              {selectedHolidayIds.length === holidays.length
                ? "Batal Pilih"
                : "Pilih Semua"}
            </button>
          )}
        </div>

        {selectedHolidayIds.length > 0 && (
          <button
            type="button"
            onClick={handleBulkDeleteHolidays}
            disabled={isBulkDeleting || deletingHolidayId !== null}
            className="text-[10px] text-red-600 font-bold hover:text-red-700 bg-transparent border-none cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            {isBulkDeleting ? (
              <>
                <FiLoader className="animate-spin" size={10} /> Menghapus...
              </>
            ) : (
              "Hapus Terpilih"
            )}
          </button>
        )}
      </div>

      {holidays.length > 0 ? (
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
          {holidays.map((holiday) => {
            const formatted = new Date(holiday.date).toLocaleDateString(
              "id-ID",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
              },
            );
            const isIndividualLoading = deletingHolidayId === holiday.id;
            const isAnyLoading = isBulkDeleting || deletingHolidayId !== null;

            return (
              <div
                key={holiday.id}
                className="group flex items-center justify-between p-2 bg-purple-50/50 hover:bg-purple-50 rounded-xl transition-colors text-xs gap-2"
              >
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  {projectStatus !== "SELESAI" && (
                    <input
                      type="checkbox"
                      checked={selectedHolidayIds.includes(holiday.id)}
                      onChange={() => handleToggleSelectHoliday(holiday.id)}
                      disabled={isAnyLoading}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer h-3.5 w-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  )}
                  <span className="font-semibold text-purple-700">
                    {formatted}
                  </span>
                </label>

                {projectStatus !== "SELESAI" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteHoliday(holiday.id, holiday.date, formatted)
                    }
                    disabled={isAnyLoading}
                    className={`p-1 text-red-400 rounded-md transition-all border-none bg-transparent ${
                      isIndividualLoading
                        ? "opacity-100 cursor-wait"
                        : isAnyLoading
                          ? "opacity-20 cursor-not-allowed text-gray-300"
                          : "opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    }`}
                  >
                    {isIndividualLoading ? (
                      <FiLoader
                        size={14}
                        className="animate-spin text-purple-600"
                      />
                    ) : (
                      <FiTrash2 size={14} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">
          Tidak ada jadwal libur mendatang.
        </p>
      )}
    </div>
  );
}
