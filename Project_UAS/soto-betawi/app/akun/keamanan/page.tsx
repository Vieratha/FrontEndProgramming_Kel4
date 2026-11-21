import { redirect } from "next/navigation";
import SecurityClient from "../../components/SecurityClient";
import { getCurrentUser } from "../../lib/auth";

export default async function AccountSecurityPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "CUSTOMER") {
    redirect("/admin");
  }

  return (
    <SecurityClient
      user={{
        name: user.name,
      }}
    />
  );
}
