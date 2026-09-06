/**
 * Whether the app should treat this visitor as signed in.
 *
 * The access-token cookie alone is not proof: it outlives the token it holds, so an expired
 * session would otherwise present as signed in with no account behind it — which is how the admin
 * gate ended up saying "you are signed in as ‹nothing›". Before the profile fetch settles the
 * cookie is the best guess available, and trusting it avoids flashing a signed-out header at
 * someone who is signed in; once the fetch has settled, the profile is the answer.
 */
export function resolveSignedIn(input: { loaded: boolean; hasToken: boolean; hasUser: boolean }): boolean {
  return input.loaded ? input.hasUser : input.hasToken;
}

/** A rejected credential is worth discarding; a network blip is not. */
export function isAuthRejection(error: unknown): boolean {
  const status = (error as { statusCode?: number; response?: { status?: number } } | null)?.statusCode
    ?? (error as { response?: { status?: number } } | null)?.response?.status;
  return status === 401 || status === 403;
}
