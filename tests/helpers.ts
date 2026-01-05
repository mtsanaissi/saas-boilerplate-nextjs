export type RedirectError = Error & { redirectTo?: string };

export function createRedirectError(redirectTo: string): RedirectError {
  const error = new Error("REDIRECT") as RedirectError;
  error.redirectTo = redirectTo;
  return error;
}

export function expectRedirect(error: unknown, to: string) {
  if (!(error instanceof Error)) {
    throw new Error("Expected an error to be thrown");
  }
  if ((error as RedirectError).redirectTo !== to) {
    throw new Error(
      `Expected redirect to ${to}, got ${(error as RedirectError).redirectTo}`,
    );
  }
}
