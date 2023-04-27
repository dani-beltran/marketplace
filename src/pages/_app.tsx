import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider, SessionProviderProps } from "next-auth/react";
import CssBaseline from "@mui/material/CssBaseline";

export default function App({
  Component,
  pageProps,
  session,
}: AppProps & SessionProviderProps) {
  return (
    <SessionProvider session={session}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline enableColorScheme />
      <Component {...pageProps} />
    </SessionProvider>
  );
}
