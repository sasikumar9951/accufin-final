"use client";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import Finance from "@/app/_component/Finance";
import Finance2 from "@/app/_component/Finance2";
import Finance3 from "@/app/_component/Finance3";
import Cases from "@/app/_component/Cases";
import BlogSection from "@/app/_component/BlogSection";

export default function CasesPage() {
    return (
        <div className="md:pt-[120px] pt-[150px]">
            <Navbar />
            <Cases />
            <Finance2 />
            <Finance3 />
            <Finance />
            <BlogSection/>
            <Footer />
        </div>
    );
}