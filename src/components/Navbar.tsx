import React, { useState } from 'react';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Navbar: React.FC = () => {
    const { cartCount, setIsCartOpen } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const navLinks = ['Shop', 'Collections', 'About', 'Contact'];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 nav-blur border-b border-border">
            <div className="container mx-auto">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <a href="/" className="text-xl md:text-2xl font-bold tracking-tight">
                        Bông<span className="text-primary">COSMETIC</span>
                    </a>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link}
                                href="#"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                            >
                                {link}
                            </a>
                        ))}
                    </div>

                    {/* Search & Cart */}
                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Search - Desktop */}
                        <div className="hidden md:flex items-center bg-secondary rounded-full px-4 py-2 gap-2">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent text-sm w-40 focus:outline-none placeholder:text-muted-foreground"
                            />
                        </div>

                        {/* Search - Mobile */}
                        <button className="md:hidden p-2 hover:bg-secondary rounded-full transition-colors">
                            <Search className="w-5 h-5" />
                        </button>

                        {/* Cart Button */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-2 hover:bg-secondary rounded-full transition-colors"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center animate-scale-up">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 hover:bg-secondary rounded-full transition-colors"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-border animate-fade-in">
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link}
                                    href="#"
                                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                                >
                                    {link}
                                </a>
                            ))}
                            {/* Mobile Search */}
                            <div className="flex items-center bg-secondary rounded-full px-4 py-3 gap-2 mt-2">
                                <Search className="w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-muted-foreground"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
