import { Link } from "react-router-dom";
const Navbar = () => {
  return (
    <nav className="border-b border-blue-400 bg-blue-400 py-4 shadow">
      <div className="container mx-auto flex justify-between items-center">

        {/* Logo */}
        <h1 className="text-rose-500 font-bold text-2xl px-6">Logo</h1>

        {/* Menu */}
        <ul className="flex gap-14 px-4">

          <li>
            <Link
              to="/connect-wallet"
              className="font-bold text-lg hover:text-white hover:scale-105 transform transition duration-300 ease-in-out"
            >
              Connect Wallet
            </Link>
          </li>

          <li>
            <Link
              to="/HomePage"
              className="font-bold text-lg hover:text-white hover:scale-105 transform transition duration-300 ease-in-out"
            >
              Home
            </Link>
          </li>

          <li>
            <Link
              to="/about"
              className="font-bold text-lg hover:text-white hover:scale-105 transform transition duration-300 ease-in-out"
            >
              About
            </Link>
          </li>

        </ul>
      </div>
    </nav>
  );
};

export default Navbar;