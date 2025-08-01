import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

function Card({ className, ref, ...props }: ComponentProps<"div">) {
  return (
    <div
      ref={ref}
      className={twMerge(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}
Card.displayName = "Card";

function CardHeader({ className, ref, ...props }: ComponentProps<"div">) {
  return (
    <div
      ref={ref}
      className={twMerge("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ref, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      ref={ref}
      className={twMerge(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ref,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <p
      ref={ref}
      className={twMerge("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({
  className,
  ref,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div ref={ref} className={twMerge("p-6 pt-0", className)} {...props} />
  );
}

function CardFooter({ className, ref, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      ref={ref}
      className={twMerge("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
