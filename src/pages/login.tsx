import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const login = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        <p>Welcome, {session.user?.email}</p>
        <img src={session.user?.image!} alt="user image" style={{borderRadius: '50px', height: '50px', width: '50px'}}/>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  } else {
    return (
      <div>
        <p>You are not signed in.</p>
        <button onClick={() => signIn()}>Sign in</button>
      </div>
    );
  }
};

export default login;
