import { getMDXList, getMDXDetail } from "@/lib/mdx";
import { getWeaponBySlug } from "@/lib/weapons";
import { WeaponDetailCard } from "@/components/WeaponCard";
import {
  WeaponAttenuationChart,
  type WeaponAttenuationChartProps,
} from "@/components/WeaponAttenuationChart";
import { WeaponSkill } from "@/components/WeaponSkill";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents, TableOfContents } from "@/lib/mdx-components";
import { mdxOptions } from "@/lib/mdx-options";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateStaticParams() {
  const items = getMDXList("weapons");
  return items.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { metadata } = getMDXDetail("weapons", slug);
  const title = metadata.title || slug;
  return {
    title,
    description: `${title} — 逆战未来武器详情`,
    alternates: { canonical: `/weapons/${slug}` },
  };
}

// Tailwind max-width classes mapping
const PAGE_WIDTH_CLASSES: Record<string, string> = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-4xl",
  "2xl": "max-w-5xl",
  "3xl": "max-w-6xl",
  full: "max-w-7xl",
};

function isCustomWidth(value: string): boolean {
  return /^\d+(px|rem|em|vw|%)$/.test(value);
}

export default async function WeaponDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const weapon = await getWeaponBySlug(slug);
  const { content, metadata } = getMDXDetail("weapons", slug);
  const showToc = metadata.toc !== false;

  const pageWidth = metadata["page-width"] as string | undefined;
  const isCustom = pageWidth && isCustomWidth(pageWidth);
  const widthClass = isCustom
    ? ""
    : pageWidth && PAGE_WIDTH_CLASSES[pageWidth]
      ? PAGE_WIDTH_CLASSES[pageWidth]
      : "max-w-3xl";
  const customStyle = isCustom ? { maxWidth: pageWidth } : undefined;

  if (!weapon) {
    return (
      <div className="mx-auto max-w-3xl py-6">
        <p className="text-zinc-500">武器不存在</p>
      </div>
    );
  }

  const AttenuationChartForWeapon = (props: WeaponAttenuationChartProps) => (
    <WeaponAttenuationChart {...props} weapon={props.weapon ?? weapon} />
  );
  const WeaponSkillForWeapon = ({ children }: { children: ReactNode }) => (
    <>
      <WeaponSkill>{children}</WeaponSkill>
      <WeaponAttenuationChart weapon={weapon} />
    </>
  );
  const weaponMdxComponents = {
    ...mdxComponents,
    AttenuationChart: AttenuationChartForWeapon,
    WeaponAttenuationChart: AttenuationChartForWeapon,
    WeaponSkill: WeaponSkillForWeapon,
  };

  return (
    <>
      <TableOfContents enabled={showToc} />
      <div
        className={`mx-auto ${widthClass} py-6 ${isCustom ? "max-md:max-w-full" : ""}`}
        style={customStyle}
      >
        <WeaponDetailCard weapon={weapon} />

        {content.trim() && (
          <article className="prose prose-lg prose-invert mt-8 max-w-none">
            <MDXRemote
              source={content}
              components={weaponMdxComponents}
              options={mdxOptions}
            />
          </article>
        )}
      </div>
    </>
  );
}
