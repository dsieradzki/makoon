pipeline {
    agent {
        docker { image 'rust:1.73.0-bullseye' }
    }
    stages {
        stage('Checkout') {
            steps {
                sh 'rm -rf makoon'
                sh 'git clone -b integration_tests --depth 1 https://github.com/dsieradzki/makoon'
            }
        }
        stage('Test') {
            steps {
                dir('makoon') {
                    withCredentials([usernamePassword(credentialsId: 'proxmox', usernameVariable: 'PROXMOX_USER', passwordVariable: 'PROXMOX_PASSWORD')]) {
                    sh 'mkdir web/src-web/dist/ -p && touch web/src-web/dist/dummy'
                    sh 'cargo test --features e2e -- --nocapture'
                    }
                }
            }
        }
    }
}