export type ApiFetchOptions = RequestInit & { logoutOn401?: boolean };

export async function apiFetch(input: RequestInfo, init?: ApiFetchOptions) {
  const opts: ApiFetchOptions = { credentials: "same-origin", logoutOn401: true, ...(init || {}) };

  try {
    const res = await fetch(input, opts as RequestInit);
    if (res.status === 401 && opts.logoutOn401) {
      // lazy import to avoid client/server issues
      const { signOut } = await import("next-auth/react");
      signOut();
      return res;
    }
    return res;
  } catch (err) {
    // network error - do not force logout
    console.error("apiFetch network error", err);
    throw err;
  }
}
