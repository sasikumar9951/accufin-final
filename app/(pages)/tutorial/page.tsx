"use client";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import SinglePost from "@/app/_component/SinglePost";
import Entry from "@/app/_component/Entry";

export default function ServicePage() {
    return (
        <div className="md:pt-[120px] pt-[150px]">
            <Navbar />
            <SinglePost />
            {/* <Restruct /> */}
            <Entry/>
            <Footer />
        </div>
    );
}