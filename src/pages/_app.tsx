import "@/styles/globals.css";
import { useMemo } from "react";
import type { AppProps } from "next/app";
import { SessionProvider, SessionProviderProps } from "next-auth/react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/system";
import { createTheme, useMediaQuery } from "@mui/material";
import { purple, green } from "@mui/material/colors";

export default function App({
  Component,
  pageProps,
  session,
}: AppProps & SessionProviderProps) {
  // Enabling Dark Mode according to system-wide setting
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
          primary: purple,
          secondary: green,
        },
      }),
    [prefersDarkMode]
  );

  return (
    <SessionProvider session={session}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline enableColorScheme />
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}
