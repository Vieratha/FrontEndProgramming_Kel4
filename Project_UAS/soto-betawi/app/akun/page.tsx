import { redirect } from "next/navigation";
import AccountClient from "../components/AccountClient";
import { getCurrentUser } from "../lib/auth";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "CUSTOMER") {
    redirect("/admin");
  }

  return (
    <AccountClient
      user={{
        name: user.name,
        email: user.email,
      }}
    />
  );
}
