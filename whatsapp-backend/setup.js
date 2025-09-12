#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🤖 Configuración del WhatsApp Bot para Sistema de Taxis\n');

const questions = [
  {
    key: 'TWILIO_ACCOUNT_SID',
    question: 'Ingresa tu Twilio Account SID: ',
    required: true
  },
  {
    key: 'TWILIO_AUTH_TOKEN',
    question: 'Ingresa tu Twilio Auth Token: ',
    required: true
  },
  {
    key: 'TWILIO_WHATSAPP_NUMBER',
    question: 'Ingresa tu número de WhatsApp de Twilio (ej: whatsapp:+14155238886): ',
    required: true
  },
  {
    key: 'FIREBASE_PROJECT_ID',
    question: 'Ingresa tu Firebase Project ID (sigell-version-5): ',
    required: false,
    default: 'sigell-version-5'
  },
  {
    key: 'FIREBASE_PRIVATE_KEY',
    question: 'Ingresa tu Firebase Private Key: ',
    required: false
  },
  {
    key: 'FIREBASE_CLIENT_EMAIL',
    question: 'Ingresa tu Firebase Client Email: ',
    required: false
  },
  {
    key: 'PORT',
    question: 'Puerto del servidor (3001): ',
    required: false,
    default: '3001'
  },
  {
    key: 'FRONTEND_URL',
    question: 'URL del frontend (https://sigell-version-5.web.app): ',
    required: false,
    default: 'https://sigell-version-5.web.app'
  }
];

const config = {};

function askQuestion(index) {
  if (index >= questions.length) {
    createEnvFile();
    return;
  }

  const question = questions[index];
  const prompt = question.default ? `${question.question}[${question.default}] ` : question.question;

  rl.question(prompt, (answer) => {
    const value = answer.trim() || question.default || '';
    
    if (question.required && !value) {
      console.log('❌ Este campo es requerido.\n');
      askQuestion(index);
      return;
    }

    config[question.key] = value;
    askQuestion(index + 1);
  });
}

function createEnvFile() {
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const envPath = path.join(__dirname, '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Archivo .env creado exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Instalar dependencias: npm install');
    console.log('2. Configurar Twilio WhatsApp Sandbox');
    console.log('3. Configurar webhook en Twilio');
    console.log('4. Ejecutar servidor: npm run dev');
    console.log('\n🚀 ¡Bot de WhatsApp listo para configurar!');
  } catch (error) {
    console.error('❌ Error creando archivo .env:', error.message);
  }

  rl.close();
}

// Verificar si ya existe .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  rl.question('⚠️  El archivo .env ya existe. ¿Quieres sobrescribirlo? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      askQuestion(0);
    } else {
      console.log('Configuración cancelada.');
      rl.close();
    }
  });
} else {
  askQuestion(0);
}
