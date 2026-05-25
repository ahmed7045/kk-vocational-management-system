import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import "./DateRangePicker.css";

const pad = (num) => String(num).padStart(2, "0");

const formatDateValue = (date) => {
  if (!date) return "";

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value) => {
  if (!value) return "";

  const date = new Date(value + "T00:00:00");

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const isSameDay = (date, value) => {
  if (!date || !value) return false;
  return formatDateValue(date) === value;
};

const isBetween = (date, start, end) => {
  if (!date || !start || !end) return false;

  const current = new Date(formatDateValue(date));
  const startDate = new Date(start);
  const endDate = new Date(end);

  return current > startDate && current < endDate;
};

const DateRangePicker = ({
  fromDate,
  toDate,
  onChange,
  placeholder = "Date range",
}) => {
  const wrapperRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [tempFromDate, setTempFromDate] = useState(fromDate || "");
  const [tempToDate, setTempToDate] = useState(toDate || "");

  useEffect(() => {
    setTempFromDate(fromDate || "");
    setTempToDate(toDate || "");
  }, [fromDate, toDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayIndex = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days = [];

  for (let i = 0; i < startDayIndex; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    days.push(new Date(year, month, day));
  }

  const monthTitle = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const moveMonth = (direction) => {
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + direction);
      return next;
    });
  };

  const handleDateClick = (date) => {
    const selected = formatDateValue(date);

    if (!tempFromDate || (tempFromDate && tempToDate)) {
      setTempFromDate(selected);
      setTempToDate("");
      return;
    }

    if (selected < tempFromDate) {
      setTempFromDate(selected);
      setTempToDate("");
      return;
    }

    setTempToDate(selected);

    onChange({
      fromDate: tempFromDate,
      toDate: selected,
    });

    setOpen(false);
  };

  const clearRange = (event) => {
    event.stopPropagation();

    setTempFromDate("");
    setTempToDate("");

    onChange({
      fromDate: "",
      toDate: "",
    });
  };

  const label =
    fromDate && toDate
      ? `${formatDisplayDate(fromDate)} → ${formatDisplayDate(toDate)}`
      : placeholder;

  return (
    <div className="date-range-picker" ref={wrapperRef}>
      <button
        type="button"
        className="date-range-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Calendar size={17} />
        <span>{label}</span>

        {(fromDate || toDate) && (
          <X size={15} className="date-range-clear" onClick={clearRange} />
        )}
      </button>

      {open && (
        <div className="date-range-dropdown">
          <div className="date-range-header">
            <strong>{monthTitle}</strong>

            <div>
              <button type="button" onClick={() => moveMonth(-1)}>
                <ChevronLeft size={20} />
              </button>

              <button type="button" onClick={() => moveMonth(1)}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="date-range-weekdays">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          <div className="date-range-days">
            {days.map((date, index) => {
              if (!date) {
                return <span key={`empty-${index}`} />;
              }

              const value = formatDateValue(date);

              const selectedStart = isSameDay(date, tempFromDate);
              const selectedEnd = isSameDay(date, tempToDate);
              const inRange = isBetween(date, tempFromDate, tempToDate);

              return (
                <button
                  key={value}
                  type="button"
                  className={[
                    selectedStart ? "selected" : "",
                    selectedEnd ? "selected" : "",
                    inRange ? "in-range" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => handleDateClick(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;