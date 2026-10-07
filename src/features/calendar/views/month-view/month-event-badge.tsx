import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { endOfDay, isSameDay, parseISO, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { EventDetailsDialog } from "@/features/calendar/dialogs/event-details-dialog";
import { DraggableEvent } from "@/features/calendar/dnd/draggable-event";
import { formatTime } from "@/features/calendar/helpers";
import type { IEvent } from "@/features/calendar/interfaces";
import { EventBullet } from "@/features/calendar/views/month-view/event-bullet";

const eventBadgeVariants = cva(
  "flex w-full h-6.5 select-none items-center justify-between gap-1.5 truncate whitespace-nowrap rounded-md border px-2 text-xs font-medium cursor-grab",
  {
    variants: {
      color: {
        blue: "border-0 border-l-[3px] border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-500/15 dark:text-blue-100",
        green: "border-0 border-l-[3px] border-green-500 bg-green-50 text-green-900 dark:bg-green-500/15 dark:text-green-100",
        red: "border-0 border-l-[3px] border-red-500 bg-red-50 text-red-900 dark:bg-red-500/15 dark:text-red-100",
        yellow: "border-0 border-l-[3px] border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-500/15 dark:text-yellow-100",
        teal: "border-0 border-l-[3px] border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-500/15 dark:text-teal-100",
        orange: "border-0 border-l-[3px] border-orange-500 bg-orange-50 text-orange-900 dark:bg-orange-500/15 dark:text-orange-100",
        "blue-dot": "border-transparent bg-muted/70 text-foreground [&_svg]:fill-blue-500",
        "green-dot": "border-transparent bg-muted/70 text-foreground [&_svg]:fill-green-500",
        "red-dot": "border-transparent bg-muted/70 text-foreground [&_svg]:fill-red-500",
        "yellow-dot": "border-transparent bg-muted/70 text-foreground [&_svg]:fill-yellow-500",
        "teal-dot": "border-transparent bg-muted/70 text-foreground [&_svg]:fill-teal-500",
        "orange-dot": "border-transparent bg-muted/70 text-foreground [&_svg]:fill-orange-500",
      },
      multiDayPosition: {
        first: "relative z-10 mr-0 rounded-r-none border-r-0 [&>span]:mr-2.5",
        middle:
          "relative z-10 mx-0 w-[calc(100%_+_1px)] rounded-none border-x-0",
        last: "ml-0 rounded-l-none border-l-0",
        none: "",
      },
    },
    defaultVariants: {
      color: "blue-dot",
    },
  },
);

interface IProps extends Omit<
  VariantProps<typeof eventBadgeVariants>,
  "color" | "multiDayPosition"
> {
  event: IEvent;
  cellDate: Date;
  eventCurrentDay?: number;
  eventTotalDays?: number;
  className?: string;
  position?: "first" | "middle" | "last" | "none";
}

export function MonthEventBadge({
  event,
  cellDate,
  eventCurrentDay,
  eventTotalDays,
  className,
  position: propPosition,
}: IProps) {
  const { badgeVariant, use24HourFormat } = useCalendar();

  const itemStart = startOfDay(parseISO(event.startDate));
  const itemEnd = endOfDay(parseISO(event.endDate));

  if (cellDate < itemStart || cellDate > itemEnd) return null;

  let position: "first" | "middle" | "last" | "none" | undefined;

  if (propPosition) {
    position = propPosition;
  } else if (eventCurrentDay && eventTotalDays) {
    position = "none";
  } else if (isSameDay(itemStart, itemEnd)) {
    position = "none";
  } else if (isSameDay(cellDate, itemStart)) {
    position = "first";
  } else if (isSameDay(cellDate, itemEnd)) {
    position = "last";
  } else {
    position = "middle";
  }

  const renderBadgeText = ["first", "none"].includes(position);
  const renderBadgeTime = ["last", "none"].includes(position);

  const color = (
    badgeVariant === "dot" ? `${event.color}-dot` : event.color
  ) as VariantProps<typeof eventBadgeVariants>["color"];

  const eventBadgeClasses = cn(
    eventBadgeVariants({ color, multiDayPosition: position, className }),
  );

  const marginClass = {
    first: "ml-1 mr-0",
    middle: "mx-0",
    last: "ml-0 mr-1",
    none: "mx-1",
  }[position || "none"];

  return (
    <DraggableEvent event={event} className={marginClass}>
      <EventDetailsDialog event={event}>
        <button type="button" className={eventBadgeClasses}>
          <div className="flex items-center gap-1.5 truncate">
            {!["middle", "last"].includes(position) &&
              badgeVariant === "dot" && <EventBullet color={event.color} />}

            {renderBadgeText && (
              <p className="flex-1 truncate font-semibold">
                {eventCurrentDay && (
                  <span className="text-xs">
                    Day {eventCurrentDay} of {eventTotalDays} •{" "}
                  </span>
                )}
                {event.title}
              </p>
            )}
          </div>

          <div className="hidden sm:block">
            {renderBadgeTime && (
              <span>
                {formatTime(new Date(event.startDate), use24HourFormat)}
              </span>
            )}
          </div>
        </button>
      </EventDetailsDialog>
    </DraggableEvent>
  );
}
