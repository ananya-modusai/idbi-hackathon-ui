export default function InsolvencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col flex-1 min-h-0">
      {children}
    </section>
  );
}
