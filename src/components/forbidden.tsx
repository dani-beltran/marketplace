import { Container } from "@mui/material";
import React from "react";

const Forbidden = () => {
  return (
    <Container maxWidth="sm">
      <h1>403</h1>
      <p>You have no access to this page</p>
    </Container>
  );
};

export default Forbidden;
