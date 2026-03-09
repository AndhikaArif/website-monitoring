export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
    </div>
  );
}
