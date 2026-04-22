export const PUBLIC_PATHS = new Set(["/", "/login"]);

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/auth")) return true;
  return false;
}

