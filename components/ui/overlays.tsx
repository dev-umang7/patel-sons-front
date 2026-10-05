"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive, DropdownMenu as Menu, Popover as PopoverPrimitive, Tooltip as TooltipPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- Tooltip */

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({ content, children, side = "top", align = "center" }: { content: ReactNode; children: ReactNode; side?: "top" | "right" | "bottom" | "left"; align?: "start" | "center" | "end" }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          className="z-50 max-w-72 rounded-md bg-fg px-2 py-1 text-xs text-fg-inverse shadow-md data-[state=delayed-open]:animate-fade-in"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* ---------------------------------------------------------------- Popover */

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverClose = PopoverPrimitive.Close;

export function PopoverContent({ className, align = "start", sideOffset = 6, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn("z-50 rounded-lg border border-border bg-surface p-1 shadow-lg outline-none data-[state=open]:animate-fade-in", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

/* ----------------------------------------------------------- Dropdown menu */

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuGroup = Menu.Group;

export function DropdownMenuContent({ className, align = "end", sideOffset = 6, ...props }: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        align={align}
        sideOffset={sideOffset}
        className={cn("z-50 min-w-44 rounded-lg border border-border bg-surface p-1 shadow-lg data-[state=open]:animate-fade-in", className)}
        {...props}
      />
    </Menu.Portal>
  );
}

const itemBase =
  "relative flex h-8 cursor-default select-none items-center gap-2 rounded-md px-2 text-sm text-fg outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-surface-hover [&_svg]:size-4 [&_svg]:text-fg-muted";

export function DropdownMenuItem({ className, tone, ...props }: ComponentProps<typeof Menu.Item> & { tone?: "danger" }) {
  return <Menu.Item className={cn(itemBase, tone === "danger" && "text-danger [&_svg]:text-danger", className)} {...props} />;
}

export function DropdownMenuCheckboxItem({ className, children, ...props }: ComponentProps<typeof Menu.CheckboxItem>) {
  return (
    <Menu.CheckboxItem className={cn(itemBase, "pl-7", className)} {...props}>
      <Menu.ItemIndicator className="absolute left-2 inline-flex">
        <svg viewBox="0 0 16 16" className="size-3.5 text-primary" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="m3.5 8.5 3 3 6-7" />
        </svg>
      </Menu.ItemIndicator>
      {children}
    </Menu.CheckboxItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Menu.Label>) {
  return <Menu.Label className={cn("px-2 pt-1.5 pb-1 text-2xs font-medium tracking-wide text-fg-muted uppercase", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof Menu.Separator>) {
  return <Menu.Separator className={cn("-mx-1 my-1 h-px bg-border-subtle", className)} {...props} />;
}

/* ----------------------------------------------------------- Dialog & Sheet */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

function Overlay() {
  return <DialogPrimitive.Overlay className="overlay-fade fixed inset-0 z-50 bg-overlay" />;
}

export function DialogContent({
  title,
  description,
  children,
  className,
  footer,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          "dialog-pop fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-surface shadow-lg outline-none",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
          <div>
            <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">{title}</DialogPrimitive.Title>
            {description ? <DialogPrimitive.Description className="mt-1 text-sm text-fg-muted">{description}</DialogPrimitive.Description> : <DialogPrimitive.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</DialogPrimitive.Description>}
          </div>
          <DialogPrimitive.Close aria-label="Close" className="-mt-1 -mr-1 grid size-7 place-items-center rounded-md text-fg-muted hover:bg-surface-hover hover:text-fg">
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-5 py-3">{footer}</div>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  title,
  description,
  children,
  side = "right",
  className,
  footer,
  hideHeader,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  side?: "right" | "left" | "bottom";
  className?: string;
  footer?: ReactNode;
  hideHeader?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        data-side={side}
        className={cn(
          "sheet-slide fixed z-50 flex flex-col bg-surface shadow-lg outline-none",
          side === "right" && "inset-y-0 right-0 w-full max-w-md border-l border-border",
          side === "left" && "inset-y-0 left-0 w-[85vw] max-w-xs border-r border-border",
          side === "bottom" && "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-xl border-t border-border",
          className,
        )}
      >
        <div className={cn("flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4", hideHeader && "sr-only")}>
          <div className="min-w-0">
            <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">{title}</DialogPrimitive.Title>
            {description ? <DialogPrimitive.Description className="mt-0.5 text-sm text-fg-muted">{description}</DialogPrimitive.Description> : <DialogPrimitive.Description className="sr-only">{typeof title === "string" ? title : "Panel"}</DialogPrimitive.Description>}
          </div>
          <DialogPrimitive.Close aria-label="Close" className="-mr-1 grid size-7 shrink-0 place-items-center rounded-md text-fg-muted hover:bg-surface-hover hover:text-fg">
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-5 py-3">{footer}</div>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
