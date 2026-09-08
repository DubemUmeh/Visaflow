"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    toast.promise(login(data.email, data.password, data.rememberMe), {
      loading: "Logging you in...",
      success: () => {
        router.push("/dashboard");
        return "Welcome back!";
      },
      error: (err: any) => {
        console.error(err);

        // Check the exact property your backend/auth library uses (e.g., status codes or error messages)
        const isAuthError =
          err.status === 401 ||
          err.message?.includes("axios") ||
          err.message?.includes("credential") ||
          err.message?.includes("password");

        return isAuthError
          ? "Email or password incorrect"
          : "Internal server error";
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="bg-card rounded-2xl shadow-elevated border border-border/70 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your VisaFlow account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail />}
            error={errors.email?.message}
            {...register("email")}
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              leftIcon={<Lock />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground/70 hover:text-muted-foreground"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              }
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                {...register("rememberMe")}
              />
              <span className="text-sm text-muted-foreground">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-brand hover:text-brand font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="brand"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs text-muted-foreground/70 bg-card px-2">
            or continue with
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" type="button" className="gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
          <Button variant="outline" size="lg" type="button" className="gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Apple
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-brand font-medium hover:text-brand"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
