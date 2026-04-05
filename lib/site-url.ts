export function getBaseUrl() {
  const rawUrl = (process.env.NEXTAUTH_URL || "https://thelostlabel.com").replace(/\/+$/, "");
  return rawUrl.replace(/^http:\/\//i, "https://");
}
