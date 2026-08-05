import Hero from "@/components/sections/Hero";
import Empathy from "@/components/sections/Empathy";
import CareerDirect from "@/components/sections/CareerDirect";
import Process from "@/components/sections/Process";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Empathy />
      <CareerDirect />
      <Process />
    </main>
  );
}
