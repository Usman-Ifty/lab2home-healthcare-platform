export const publicNavItems = [
    {
        label: "Services",
        bgColor: "hsl(200 85% 45%)", // Primary blue
        textColor: "#fff",
        links: [
            { label: "Diagnostic Tests", href: "/#features", ariaLabel: "View diagnostic tests" },
            { label: "Home Collection", href: "/#how-it-works", ariaLabel: "Home sample collection" },
            { label: "AI Reports", href: "/#services", ariaLabel: "AI-powered report analysis" }
        ]
    },
    {
        label: "About",
        bgColor: "hsl(180 65% 50%)", // Secondary teal
        textColor: "#fff",
        links: [
            { label: "About Us", href: "/about", ariaLabel: "Learn about us" },
            { label: "Our Team", href: "/about#team", ariaLabel: "Meet our team" }
        ]
    },
    {
        label: "Contact",
        bgColor: "hsl(150 70% 45%)", // Health green
        textColor: "#fff",
        links: [
            { label: "Support", href: "/contact", ariaLabel: "Contact support" },
            { label: "Book Test", href: "/signup", ariaLabel: "Book a test" }
        ]
    }
];
