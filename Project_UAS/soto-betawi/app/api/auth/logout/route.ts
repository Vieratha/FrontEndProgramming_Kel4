import { NextResponse } from "next/server";
import { deleteCurrentSession } from "@/app/lib/auth";

export async function POST() {
  await deleteCurrentSession();

  return NextResponse.json({
    message: "Logout berhasil.",
  });
}
