import React from "react";
import { useSession } from "next-auth/react"
import { Container } from "@mui/material";
import Forbidden from "@/components/forbidden";
import Loading from "@/components/loading";


const adminPage = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Loading/>
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return <Forbidden />
  }


  return (    
    <Container maxWidth="sm">
        <h1>Admin</h1>
        <p>You are the admin</p>
    </Container>
  );
};

export default adminPage;
