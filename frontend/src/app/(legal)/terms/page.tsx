import type { Metadata } from "next";
import { Localized } from "../Localized";
import { TermsRo } from "./TermsRo";
import { TermsEn } from "./TermsEn";

export const metadata: Metadata = { title: "Terms and Conditions / Termeni și condiții — UniProject Hub" };

export default function TermsPage() {
  return <Localized ro={<TermsRo />} en={<TermsEn />} />;
}
