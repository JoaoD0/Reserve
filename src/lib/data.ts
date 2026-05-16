import sushiImg from "@/assets/sushi.jpg";
import pastaImg from "@/assets/pasta.jpg";
import burgerImg from "@/assets/burger.jpg";
import cocktailsImg from "@/assets/cocktails.jpg";
import heroImg from "@/assets/hero-restaurant.jpg";

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  tag: string;
  price: string;
  rating: number;
  image_url: string;
  address: string;
  location: string;
  opening_time: string;
  closing_time: string;
  description: string;
  latitude: number;
  longitude: number;
  is_featured: boolean;
  next_slot?: string;
  distance?: string;
  bookedSlots?: string[];
};

export type MenuItem = {
  id: string;
  restaurant_id: string;
  category: "Entradas" | "Pratos" | "Sobremesas" | "Bebidas";
  name: string;
  description?: string;
  price: string;
  sort_order: number;
};

export const RESTAURANTS: Restaurant[] = [
  {
    id: "mare-alta",
    name: "Maré Alta",
    cuisine: "Bistrô",
    tag: "Mediterrâneo · Autoral",
    price: "$$$$",
    rating: 4.9,
    image_url: heroImg,
    address: "Rua Harmonia 340, Vila Madalena",
    location: "Vila Madalena",
    opening_time: "12:00",
    closing_time: "23:00",
    description:
      "Menu degustação de 7 tempos pela chef Helena Vidal. Um dos destinos gastronômicos mais celebrados da cidade, combinando técnicas clássicas com ingredientes sazonais.",
    latitude: -23.5631,
    longitude: -46.6903,
    is_featured: false,
    bookedSlots: ["13:30", "14:00", "19:30", "21:00"],
  },
  {
    id: "sakura-omakase",
    name: "Sakura Omakase",
    cuisine: "Japonês",
    tag: "Japonês contemporâneo",
    price: "$$$",
    rating: 4.9,
    image_url: sushiImg,
    address: "Rua dos Pinheiros 1280, Jardins",
    location: "Jardins",
    opening_time: "19:00",
    closing_time: "23:00",
    description:
      "Balcão íntimo de 10 lugares. Omakase autoral do chef Kenzo Arata, com peixes selecionados diariamente do Tsukiji. Uma experiência gastronômica incomparável.",
    latitude: -23.5701,
    longitude: -46.68,
    is_featured: true,
    next_slot: "20:30",
    bookedSlots: ["19:30", "20:00", "21:30"],
  },
  {
    id: "atelier-trufa",
    name: "Atelier Trufa",
    cuisine: "Italiano",
    tag: "Italiano · Autoral",
    price: "$$$$",
    rating: 4.8,
    image_url: pastaImg,
    address: "Rua Aspicuelta 410, Vila Madalena",
    location: "Vila Madalena",
    opening_time: "19:00",
    closing_time: "23:00",
    description:
      "Cozinha italiana contemporânea com massas frescas feitas na hora e foco em trufas brancas e negras. Carta de vinhos italianos selecionados.",
    latitude: -23.5567,
    longitude: -46.6923,
    is_featured: true,
    next_slot: "21:00",
    bookedSlots: ["19:00", "20:30", "22:00"],
  },
  {
    id: "brasa-cobre",
    name: "Brasa & Cobre",
    cuisine: "Bistrô",
    tag: "Steakhouse · 1.2 km",
    price: "$$$",
    rating: 4.7,
    image_url: burgerImg,
    address: "Av. Rebouças 880, Pinheiros",
    location: "Pinheiros",
    opening_time: "12:00",
    closing_time: "23:00",
    description:
      "Churrascaria contemporânea especializada em cortes nobres dry-aged. Ambiente rústico com toques de elegância e uma adega com mais de 200 rótulos.",
    latitude: -23.562,
    longitude: -46.6735,
    is_featured: false,
    distance: "12 min",
    bookedSlots: ["13:00", "13:30", "20:00", "20:30"],
  },
  {
    id: "salao-vermelho",
    name: "Salão Vermelho",
    cuisine: "Bar",
    tag: "Coquetelaria · 800 m",
    price: "$$",
    rating: 4.6,
    image_url: cocktailsImg,
    address: "Rua Padre João Manuel 600, Jardins",
    location: "Jardins",
    opening_time: "18:00",
    closing_time: "02:00",
    description:
      "Bar de coquetelaria autoral com drinks assinados pela bartender Lara Vaz. Ambiente intimista com música ao vivo às sextas e sábados.",
    latitude: -23.558,
    longitude: -46.6635,
    is_featured: false,
    distance: "8 min",
    bookedSlots: ["19:00", "19:30", "22:30"],
  },
];

export const MENU_ITEMS: MenuItem[] = [
  // Maré Alta
  { id: "m1", restaurant_id: "mare-alta", category: "Entradas", name: "Ostras com mignonette", description: "6 unidades com molho de vinagre e echalota", price: "R$ 89", sort_order: 1 },
  { id: "m2", restaurant_id: "mare-alta", category: "Entradas", name: "Vieiras grelhadas", description: "Com purê de couve-flor e trufa", price: "R$ 124", sort_order: 2 },
  { id: "m3", restaurant_id: "mare-alta", category: "Pratos", name: "Menu degustação 7 tempos", description: "Seleção da chef Helena Vidal com harmonização opcional", price: "R$ 380", sort_order: 3 },
  { id: "m4", restaurant_id: "mare-alta", category: "Pratos", name: "Robalo com purê de aipim", description: "Filé de robalo grelhado, manteiga de ervas e limão siciliano", price: "R$ 198", sort_order: 4 },
  { id: "m5", restaurant_id: "mare-alta", category: "Pratos", name: "Polvo na brasa", description: "Com batata rústica, aioli de açafrão e paprika defumada", price: "R$ 215", sort_order: 5 },
  { id: "m6", restaurant_id: "mare-alta", category: "Sobremesas", name: "Limão siciliano com merengue", description: "Torta cremosa com merengue italiano tostado", price: "R$ 68", sort_order: 6 },
  { id: "m7", restaurant_id: "mare-alta", category: "Sobremesas", name: "Petit gâteau de maracujá", description: "Com sorvete de creme e calda de maracujá", price: "R$ 58", sort_order: 7 },
  { id: "m8", restaurant_id: "mare-alta", category: "Bebidas", name: "Harmonização de vinhos", description: "5 taças selecionadas pelo sommelier", price: "R$ 220", sort_order: 8 },
  { id: "m9", restaurant_id: "mare-alta", category: "Bebidas", name: "Champagne Moët & Chandon", description: "Taça 150ml", price: "R$ 145", sort_order: 9 },
  // Sakura Omakase
  { id: "s1", restaurant_id: "sakura-omakase", category: "Entradas", name: "Edamame com flor de sal", description: "Vagem de soja cozida no vapor", price: "R$ 28", sort_order: 1 },
  { id: "s2", restaurant_id: "sakura-omakase", category: "Entradas", name: "Gyoza de camarão", description: "6 unidades com molho ponzu", price: "R$ 52", sort_order: 2 },
  { id: "s3", restaurant_id: "sakura-omakase", category: "Pratos", name: "Omakase 12 cortes", description: "Seleção do chef, 12 etapas sazonais", price: "R$ 320", sort_order: 3 },
  { id: "s4", restaurant_id: "sakura-omakase", category: "Pratos", name: "Sashimi de toro", description: "Barriga de atum gordo, 5 fatias", price: "R$ 145", sort_order: 4 },
  { id: "s5", restaurant_id: "sakura-omakase", category: "Pratos", name: "Tempura de camarão", description: "Camarão rosa empanado com dashi", price: "R$ 78", sort_order: 5 },
  { id: "s6", restaurant_id: "sakura-omakase", category: "Sobremesas", name: "Mochi de matcha", description: "Trio de mochi artesanal de chá verde", price: "R$ 38", sort_order: 6 },
  { id: "s7", restaurant_id: "sakura-omakase", category: "Sobremesas", name: "Sorvete de gengibre", description: "Com calda de mel e gergelim torrado", price: "R$ 32", sort_order: 7 },
  { id: "s8", restaurant_id: "sakura-omakase", category: "Bebidas", name: "Sake pairing", description: "Harmonização com 5 doses selecionadas", price: "R$ 220", sort_order: 8 },
  { id: "s9", restaurant_id: "sakura-omakase", category: "Bebidas", name: "Cerveja Sapporo", description: "Lata 350ml", price: "R$ 24", sort_order: 9 },
  // Atelier Trufa
  { id: "at1", restaurant_id: "atelier-trufa", category: "Entradas", name: "Burrata com trufa negra", description: "Burrata fresca com lascas de trufa e rúcula", price: "R$ 98", sort_order: 1 },
  { id: "at2", restaurant_id: "atelier-trufa", category: "Entradas", name: "Carpaccio de wagyu", description: "Com lascas de parmesão e azeite trufado", price: "R$ 115", sort_order: 2 },
  { id: "at3", restaurant_id: "atelier-trufa", category: "Pratos", name: "Tagliolini ao tartufo", description: "Massa fresca com manteiga e lascas de trufa branca", price: "R$ 189", sort_order: 3 },
  { id: "at4", restaurant_id: "atelier-trufa", category: "Pratos", name: "Risoto de funghi porcini", description: "Arborio cremoso com funghi e parmesão 24 meses", price: "R$ 162", sort_order: 4 },
  { id: "at5", restaurant_id: "atelier-trufa", category: "Pratos", name: "Gnocchi trufado", description: "Nhoque de batata com creme de trufa negra", price: "R$ 145", sort_order: 5 },
  { id: "at6", restaurant_id: "atelier-trufa", category: "Sobremesas", name: "Tiramisù da casa", description: "Receita clássica com mascarpone e café espresso", price: "R$ 54", sort_order: 6 },
  { id: "at7", restaurant_id: "atelier-trufa", category: "Sobremesas", name: "Panna cotta de baunilha", description: "Com calda de frutas vermelhas", price: "R$ 48", sort_order: 7 },
  { id: "at8", restaurant_id: "atelier-trufa", category: "Bebidas", name: "Vinho tinto da casa", description: "Taça Brunello di Montalcino", price: "R$ 120", sort_order: 8 },
  { id: "at9", restaurant_id: "atelier-trufa", category: "Bebidas", name: "Prosecco Valdobbiadene", description: "Taça 150ml", price: "R$ 65", sort_order: 9 },
  // Brasa & Cobre
  { id: "bc1", restaurant_id: "brasa-cobre", category: "Entradas", name: "Costelinha ao mel", description: "Meia costelinha suína com mel e pimenta", price: "R$ 72", sort_order: 1 },
  { id: "bc2", restaurant_id: "brasa-cobre", category: "Entradas", name: "Linguiça artesanal", description: "Linguiça toscana grelhada com chimichurri", price: "R$ 48", sort_order: 2 },
  { id: "bc3", restaurant_id: "brasa-cobre", category: "Pratos", name: "Tomahawk dry-aged", description: "1kg, maturado 45 dias, acompanha batata rústica", price: "R$ 248", sort_order: 3 },
  { id: "bc4", restaurant_id: "brasa-cobre", category: "Pratos", name: "Picanha na brasa", description: "400g com farofa de alho e vinagrete", price: "R$ 142", sort_order: 4 },
  { id: "bc5", restaurant_id: "brasa-cobre", category: "Pratos", name: "Fraldinha ao alho", description: "350g com manteiga de ervas e gratin de batata", price: "R$ 128", sort_order: 5 },
  { id: "bc6", restaurant_id: "brasa-cobre", category: "Sobremesas", name: "Pudim de leite", description: "Receita tradicional com calda de caramelo", price: "R$ 32", sort_order: 6 },
  { id: "bc7", restaurant_id: "brasa-cobre", category: "Bebidas", name: "Chopp artesanal", description: "Pint 500ml, Schornstein Weiss ou Pilsen", price: "R$ 28", sort_order: 7 },
  { id: "bc8", restaurant_id: "brasa-cobre", category: "Bebidas", name: "Caipirinha de limão", description: "Cachaça Leblon, limão e açúcar", price: "R$ 38", sort_order: 8 },
  // Salão Vermelho
  { id: "sv1", restaurant_id: "salao-vermelho", category: "Entradas", name: "Tábua de frios", description: "Queijos e embutidos artesanais com geleias", price: "R$ 82", sort_order: 1 },
  { id: "sv2", restaurant_id: "salao-vermelho", category: "Entradas", name: "Bruschetta de tomate", description: "Pão italiano com tomate confit e manjericão", price: "R$ 42", sort_order: 2 },
  { id: "sv3", restaurant_id: "salao-vermelho", category: "Pratos", name: "Flatbread de cogumelos", description: "Pão rústico com mix de cogumelos e grana padano", price: "R$ 68", sort_order: 3 },
  { id: "sv4", restaurant_id: "salao-vermelho", category: "Pratos", name: "Croquete de pernil", description: "6 unidades com aioli de limão", price: "R$ 52", sort_order: 4 },
  { id: "sv5", restaurant_id: "salao-vermelho", category: "Sobremesas", name: "Brownie quente", description: "Com sorvete de baunilha e calda de chocolate", price: "R$ 45", sort_order: 5 },
  { id: "sv6", restaurant_id: "salao-vermelho", category: "Bebidas", name: "Negroni", description: "Campari, gin e vermute tinto", price: "R$ 52", sort_order: 6 },
  { id: "sv7", restaurant_id: "salao-vermelho", category: "Bebidas", name: "Aperol Spritz", description: "Aperol, Prosecco e água com gás", price: "R$ 48", sort_order: 7 },
  { id: "sv8", restaurant_id: "salao-vermelho", category: "Bebidas", name: "Moscow Mule", description: "Vodka, ginger beer e limão", price: "R$ 52", sort_order: 8 },
  { id: "sv9", restaurant_id: "salao-vermelho", category: "Bebidas", name: "Gin Tônica", description: "Gin Tanqueray com Fever Tree e frutas", price: "R$ 48", sort_order: 9 },
];

export function getRestaurantById(id: string) {
  return RESTAURANTS.find((r) => r.id === id);
}

export function getMenuByRestaurantId(restaurantId: string) {
  return MENU_ITEMS.filter((m) => m.restaurant_id === restaurantId);
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
