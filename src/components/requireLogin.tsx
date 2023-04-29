import React from "react";
import { Button, Container } from "@mui/material";

type Props = {
  callbackUrl?: string;
};

const RequireLogin = ({ callbackUrl }: Props) => {
  const loginUrl = callbackUrl ? `/login?callbackUrl=${callbackUrl}` : "/login";
  
  return (
    <>
      <Container maxWidth="sm" sx={{ marginBottom: "2rem" }}>
        <h1>You need to sign-in</h1>
        <p>To access this page you need to sign-in</p>
      </Container>
      <Container maxWidth="sm">
        <Button
          variant="outlined"
          onClick={() =>
            (window.location.href = loginUrl)
          }
        >
          Sign-in
        </Button>
      </Container>
    </>
  );
};

export default RequireLogin;
