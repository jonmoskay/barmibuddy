export interface PortalClient {
  slug: string;
  clientName: string;
  tagline: string;
  passwordEnvKey: string;
  contactName: string;
  contactEmail: string;
}

export const portals: PortalClient[] = [
  {
    slug: "generation",
    clientName: "Generation",
    tagline: "AI That Works for Generation.",
    passwordEnvKey: "PORTAL_PASS_GENERATION",
    contactName: "Lee",
    contactEmail: "",
  },
];

export function getPortal(slug: string): PortalClient | undefined {
  return portals.find((p) => p.slug === slug);
}
