/**
 * Array de ciudades principales de Ecuador para sugerencias
 * Optimizado para búsqueda rápida sin consumo de Firebase
 */

const ciudadesEcuador = [
  // Provincia de Pichincha
  "Quito", "Cayambe", "Otavalo", "Sangolquí", "Rumiñahui",
  "Mejía", "Pedro Moncayo", "Pedro Vicente Maldonado", "Puerto Quito",
  
  // Provincia de Guayas
  "Guayaquil", "Samborondón", "Daule", "Durán", "Yaguachi",
  "Naranjal", "Naranjito", "El Triunfo", "Marcelino Maridueña",
  "Simón Bolívar", "Milagro", "General Villamil Playas",
  
  // Provincia de Azuay
  "Cuenca", "Gualaceo", "Paute", "Sígsig", "Oña",
  "El Pan", "Sevilla de Oro", "Guachapala", "Camilo Ponce Enríquez",
  "Chordeleg", "Girón", "Santa Isabel", "Pucará", "San Fernando",
  
  // Provincia de Manabí
  "Portoviejo", "Manta", "Jipijapa", "Montecristi", "Chone",
  "Calceta", "Paján", "Olmedo", "Rocafuerte", "Sucre",
  "24 de Mayo", "Pedernales", "Puerto López", "Jama",
  "San Vicente", "Santa Ana", "Flavio Alfaro", "Bolívar",
  "Tosagua", "Junín", "Pichincha", "Puerto Cayo",
  
  // Provincia de El Oro
  "Machala", "Pasaje", "Santa Rosa", "Huaquillas", "Arenillas",
  "Atahualpa", "Balsas", "Chilla", "El Guabo", "Las Lajas",
  "Marcabelí", "Piñas", "Portovelo", "Zaruma",
  
  // Provincia de Tungurahua
  "Ambato", "Baños de Agua Santa", "Cevallos", "Mocha", "Patate",
  "Pelileo", "Píllaro", "Quero", "San Pedro de Pelileo", "Tisaleo",
  
  // Provincia de Chimborazo
  "Riobamba", "Alausí", "Chambo", "Chunchi", "Colta",
  "Cumandá", "Guamote", "Guano", "Pallatanga", "Penipe",
  
  // Provincia de Imbabura
  "Ibarra", "Antonio Ante", "Cotacachi", "Otavalo", "Pimampiro",
  "San Miguel de Urcuquí",
  
  // Provincia de Loja
  "Loja", "Calvas", "Catamayo", "Celica", "Chaguarpamba",
  "Espíndola", "Gonzanamá", "Macará", "Olmedo", "Paltas",
  "Pindal", "Puyango", "Quilanga", "Saraguro", "Sozoranga",
  "Zapotillo",
  
  // Provincia de Esmeraldas
  "Esmeraldas", "Eloy Alfaro", "Muisne", "Quinindé", "San Lorenzo",
  "Atacames", "Rioverde", "La Concordia",
  
  // Provincia de Los Ríos
  "Babahoyo", "Baba", "Montalvo", "Puebloviejo", "Quevedo",
  "Urdaneta", "Valencia", "Ventanas", "Vinces", "Palenque",
  
  // Provincia de Bolívar
  "Guaranda", "Chillanes", "Chimbo", "Echeandía", "San Miguel",
  "Caluma", "Las Naves",
  
  // Provincia de Cañar
  "Azogues", "Biblián", "Cañar", "Déleg", "El Tambo",
  "La Troncal", "Suscal",
  
  // Provincia de Cotopaxi
  "Latacunga", "La Maná", "Pangua", "Pujilí", "Salcedo",
  "Saquisilí", "Sigchos", "Tisaleo",
  
  // Provincia de Santo Domingo de los Tsáchilas
  "Santo Domingo", "La Concordia",
  
  // Provincia de Santa Elena
  "Santa Elena", "La Libertad", "Salinas",
  
  // Provincia de Zamora Chinchipe
  "Zamora", "Centinela del Cóndor", "Chinchipe", "El Pangui",
  "Nangaritza", "Palanda", "Pucará", "Yacuambi", "Yantzaza",
  
  // Provincia de Morona Santiago
  "Macas", "Gualaquiza", "Huamboya", "Limón Indanza", "Logroño",
  "Morona", "Pablo Sexto", "Palora", "San Juan Bosco", "Santiago",
  "Sucúa", "Taisha", "Tiwintza",
  
  // Provincia de Napo
  "Tena", "Archidona", "El Chaco", "Quijos", "Carlos Julio Arosemena Tola",
  
  // Provincia de Orellana
  "Puerto Francisco de Orellana", "Aguarico", "La Joya de los Sachas",
  "Loreto", "Nueva Loja",
  
  // Provincia de Pastaza
  "Puyo", "Arajuno", "Mera", "Santa Clara",
  
  // Provincia de Sucumbíos
  "Nueva Loja", "Cascales", "Cuyabeno", "Gonzalo Pizarro",
  "Lago Agrio", "Putumayo", "Shushufindi", "Sucumbíos",
  
  // Provincia de Galápagos
  "Puerto Baquerizo Moreno", "Puerto Ayora", "Puerto Villamil",
  
  // Otras ciudades importantes
  "Bahía de Caráquez", "Mocache", "Buena Fe", "El Empalme",
  "Balzar", "Colimes", "Palestina", "Santa Lucía", "Pedro Carbo",
  "Lomas de Sargentillo", "Nobol", "General Villamil Playas"
];

/**
 * Función para obtener sugerencias de ciudades basadas en una consulta
 * @param {string} query - Texto de búsqueda
 * @returns {Array} - Array de ciudades que coinciden con la consulta (máximo 10)
 */
export const obtenerSugerenciasCiudades = (query) => {
  if (!query || query.length < 2) return [];
  
  const lowerCaseQuery = query.toLowerCase().trim();
  
  // Filtrar ciudades que contengan la consulta
  const sugerencias = ciudadesEcuador.filter(ciudad =>
    ciudad.toLowerCase().includes(lowerCaseQuery)
  );
  
  // Ordenar por relevancia (coincidencias al inicio)
  sugerencias.sort((a, b) => {
    const aIndex = a.toLowerCase().indexOf(lowerCaseQuery);
    const bIndex = b.toLowerCase().indexOf(lowerCaseQuery);
    
    if (aIndex === 0 && bIndex !== 0) return -1;
    if (bIndex === 0 && aIndex !== 0) return 1;
    return aIndex - bIndex;
  });
  
  // Limitar a 10 sugerencias
  return sugerencias.slice(0, 10);
};

/**
 * Función para verificar si una ciudad existe en la lista
 * @param {string} ciudad - Nombre de la ciudad a verificar
 * @returns {boolean} - True si la ciudad existe
 */
export const verificarCiudadExiste = (ciudad) => {
  return ciudadesEcuador.some(c => 
    c.toLowerCase() === ciudad.toLowerCase()
  );
};

export default ciudadesEcuador;
