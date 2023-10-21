// import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { signIn } from "next-auth/react"

export default function Home() {
    return (
        <>
        <div>
            <div className="font-sans">Hello world!</div>
            <button onClick={() => signIn()}>Sign in</button>
        </div>
        </>
    )


}
