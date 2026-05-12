import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getSession } from "@/lib/auth-server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00c98d]/10 blur-3xl" />
      </div>

      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <Image src="/logo.webp" alt="Pobble" width={40} height={40} className="rounded-lg shadow-lg shadow-[#00c98d]/20" />
        <span className="text-xl font-bold tracking-tight text-white">
          Pobble<span className="text-[#00c98d]">Host</span>
        </span>
      </Link>

      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
