pipeline {
  agent any

  environment {
    REGISTRY = credentials('docker-registry-cred')
    IMAGE_NAME = 'your-docker-user/finance-assistant-chatbot'
    IMAGE_TAG = "${env.BUILD_NUMBER}"
  }

  options {
    timestamps()
    ansiColor('xterm')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci --no-audit --no-fund'
      }
    }

    stage('Build (frontend)') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Docker Build') {
      steps {
        sh 'docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .'
      }
    }

    stage('Docker Push') {
      when { expression { return env.DOCKER_PUSH?.toBoolean() } }
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
          sh 'docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest'
          sh 'docker push ${IMAGE_NAME}:${IMAGE_TAG}'
          sh 'docker push ${IMAGE_NAME}:latest'
        }
      }
    }
  }
}

