import * as React from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { cn } from "@/lib/utils"

const Card = React.forwardRef(({ className, ...props }, ref) => {
  const { user } = useAuthStore();
  const isPatient = user?.role === 'patient';
  
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border shadow-sm",
        isPatient 
          ? "bg-[rgba(10,10,20,0.85)] backdrop-blur-xl border-white/25 text-white shadow-[0_8px_32px_rgba(0,0,0,0.6)]" 
          : "bg-card text-card-foreground border-border",
        className
      )}
      {...props} 
    />
  );
})
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => {
  const { user } = useAuthStore();
  const isPatient = user?.role === 'patient';
  
  return (
    <div
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        isPatient ? "text-white" : "",
        className
      )}
      {...props} 
    />
  );
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => {
  const { user } = useAuthStore();
  const isPatient = user?.role === 'patient';
  
  return (
    <div
      ref={ref}
      className={cn(
        "text-sm",
        isPatient ? "text-gray-300" : "text-muted-foreground",
        className
      )}
      {...props} 
    />
  );
})
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
