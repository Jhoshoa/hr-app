import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import { Providers } from "./providers";
import messages from "../src/i18n/messages/es.json";

export const metadata: Metadata = {
  title: "HR App",
  description: "HR operations workspace"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <NextIntlClientProvider locale="es" messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
