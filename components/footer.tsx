import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">StreamComics</h3>
            <p className="text-muted-foreground">
              Watch videos and read comics with a seamless, modern experience.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/stream"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Stream
                </Link>
              </li>
              <li>
                <Link
                  href="/comics"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Comics
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} StreamComics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;