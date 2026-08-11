declare module "*.mdx" {
  import type { ComponentType } from "react";

  export const metadata: unknown;
  const MDXContent: ComponentType;
  export default MDXContent;
}
