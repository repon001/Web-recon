import { redirect } from "next/navigation";

/**
 * There is no landing page.
 *
 * Middleware has already decided which side of the fence this request is on:
 * it either has a session, in which case /scans is what they came for, or it
 * does not and never reached here at all.
 */
export default function RootPage() {
  redirect("/scans");
}
