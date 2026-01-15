"use client";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import Blog from "@/app/_component/Blog";
import BlogSection3 from "@/app/_component/BlogSection3";


export default function BlogPage() {
    return (
        <div className="md:pt-[120px] pt-[150px]">
            <Navbar />
            <Blog />
            <BlogSection3 />
            <Footer />
        </div>
    );
}