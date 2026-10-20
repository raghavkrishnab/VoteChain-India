import Nav from '../components/Nav';
import SystemStatus from '../components/SystemStatus';
import { APP_NAME, NETWORK_NAME } from '../config/config';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <SystemStatus />
      <main className="max-w-6xl w-full mx-auto px-5 py-8 flex-1">{children}</main>
      <footer className="border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-5 py-4 flex flex-wrap justify-between gap-2">
          <span>{APP_NAME} · educational prototype, not for real elections</span>
          <span>Network: {NETWORK_NAME}</span>
        </div>
      </footer>
    </div>
  );
}
