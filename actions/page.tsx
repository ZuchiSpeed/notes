"use server";

import prisma from "@/app/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function postData(formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // 🛡️ Defensive check - ensure user exists
  if (!user || !user.email) {
    console.error("❌ No authenticated user found");
    return redirect("/");
  }

  const name = formData.get("name") as string;
  const colorScheme = formData.get("color") as string;

  await prisma.user.upsert({
    where: {
      id: user?.id,
    },
    update: {
      name: name ?? undefined,
      colorScheme: colorScheme ?? undefined,
    },
    create: {
        id: user.id,
        email: user.email,
        name: name,
        colorScheme: colorScheme || "theme-default",
      },
  });

  revalidatePath('/', 'layout')
}

