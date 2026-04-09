"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerFieldProps {
  value?: string | null;
  onChange: (val: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
}: DatePickerFieldProps) {
  // Parse YYYY-MM-DD as local time to avoid UTC offset shifting
  const selected = value ? new Date(value + "T00:00:00") : undefined;

  function handleSelect(date: Date | undefined) {
    onChange(date ? format(date, "yyyy-MM-dd") : null);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!value}
          className={cn(
            "w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {selected ? format(selected, "dd/MM/yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          locale={es}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
