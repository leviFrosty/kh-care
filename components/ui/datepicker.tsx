"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  /**
   * The selected date (controlled usage).
   */
  value?: Date;
  /**
   * Called when the date changes.
   */
  onChange?: (date: Date | undefined) => void;
  /**
   * Class name for the popover content.
   */
  className?: string;
  /**
   * Class name for the button.
   */
  buttonClassName?: string;
  /**
   * Additional props for the Calendar. Only mode="single" is supported.
   */
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    "mode" | "selected" | "onSelect"
  > & {
    mode?: "single";
  };
  /**
   * Placeholder text or node when no date is selected.
   */
  placeholder?: React.ReactNode;
  /**
   * Additional props for the Button.
   */
  buttonProps?: React.ComponentProps<typeof Button>;
}

export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      className,
      buttonClassName,
      calendarProps,
      placeholder = "Pick a date",
      buttonProps,
      ...rest
    },
    ref,
  ) => {
    const [internalDate, setInternalDate] = React.useState<Date>();
    const isControlled = value !== undefined;
    const date = isControlled ? value : internalDate;

    // Warn if calendarProps.mode is set and not 'single'
    React.useEffect(() => {
      if (calendarProps?.mode && calendarProps.mode !== "single") {
        // eslint-disable-next-line no-console
        console.warn(
          "[DatePicker] Only 'single' mode is supported. Provided mode:",
          calendarProps.mode,
        );
      }
    }, [calendarProps?.mode]);

    const handleSelect = React.useCallback(
      (selected: Date | undefined) => {
        if (!isControlled) setInternalDate(selected);
        onChange?.(selected);
      },
      [isControlled, onChange],
    );

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant={buttonProps?.variant || "outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
              buttonClassName,
            )}
            {...buttonProps}
            {...rest}
          >
            <CalendarIcon />
            {date ? format(date, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-auto p-0", className)} align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
    );
  },
);

DatePicker.displayName = "DatePicker";
