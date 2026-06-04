"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({ variant = "primary", children, className, ...rest }: Props) {
  return (
    <button className={`btn btn-${variant}${className ? " " + className : ""}`} {...rest}>
      {children}
    </button>
  );
}
