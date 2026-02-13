import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-24 bg-gradient-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Experience Healthcare at Home?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied patients who trust Lab2Home for their diagnostic needs. 
            Book your first test today and experience the convenience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-6 shadow-strong hover:scale-105 transition-transform"
              asChild
            >
              <Link to="/signup">
                <UserPlus className="w-5 h-5 mr-2" />
                Sign Up Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-primary transition-colors"
            >
              <Phone className="w-5 h-5 mr-2" />
              Contact Support
            </Button>
          </div>

          <div className="mt-12 pt-12 border-t border-white/20">
            <p className="text-white/80 text-sm mb-4">Trusted by leading healthcare providers</p>
            <div className="flex justify-center items-center gap-12 flex-wrap opacity-60">
              <div className="text-white font-semibold text-lg">CERTIFIED</div>
              <div className="text-white font-semibold text-lg">SECURE</div>
              <div className="text-white font-semibold text-lg">RELIABLE</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
    </section>
  );
};

export default CTA;
