import Head from "next/head";
import LoginPopup from "../components/LoginPopup/LoginPopup";

export default function Home() {
  return (
    <>
      <Head>
        <title>Voxllinktree</title>
        <meta name="description" content="Cosmetic Login Popup Demo" />
      </Head>
      <LoginPopup />
    </>
  );
}