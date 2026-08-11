import { brand } from "../content";

export default function BrandTagline({ className = "" }: { className?: string }) {
  return <p className={className}>{brand.tagline}</p>;
}
