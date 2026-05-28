import { redirect } from "next/navigation";

export default function SessionIndex() {
  redirect("/session/new-session");
}
