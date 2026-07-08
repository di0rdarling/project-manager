export const pageInnerClassName =
  "mx-auto w-full max-w-6xl 2xl:max-w-7xl";

const pageContentClassName = `${pageInnerClassName} flex flex-col gap-8 px-6 py-12`;

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContent({
  children,
  className,
}: Readonly<PageContentProps>) {
  return (
    <div
      className={
        className ? `${pageContentClassName} ${className}` : pageContentClassName
      }
    >
      {children}
    </div>
  );
}
