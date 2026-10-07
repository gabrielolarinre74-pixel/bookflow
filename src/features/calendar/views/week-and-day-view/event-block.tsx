import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { differenceInMinutes, parseISO } from "date-fns";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { EventDetailsDialog } from "@/features/calendar/dialogs/event-details-dialog";
import { DraggableEvent } from "@/features/calendar/dnd/draggable-event";
import { ResizableEvent } from "@/features/calendar/dnd/resizable-event";
import { formatTime } from "@/features/calendar/helpers";
import type { IEvent } from "@/features/calendar/interfaces";

const calendarWeekEventCardVariants = cva(
  "flex select-none flex-col gap-0.5 truncate whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-xs shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-shadow hover:shadow-md focus-visible:outline-offset-2",
  {
    variants: {
      color: {
        blue: "border-0 border-l-[3px] border-blue-500 bg-blue-50 text-blue-950 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-50 dark:hover:bg-blue-500/25",
        green: "border-0 border-l-[3px] border-green-500 bg-green-50 text-green-950 hover:bg-green-100 dark:bg-green-500/15 dark:text-green-50 dark:hover:bg-green-500/25",
        red: "border-0 border-l-[3px] border-red-500 bg-red-50 text-red-950 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-50 dark:hover:bg-red-500/25",
        yellow: "border-0 border-l-[3px] border-yellow-500 bg-yellow-50 text-yellow-950 hover:bg-yellow-100 dark:bg-yellow-500/15 dark:text-yellow-50 dark:hover:bg-yellow-500/25",
        teal: "border-0 border-l-[3px] border-teal-500 bg-teal-50 text-teal-950 hover:bg-teal-100 dark:bg-teal-500/15 dark:text-teal-50 dark:hover:bg-teal-500/25",
        orange: "border-0 border-l-[3px] border-orange-500 bg-orange-50 text-orange-950 hover:bg-orange-100 dark:bg-orange-500/15 dark:text-orange-50 dark:hover:bg-orange-500/25",
        "blue-dot": "border border-l-[3px] border-border border-l-blue-500 bg-card text-foreground hover:bg-muted [&_svg]:fill-blue-500",
        "green-dot": "border border-l-[3px] border-border border-l-green-500 bg-card text-foreground hover:bg-muted [&_svg]:fill-green-500",
        "red-dot": "border border-l-[3px] border-border border-l-red-500 bg-card text-foreground hover:bg-muted [&_svg]:fill-red-500",
        "yellow-dot": "border border-l-[3px] border-border border-l-yellow-500 bg-card text-foreground hover:bg-muted [&_svg]:fill-yellow-500",
        "teal-dot": "border border-l-[3px] border-border border-l-teal-500 bg-card text-foreground hover:bg-muted [&_svg]:fill-teal-500",
        "orange-dot": "border border-l-[3px] border-border border-l-orange-500 bg-card text-foreground hover:bg-muted [&_svg]:fill-orange-500",
      },
    },
    defaultVariants: {
      color: "blue-dot",
    },
  },
);

interface IProps
  extends
    HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof calendarWeekEventCardVariants>, "color"> {
  event: IEvent;
}

export function EventBlock({ event, className }: IProps) {
  const { badgeVariant, use24HourFormat } = useCalendar();

  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);
  const durationInMinutes = differenceInMinutes(end, start);
  const heightInPixels = (durationInMinutes / 60) * 96 - 8;

  const color = (
    badgeVariant === "dot" ? `${event.color}-dot` : event.color
  ) as VariantProps<typeof calendarWeekEventCardVariants>["color"];

  const calendarWeekEventCardClasses = cn(
    calendarWeekEventCardVariants({ color, className }),
    durationInMinutes < 35 && "py-0 justify-center",
  );

  return (
    <ResizableEvent event={event}>
      <DraggableEvent event={event}>
        <EventDetailsDialog event={event}>
          <button
            type="button"
            className={calendarWeekEventCardClasses}
            style={{ height: `${heightInPixels}px` }}
          >
            <div className="flex items-center gap-1.5 truncate">
              {badgeVariant === "dot" && (
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                  aria-hidden="true"
                >
                  <circle cx="4" cy="4" r="4" />
                </svg>
              )}

              <p className="truncate font-semibold">{event.title}</p>
            </div>

            {durationInMinutes > 25 && (
              <p className="opacity-70 tabular-nums">
                {formatTime(start, use24HourFormat)} –{" "}
                {formatTime(end, use24HourFormat)}
              </p>
            )}
            {durationInMinutes > 50 && event.customer && (
              <p className="truncate opacity-70">{event.customer.name}</p>
            )}
          </button>
        </EventDetailsDialog>
      </DraggableEvent>
    </ResizableEvent>
  );
}
