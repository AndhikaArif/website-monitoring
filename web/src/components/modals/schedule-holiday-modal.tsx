"use client";

import { useState, useEffect } from "react";
import { Formik, Form } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import axios from "axios";
import { FiCalendar, FiX, FiClock } from "react-icons/fi";
import toast from "react-hot-toast";

import { scheduleProjectHoliday } from "@/services/project.service";
import { scheduleHolidaySchema } from "@/validation/project.validation";
import { useAuth } from "@/context/auth-context";

interface ScheduleHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess?: () => void;
}

export default function ScheduleHolidayModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: ScheduleHolidayModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMultiDay, setIsMultiDay] = useState(false);

  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase(); // Menyeragamkan menjadi UPPERCASE

  const isColorAdmin = userRole === "ADMIN";
  const theme = {
    headerBg: isColorAdmin ? "bg-blue-50/50" : "bg-purple-50/50",
    iconText: isColorAdmin ? "text-blue-600" : "text-purple-600",
    inputFocus: isColorAdmin
      ? "focus:border-blue-500 focus:ring-blue-50"
      : "focus:border-purple-500 focus:ring-purple-50",
    checkbox: isColorAdmin
      ? "text-blue-600 focus:ring-blue-500"
      : "text-purple-600 focus:ring-purple-500",
    btnSubmit: isColorAdmin
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-purple-600 hover:bg-purple-700",
  };

  // Reset checkbox tiap kali dibuka
  useEffect(() => {
    if (isOpen) {
      setIsMultiDay(false);
    }
  }, [isOpen]);

  // Helper konversi format tanggal browser (YYYY-MM-DD) <-> backend (DD-MM-YYYY)
  const toBackendFormat = (htmlDate: string): string => {
    if (!htmlDate) return "";
    const [year, month, day] = htmlDate.split("-");
    return `${day}-${month}-${year}`;
  };

  const toHtmlFormat = (beDate: string): string => {
    if (!beDate) return "";
    const [day, month, year] = beDate.split("-");
    return `${year}-${month}-${day}`;
  };

  const getNextDay = (dateStr: string) => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split("-");
    const date = new Date(`${year}-${month}-${day}`);
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString("sv-SE"); // Format YYYY-MM-DD
  };

  // Ambil tanggal hari ini dengan format YYYY-MM-DD sesuai timezone lokal
  const todayHtml = new Date().toLocaleDateString("sv-SE");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden relative">
        {/* HEADER */}
        <div className="bg-purple-50/50 px-6 py-5 text-black flex items-center justify-between border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <FiCalendar className={theme.iconText} /> Jadwal Libur Proyek
          </h2>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-xl p-1 transition-colors"
          >
            <FiX />
          </button>
        </div>

        {/* BODY / FORM */}
        <div className="p-6">
          <Formik
            initialValues={{
              startDate: toBackendFormat(todayHtml),
              endDate: "",
            }}
            validationSchema={toFormikValidationSchema(scheduleHolidaySchema)}
            onSubmit={async (values, { resetForm }) => {
              // Jika endDate kosong, samakan nilainya dengan startDate (Libur 1 Hari)
              const finalEndDate = values.endDate || values.startDate;

              const [sDay, sMonth, sYear] = values.startDate.split("-");
              const [eDay, eMonth, eYear] = finalEndDate.split("-");
              const startObj = new Date(`${sYear}-${sMonth}-${sDay}`);
              const endObj = new Date(`${eYear}-${eMonth}-${eDay}`);

              if (startObj > endObj) {
                toast.error(
                  "Tanggal mulai tidak boleh melewati tanggal selesai!",
                );
                return;
              }

              try {
                setIsSubmitting(true);
                const response = await scheduleProjectHoliday(projectId, {
                  startDate: values.startDate,
                  endDate: finalEndDate,
                });

                if (onSuccess) {
                  await onSuccess();

                  toast.success(
                    response.message || "Berhasil mengatur jadwal libur!",
                  );
                }

                resetForm();
                onClose();
                if (onSuccess) onSuccess();
              } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                  toast.error(
                    error.response?.data?.message ||
                      "Gagal mengatur hari libur.",
                  );
                }
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {({ setFieldValue, values, errors, touched }) => (
              <Form className="space-y-4">
                {/* TANGGAL MULAI */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Tanggal Mulai Libur
                  </label>
                  <input
                    type="date"
                    disabled={isSubmitting}
                    min={todayHtml}
                    value={toHtmlFormat(values.startDate)}
                    onChange={(e) => {
                      setFieldValue(
                        "startDate",
                        toBackendFormat(e.target.value),
                      );
                      // Jika user ubah startDate, otomatis kosongkan endDate jika tglnya jadi tidak valid
                      setFieldValue("endDate", "");
                    }}
                    className={`w-full px-4 py-2.5 text-black rounded-xl border outline-none transition-all ${
                      errors.startDate && touched.startDate
                        ? "border-red-300 focus:ring-4 focus:ring-red-50"
                        : `border-gray-200 ${theme.inputFocus}`
                    }`}
                  />
                  {errors.startDate && touched.startDate && (
                    <div className="text-red-500 text-xs mt-1">
                      {String(errors.startDate)}
                    </div>
                  )}
                </div>

                {/* OPSI MULTI-HARI (TOGGLE) */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    disabled={isSubmitting}
                    id="isMultiDay"
                    checked={isMultiDay}
                    onChange={(e) => {
                      setIsMultiDay(e.target.checked);
                      // Reset nilai endDate jika opsi multi-hari dimatikan
                      if (!e.target.checked) setFieldValue("endDate", "");
                    }}
                    className={`w-4 h-4 bg-gray-100 border-gray-300 rounded cursor-pointer ${theme.checkbox}`}
                  />
                  <label
                    htmlFor="isMultiDay"
                    className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                  >
                    Libur lebih dari 1 hari?
                  </label>
                </div>

                {/* TANGGAL SELESAI (Hanya Muncul Jika isMultiDay === true) */}
                {isMultiDay && (
                  <div className="animate-fadeIn transition-all">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Tanggal Selesai Libur
                    </label>
                    <input
                      type="date"
                      disabled={isSubmitting}
                      min={getNextDay(values.startDate)}
                      value={toHtmlFormat(values.endDate)}
                      onChange={(e) =>
                        setFieldValue(
                          "endDate",
                          toBackendFormat(e.target.value),
                        )
                      }
                      className={`w-full px-4 py-2.5 text-black rounded-xl border outline-none transition-all ${
                        errors.endDate && touched.endDate
                          ? "border-red-300 focus:ring-4 focus:ring-red-50"
                          : `border-gray-200 ${theme.inputFocus}`
                      }`}
                    />
                    {errors.endDate && touched.endDate && (
                      <div className="text-red-500 text-xs mt-1">
                        {String(errors.endDate)}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 text-amber-900 text-xs leading-normal">
                  <FiClock className="text-sm shrink-0 mt-0.5 text-amber-600" />
                  <p>
                    Sistem otomatis mengabaikan hari libur yang sudah pernah
                    terdaftar pada tanggal yang sama.
                  </p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onClose}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all cursor-pointer bg-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-2.5 text-white rounded-xl font-semibold transition-all cursor-pointer border-none ${
                      isSubmitting ? "bg-gray-400" : theme.btnSubmit
                    }`}
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Libur"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}
