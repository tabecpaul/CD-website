import { permanentRedirect } from "next/navigation";

export default function CheckoutPage() {
  permanentRedirect("/assessment-consultation");
}
