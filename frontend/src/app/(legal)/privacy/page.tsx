import type { Metadata } from "next";
import { Localized } from "../Localized";
import { PrivacyRo } from "./PrivacyRo";
import { PrivacyEn } from "./PrivacyEn";

export const metadata: Metadata = { title: "Privacy Policy / Politica de confidențialitate — UniProject Hub" };

export default function PrivacyPage() {
  return <Localized ro={<PrivacyRo />} en={<PrivacyEn />} />;
}
