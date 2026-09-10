"use client";

import { ComponentProps } from "react";
import { Link } from "@/i18n/routing";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: ComponentProps<typeof Link>["href"];
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://fitgo.app",
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.label,
        ...(item.href ? { "item": `https://fitgo.app${item.href}` } : {}),
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Migas de pan" className="mb-6 flex items-center text-xs text-text-muted">
        <ol className="flex items-center flex-wrap gap-1.5">
          <li className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-text-primary transition-colors"
            >
              <Home size={13} />
              <span>Inicio</span>
            </Link>
          </li>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={index} className="flex items-center gap-1.5">
                <ChevronRight size={12} className="text-text-muted/60" />
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-primary font-medium">{item.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
