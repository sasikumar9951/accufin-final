"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaCalendarAlt } from "react-icons/fa";
import { ImportantDate } from "@prisma/client";

interface ImportantDatesModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function ImportantDatesModal({
  isOpen,
  onClose,
}: Readonly<ImportantDatesModalProps>) {
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchImportantDates();
    }
  }, [isOpen]);

  const fetchImportantDates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/important-dates");
      const data = await response.json();
      setImportantDates(data);
    } catch (error) {
      console.error("Error fetching important dates:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 0) return `${diffDays} days from now`;
    return "Past due";
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      {/* Blur overlay for entire background */}
      <div 
        className="fixed inset-0 z-[9998]"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(0, 0, 0, 0.3)'
        }}
      ></div>
      
      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pt-[5vh]">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <FaCalendarAlt className="text-[#007399] text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">
              Important Dates
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {(() => {
            if (loading) {
              return (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007399]"></div>
                </div>
              );
            }
            if (importantDates.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <FaCalendarAlt className="text-4xl mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No upcoming important dates</p>
                </div>
              );
            }
            return (
              <div className="space-y-4">
              {importantDates.map((date) => (
                <div
                  key={date.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">
                        {date.title}
                      </h3>
                      {date.description && (
                        <p className="text-gray-600 mb-2 whitespace-pre-wrap">{date.description}</p>
                      )}
                      <div className="flex items-center text-sm text-gray-500">
                        <FaCalendarAlt className="mr-2 text-[#007399]" />
                        <span>{formatDate(date.date)}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          (() => {
                            const daysUntil = getDaysUntil(date.date);
                            if (daysUntil === "Today") {
                              return "bg-red-100 text-red-800";
                            }
                            if (daysUntil === "Tomorrow") {
                              return "bg-orange-100 text-orange-800";
                            }
                            return "bg-green-100 text-green-800";
                          })()
                        }`}
                      >
                        {getDaysUntil(date.date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#007399] text-white rounded hover:bg-[#005a7a] transition-colors"
          >
            Close
          </button>
        </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
