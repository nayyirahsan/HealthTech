export function TopNav() {
  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <span className="text-sm text-gray-500">UT Austin Premed AI Copilot</span>
      <div className="flex items-center gap-4">
        {/* TODO: User avatar and auth controls */}
        <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-sm font-medium text-orange-800">
          U
        </div>
      </div>
    </header>
  );
}
