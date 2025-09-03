import { Link } from "react-router";
import { usePuterStore } from "~/lib/puter";
import { useState } from "react";

const Navbar = () => {
  const { auth, fs, kv } = usePuterStore();
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleClearDataConfirm = async () => {
    setShowConfirmModal(false);
    setIsClearing(true);

    try {
      // Get all files and delete them
      const files = (await fs.readDir("./")) as FSItem[];
      if (files) {
        for (const file of files) {
          await fs.delete(file.path);
        }
      }
      // Clear all key-value data
      await kv.flush();

      // Refresh the page to show empty state
      window.location.reload();
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("Failed to clear data. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearData = () => {
    setShowConfirmModal(true);
  };

  return (
    <nav className="flex items-center bg-white rounded-full p-4 w-full px-4 md:px-10 max-w-[1200px] mx-auto">
      <Link to="/" className="flex-shrink-0">
        <p className="text-2xl font-bold text-gradient">HireFlow</p>
      </Link>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-3 ml-auto">
        <button
          onClick={handleClearData}
          disabled={isClearing}
          className="bg-gradient-to-b from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
        >
          {isClearing ? "Clearing..." : "Clear Data"}
        </button>
        <button
          onClick={auth.signOut}
          className="bg-gradient-to-b from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
        >
          Log Out
        </button>
        <Link to="/upload" className="primary-button w-fit">
          Upload Resume
        </Link>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex gap-1 ml-auto">
        <button
          onClick={handleClearData}
          disabled={isClearing}
          className="bg-gradient-to-b from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white px-2 py-1 rounded-full text-xs font-medium transition-all duration-200"
        >
          {isClearing ? "..." : "Clear"}
        </button>
        <button
          onClick={auth.signOut}
          className="bg-gradient-to-b from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white px-2 py-1 rounded-full text-xs font-medium transition-all duration-200"
        >
          Sign Out
        </button>
        <Link to="/upload" className="primary-button w-fit px-4 py-1.5 text-sm">
          Upload
        </Link>
      </div>

      {/* Stylish Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="gradient-border max-w-md mx-4 animate-in zoom-in duration-300">
            <div className="bg-white rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-b from-red-400 to-red-500 rounded-full flex items-center justify-center">
                  <img
                    src="/icons/warning.svg"
                    alt="Warning"
                    className="w-5 h-5 filter invert"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Clear All Data
                </h3>
              </div>

              <p className="text-gray-600 leading-relaxed">
                Are you sure you want to clear all your resume data? This will
                permanently delete:
              </p>

              <ul className="text-gray-600 text-sm space-y-1 ml-4">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                  All uploaded resumes
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                  ATS analysis results
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                  Application tracking data
                </li>
              </ul>

              <p className="text-red-600 text-sm font-medium">
                ⚠️ This action cannot be undone.
              </p>

              <div className="flex gap-3 mt-2 max-sm:flex-col">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-xl max-sm:rounded-lg font-medium transition-all duration-200 max-sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearDataConfirm}
                  className="flex-1 bg-gradient-to-b from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white py-2.5 px-4 rounded-xl max-sm:rounded-lg font-medium transition-all duration-200 max-sm:text-sm"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
