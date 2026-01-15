"use client";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import ContactHead from "@/app/_component/ContactHead";
import Contact from "@/app/_component/Contact";

export default function ContactPage() {
    return (
        <div className="md:pt-[120px] pt-[150px]">
            <Navbar />
            <ContactHead />
            <Contact />
            <Footer />
        </div>
    );
}