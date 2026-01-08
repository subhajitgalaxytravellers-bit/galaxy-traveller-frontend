// eslint-disable-next-line no-unused-vars
"use client";
import { motion } from "framer-motion";
import { PlaneTakeoff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function DetailSection() {
  const navigate = useRouter();

  return (
    <section className="relative bg-background max-w-[99rem] mx-auto py-16 sm:py-20 px-4 sm:px-8 overflow-hidden">
      <div className=" mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <p className="text-primary font-semibold uppercase tracking-wide mb-2">
            Dream Your Next Trip
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
            Discover When Even <br /> You Want To Go
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl">
            Are you tired of the typical tourist destinations and looking to
            step out of your comfort zone? Adventure travel may be the perfect
            solution for you. Explore hidden gems and unforgettable experiences
            with us.
          </p>

          <div className="space-y-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <PlaneTakeoff className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">Best Travel Agency</h4>
                <p className="text-muted-foreground text-sm">
                  Plan your dream destination easily and confidently with our
                  expert team.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">
                  Secure Journey With Us
                </h4>
                <p className="text-muted-foreground text-sm">
                  Enjoy safe, comfortable, and worry-free trips backed by 24/7
                  support.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => {
              navigate("/contact");
            }}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg"
          >
            Book Your Trip
          </Button>
        </motion.div>

        {/* RIGHT IMAGE AREA */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          className="relative flex justify-center md:justify-end"
        >
          {/* MAIN IMAGE */}
          <div className="relative w-[90%] sm:w-[80%] md:w-[85%] aspect-[5/6] rounded-2xl overflow-hidden shadow-xl">
            <Image
                  src={"/assets/destination-santorini.jpg"}
              alt="Main travel"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 600px"
            />
          </div>

          {/* SMALL OVERLAY IMAGE */}
          <div className="absolute hidden sm:block top-1/2 -left-10 md:-left-14 transform -translate-y-1/2 w-[35%] aspect-square rounded-xl overflow-hidden shadow-lg border-4 border-white">
            <Image
              src={"/assets/sea.jpg"}
              alt="Small travel"
              fill
              className="object-cover"
              sizes="200px"
            />
          </div>

          {/* MOBILE SMALL IMAGE (STACKED) */}
          <div className="sm:hidden mt-6 w-[60%] aspect-square rounded-xl overflow-hidden shadow-lg border-4 border-white">
            <Image
                 src={"/assets/destination-santorini.jpg"}
              alt="Small travel mobile"
              fill
              className="object-cover"
              sizes="200px"
            />
          </div>

          {/* DECORATIVE TEXT */}
          <h2 className="absolute hidden md:block top-1/2 -right-20 transform -translate-y-1/2 rotate-90 text-[110px] lg:text-[160px] font-extrabold text-foreground/5 select-none">
            TRAVEL
          </h2>
        </motion.div>
      </div>

      {/* BACKGROUND DECORATION */}
      <div className="absolute left-0 bottom-0 opacity-10 pointer-events-none select-none hidden sm:block">
        <Image
          src="https://upload.wikimedia.org/wikipedia/commons/3/30/BlankMap-World-Sovereign_Nations.svg"
          alt=""
          width={400}
          height={300}
          className="w-[300px] md:w-[400px]"
        />
      </div>
    </section>
  );
}
