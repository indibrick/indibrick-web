// app/embed/layout.tsx
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  // Notice we are NOT including the Header or Footer components here
  // This ensures the widget looks native on the partner's website
  return (
    <div className="bg-transparent w-full h-full min-h-screen">
      {children}
    </div>
  );
}