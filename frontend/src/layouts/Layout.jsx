import Nav from '../components/Nav';
import SystemStatus from '../components/SystemStatus';

export default function Layout({ children }) {
  return (
    <>
      <Nav />
      <SystemStatus />
      <main className="max-w-6xl mx-auto p-5">{children}</main>
    </>
  );
}
