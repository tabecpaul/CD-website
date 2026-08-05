import Hero from "@/components/sections/Hero";
import Empathy from "@/components/sections/Empathy";
import CareerDirect from "@/components/sections/CareerDirect";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Empathy />
      <CareerDirect />
    </main>
  );
}
