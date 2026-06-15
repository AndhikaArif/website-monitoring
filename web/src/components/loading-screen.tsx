import { FiLoader } from "react-icons/fi";

export default function LoadingScreen() {
  return (
    <div className="fixed flex inset-0 z-50 min-h-screen items-center justify-center bg-gray-50">
      <FiLoader className="animate-spin text-gray-900 text-4xl mb-4" />
    </div>
  );
}
