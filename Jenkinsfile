pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                dir('client') {
                    sh 'npm ci'
                }
                dir('server') {
                    sh 'npm ci'
                }
            }
        }

        stage('Lint') {
            steps {
                dir('client') {
                    sh 'npm run lint'
                }
                dir('server') {
                    sh 'npm run lint'
                }
            }
        }

        stage('Test') {
            steps {
                dir('client') {
                    sh 'npm test'
                }
                dir('server') {
                    sh 'npm test'
                }
            }
        }

        stage('Build frontend') {
            steps {
                dir('client') {
                    sh 'npm run build'
                }
            }
        }
    }
}