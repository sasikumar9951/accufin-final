"use client";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import Cases2 from "@/app/_component/Cases2";
import Restruct from "@/app/_component/Restruct";

export default function CasedetailPage() {
    return (
        <div className="md:pt-[120px] pt-[150px]">
            <Navbar />
            <Cases2 />
            <Restruct />
            <Footer />
        </div>
    );
}