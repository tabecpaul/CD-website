export default function ContentLoading() {
  return <main className="min-h-screen bg-cream px-5 py-14 text-navy"><div className="mx-auto max-w-7xl"><div className="h-10 w-52 animate-pulse rounded bg-navy/10" /><div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-white" />)}</div><div className="mt-8 space-y-4">{[1,2,3].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-white" />)}</div></div></main>;
}
