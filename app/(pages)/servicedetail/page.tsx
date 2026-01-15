"use client";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import Bookkeeping from "@/app/_component/Bookkeeping";
import Service2 from "@/app/_component/Service2";

export default function ServicePage() {
    return (
        <div className="md:pt-[120px] pt-[150px]">
            <Navbar />
            <Service2 />
            <Bookkeeping/>
            <Footer />
        </div>
    );
}