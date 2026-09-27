import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCU Watch Order",
  description: "A personal MCU watch tracker.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
