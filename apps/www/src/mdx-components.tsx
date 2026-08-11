import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  h2: (props) => <h2 className="mt-14 text-3xl font-black leading-tight tracking-tight text-navy" {...props} />,
  h3: (props) => <h3 className="mt-10 text-2xl font-black leading-tight text-navy" {...props} />,
  p: (props) => <p className="mt-5 text-[1.0625rem] leading-8 text-navy/75" {...props} />,
  ul: (props) => <ul className="mt-5 list-disc space-y-3 pl-6 text-[1.0625rem] leading-8 text-navy/75" {...props} />,
  ol: (props) => <ol className="mt-5 list-decimal space-y-3 pl-6 text-[1.0625rem] leading-8 text-navy/75" {...props} />,
  a: (props) => <a className="font-bold text-teal underline decoration-teal/40 underline-offset-4 hover:decoration-teal" {...props} />,
  blockquote: (props) => <blockquote className="mt-8 border-l-4 border-gold bg-cream px-6 py-5 text-lg font-semibold leading-8 text-navy" {...props} />,
  strong: (props) => <strong className="font-black text-navy" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
