interface Props {
  children: React.ReactNode;
}
export default function Layout({ children }: Props) {
  return (
    <div className="min-h-svh w-full flex items-center justify-center bg-muted">
      {children}
    </div>
  );
}
