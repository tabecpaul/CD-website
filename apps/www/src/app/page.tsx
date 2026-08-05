import Hero from "@/components/sections/Hero";
import Empathy from "@/components/sections/Empathy";
import CareerDirect from "@/components/sections/CareerDirect";
import Process from "@/components/sections/Process";
import Testimonials from "@/components/sections/Testimonials";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Empathy />
      <CareerDirect />
      <Process />
      <Testimonials />
    </main>
  );
}
