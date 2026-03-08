import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCeJb3Hl4zlq7ZlZA8jQhdS9xUTJAf2STI",
  authDomain: "allison-venta.firebaseapp.com",
  projectId: "allison-venta",
  storageBucket: "allison-venta.firebasestorage.app",
  messagingSenderId: "1041023333784",
  appId: "1:1041023333784:web:4f131f150abb68d5c6e7ed",
  measurementId: "G-83JD8H7P87"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const allProducts = [
  // LOCAL PRODUCTS FROM HOGAR
  { title: 'Sillón de 3 cuerpos Barra Design Sofá Alma Beige', description: 'Sofá de 3 cuerpos modelo Alma con diseño moderno y cómodo, perfecto para tu hogar.', price: 300000, imageUrl: 'images/hogar/Sillon-de-3-cuerpos-Barra-Design-Sofa-Alma-Beige.jpg', category: 'hogar' },
  { title: 'Xiaomi Robot Vacuum X20 Blanco', description: 'Robot aspiradora Xiaomi X20, limpieza inteligente y potente para todo tipo de suelos.', price: 280000, imageUrl: 'images/hogar/xiaomi_robot_vacuum_x20_blanco.jpg', category: 'hogar' },
  { title: 'Escritorio IKEA MALM + Silla Home Collection', description: 'Set de escritorio MALM de IKEA en color blanco con silla ergonómica de oficina.', price: 85000, imageUrl: 'images/hogar/escritorio_ikea_malm_silla_home_collection_office.jpg', category: 'hogar' },
  { title: 'Philips Hue Lámpara de pie inteligente Signe RGB', description: 'Lámpara de pie inteligente con tecnología RGB, crea ambientes únicos con millones de colores.', price: 150000, imageUrl: 'images/hogar/philips_hue_lampara_signe.jpg', category: 'hogar' },
  { title: 'Philips Hue Light strip Plus 2 metros', description: 'Tira LED inteligente multicolor de 2 metros, ideal para iluminación indirecta.', price: 60000, imageUrl: 'images/hogar/philips_hue_lightstrip.jpg', category: 'hogar' },
  { title: 'Cama de 2 plazas CIC PREMIUM + base europea', description: 'Cama de 2 plazas de la línea Premium de CIC, incluye base europea para mayor soporte.', price: 325000, imageUrl: 'images/hogar/Cama-de-2-plazas-CIC-PREMIUM-base-europea.jpg', category: 'hogar' },
  { title: 'Juego de Sábanas Rosen 100% algodón - 300 hilos', description: 'Sábanas Rosen de 2 plazas, suavidad y frescura garantizada con 300 hilos de algodón.', price: 35000, imageUrl: 'images/hogar/juego_sabanas_rosen_100_algodon.jpg', category: 'hogar' },
  { title: 'Plumón Down Alternative Fabrics 2 plazas', description: 'Plumón de 200 hilos 100% algodón, abrigador y de tacto suave.', price: 45000, imageUrl: 'images/hogar/plumon_down_alternative_fabrics_200_hilos_100_algodon_2_plazas.jpg', category: 'hogar' },
  { title: 'Funda de Plumón Rosen + 2 Fundas de Almohada', description: 'Set de funda para plumón Rosen en excelente estado, diseño elegante.', price: 25000, imageUrl: 'images/hogar/funda_de_plumon_rosen_2_fundas_de_almohada.jpg', category: 'hogar' },
  { title: 'Cubrecama Quilt Alessa Fabrics 2 plazas', description: 'Cubrecama Quilt de algodón, ideal para media estación.', price: 30000, imageUrl: 'images/hogar/cubrecama_quilt_alessa_fabrics_100_algodon_2_plazas.jpg', category: 'hogar' },
  { title: 'Silla Colgante', description: 'Silla colgante tejida, perfecta para balcones o terrazas con estilo.', price: 40000, imageUrl: 'images/hogar/silla_colgante.jpg', category: 'hogar' },
  { title: 'Velador Bazar de la Fortuna', description: 'Velador con diseño vintage único, pieza decorativa y funcional.', price: 25000, imageUrl: 'images/hogar/velador_bazar_de_la_fortuna.jpg', category: 'hogar' },
  { title: '2 Tendederos de ropa plegables + Tabla de planchar', description: 'Kit práctico para el cuidado de tu ropa, incluye dos tendederos y tabla.', price: 20000, imageUrl: 'images/hogar/2_tendederos_de_ropa_plegable_tabla_de_planchar_ganchos_para_colgar_plegables.jpg', category: 'hogar' },
  { title: 'Carrito y Bolsa Rullebor IKEA', description: 'Carrito de transporte mediano con bolsa Frakta de IKEA, muy resistente.', price: 15000, imageUrl: 'images/hogar/carrito_y_bolsa_rullebor_frakta_carrito_mediano_generico.jpg', category: 'hogar' },
  { title: 'Set Vajilla de Porcelana', description: 'Elegante set de vajilla de porcelana para ocasiones especiales o uso diario.', price: 40000, imageUrl: 'images/hogar/set_vajilla_porcelana.jpg', category: 'hogar' },
  { title: 'Kit de Yoga y Pilates', description: 'Kit completo para tus rutinas de ejercicio en casa.', price: 15000, imageUrl: 'images/hogar/kit_de_yoga_y_pilates.jpg', category: 'hogar' },
  { title: 'Zafu Tienda Shiva', description: 'Cojín de meditación Zafu, cómodo y de excelente calidad.', price: 12000, imageUrl: 'images/hogar/zafu_tienda_shiva.jpg', category: 'hogar' },
  { title: 'Placa Mural Decorativa', description: 'Pieza de arte mural decorativa para darle personalidad a tus paredes.', price: 10000, imageUrl: 'images/hogar/placa_mural_decorativa.jpg', category: 'hogar' },
  { title: 'Mesa de centro Kallfu Circular metal black', description: 'Moderna mesa de centro circular metálica de color negro, ideal para salas de estar.', price: 75000, imageUrl: 'images/hogar/Mesa-de-centro-Kallfu-Circular-metal-black.jpg', category: 'hogar' },
  { title: 'Alfombra Bergen Blanc 0,8 x 0,4', description: 'Alfombra Bergen Blanc de diseño elegante y material de alta calidad.', price: 65000, imageUrl: 'images/hogar/Alfombra-Bergen-Blanc-0,8-x-0,4.jpg', category: 'hogar' },
  { title: 'Alfombra sala BABIL Collection dorado 160x230 cm', description: 'Alfombra para sala con diseño refinado de la colección BABIL en color dorado.', price: 40000, imageUrl: 'images/hogar/Alfombra-sala-BABIL-Collection-dorado-160x230-cm.jpg', category: 'hogar' },
  { title: 'Microondas Miidea 20 litros MMP-20GC3D', description: 'Microondas Miidea de 20 litros, eficiente y con múltiples funciones de cocción.', price: 40000, imageUrl: 'images/hogar/Microondas-Miidea-20-litros-MMP-20GC3D.jpg', category: 'hogar' },
  { title: 'Estante Mueble organizador de baño CIC Sodimac', description: 'Mueble organizador para baño con repisas, ideal para mantener el orden.', price: 40000, imageUrl: 'images/hogar/Estante-Mueble-organizador-de-baño-CIC-Sodimac.jpg', category: 'hogar' },
  { title: 'Funda sillón 3 cuerpos - euro fundas italianas beige', description: 'Elegante funda de diseño italiano en color beige para sillones de 3 cuerpos.', price: 150000, imageUrl: 'images/hogar/Funda-sillon-3-cuerpos-euro-fundas-italianas-beige.jpg', category: 'hogar' },
  { title: 'Seca platos - acero inoxidable', description: 'Práctico seca platos de acero inoxidable, resistente y fácil de limpiar.', price: 10000, imageUrl: 'images/hogar/seca_platos_acero_inoxidable.jpg', category: 'hogar' },
  { title: 'Lámpara de mesa IKEA ASKMULLER', description: 'Lámpara de mesa con diseño moderno y funcional de la marca IKEA.', price: 15000, imageUrl: 'images/hogar/Lámpara-de-mesa-IKEA-ASKMULLER.jpg', category: 'hogar' },
  { title: 'Set de baño: Portarollos Krokfjorden IKEA + Escobilla + basurero', description: 'Set completo de baño que incluye portarollos Krokfjorden, escobilla y basurero metálico.', price: 17000, imageUrl: 'images/hogar/Set-de-baño-Portarollos-Krokfjorden-IKEA-Escobilla-basurero-metalico-con-pedal.jpg', category: 'hogar' },
  { title: 'Recipientes y copas', description: 'Recipientes cuadrados de vidrio con tapas de madera y copas de vidrio altas y elegantes.', price: 10000, imageUrl: 'images/hogar/Recipientes-y-copas.jpg', category: 'hogar' },
  { title: 'Set de 12 vasos - mainstays glass tumblers', description: 'Caja con un set de 12 vasos de vidrio Mainstays, aptos para lavavajillas.', price: 10000, imageUrl: 'images/hogar/Set-de-12-vasos-mainstays-glass-tumblers.jpg', category: 'hogar' },
  { title: 'Tazas y filtrantes Adagio Teas', description: 'Taza de vidrio doble pared y filtrante con detalles dorados de la marca Adagio Teas.', price: 10000, imageUrl: 'images/hogar/Tazas-y-filtrantes-Adagio-Teas.jpg', category: 'hogar' },
  { title: 'Brando Prime Tetera de vidrio', description: 'Tetera de vidrio marca Brando Prime, ideal para infusiones sueltas, con caja original.', price: 10000, imageUrl: 'images/hogar/Brando-Prime-Tetera-de-vidrio.jpg', category: 'hogar' },
  { title: 'Cafetera Prensa Francesa Oroley 3 tazas', description: 'Prensa francesa Oroley, capacidad para 3 tazas, en su caja original.', price: 5000, imageUrl: 'images/hogar/Cafetera-Prensa-Francesa-Oroley-3-tazas.jpg', category: 'hogar' },
  { title: 'Licuadora Thomas 1.5 litros TH 510 Vi', description: 'Licuadora Thomas con jarro de vidrio, motor potente, capacidad de 1.5 litros.', price: 30000, imageUrl: 'images/hogar/Licuadora-Thomas-1.5-litros-TH-510-Vi.jpg', category: 'hogar' },
  { title: 'Set de Fuentes de vidrio', description: 'Set de 2 fuentes de vidrio rectangular para hornear o servir.', price: 5000, imageUrl: 'images/hogar/Set-de-Fuentes-de-vidrio.jpg', category: 'hogar' },
  { title: 'TV Samsung QLED Q65C 43" + rack', description: 'Televisor Samsung QLED de 43 pulgadas en excelente estado, incluye soporte rack.', price: 270000, imageUrl: 'images/hogar/TV-Samsung-QLED-Q65C-43-rack.jpg', category: 'hogar' },
  { title: 'Olla a presión Thomas TH 40 PC', description: 'Olla a presión eléctrica multifuncional Thomas.', price: 30000, imageUrl: 'images/hogar/Olla-a-presión-Thomas-TH-40-PC.jpg', category: 'hogar' },
  { title: 'Set de cuchillos Brando y tabla de picar', description: 'Set que incluye cuchillos de la marca Brando junto con tabla para picar.', price: 20000, imageUrl: 'images/hogar/Set-de-cuchillos-Brando-y-tabla-de-picar-utensilios-de-cocina-y-cubiertos.jpg', category: 'hogar' },
  
  // LOCAL PRODUCTS FROM ROPA
  { title: 'Mammut Botas de Trekking Sapuen High GTX Women', description: 'Botas de alta calidad para trekking, color Dark Steel-Neo Mini, talla 38 (6.5 UK / 8 US). Impermeables y resistentes.', price: 190000, imageUrl: 'images/ropa/mammut-botas-de-trekking-sapuen-high-gtx-women-dark-steel-neo-mini-6-talla-38-6-5-uk-8-us-190000.jpg', category: 'ropa' },
  { title: 'Sandalia Bali Negra Talla 38 Marie The Brand', description: 'Elegantes sandalias Bali negras de la marca Marie The Brand en talla 38.', price: 70000, imageUrl: 'images/ropa/Sandalia-Bali-Negra-Talla-38-Marie-The-Brand-70000.jpg', category: 'ropa' },
  { title: 'Zapatos de vestir charol Gacel Talla 37', description: 'Zapatos de vestir de charol elegante de la marca Gacel en talla 37.', price: 45000, imageUrl: 'images/ropa/Zapatos-de-vestir-charol-Gacel-Talla-37-45000.jpg', category: 'ropa' },
  { title: 'Zapatos Athar - Cuero Talla 38', description: 'Zapatos Athar fabricados en cuero de alta calidad en talla 38.', price: 75000, imageUrl: 'images/ropa/Zapatos-Athar-Cuero-Talla-38-75000.jpg', category: 'ropa' },
  { title: 'Mocasin Nalca Negro Talla 37', description: 'Mocasines negros marca Nalca en talla 37, estilo y comodidad.', price: 75000, imageUrl: 'images/ropa/Mocasin-Nalca-Negro-Talla-37-75000.jpg', category: 'ropa' },
  { title: 'Sandalias Nalca Talla 37', description: 'Sandalias marca Nalca en talla 37, ideales para toda ocasión.', price: 55000, imageUrl: 'images/ropa/Sandalias-Nalca-Talla-37-55000.jpg', category: 'ropa' },

  // LOCAL PRODUCTS FROM LICORES
  { title: 'Pack de Licores & Vinos Premium', description: 'Adobe Reserva Carmenere 2023 (Emiliana)\nLa Musa Rosato Aperitivo (750cc)\nEspumante Undurraga Brut (750cc)\nQueulat Gran Reserva Merlot Ventisquero (750cc)\nAperol Aperitivo (750cc)\nNovas Gran Reserva Carmenere (Emiliana)\nPisco Tres Erres Transparente 40° (750cc)\nPisco Aviador de Uvas Escogidas 36° (750cc)\nPisco Alto del Carmen Reservado Transparente 40° (750cc)', price: 80000, imageUrl: 'images/licores/licores.png', category: 'licores' }
];

async function runMigration() {
  console.log('Starting migration...');
  const publicDir = path.join(process.cwd(), 'public');

  for (const product of allProducts) {
    console.log(`Processing: ${product.title}`);
    try {
      const imagePath = path.join(publicDir, product.imageUrl);
      let storagePathUrl = '';
      let storagePath = '';
      
      if (fs.existsSync(imagePath)) {
        console.log(`  Uploading image...`);
        const fileData = fs.readFileSync(imagePath);
        const uint8Array = new Uint8Array(fileData.buffer, fileData.byteOffset, fileData.byteLength);
        
        const fileName = path.basename(imagePath);
        storagePath = `product-images/${product.category}/${Date.now()}_${fileName}`;
        
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, uint8Array, {
            contentType: 'image/jpeg'
        });
        
        storagePathUrl = await getDownloadURL(storageRef);
      } else {
        console.warn(`  Warning: Image not found at ${imagePath}`);
      }

      console.log(`  Saving to Firestore...`);
      await addDoc(collection(db, 'products'), {
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: storagePathUrl || product.imageUrl,
        storagePath: storagePath
      });
      console.log(`  Success! -> ${product.title}`);
    } catch (err) {
      console.error(`  Error processing ${product.title}:`, err);
    }
  }

  console.log('Migration finished successfully!');
  process.exit(0);
}

runMigration();
