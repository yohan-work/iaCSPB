import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function generateProjectName(templateName: string): string {
  const suffixes = ["프로젝트", "워크스페이스", "앱"];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `나의 ${templateName} ${suffix}`;
}
