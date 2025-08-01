import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { tv, VariantProps } from "tailwind-variants";
import { twMerge } from "tailwind-merge";

const buttonVariants = tv({
  base: "flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ",
  variants: {
    variant: {
      default:
        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-wellness",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline:
        "border border-border bg-card hover:bg-accent hover:text-accent-foreground shadow-soft",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      wellness:
        "bg-gradient-wellness text-white hover:shadow-wellness shadow-soft",
      success:
        "bg-success text-success-foreground hover:bg-success/90 shadow-soft",
      floating:
        "bg-card text-card-foreground shadow-wellness hover:shadow-lg border border-border/50",
    },
    size: {
      default: "h-11 px-6 py-2",
      sm: "h-9 rounded-lg px-4",
      lg: "h-12 rounded-lg px-8",
      icon: "h-11 w-11",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={twMerge(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  );
}
