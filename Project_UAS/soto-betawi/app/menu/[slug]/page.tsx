import { defaultMenus } from "@/data/menus";
import MenuDetailClient from "@/components/MenuDetailClient";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return defaultMenus.map((menu) => ({ slug: menu.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const menu = defaultMenus.find((item) => item.slug === slug);
  return { title: menu ? `${menu.name} | Soto Betawi Jakarta` : "Menu | Soto Betawi Jakarta" };
}

export default async function MenuDetailPage({ params }: Props) {
  const { slug } = await params;
  const menu = defaultMenus.find((item) => item.slug === slug) ?? null;
  return <MenuDetailClient slug={slug} initialMenu={menu} />;
}
