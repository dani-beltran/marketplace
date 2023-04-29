import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/router";

const login = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const callbackUrl =
    (Array.isArray(router.query.callbackUrl)
      ? router.query.callbackUrl[0]
      : router.query.callbackUrl);

  if (session) {
    return (
      <div>
        <p>Welcome, {session.user?.email}</p>
        <img
          src={session.user?.image!}
          alt="user image"
          style={{ borderRadius: "50px", height: "50px", width: "50px" }}
        />
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  } else {
    return (
      <div>
        <p>You are not signed in.</p>
        <button onClick={() => signIn(undefined, { callbackUrl })}>
          Sign in
        </button>
      </div>
    );
  }
};

export default login;
