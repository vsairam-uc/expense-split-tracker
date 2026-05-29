export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 pb-12 sm:py-12">
      {children}
    </div>
  );
}
