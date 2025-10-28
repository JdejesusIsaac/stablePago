import { Container } from "./common/Container";

const newProducts: NewProductProps[] = [
  {
    title: "Get your card",
    description: "Set up a card to start using your funds",
    image: "/credit-card-pro.png",
  },
  {
    title: "Earn yield",
    description: "Get up to 3.15% APY",
    image: "/earn-yield.png",
  },
];

interface NewProductProps {
  title: string;
  description: string;
  image: string;
}

const NewProduct = ({ title, description, image }: NewProductProps) => {
  return (
    <div className="card-arc flex-1 p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-200">
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-surface-elevated border border-border flex items-center justify-center overflow-hidden">
            <img className="w-full h-full object-cover" src={image} alt={title} />
          </div>
          <div>
            <div className="text-base font-bold text-foreground mb-1">{title}</div>
            <div className="text-sm text-text-secondary">{description}</div>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end justify-center">
          <div className="bg-muted/50 border border-border text-text-secondary min-w-[100px] text-center rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide">
            Coming soon
          </div>
        </div>
      </div>
    </div>
  );
};

export function NewProducts() {
  return (
    <div className="w-full max-w-5xl">
      <h2 className="text-xl font-bold text-foreground tracking-tight mb-4">Coming Soon</h2>
      <div className="flex flex-col gap-4 md:flex-row">
        {newProducts.map((product) => (
          <NewProduct key={product.title} {...product} />
        ))}
      </div>
    </div>
  );
}
