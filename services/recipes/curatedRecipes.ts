import type { Recipe } from '../../store/types';

export interface CuratedRecipeDef {
  id: string;
  es: {
    name: string;
    description: string;
    ingredients: string[];
    instructions: string[];
  };
  en: {
    name: string;
    description: string;
    ingredients: string[];
    instructions: string[];
  };
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number;
  goal: 'lose' | 'maintain' | 'gain';
  tags: string[];
}

export const CURATED_RECIPES: CuratedRecipeDef[] = [
  // ─── ALTO EN PROTEÍNA & VOLUMEN ─────────────────────────────────────────────
  {
    id: 'curated_pollo_arroz_brocoli',
    es: {
      name: 'Pollo Dorado con Arroz Jazmín y Brócoli Salteado',
      description: 'El clásico fitness perfeccionado: pechuga jugosa marinada con hierbas, arroz al punto y brócoli crujiente rico en fibra.',
      ingredients: [
        '180g de pechuga de pollo en tiras o filete',
        '80g de arroz jazmín o basmati en seco',
        '120g de arbolitos de brócoli fresco',
        '1 cdta (5ml) de aceite de oliva virgen extra',
        '1 diente de ajo picado',
        'Sal marina, pimienta negra, pimentón dulce y orégano al gusto',
      ],
      instructions: [
        'Cocina el arroz en agua hirviendo con una pizca de sal durante 12-15 minutos hasta que esté tierno.',
        'Sazona el pollo con ajo picado, pimentón, orégano, sal y pimienta.',
        'En una sartén antiadherente a fuego medio-alto con el aceite de oliva, dora el pollo 4-5 minutos por lado hasta que quede sellado y jugoso.',
        'En la misma sartén o al vapor, saltea el brócoli 5 minutos con una pizca de sal y pimienta para mantenerlo al dente.',
        'Sirve el arroz de base, añade el pollo dorado y acompaña con el brócoli.',
      ],
    },
    en: {
      name: 'Golden Chicken with Jasmine Rice & Sautéed Broccoli',
      description: 'The ultimate fitness staple: juicy herb-marinated breast, fluffy rice, and fiber-rich crisp broccoli.',
      ingredients: [
        '180g chicken breast sliced',
        '80g dry jasmine or basmati rice',
        '120g fresh broccoli florets',
        '1 tsp (5ml) extra virgin olive oil',
        '1 garlic clove minced',
        'Sea salt, black pepper, paprika, and oregano to taste',
      ],
      instructions: [
        'Cook rice in simmering salted water for 12-15 minutes until fluffy.',
        'Season chicken with minced garlic, paprika, oregano, salt, and pepper.',
        'Sear chicken in a non-stick pan with olive oil over medium-high heat for 4-5 minutes per side until golden and juicy.',
        'Steam or pan-sear broccoli for 5 minutes with a pinch of salt until tender-crisp.',
        'Plate the warm rice, sliced golden chicken, and fresh broccoli.',
      ],
    },
    calories: 485,
    protein: 48,
    carbs: 58,
    fat: 7,
    prepTime: 20,
    goal: 'gain',
    tags: ['highProtein', 'meatRice', 'chicken', 'pollo', 'arroz', 'almuerzo', 'comida', 'volumen'],
  },

  {
    id: 'curated_ternera_patatas_romero',
    es: {
      name: 'Ternera Magra al Sartén con Patatas Asadas y Romero',
      description: 'Corte magro de ternera alto en hierro biodisponible y creatina natural con patatas crujientes al horno o sartén.',
      ingredients: [
        '180g de filete magro de ternera (babilla o solomillo)',
        '200g de patatas cortadas en dados medianos',
        '1 cdta (5ml) de aceite de oliva virgen extra',
        'Romero fresco o seco, ajo en polvo y sal gruesa',
      ],
      instructions: [
        'Hierve los dados de patata 7 minutos o hornéalos en freidora de aire a 195°C durante 15 minutos con aceite, sal y romero hasta que doren.',
        'Calienta una plancha a fuego muy vivo.',
        'Sella el filete de ternera 2-3 minutos por lado según el término deseado.',
        'Deja reposar la carne 2 minutos antes de cortar para retener sus jugos.',
        'Sirve acompañado de las patatas crujientes con un toque de romero.',
      ],
    },
    en: {
      name: 'Lean Beef Medallions with Rosemary Roasted Potatoes',
      description: 'Lean cut rich in iron, zinc, and natural creatine paired with golden crispy rosemary potatoes.',
      ingredients: [
        '180g lean beef steak (sirloin or tenderloin)',
        '200g potatoes diced into cubes',
        '1 tsp (5ml) extra virgin olive oil',
        'Fresh or dried rosemary, garlic powder, and coarse sea salt',
      ],
      instructions: [
        'Air fry potato cubes at 195°C / 380°F for 15 minutes with olive oil, salt, and rosemary until crispy.',
        'Heat a skillet or grill plate until smoking hot.',
        'Sear beef 2-3 minutes per side to your preferred doneness.',
        'Let rest for 2 minutes to lock in juices before slicing.',
        'Serve steak alongside the crispy seasoned potatoes.',
      ],
    },
    calories: 520,
    protein: 46,
    carbs: 42,
    fat: 16,
    prepTime: 22,
    goal: 'gain',
    tags: ['highProtein', 'meatRice', 'carne', 'ternera', 'patata', 'beef', 'volumen', 'almuerzo'],
  },

  // ─── AVENA & DESAYUNOS FIT ──────────────────────────────────────────────────
  {
    id: 'curated_avena_proteica_chocolate',
    es: {
      name: 'Bowl de Avena Proteica con Chocolate & Frutos Rojos',
      description: 'Desayuno energético con carbohidratos de absorción lenta y proteína completa para rendir al máximo en tus entrenamientos.',
      ingredients: [
        '50g de copos de avena integral',
        '1 scoop (30g) de proteína en polvo (chocolate o vainilla)',
        '200ml de leche de almendras o desnatada',
        '1 cdta (5g) de semillas de chía',
        '50g de arándanos o fresas frescas',
        'Canela en polvo al gusto',
      ],
      instructions: [
        'Cocina la avena con la leche y canela en una olla pequeña a fuego medio durante 4-5 minutos, o 2 minutos en microondas.',
        'Retira del fuego y deja reposar 1 minuto.',
        'Añade la proteína en polvo disolviéndola con una cuchara hasta lograr una textura cremosa.',
        'Sirve en un bol y decora con los frutos rojos y semillas de chía.',
      ],
    },
    en: {
      name: 'Choco Protein Oatmeal Bowl with Fresh Berries',
      description: 'Slow-digesting complex carbs and 35g+ of complete protein to fuel your intense workouts and recovery.',
      ingredients: [
        '50g rolled oats',
        '1 scoop (30g) whey or plant protein powder',
        '200ml unsweetened almond or skim milk',
        '1 tsp (5g) chia seeds',
        '50g fresh blueberries or strawberries',
        'Dash of ground cinnamon',
      ],
      instructions: [
        'Simmer oats with milk and cinnamon in a saucepan for 4-5 minutes until thick.',
        'Remove from heat and let cool slightly for 60 seconds.',
        'Stir in the protein powder until smooth and creamy.',
        'Top with fresh berries and chia seeds.',
      ],
    },
    calories: 380,
    protein: 36,
    carbs: 44,
    fat: 6,
    prepTime: 10,
    goal: 'maintain',
    tags: ['oatsBreakfast', 'quick15', 'avena', 'desayuno', 'oats', 'breakfast', 'postre', 'fitDesserts'],
  },

  {
    id: 'curated_tortilla_claras_pavo_espinacas',
    es: {
      name: 'Tortilla Fit de Claras con Pavo y Espinacas Baby',
      description: 'Ultra baja en calorías y grasas, ideal para definición muscular y saciedad prolongada durante toda la mañana.',
      ingredients: [
        '150ml de claras de huevo (aprox. 4 claras)',
        '1 huevo entero para nutrientes esenciales',
        '60g de pechuga de pavo baja en sal en cubitos',
        '50g de espinacas baby frescas',
        'Pizca de sal, pimienta y spray de aceite de oliva',
      ],
      instructions: [
        'En una sartén antiadherente con spray de aceite, saltea las espinacas 1 minuto hasta que reduzcan.',
        'Agrega los cubos de pavo y remueve 30 segundos.',
        'Bate las claras con el huevo entero, sal y pimienta, y viértelos sobre la sartén.',
        'Cocina a fuego medio tapado 3 minutos, dobla por la mitad y sirve caliente.',
      ],
    },
    en: {
      name: 'Egg White Omelet with Turkey Breast & Baby Spinach',
      description: 'High volume, ultra lean morning fuel packed with bioavailable protein and essential micronutrients.',
      ingredients: [
        '150ml liquid egg whites',
        '1 whole egg for healthy fats and choline',
        '60g low-sodium turkey breast diced',
        '50g fresh baby spinach',
        'Pinch of salt, black pepper, and olive oil spray',
      ],
      instructions: [
        'Sauté baby spinach in a non-stick skillet with light oil spray for 1 minute.',
        'Add diced turkey breast and stir for 30 seconds.',
        'Whisk egg whites with the whole egg, salt, and pepper, then pour into the pan.',
        'Cook on medium heat covered for 3 minutes, fold in half, and enjoy.',
      ],
    },
    calories: 230,
    protein: 34,
    carbs: 3,
    fat: 7,
    prepTime: 10,
    goal: 'lose',
    tags: ['highProtein', 'ketoLowCarb', 'quick15', 'oatsBreakfast', 'desayuno', 'huevos', 'definicion'],
  },

  // ─── KETO & LOW CARB ────────────────────────────────────────────────────────
  {
    id: 'curated_salmon_esparragos_limon',
    es: {
      name: 'Lomo de Salmón al Horno con Espárragos Verdes y Limón',
      description: 'Grasas saludables Omega-3 antiinflamatorias y proteína de alta calidad para salud hormonal y muscular.',
      ingredients: [
        '170g de lomo de salmón fresco',
        '150g de espárragos verdes frescos',
        '1 cdta (5ml) de aceite de oliva virgen extra',
        'Medio limón en rodajas',
        'Eneldo fresco, sal en escamas y pimienta negra',
      ],
      instructions: [
        'Precalienta el horno a 200°C o prepara tu freidora de aire a 190°C.',
        'Corta la parte dura de los espárragos y colócalos en la bandeja con el salmón.',
        'Rocía con el aceite de oliva, exprime unas gotas de limón y añade eneldo, sal y pimienta.',
        'Hornea durante 12-14 minutos hasta que el salmón esté tierno por dentro y los espárragos crujientes.',
      ],
    },
    en: {
      name: 'Pan-Roasted Salmon Fillet with Asparagus & Lemon Herb',
      description: 'Anti-inflammatory Omega-3 fatty acids and clean marine protein for hormonal balance and lean muscle.',
      ingredients: [
        '170g fresh salmon fillet',
        '150g green asparagus spears trimmed',
        '1 tsp (5ml) extra virgin olive oil',
        'Half a lemon sliced',
        'Dill, sea salt flakes, and cracked black pepper',
      ],
      instructions: [
        'Preheat oven or air fryer to 195°C / 380°F.',
        'Arrange trimmed asparagus and salmon fillet on baking parchment.',
        'Drizzle with olive oil, lemon slices, fresh dill, salt, and pepper.',
        'Roast for 12-14 minutes until salmon flakes easily with a fork.',
      ],
    },
    calories: 410,
    protein: 37,
    carbs: 5,
    fat: 26,
    prepTime: 18,
    goal: 'maintain',
    tags: ['ketoLowCarb', 'fishSalmon', 'salmon', 'pescado', 'cenasLigeras', 'keto', 'cena'],
  },

  {
    id: 'curated_aguacate_relleno_atun',
    es: {
      name: 'Aguacate Relleno de Ensalada de Atún y Huevo Duro',
      description: 'Receta sin cocción rápida y rica en grasas buenas y proteína saciante. Perfecta para días ajetreados.',
      ingredients: [
        '1 aguacate mediano maduro cortado por la mitad',
        '1 lata (100g escurrida) de atún al natural',
        '1 huevo duro picado',
        '20g de cebolla morada picada fina',
        'Zumo de 1/2 lima o limón, cilantro fresco, sal y pimienta',
      ],
      instructions: [
        'Corta el aguacate por la mitad y retira el hueso.',
        'Extrae una cucharada de pulpa de cada mitad y colócala en un bol.',
        'Machaca la pulpa con el atún escurrido, el huevo duro picado, la cebolla morada, zumo de lima, sal y pimienta.',
        'Rellena los huecos del aguacate con la mezcla y espolvorea cilantro fresco.',
      ],
    },
    en: {
      name: 'Stuffed Avocado with Lemon Tuna & Boiled Egg',
      description: 'Zero-cook, nutrient-dense keto meal rich in monounsaturated fats and satisfying protein.',
      ingredients: [
        '1 ripe medium avocado halved',
        '1 can (100g drained) tuna in water',
        '1 hard-boiled egg chopped',
        '20g finely diced red onion',
        'Juice of 1/2 lime, fresh cilantro, salt, and pepper',
      ],
      instructions: [
        'Halve the avocado and remove the pit.',
        'Scoop out a small spoonful of avocado flesh into a mixing bowl.',
        'Mash with drained tuna, chopped hard-boiled egg, red onion, lime juice, salt, and pepper.',
        'Spoon the filling back into avocado shells and garnish with fresh cilantro.',
      ],
    },
    calories: 395,
    protein: 34,
    carbs: 6,
    fat: 25,
    prepTime: 8,
    goal: 'lose',
    tags: ['ketoLowCarb', 'quick15', 'fishSalmon', 'atun', 'aguacate', 'snack', 'cenasLigeras'],
  },

  // ─── CENAS LIGERAS & DEFINICIÓN ─────────────────────────────────────────────
  {
    id: 'curated_ensalada_mediterranea_pollo',
    es: {
      name: 'Ensalada Mediterránea con Pollo a la Plancha y Feta Light',
      description: 'Cena refrescante y saciante con proteína magra, antioxidantes vegetales y aderezo cítrico ligero.',
      ingredients: [
        '150g de pechuga de pollo a la plancha',
        '100g de mezcla de lechugas y rúcula',
        '80g de tomates cherry cortados por la mitad',
        '50g de pepino en rodajas',
        '30g de queso feta light desmenuzado',
        '1 cdta (5ml) de aceite de oliva virgen extra y vinagre de manzana',
      ],
      instructions: [
        'Cocina la pechuga de pollo a la plancha con sal y orégano, luego córtala en dados.',
        'En un bol grande, combina las hojas verdes, tomates cherry y pepino.',
        'Coloca el pollo templado por encima.',
        'Desmenuza el queso feta y aliña con el aceite de oliva, vinagre y una pizca de sal.',
      ],
    },
    en: {
      name: 'Mediterranean Grilled Chicken Salad with Light Feta',
      description: 'Crisp, refreshing, high-protein cutting dinner loaded with antioxidants and zesty vinaigrette.',
      ingredients: [
        '150g grilled chicken breast',
        '100g mixed greens and fresh arugula',
        '80g cherry tomatoes halved',
        '50g sliced cucumber',
        '30g light crumbled feta cheese',
        '1 tsp (5ml) extra virgin olive oil and apple cider vinegar',
      ],
      instructions: [
        'Grill chicken breast seasoned with oregano and salt, then slice into bite-sized strips.',
        'In a large salad bowl, toss greens, halved tomatoes, and crisp cucumber.',
        'Top with warm sliced chicken and crumbled feta.',
        'Drizzle with olive oil, vinegar, and a pinch of sea salt.',
      ],
    },
    calories: 320,
    protein: 42,
    carbs: 9,
    fat: 11,
    prepTime: 12,
    goal: 'lose',
    tags: ['lightDinners', 'highProtein', 'quick15', 'ensalada', 'cena', 'salad', 'dinner'],
  },

  {
    id: 'curated_merluza_wok_verduras',
    es: {
      name: 'Filete de Merluza con Wok de Pimientos y Calabacín',
      description: 'Pescado blanco magro de fácil digestión para una noche reparadora sin sensación de pesadez.',
      ingredients: [
        '200g de lomo de merluza o bacalao fresco',
        '100g de calabacín en bastones',
        '100g de pimientos rojo y verde en tiras',
        '1 cdta (5ml) de aceite de oliva virgen extra',
        'Ajo picado, perejil fresco, zumo de limón y sal',
      ],
      instructions: [
        'En un wok o sartén amplia con media cucharadita de aceite, saltea las verduras a fuego vivo durante 6 minutos.',
        'En otra sartén antiadherente, cocina el lomo de merluza 3 minutos por lado con ajo y perejil.',
        'Sirve la merluza sobre el lecho de verduras crujientes y exprime zumo de limón por encima.',
      ],
    },
    en: {
      name: 'White Fish Fillet with Stir-Fried Peppers & Zucchini',
      description: 'Ultra lean white fish for optimal overnight recovery without heavy digestion.',
      ingredients: [
        '200g cod or hake fillet',
        '100g zucchini cut into matchsticks',
        '100g red and green bell peppers sliced',
        '1 tsp (5ml) olive oil',
        'Minced garlic, fresh parsley, lemon juice, and salt',
      ],
      instructions: [
        'Stir-fry zucchini and peppers in a wok with half the oil for 6 minutes until tender-crisp.',
        'Pan-sear fish fillet in a non-stick pan for 3 minutes per side with garlic and parsley.',
        'Serve fish over the colorful vegetables with a fresh squeeze of lemon.',
      ],
    },
    calories: 260,
    protein: 38,
    carbs: 10,
    fat: 5,
    prepTime: 15,
    goal: 'lose',
    tags: ['lightDinners', 'fishSalmon', 'quick15', 'pescado', 'cena', 'cenasLigeras'],
  },

  // ─── POSTRES FIT & SNACKS PROTEICOS ──────────────────────────────────────────
  {
    id: 'curated_tortitas_avena_platano',
    es: {
      name: 'Tortitas Proteicas de Avena, Plátano y Claras',
      description: 'Esponjosas y deliciosas sin azúcares añadidos ni harinas refinadas. Perfectas para desayunos o meriendas.',
      ingredients: [
        '50g de harina de avena integral',
        '1 plátano maduro pequeño (80g)',
        '120ml de claras de huevo',
        '1 scoop (25g) de proteína en polvo (opcional)',
        '1 cdta de canela y 1/2 cdta de levadura en polvo',
      ],
      instructions: [
        'Tritura en batidora la avena, el plátano, las claras, la proteína y la canela hasta obtener una masa homogénea.',
        'Calienta una sartén antiadherente a fuego medio con una gota de aceite.',
        'Vierte porciones de masa y cocina 2 minutos hasta que salgan burbujas, voltea y dora 1 minuto más.',
        'Sirve apiladas con rodajas de fruta fresca o miel baja en calorías.',
      ],
    },
    en: {
      name: 'Fluffy Banana Protein Oat Pancakes',
      description: 'Fluffy golden pancakes without refined sugar or flour. High protein snack or weekend breakfast.',
      ingredients: [
        '50g oat flour',
        '1 small ripe banana (80g)',
        '120ml liquid egg whites',
        '1 scoop (25g) vanilla protein powder (optional)',
        '1 tsp cinnamon and 1/2 tsp baking powder',
      ],
      instructions: [
        'Blend oats, banana, egg whites, protein powder, and cinnamon until smooth.',
        'Heat a non-stick skillet over medium heat with light spray.',
        'Pour batter rounds and cook 2 minutes until bubbles appear, flip, and cook 1 more minute.',
        'Stack and enjoy with fresh fruit or low-calorie syrup.',
      ],
    },
    calories: 340,
    protein: 32,
    carbs: 45,
    fat: 4,
    prepTime: 12,
    goal: 'gain',
    tags: ['fitDesserts', 'oatsBreakfast', 'postre', 'pancakes', 'avena', 'platano', 'desayuno'],
  },

  {
    id: 'curated_yogur_griego_nueces_miel',
    es: {
      name: 'Copa de Yogur Griego 0% con Frutos Secos y Semillas',
      description: 'Snack proteico rápido rico en caseína de digestión lenta y calcio para mantener el anabolismo.',
      ingredients: [
        '200g de yogur griego 0% natural o skyr',
        '20g de nueces o almendras crudas picadas',
        '1 cdta (7g) de semillas de chía o lino',
        '50g de frambuesas o frutos rojos',
        'Unas gotas de extracto de vainilla o stevia',
      ],
      instructions: [
        'Vierte el yogur griego en un bol o copa amplia.',
        'Mezcla con unas gotas de vainilla o edulcorante al gusto.',
        'Cubre con las nueces picadas, semillas y frutos rojos frescos.',
      ],
    },
    en: {
      name: 'Greek Yogurt Crunch Bowl with Raw Walnuts & Berries',
      description: 'High-protein slow-release casein snack rich in probiotics, healthy fats, and antioxidants.',
      ingredients: [
        '200g plain 0% Greek yogurt or Skyr',
        '20g raw walnuts or almonds chopped',
        '1 tsp (7g) chia or flax seeds',
        '50g fresh raspberries or berries',
        'Dash of vanilla extract or stevia',
      ],
      instructions: [
        'Spoon Greek yogurt into a dessert bowl or glass.',
        'Stir in a drop of vanilla extract or preferred sweetener.',
        'Top with chopped nuts, chia seeds, and sweet berries.',
      ],
    },
    calories: 275,
    protein: 26,
    carbs: 14,
    fat: 12,
    prepTime: 5,
    goal: 'maintain',
    tags: ['healthySnacks', 'fitDesserts', 'quick15', 'yogur', 'snack', 'postre'],
  },

  {
    id: 'curated_fajitas_pollo_pimientos',
    es: {
      name: 'Fajitas Proteicas de Pollo y Pimientos en Tortilla Integral',
      description: 'Sabor mexicano saludable con pechuga sazonada, pimientos asados y tortilla de trigo integral.',
      ingredients: [
        '160g de pechuga de pollo cortada en tiras',
        '2 tortillas de trigo integral medianas',
        '80g de pimientos rojo y verde en juliana',
        '40g de cebolla en tiras',
        '1 cdta de mezcla de especias para fajitas (comino, pimentón, ajo)',
        '1 cdta de aceite de oliva',
      ],
      instructions: [
        'Saltea el pollo con el aceite en una sartén a fuego alto 3 minutos.',
        'Añade la cebolla, los pimientos y las especias mexicanas.',
        'Cocina salteando 4-5 minutos hasta que la verdura esté tierna y el pollo cocido.',
        'Calienta las tortillas 20 segundos y rellena con la mezcla caliente.',
      ],
    },
    en: {
      name: 'Spiced Chicken Fajitas in Whole Wheat Wraps',
      description: 'Flavor-packed Mexican style chicken strips with sautéed peppers in whole grain soft tortillas.',
      ingredients: [
        '160g chicken breast strips',
        '2 whole wheat medium tortillas',
        '80g bell peppers sliced',
        '40g yellow onion sliced',
        '1 tsp fajita spice blend (cumin, paprika, garlic)',
        '1 tsp olive oil',
      ],
      instructions: [
        'Sauté chicken strips in olive oil over high heat for 3 minutes.',
        'Add sliced onions, peppers, and fajita seasoning.',
        'Cook 4-5 minutes until peppers are soft and chicken is cooked through.',
        'Warm tortillas for 20 seconds and fill with the sizzling mixture.',
      ],
    },
    calories: 440,
    protein: 44,
    carbs: 42,
    fat: 9,
    prepTime: 15,
    goal: 'maintain',
    tags: ['highProtein', 'quick15', 'chicken', 'pollo', 'almuerzo', 'fajitas'],
  },

  {
    id: 'curated_burrito_bowl_arroz_frijoles',
    es: {
      name: 'Burrito Bowl Fit con Ternera, Frijoles Negros y Arroz',
      description: 'Energía densa en nutrientes para fase de volumen o atletas con alto gasto calórico diario.',
      ingredients: [
        '150g de carne picada de ternera magra (5% grasa)',
        '70g de arroz basmati o integral en seco',
        '80g de frijoles negros cocidos',
        '40g de maíz dulce',
        '30g de aguacate en dados',
        'Pico de gallo (tomate, cebolla y lima) al gusto',
      ],
      instructions: [
        'Cocina el arroz en agua con sal hasta que esté tierno.',
        'En una sartén, dora la carne picada sazonada con comino, ajo y pimentón durante 5 minutos.',
        'En un bol amplio, coloca el arroz de base.',
        'Agrega en secciones la ternera, los frijoles negros escurridos, el maíz dulce y el aguacate.',
        'Corona con una cucharada de pico de gallo y lima fresca.',
      ],
    },
    en: {
      name: 'Lean Beef Burrito Bowl with Black Beans & Jasmine Rice',
      description: 'Nutrient-dense power bowl for muscle building and high-energy workout recovery.',
      ingredients: [
        '150g lean ground beef (5% fat)',
        '70g dry jasmine or brown rice',
        '80g cooked black beans rinsed',
        '40g sweet corn',
        '30g avocado diced',
        'Fresh salsa or pico de gallo to taste',
      ],
      instructions: [
        'Cook rice until fluffy and tender.',
        'Brown the lean ground beef with cumin, garlic powder, and paprika for 5 minutes.',
        'Assemble the bowl with warm rice base.',
        'Arrange beef, black beans, corn, and avocado in distinct sections.',
        'Top with fresh salsa and a lime wedge.',
      ],
    },
    calories: 560,
    protein: 48,
    carbs: 62,
    fat: 14,
    prepTime: 20,
    goal: 'gain',
    tags: ['meatRice', 'highProtein', 'carne', 'arroz', 'volumen', 'almuerzo'],
  }
];

/**
 * Returns localized curated recipes matching query, goal, and language.
 */
export function getCuratedRecipes(
  query?: string,
  userGoal: string = 'maintain',
  language: string = 'es'
): Recipe[] {
  const langKey = language?.toLowerCase().startsWith('es') ? 'es' : 'en';
  const cleanQuery = (query || '').trim().toLowerCase();

  // Map definitions to Recipe type
  const allMapped: Recipe[] = CURATED_RECIPES.map((def) => {
    const loc = def[langKey] || def.es;
    return {
      id: def.id,
      name: loc.name,
      description: loc.description,
      calories: def.calories,
      protein: def.protein,
      carbs: def.carbs,
      fat: def.fat,
      ingredients: loc.ingredients,
      instructions: loc.instructions,
      prepTime: def.prepTime,
      goal: def.goal,
      isFavorite: false,
    };
  });

  if (!cleanQuery) {
    // If no query, prioritize user's goal first, then rest
    const matchingGoal = allMapped.filter(r => r.goal === userGoal);
    const otherGoals = allMapped.filter(r => r.goal !== userGoal);
    return [...matchingGoal, ...otherGoals];
  }

  // Check suggestion aliases
  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

  const scored = allMapped.map((recipe, index) => {
    const def = CURATED_RECIPES[index];
    let score = 0;

    for (const token of queryTokens) {
      if (token === 'receta' || token === 'recetas' || token === 'saludable') continue;
      
      if (recipe.name.toLowerCase().includes(token)) score += 10;
      if (recipe.description.toLowerCase().includes(token)) score += 5;
      if (recipe.ingredients.some(ing => ing.toLowerCase().includes(token))) score += 7;
      if (def.tags.some(tag => tag.toLowerCase().includes(token))) score += 8;

      // Special tags
      if ((token.includes('prote') || token.includes('protein')) && recipe.protein >= 35) score += 6;
      if ((token.includes('keto') || token.includes('carb')) && recipe.carbs <= 10) score += 8;
      if ((token.includes('rapida') || token.includes('15')) && recipe.prepTime <= 15) score += 6;
      if ((token.includes('cena') || token.includes('ligera')) && recipe.calories <= 380) score += 6;
      if ((token.includes('postre') || token.includes('snack')) && def.tags.includes('fitDesserts')) score += 8;
    }

    // Small bonus for user's goal
    if (recipe.goal === userGoal) score += 1;

    return { recipe, score };
  });

  const matches = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.recipe);

  // If no specific match, return all recipes with goal prioritized
  if (matches.length === 0) {
    return allMapped;
  }

  return matches;
}
