"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { CheckCircle2, LogOut, MailCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/data-display/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { env } from "@/config/env";
import {
  useAcceptTenantInvitationMutation,
  usePreviewTenantInvitationQuery
} from "@/features/access/access-api";
import { invitationAccountSchema } from "@/features/access/access-schema";
import { formatAccessDate } from "@/features/access/access-utils";
import { appHomePath, authResolvePath, getAuthConfirmUrl } from "@/lib/auth/auth-redirects";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-client";

type AuthMode = "signup" | "login";

export function InvitationAcceptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const { data: preview, isError, isFetching } = usePreviewTenantInvitationQuery(token, {
    skip: token.length === 0
  });
  const [acceptInvitation, acceptState] = useAcceptTenantInvitationMutation();

  const invitedEmail = preview?.invitedEmail.toLowerCase();
  const sessionEmail = session?.user.email?.toLowerCase();
  const hasMatchingSession = Boolean(invitedEmail && sessionEmail === invitedEmail);
  const hasMismatchedSession = Boolean(invitedEmail && sessionEmail && sessionEmail !== invitedEmail);
  const isSupabaseConfigured = env.authMode === "supabase";
  const nextPath = useMemo(
    () => `/invitations/accept?token=${encodeURIComponent(token)}`,
    [token]
  );

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase || !isSupabaseConfigured) {
      setSessionLoaded(true);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionLoaded(true);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  const accept = async () => {
    try {
      await acceptInvitation({ token }).unwrap();
      router.replace(`${authResolvePath}?redirectTo=${encodeURIComponent(appHomePath)}`);
    } catch {
      setFormError("The invitation could not be accepted. Confirm the account email and try again.");
    }
  };

  const submitCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!preview) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase || !isSupabaseConfigured) {
      setFormError("Supabase auth is not configured for this frontend session.");
      return;
    }

    const parsed = invitationAccountSchema.safeParse({ password, confirmPassword });
    if (authMode === "signup" && !parsed.success) {
      setFormError(parsed.error.errors[0]?.message ?? "Review the password values.");
      return;
    }

    setIsAuthSubmitting(true);

    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: preview.invitedEmail,
        password,
        options: {
          emailRedirectTo: getAuthConfirmUrl(nextPath)
        }
      });

      setIsAuthSubmitting(false);

      if (error) {
        setFormError(error.message);
        return;
      }

      if (data.session) {
        setSession(data.session);
        await accept();
        return;
      }

      setCheckEmail(true);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: preview.invitedEmail,
      password
    });
    setIsAuthSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setSession(data.session);
    await accept();
  };

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
    setSession(null);
    setFormError(null);
  };

  if (!token) {
    return <ErrorState title="Invitation token is missing" description="Open the full invitation link and try again." />;
  }

  if (isFetching || !sessionLoaded) {
    return <p className="text-sm text-muted-foreground">Loading invitation...</p>;
  }

  if (isError || !preview) {
    return (
      <ErrorState
        title="Invitation could not load"
        description="The link may be invalid, rotated, or no longer available."
      />
    );
  }

  const isTerminal = preview.status !== "PENDING";

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Accept invitation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-md border border-border p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{preview.tenantName}</p>
            <Badge tone={preview.status === "PENDING" ? "blue" : preview.status === "EXPIRED" ? "amber" : "gray"}>
              {preview.status}
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground">Sent to {preview.invitedEmail}</p>
          <p className="mt-1 text-muted-foreground">Expires {formatAccessDate(preview.expiresAt)}</p>
          {preview.roles.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {preview.roles.map((role) => (
                <Badge key={role.name} tone="blue">
                  {role.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        {isTerminal ? (
          <ErrorState
            title="Invitation is not pending"
            description="Ask a tenant admin to send a new invitation if access is still needed."
          />
        ) : null}

        {!isTerminal && hasMatchingSession ? (
          <div className="space-y-3">
            <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
              You are signed in with the invited email.
            </p>
            <Button className="w-full" disabled={acceptState.isLoading} onClick={accept} type="button">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {acceptState.isLoading ? "Accepting..." : "Accept invitation"}
            </Button>
          </div>
        ) : null}

        {!isTerminal && hasMismatchedSession ? (
          <div className="space-y-3">
            <ErrorState
              title="Signed in with a different email"
              description={`This invitation was sent to ${preview.invitedEmail}, but the active session is ${sessionEmail}.`}
            />
            <Button className="w-full" onClick={signOut} type="button" variant="secondary">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        ) : null}

        {!isTerminal && !sessionEmail ? (
          checkEmail ? (
            <div className="rounded-md border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
              <div className="flex items-center gap-2 font-semibold">
                <MailCheck className="h-4 w-4" aria-hidden="true" />
                Check your email
              </div>
              <p className="mt-2">
                Confirm {preview.invitedEmail}, then this invitation page will finish accepting access.
              </p>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={submitCredentials}>
              <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                <span className="font-medium">Email</span>
                <p className="mt-1 text-muted-foreground">{preview.invitedEmail}</p>
              </div>
              <Input
                autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                required
                type="password"
                value={password}
              />
              {authMode === "signup" ? (
                <Input
                  autoComplete="new-password"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  required
                  type="password"
                  value={confirmPassword}
                />
              ) : null}
              <Button className="w-full" disabled={isAuthSubmitting} type="submit">
                {isAuthSubmitting
                  ? "Working..."
                  : authMode === "signup"
                    ? "Create account and accept invitation"
                    : "Sign in and accept invitation"}
              </Button>
              <Button
                className="w-full"
                disabled={isAuthSubmitting}
                onClick={() => {
                  setAuthMode(authMode === "signup" ? "login" : "signup");
                  setFormError(null);
                }}
                type="button"
                variant="secondary"
              >
                {authMode === "signup" ? "I already have a password" : "Create a new account"}
              </Button>
              {!isSupabaseConfigured ? (
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  Set NEXT_PUBLIC_AUTH_MODE=supabase and restart the frontend to use Supabase auth.
                </p>
              ) : null}
            </form>
          )
        ) : null}

        {formError ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{formError}</p> : null}
      </CardContent>
    </Card>
  );
}
