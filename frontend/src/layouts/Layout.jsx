import Nav from '../components/Nav';

export default function Layout({ children }) {
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto p-5">{children}</main>
    </>
  );
}
