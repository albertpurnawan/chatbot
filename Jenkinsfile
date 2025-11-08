pipeline {
  agent any

  environment {
    IMAGE_NAME = 'albertpurnawan/chatbot'
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    ENABLE_GEMINI = 'false'
    GEMINI_MODEL = 'gemini-2.5-flash'
    DOCKER_PUSH = 'false'
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

    // Dockerfile builds the frontend; no pre-build steps needed here

    stage('Docker Build') {
      steps {
        sh 'docker build --build-arg ENABLE_GEMINI=${ENABLE_GEMINI} --build-arg GEMINI_MODEL=${GEMINI_MODEL} -t ${IMAGE_NAME}:${IMAGE_TAG} .'
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
