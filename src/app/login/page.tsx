import { Suspense } from "react";
import LoginPage from "./login-page";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
