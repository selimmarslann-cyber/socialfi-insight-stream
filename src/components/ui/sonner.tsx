import { useEffect, useState } from "react";
import { Toaster as Sonner, toast } from "sonner";
import { getTheme, subscribeTheme, type ThemeMode } from "@/lib/theme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const [mode, setMode] = useState<ThemeMode>(() => getTheme());

  useEffect(() => {
    setMode(getTheme());
    const unsubscribe = subscribeTheme(setMode);
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <Sonner
      theme={mode}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
