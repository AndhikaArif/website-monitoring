import { FiCalendar } from "react-icons/fi";
import { ProjectHoliday } from "@/types/project.type";
import { useAuth } from "@/context/auth-context";

interface HistoryHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  histories: ProjectHoliday[] | undefined;
}

export default function HistoryHolidayModal({
  isOpen,
  onClose,
  histories,
}: HistoryHolidayModalProps) {
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase();
  const isColorAdmin = userRole === "ADMIN";

  const theme = {
    iconText: isColorAdmin ? "text-blue-600" : "text-purple-600",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header Modal */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FiCalendar className={theme.iconText} /> Riwayat Libur Lengkap
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors border-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body Modal (Scrollable) */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {histories && histories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {histories.map((history) => {
                const dateObj = new Date(history.date);
                const formatted = dateObj.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });

                return (
                  <div
                    key={history.id}
                    className="px-3 py-2 bg-gray-50 border border-gray-100 text-gray-600 rounded-xl text-xs font-medium text-center"
                  >
                    {formatted}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic text-center w-full">
              Tidak ada data riwayat.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
