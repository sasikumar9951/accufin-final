"use client";
import Navbar from "@/app/_component/Navbar";
import Partner from "@/app/_component/Partner";
import Partner2 from "@/app/_component/Partner2";
import Footer from "@/app/_component/Footer";
import Team from "@/app/_component/Team";
import Finance from "@/app/_component/Finance";

export default function TeamPage() {
    return (
        <div className="md:pt-[120px] pt-[150px]">
            <Navbar />
            <Team />
            {/* <Ourteam /> */}
            {/* <Ourteam2 /> */}
            <Finance/>
            <Partner />
            <Partner2 />            
            <Footer />
        </div>
    );
}