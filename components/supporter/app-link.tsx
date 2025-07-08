import React from "react";
import { Link } from "expo-router";
import { Button } from "../ui/button";
import { Text } from "../ui/text";
import { TouchableOpacity } from "react-native";

interface AppLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: "ghost" | "link" | "default" | "text";
  className?: string;
  textClassName?: string;
  fallbackComponent?: React.ReactNode;
}

export function AppLink({
  href,
  children,
  variant = "ghost",
  className = "",
  textClassName = "",
}: AppLinkProps) {
  // Type assertion to avoid type errors with expo-router Link
  const safePath = href as any;

  // Render content inside a navigation-safe view
  return (
    <>
      {variant === "text" ? (
        <Link href={safePath} asChild>
          <TouchableOpacity className={className}>
            <Text className={textClassName}>{children}</Text>
          </TouchableOpacity>
        </Link>
      ) : (
        <Link href={safePath} asChild>
          <Button variant={variant} className={className}>
            {typeof children === "string" ? (
              <Text className={textClassName}>{children}</Text>
            ) : (
              children
            )}
          </Button>
        </Link>
      )}
    </>
  );
}
