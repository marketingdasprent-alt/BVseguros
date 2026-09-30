import Link from "../../app/Link";

export type BreadcrumbItem = { label: string; href?: string };

/** O último item é a página atual (sem link, aria-current). */
export default function Breadcrumb({ itens }: { itens: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Caminho" className="breadcrumb">
      <ol className="breadcrumb__list">
        {itens.map((item, i) => (
          <li key={item.label} className="breadcrumb__item">
            {item.href && i < itens.length - 1 ? (
              <Link href={item.href} className="breadcrumb__link">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
