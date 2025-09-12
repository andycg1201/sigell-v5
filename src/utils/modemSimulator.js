/**
 * Simulador de llamadas del modem para pruebas
 * Genera archivos XML de prueba para simular llamadas entrantes
 */

class ModemSimulator {
  constructor() {
    this.xmlPath = 'C:\\Users\\Andres\\AppData\\Local\\Temp\\output.xml';
    this.testNumbers = [
      '+573001234567',
      '+573007654321',
      '+573009876543',
      '+573005555555',
      '+573001111111'
    ];
  }

  /**
   * Simular una llamada entrante
   */
  async simulateIncomingCall(phoneNumber = null) {
    const number = phoneNumber || this.getRandomTestNumber();
    const timestamp = new Date().toISOString();
    
    const xmlContent = this.generateXMLContent(number, timestamp);
    
    try {
      // Crear el archivo XML simulado
      await this.createXMLFile(xmlContent);
      console.log(`ModemSimulator: Llamada simulada para ${number}`);
      return { phoneNumber: number, timestamp, xmlContent };
    } catch (error) {
      console.error('ModemSimulator: Error simulando llamada:', error);
      throw error;
    }
  }

  /**
   * Generar contenido XML para la llamada
   */
  generateXMLContent(phoneNumber, timestamp) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<call>
  <phone>${phoneNumber}</phone>
  <timestamp>${timestamp}</timestamp>
  <name></name>
  <type>incoming</type>
  <status>ringing</status>
</call>`;
  }

  /**
   * Crear archivo XML
   */
  async createXMLFile(content) {
    try {
      // En un entorno real, esto se haría con Node.js fs
      // Para el navegador, simulamos creando un blob y descargándolo
      const blob = new Blob([content], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      // Crear un enlace temporal para descargar
      const a = document.createElement('a');
      a.href = url;
      a.download = 'output.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('ModemSimulator: Archivo XML creado');
    } catch (error) {
      console.error('ModemSimulator: Error creando archivo XML:', error);
      throw error;
    }
  }

  /**
   * Obtener número de prueba aleatorio
   */
  getRandomTestNumber() {
    const randomIndex = Math.floor(Math.random() * this.testNumbers.length);
    return this.testNumbers[randomIndex];
  }

  /**
   * Simular múltiples llamadas
   */
  async simulateMultipleCalls(count = 3, interval = 5000) {
    console.log(`ModemSimulator: Simulando ${count} llamadas con intervalo de ${interval}ms`);
    
    for (let i = 0; i < count; i++) {
      await this.simulateIncomingCall();
      
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }

  /**
   * Limpiar archivo XML (simular fin de llamada)
   */
  async clearXMLFile() {
    try {
      // Simular eliminación del archivo
      console.log('ModemSimulator: Archivo XML limpiado (llamada terminada)');
    } catch (error) {
      console.error('ModemSimulator: Error limpiando archivo XML:', error);
    }
  }
}

// Crear instancia singleton
const modemSimulator = new ModemSimulator();

export default modemSimulator;
