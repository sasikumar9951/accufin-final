"use client";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaChevronRight,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { Link, OpenContact } from "@prisma/client";

const quickLinks = [
  { text: "Home", href: "/" },
  { text: "About Us", href: "/about" },
  { text: "Services", href: "/service" },
  { text: "Cases", href: "/cases" },
  { text: "Pricing", href: "/pricing" },
  // { text: "FAQs", href: "/faqs" },
  { text: "Contact Us", href: "/contact" },
];

const services = [
  { name: "Bookkeeping", href: "/service/bookkeeping" },
  { name: "Payroll Services", href: "/service/payroll" },
  { name: "Tax Planning", href: "/service/tax" },
  { name: "Audit & Assurance", href: "/service/audit" },
  { name: "Financial Statement", href: "/service/finance" },
  { name: "Business Compliances", href: "/service/businesscompliances" },
];

type OpenContactWithLinks = OpenContact & {
  links: Link[];
};
export default function Footer() {
  const [openContact, setOpenContact] = useState<OpenContactWithLinks | null>(
    null,
  );

  useEffect(() => {
    const fetchOpenContacts = async () => {
      const openContacts = await fetch("/api/user/open-contacts");
      const data = await openContacts.json();
      // Since the API returns an array, take the first element
      setOpenContact(data[0] as OpenContactWithLinks);
    };
    fetchOpenContacts();
  }, []);

  if (!openContact) return null;

  return (
    <footer className="bg-[#007399] text-white pt-12 pb-4 px-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 justify-between">
        {/* Logo & About */}
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center mb-2">
            <span className="text-white text-5xl font-bold">A</span>
            <div>
              <span className="text-white text-4xl font-bold">ccufin</span>
              <div className="text-xs text-white tracking-widest">
                ACCOUNTING FIRM
              </div>
            </div>
          </div>
          <p className="mb-6 mt-4 text-white/90">
            Every client is very important, and we invest our time in synergies
            and efforts for your businesses as equal as yours.
          </p>
          <div className="flex space-x-4 mt-6 flex-col">
            {openContact.links?.map((link) => (
              <a href={link.url} className="mb-2" key={link.id}>
                {link.name}
              </a>
            ))}
          </div>
        </div>
        {/* Quick Links */}
        <div className="flex-1 min-w-[180px]">
          <div className="font-bold text-2xl mb-4">Quick Links</div>

          <ul>
            {quickLinks.map((link) => {
              // Convert link text to lowercase and replace spaces with hyphens for href
              // const href = `${link.text.toLowerCase().replace(/\s+/g, '-')}`;

              return (
                <li key={link.text}>
                  <a
                    href={link.href}
                    className="flex items-center py-1 hover:text-[#00c6fb] transition-colors"
                  >
                    <FaChevronRight className="mr-2 text-[#00c6fb]" />
                    {link.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        {/* Services */}
        <div className="flex-1 min-w-[200px]">
          <div className="font-bold text-2xl mb-4">Services</div>
          <ul>
            {services.map((service) => (
              <li key={service.name}>
                <a
                  href={service.href}
                  className="flex items-center py-1 hover:text-[#00c6fb] transition-colors"
                >
                  <FaChevronRight className="mr-2 text-[#00c6fb]" />
                  {service.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {/* Information */}
        <div className="flex-1 min-w-[220px]">
          <div className="font-bold text-2xl mb-4">Information</div>
          <div className="flex items-start mb-4">
            <FaPhoneAlt className="text-2xl mr-3 mt-1 text-[#00c6fb]" />
            <div>
              <div className="font-bold">Phone</div>
              <div>{openContact.phone1}</div>
              <div>{openContact.phone2}</div>
            </div>
          </div>
          <div className="flex items-start mb-4">
            <FaEnvelope className="text-2xl mr-3 mt-1 text-[#00c6fb]" />
            <div>
              <div className="font-bold">Email</div>
              <div>{openContact.email}</div>
            </div>
          </div>
          <div className="flex items-start mb-4">
            <FaMapMarkerAlt className="text-2xl mr-3 mt-1 text-[#00c6fb]" />
            <div>
              <div className="font-bold">Address</div>
              <div>{openContact.address}</div>
            </div>
          </div>
        </div>
      </div>
      <hr className="my-8 border-white/30" />
      <div className="text-center text-white/80 text-sm">
        Copyright 2025 © All Right Reserved Design by Accufin
      </div>
    </footer>
  );
}
