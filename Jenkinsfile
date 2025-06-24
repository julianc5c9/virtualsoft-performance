pipeline {
    agent any

    stages {
        stage('Clonar repositorio') {
            steps {
                git 'https://github.com/julianc5c9/virtualsoft-performance.git'
            }
        }

        stage('Instalar dependencias') {
            steps {
                // Si usas npm para tus pruebas K6
                sh 'npm install'
            }
        }

        stage('Ejecutar pruebas K6') {
            steps {
                // Reemplaza con tu comando de ejecución de K6
                sh 'k6 run validacion.js'
            }
        }

        stage('Generar informe') {
            steps {
                // Opcional: Generar un informe con los resultados de las pruebas
                script {
                    try {
                        sh 'k6 run --out json=report.json validacion.js'
                        // Aquí podrías procesar el reporte JSON para generar un informe más detallado
                    } catch (err) {
                        echo "Error al generar el informe: ${err}"
                    }
                }
            }
        }

    }
}